import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Items grouped by color bucket
const COLOR_BUCKETS = [
  { id: "red",    label: "🔴", bg: "#FF6B6B", light: "#FFE5E5", text: "#C0392B" },
  { id: "yellow", label: "🟡", bg: "#FFD93D", light: "#FFFACD", text: "#B7860B" },
  { id: "green",  label: "🟢", bg: "#6BCB77", light: "#E8FFF0", text: "#1A7D2E" },
  { id: "blue",   label: "🔵", bg: "#4D96FF", light: "#E5F0FF", text: "#1A56CC" },
];

const ITEMS = [
  { emoji:"🍎", color:"red",    name:"Apple"      },
  { emoji:"🍓", color:"red",    name:"Strawberry" },
  { emoji:"🌹", color:"red",    name:"Rose"       },
  { emoji:"🍒", color:"red",    name:"Cherry"     },
  { emoji:"❤️", color:"red",    name:"Heart"      },
  { emoji:"🍌", color:"yellow", name:"Banana"     },
  { emoji:"🌻", color:"yellow", name:"Sunflower"  },
  { emoji:"⭐", color:"yellow", name:"Star"       },
  { emoji:"🐝", color:"yellow", name:"Bee"        },
  { emoji:"🌟", color:"yellow", name:"Gold Star"  },
  { emoji:"🐸", color:"green",  name:"Frog"       },
  { emoji:"🥦", color:"green",  name:"Broccoli"   },
  { emoji:"🌿", color:"green",  name:"Leaf"       },
  { emoji:"🐢", color:"green",  name:"Turtle"     },
  { emoji:"🥝", color:"green",  name:"Kiwi"       },
  { emoji:"🌊", color:"blue",   name:"Wave"       },
  { emoji:"🫐", color:"blue",   name:"Blueberry"  },
  { emoji:"🐟", color:"blue",   name:"Fish"       },
  { emoji:"💧", color:"blue",   name:"Drop"       },
  { emoji:"🦋", color:"blue",   name:"Butterfly"  },
];

function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.25);
    });
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "square";
    o.frequency.setValueAtTime(200, ctx.currentTime);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.start(); o.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS = 12;

export default function ColorMatchGame() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | playing | feedback | over
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [wrongBucket, setWrongBucket] = useState(null);
  const [streak, setStreak] = useState(0);

  const buildQueue = useCallback(() => {
    const shuffled = shuffle(ITEMS);
    return shuffled.slice(0, ROUNDS);
  }, []);

  const startGame = () => {
    const q = buildQueue();
    setQueue(q.slice(1));
    setCurrent(q[0]);
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setWrongBucket(null);
    setPhase("playing");
  };

  const handleBucket = (bucketId) => {
    if (phase !== "playing" || !current) return;
    const correct = bucketId === current.color;
    if (correct) {
      playCorrect();
      setScore(s => s + (streak >= 2 ? 2 : 1));
      setStreak(s => s + 1);
      setFeedback("correct");
    } else {
      playWrong();
      setStreak(0);
      setFeedback("wrong");
      setWrongBucket(bucketId);
    }
    setPhase("feedback");
    setTimeout(() => {
      setFeedback(null);
      setWrongBucket(null);
      if (queue.length === 0) {
        setPhase("over");
      } else {
        setCurrent(queue[0]);
        setQueue(q => q.slice(1));
        setRound(r => r + 1);
        setPhase("playing");
      }
    }, correct ? 700 : 1000);
  };

  const stars = score >= ROUNDS + 4 ? 3 : score >= ROUNDS - 2 ? 2 : 1;

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#FFF9F0 0%,#FFF0F5 50%,#F0F8FF 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes item-bounce { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes correct-flash { 0%{background:rgba(107,203,119,0.15)} 100%{background:transparent} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes streak-pop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        .correct-anim { animation: correct-flash 0.7s ease; }
        .wrong-anim   { animation: wrong-shake  0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(99,102,241,0.12)", flexShrink:0 }}>
        <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>{round}/{ROUNDS}</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#6366F1" }}>⭐ {score}</div>
          {streak >= 2 && <div style={{ fontSize:14, fontWeight:800, color:"#FF8C42", animation:"streak-pop 0.3s ease" }}>🔥×{streak}</div>}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px", gap:28 }}>

        {/* Idle screen */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ fontSize:80 }}>🎨</div>
            <div style={{ fontSize:34, fontWeight:900, color:"#6366F1" }}>Color Match!</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:280, lineHeight:1.5 }}>Match each item to its color bucket!</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", fontSize:36 }}>
              {COLOR_BUCKETS.map(b => <span key={b.id}>{b.label}</span>)}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#6366F1,#EC4899)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(99,102,241,0.35)", marginTop:8 }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing & feedback */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Item display */}
            <div className={feedback === "correct" ? "correct-anim" : ""} style={{ width:160, height:160, borderRadius:32, background:"white", boxShadow:"0 8px 32px rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:90, animation:"item-bounce 0.4s ease", position:"relative" }}>
              {current.emoji}
              {feedback === "correct" && (
                <div style={{ position:"absolute", top:-12, right:-12, fontSize:36, animation:"streak-pop 0.3s ease" }}>✅</div>
              )}
              {feedback === "wrong" && (
                <div style={{ position:"absolute", top:-12, right:-12, fontSize:36 }}>❌</div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/ROUNDS)*100}%`, height:"100%", background:"linear-gradient(90deg,#6366F1,#EC4899)", borderRadius:10, transition:"width 0.4s ease" }} />
            </div>

            {/* Color buckets */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, width:"100%", maxWidth:360 }}>
              {COLOR_BUCKETS.map(b => {
                const isWrong = wrongBucket === b.id;
                return (
                  <button
                    key={b.id}
                    className={isWrong ? "wrong-anim" : ""}
                    onClick={() => handleBucket(b.id)}
                    disabled={phase === "feedback"}
                    style={{
                      height:80, borderRadius:20, border:`3px solid ${b.bg}`,
                      background: isWrong ? "#FFE5E5" : b.light,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:42, transition:"transform 0.12s,box-shadow 0.12s",
                      boxShadow: `0 4px 16px ${b.bg}33`,
                      transform: phase === "playing" ? "scale(1)" : "scale(0.97)",
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    onTouchStart={e => e.currentTarget.style.transform = "scale(0.92)"}
                    onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Game over */}
        {phase === "over" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>
            <div style={{ fontSize:80 }}>🎉</div>
            <div style={{ fontSize:30, fontWeight:900, color:"#6366F1" }}>Amazing!</div>
            <div style={{ fontSize:52, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#555" }}>Score: <b style={{ color:"#6366F1" }}>{score}</b> / {ROUNDS}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
              <button onClick={startGame} style={{ background:"linear-gradient(135deg,#FF6B6B,#FFD93D)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🔄 Again!</button>
              <button onClick={() => navigate("/games")} style={{ background:"linear-gradient(135deg,#6366F1,#EC4899)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🏠 Games</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
