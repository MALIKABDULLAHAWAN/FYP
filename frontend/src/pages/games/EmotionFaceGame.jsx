import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const EMOTIONS = [
  { id:"happy",    emoji:"😊", name:"Happy",    color:"#FFD93D", bg:"#FFFACD", desc:"happy"    },
  { id:"sad",      emoji:"😢", name:"Sad",      color:"#4D96FF", bg:"#E5F0FF", desc:"sad"      },
  { id:"angry",    emoji:"😠", name:"Angry",    color:"#FF6B6B", bg:"#FFE5E5", desc:"angry"    },
  { id:"surprised",emoji:"😮", name:"Surprised",color:"#FF9FF3", bg:"#FFE8FF", desc:"surprised"},
  { id:"scared",   emoji:"😱", name:"Scared",   color:"#8B5CF6", bg:"#F0E8FF", desc:"scared"   },
  { id:"silly",    emoji:"😜", name:"Silly",    color:"#6BCB77", bg:"#E8FFE8", desc:"silly"    },
  { id:"sleepy",   emoji:"😴", name:"Sleepy",   color:"#A8DADC", bg:"#E8F8F8", desc:"sleepy"   },
  { id:"love",     emoji:"😍", name:"Love",     color:"#EC4899", bg:"#FFE8F5", desc:"in love"  },
  { id:"cool",     emoji:"😎", name:"Cool",     color:"#FF8C42", bg:"#FFF0E8", desc:"cool"     },
  { id:"laugh",    emoji:"🤣", name:"Laugh",    color:"#F59E0B", bg:"#FFFCE8", desc:"laughing" },
];

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.15;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.25);
    });
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "square";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
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

function getChoices(correct, all, count = 4) {
  const others = shuffle(all.filter(e => e.id !== correct.id)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

const ROUNDS = 12;

export default function EmotionFaceGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [wrongId, setWrongId] = useState(null);
  const [streak, setStreak] = useState(0);

  const buildQueue = useCallback(() => {
    // Repeat emotions to fill ROUNDS
    const base = shuffle([...EMOTIONS]);
    const q = [];
    while (q.length < ROUNDS) q.push(...base);
    return q.slice(0, ROUNDS);
  }, []);

  const presentItem = useCallback((item) => {
    setCurrent(item);
    setChoices(getChoices(item, EMOTIONS, 4));
    setTimeout(() => speak(item.name), 300);
  }, []);

  const startGame = () => {
    const q = buildQueue();
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setWrongId(null);
    setQueue(q.slice(1));
    presentItem(q[0]);
    setPhase("playing");
  };

  const handleChoice = (emotion) => {
    if (phase !== "playing" || !current) return;
    const correct = emotion.id === current.id;
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback("correct");
    } else {
      playWrong();
      setStreak(0);
      setFeedback("wrong");
      setWrongId(emotion.id);
      speak(current.name); // remind the correct answer
    }
    setPhase("feedback");
    setTimeout(() => {
      setFeedback(null);
      setWrongId(null);
      if (queue.length === 0) {
        setPhase("over");
      } else {
        setRound(r => r + 1);
        setQueue(q => {
          presentItem(q[0]);
          return q.slice(1);
        });
        setPhase("playing");
      }
    }, correct ? 700 : 1100);
  };

  const stars = score >= 11 ? 3 : score >= 8 ? 2 : 1;

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#FFF5F8 0%,#F8F0FF 50%,#F0F8FF 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes face-in   { 0%{transform:scale(0.4) rotate(-20deg);opacity:0} 60%{transform:scale(1.1) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes face-bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes choice-in { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes correct-ring { 0%{box-shadow:0 0 0 0 rgba(107,203,119,0.7)} 100%{box-shadow:0 0 0 20px rgba(107,203,119,0)} }
        @keyframes wrong-jolt  { 0%,100%{transform:scale(1)} 30%{transform:scale(0.9) rotate(-5deg)} 70%{transform:scale(1.05) rotate(3deg)} }
        @keyframes streak-pop  { 0%{opacity:0;transform:scale(0)} 60%{transform:scale(1.2)} 100%{opacity:1;transform:scale(1)} }
        .face-anim    { animation: face-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .face-idle    { animation: face-bounce 2.5s ease-in-out infinite; }
        .choice-anim  { animation: choice-in 0.3s ease both; }
        .correct-ring { animation: correct-ring 0.6s ease; }
        .wrong-jolt   { animation: wrong-jolt  0.35s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(236,72,153,0.12)", flexShrink:0 }}>
        <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {phase !== "idle" && <div style={{ fontSize:15, fontWeight:700, color:"#888" }}>{round}/{ROUNDS}</div>}
          <div style={{ fontSize:24, fontWeight:900, color:"#EC4899" }}>⭐ {score}</div>
          {streak >= 2 && <div key={streak} style={{ fontSize:14, fontWeight:800, color:"#FF8C42", animation:"streak-pop 0.3s ease" }}>🔥×{streak}</div>}
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:22 }}>

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div className="face-idle" style={{ fontSize:90 }}>😊</div>
            <div style={{ fontSize:34, fontWeight:900, color:"#EC4899" }}>Emotion Match!</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:280, lineHeight:1.5 }}>Listen and tap the right face!</div>
            <div style={{ display:"flex", gap:10, fontSize:36 }}>
              {["😊","😢","😠","😮","😴"].map(e => <span key={e}>{e}</span>)}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#EC4899,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(236,72,153,0.35)" }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Large face with speaker button */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <div
                key={round}
                className={`face-anim ${feedback === "correct" ? "correct-ring" : feedback === "wrong" ? "wrong-jolt" : ""}`}
                style={{ width:140, height:140, background:"white", borderRadius:36, boxShadow:"0 10px 36px rgba(236,72,153,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:88, position:"relative" }}
              >
                {current.emoji}
                {feedback === "correct" && <div style={{ position:"absolute", top:-14, right:-14, fontSize:34 }}>✅</div>}
              </div>
              {/* Speak button */}
              <button
                onClick={() => speak(current.name)}
                style={{ background:"linear-gradient(135deg,#EC4899,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"8px 20px", fontSize:18, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 14px rgba(236,72,153,0.3)", display:"flex", alignItems:"center", gap:6 }}
              >
                🔊
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/ROUNDS)*100}%`, height:"100%", background:"linear-gradient(90deg,#EC4899,#8B5CF6)", borderRadius:10, transition:"width 0.4s ease" }} />
            </div>

            {/* Choices - 2x2 grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, width:"100%", maxWidth:360 }}>
              {choices.map((emotion, idx) => {
                const isWrong   = wrongId === emotion.id;
                const isCorrect = feedback === "correct" && emotion.id === current.id;
                return (
                  <button
                    key={emotion.id}
                    className={isWrong ? "wrong-jolt" : ""}
                    onClick={() => handleChoice(emotion)}
                    disabled={phase === "feedback"}
                    style={{
                      height:90, borderRadius:22,
                      border:`3px solid ${isCorrect ? "#6BCB77" : isWrong ? "#FF6B6B" : emotion.color}`,
                      background: isWrong ? "#FFE5E5" : isCorrect ? "#E8FFE8" : emotion.bg,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:52,
                      boxShadow: `0 4px 16px ${emotion.color}33`,
                      transition:"transform 0.12s",
                      animationDelay: `${idx * 0.06}s`,
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.91)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    onTouchStart={e => e.currentTarget.style.transform = "scale(0.91)"}
                    onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {emotion.emoji}
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
            <div style={{ fontSize:30, fontWeight:900, color:"#EC4899" }}>Wonderful!</div>
            <div style={{ fontSize:52, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#555" }}>Score: <b style={{ color:"#EC4899" }}>{score}</b> / {ROUNDS}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
              <button onClick={startGame} style={{ background:"linear-gradient(135deg,#FF6B6B,#FFD93D)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🔄 Again!</button>
              <button onClick={() => navigate("/games")} style={{ background:"linear-gradient(135deg,#EC4899,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🏠 Games</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
