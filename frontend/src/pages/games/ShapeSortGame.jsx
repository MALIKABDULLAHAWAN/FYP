import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Shape renderers (pure CSS/SVG - no image dependencies)
function CircleShape({ size = 90, color = "#4D96FF" }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color, boxShadow:`0 6px 20px ${color}55` }} />;
}
function SquareShape({ size = 86, color = "#FF6B6B" }) {
  return <div style={{ width:size, height:size, borderRadius:12, background:color, boxShadow:`0 6px 20px ${color}55` }} />;
}
function TriangleShape({ size = 90, color = "#6BCB77" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,95 5,95" fill={color} style={{ filter:`drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}
function StarShape({ size = 90, color = "#FFD93D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={color} style={{ filter:`drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}
function DiamondShape({ size = 90, color = "#FF9FF3" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,50 50,95 5,50" fill={color} style={{ filter:`drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}

const SHAPES = [
  { id:"circle",   label:"⭕", name:"Circle",   Component:CircleShape,   color:"#4D96FF", bg:"#E5F0FF" },
  { id:"square",   label:"🟥", name:"Square",   Component:SquareShape,   color:"#FF6B6B", bg:"#FFE5E5" },
  { id:"triangle", label:"🔺", name:"Triangle", Component:TriangleShape, color:"#6BCB77", bg:"#E8FFE8" },
  { id:"star",     label:"⭐", name:"Star",     Component:StarShape,     color:"#FFD93D", bg:"#FFFAD0" },
  { id:"diamond",  label:"💜", name:"Diamond",  Component:DiamondShape,  color:"#FF9FF3", bg:"#FFE8FF" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 784].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.28);
    });
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "sawtooth";
    o.frequency.value = 180;
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.start(); o.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

const ROUNDS = 15;

export default function ShapeSortGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongId, setWrongId] = useState(null);

  // Use first 4 shapes for easy mode, all 5 for harder
  const getActiveBuckets = useCallback(() => {
    return round < 8 ? SHAPES.slice(0, 4) : SHAPES;
  }, [round]);

  const buildQueue = () => {
    const buckets = round < 8 ? SHAPES.slice(0, 4) : SHAPES;
    const items = [];
    for (let i = 0; i < ROUNDS; i++) items.push(buckets[i % buckets.length]);
    return shuffle(items);
  };

  const startGame = () => {
    const q = buildQueue();
    setCurrent(q[0]);
    setQueue(q.slice(1));
    setScore(0);
    setRound(1);
    setFeedback(null);
    setWrongId(null);
    setPhase("playing");
  };

  const handleBucket = (shapeId) => {
    if (phase !== "playing" || !current) return;
    const correct = shapeId === current.id;
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
      setFeedback("correct");
    } else {
      playWrong();
      setFeedback("wrong");
      setWrongId(shapeId);
    }
    setPhase("feedback");
    setTimeout(() => {
      setFeedback(null);
      setWrongId(null);
      if (queue.length === 0) {
        setPhase("over");
      } else {
        setCurrent(queue[0]);
        setQueue(q => q.slice(1));
        setRound(r => r + 1);
        setPhase("playing");
      }
    }, correct ? 600 : 900);
  };

  const stars = score >= 13 ? 3 : score >= 9 ? 2 : 1;
  const activeBuckets = getActiveBuckets();

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#F8F0FF 0%,#FFF0FA 50%,#F0F5FF 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes shape-in  { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.12) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes bucket-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px)} 75%{transform:translateX(7px)} }
        @keyframes correct-glow { 0%{box-shadow:0 0 0 rgba(107,203,119,0)} 50%{box-shadow:0 0 30px rgba(107,203,119,0.6)} 100%{box-shadow:0 0 0 rgba(107,203,119,0)} }
        .shape-anim { animation: shape-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wrong-bucket { animation: wrong-shake 0.35s ease; }
        .correct-bucket { animation: correct-glow 0.6s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(139,92,246,0.12)", flexShrink:0 }}>
        <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>{round}/{ROUNDS}</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#8B5CF6" }}>⭐ {score}</div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:24 }}>

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ display:"flex", gap:16 }}>
              <CircleShape   size={60} color="#4D96FF" />
              <SquareShape   size={60} color="#FF6B6B" />
              <TriangleShape size={60} color="#6BCB77" />
              <StarShape     size={60} color="#FFD93D" />
            </div>
            <div style={{ fontSize:34, fontWeight:900, color:"#8B5CF6" }}>Shape Sort!</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:280, lineHeight:1.5 }}>Sort each shape into the right bucket!</div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#8B5CF6,#EC4899)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(139,92,246,0.35)" }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing / Feedback */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Shape to sort */}
            <div className="shape-anim" key={round} style={{ width:130, height:130, background:"white", borderRadius:28, boxShadow:"0 10px 36px rgba(139,92,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              <current.Component size={90} color={current.color} />
              {feedback === "correct" && <div style={{ position:"absolute", top:-14, right:-14, fontSize:34 }}>✅</div>}
              {feedback === "wrong"   && <div style={{ position:"absolute", top:-14, right:-14, fontSize:34 }}>❌</div>}
            </div>

            {/* Progress */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/ROUNDS)*100}%`, height:"100%", background:"linear-gradient(90deg,#8B5CF6,#EC4899)", borderRadius:10, transition:"width 0.4s ease" }} />
            </div>

            {/* Buckets */}
            <div style={{ display:"grid", gridTemplateColumns: activeBuckets.length === 5 ? "1fr 1fr 1fr" : "1fr 1fr", gap:12, width:"100%", maxWidth:380 }}>
              {activeBuckets.map(s => {
                const isWrong = wrongId === s.id;
                const isCorrect = feedback === "correct" && current.id === s.id;
                return (
                  <button
                    key={s.id}
                    className={isWrong ? "wrong-bucket" : isCorrect ? "correct-bucket" : ""}
                    onClick={() => handleBucket(s.id)}
                    disabled={phase === "feedback"}
                    style={{
                      height:88, borderRadius:20,
                      border:`3px solid ${isCorrect ? "#6BCB77" : isWrong ? "#FF6B6B" : s.color}`,
                      background: isWrong ? "#FFE5E5" : isCorrect ? "#E8FFE8" : s.bg,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                      transition:"transform 0.12s", boxShadow:`0 4px 14px ${s.color}33`,
                    }}
                    onMouseDown={e => e.currentTarget.style.transform="scale(0.92)"}
                    onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
                    onTouchStart={e => e.currentTarget.style.transform="scale(0.92)"}
                    onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
                  >
                    <s.Component size={40} color={s.color} />
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
            <div style={{ fontSize:30, fontWeight:900, color:"#8B5CF6" }}>Well Done!</div>
            <div style={{ fontSize:52, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#555" }}>Score: <b style={{ color:"#8B5CF6" }}>{score}</b> / {ROUNDS}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
              <button onClick={startGame} style={{ background:"linear-gradient(135deg,#FF6B6B,#FFD93D)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🔄 Again!</button>
              <button onClick={() => navigate("/games")} style={{ background:"linear-gradient(135deg,#8B5CF6,#EC4899)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🏠 Games</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
