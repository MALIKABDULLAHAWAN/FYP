import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";

// Shape renderers (pure CSS/SVG - no image dependencies)
function CircleShape({ size = 90, color = "#4D96FF" }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 6px 20px ${color}55` }} />;
}
function SquareShape({ size = 86, color = "#FF6B6B" }) {
  return <div style={{ width: size, height: size, borderRadius: 12, background: color, boxShadow: `0 6px 20px ${color}55` }} />;
}
function TriangleShape({ size = 90, color = "#6BCB77" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,95 5,95" fill={color} style={{ filter: `drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}
function StarShape({ size = 90, color = "#FFD93D" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={color} style={{ filter: `drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}
function DiamondShape({ size = 90, color = "#FF9FF3" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,50 50,95 5,50" fill={color} style={{ filter: `drop-shadow(0 6px 10px ${color}88)` }} />
    </svg>
  );
}

const SHAPES = [
  { id: "circle",   label: "⭕", name: "Circle",   Component: CircleShape,   color: "#4D96FF", bg: "#E5F0FF" },
  { id: "square",   label: "🟥", name: "Square",   Component: SquareShape,   color: "#FF6B6B", bg: "#FFE5E5" },
  { id: "triangle", label: "🔺", name: "Triangle", Component: TriangleShape, color: "#6BCB77", bg: "#E8FFE8" },
  { id: "star",     label: "⭐", name: "Star",     Component: StarShape,     color: "#FFD93D", bg: "#FFFAD0" },
  { id: "diamond",  label: "💜", name: "Diamond",  Component: DiamondShape,  color: "#FF9FF3", bg: "#FFE8FF" },
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

export default function ShapeSortGame({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [phase, setPhase] = useState(isSession ? "playing" : "idle");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongId, setWrongId] = useState(null);

  const settings = {
    easy:   { bucketCount: 3, rounds: 8  },
    medium: { bucketCount: 4, rounds: 12 },
    hard:   { bucketCount: 5, rounds: 15 }
  };
  const currentSettings = settings[level] || settings.easy;

  const buildQueue = useCallback(() => {
    const buckets = SHAPES.slice(0, currentSettings.bucketCount);
    const items = [];
    for (let i = 0; i < currentSettings.rounds; i++) {
      items.push(buckets[i % buckets.length]);
    }
    return shuffle(items);
  }, [currentSettings.bucketCount, currentSettings.rounds]);

  const startGame = useCallback(() => {
    const q = buildQueue();
    setCurrent(q[0]);
    setQueue(q.slice(1));
    setScore(0);
    setRound(1);
    setFeedback(null);
    setWrongId(null);
    setPhase("playing");
  }, [buildQueue]);

  // Auto-start when used inside a therapy session
  useEffect(() => {
    if (isSession) {
      startGame();
    }
  }, [isSession, level, startGame]);

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

  const activeBuckets = SHAPES.slice(0, currentSettings.bucketCount);

  return (
    <div style={{
      minHeight: "calc(100vh - 70px)",
      background: "linear-gradient(160deg,#F8F0FF 0%,#FFF0FA 50%,#F0F5FF 100%)",
      fontFamily: "'Nunito','Inter',sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        @keyframes shape-in  { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.12) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px)} 75%{transform:translateX(7px)} }
        @keyframes correct-glow { 0%{box-shadow:0 0 0 rgba(107,203,119,0)} 50%{box-shadow:0 0 30px rgba(107,203,119,0.6)} 100%{box-shadow:0 0 0 rgba(107,203,119,0)} }
        .shape-anim { animation: shape-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wrong-bucket { animation: wrong-shake 0.35s ease; }
        .correct-bucket { animation: correct-glow 0.6s ease; }
      `}</style>

      {!isSession && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 18px", background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)", borderBottom: "2px solid rgba(139,92,246,0.12)", flexShrink: 0
        }}>
          <button onClick={() => navigate("/games")} style={{
            background: "#FF6B6B", color: "white", border: "none",
            borderRadius: "50%", width: 44, height: 44, fontSize: 22, cursor: "pointer", lineHeight: 1
          }}>←</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#888" }}>{round}/{currentSettings.rounds}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#8B5CF6" }}>⭐ {score}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 24 }}>

        {phase === "idle" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <CircleShape   size={60} color="#4D96FF" />
              <SquareShape   size={60} color="#FF6B6B" />
              <TriangleShape size={60} color="#6BCB77" />
              <StarShape     size={60} color="#FFD93D" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#8B5CF6" }}>Shape Sort!</div>
            <div style={{ fontSize: 17, color: "#666", maxWidth: 280, lineHeight: 1.5 }}>Sort each shape into the right bucket!</div>
            <button onClick={startGame} style={{
              background: "linear-gradient(135deg,#8B5CF6,#EC4899)", color: "white",
              border: "none", borderRadius: 50, padding: "18px 52px",
              fontSize: 26, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 8px 28px rgba(139,92,246,0.35)"
            }}>
              ▶ Play!
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "feedback") && current && (
          <>
            <div className="shape-anim" key={round} style={{
              width: 130, height: 130, background: "white", borderRadius: 28,
              boxShadow: "0 10px 36px rgba(139,92,246,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
            }}>
              <current.Component size={90} color={current.color} />
              {feedback === "correct" && <div style={{ position: "absolute", top: -14, right: -14, fontSize: 34 }}>✅</div>}
              {feedback === "wrong"   && <div style={{ position: "absolute", top: -14, right: -14, fontSize: 34 }}>❌</div>}
            </div>

            <div style={{ width: "100%", maxWidth: 320, height: 10, background: "#EEE", borderRadius: 10, overflow: "hidden" }}>
              <div style={{
                width: `${(round / currentSettings.rounds) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg,#8B5CF6,#EC4899)",
                borderRadius: 10, transition: "width 0.4s ease"
              }} />
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: activeBuckets.length >= 5 ? "1fr 1fr 1fr" : "1fr 1fr",
              gap: 12, width: "100%", maxWidth: 380
            }}>
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
                      height: 88, borderRadius: 20,
                      border: `3px solid ${isCorrect ? "#6BCB77" : isWrong ? "#FF6B6B" : s.color}`,
                      background: isWrong ? "#FFE5E5" : isCorrect ? "#E8FFE8" : s.bg,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                      transition: "transform 0.12s", boxShadow: `0 4px 14px ${s.color}33`,
                    }}
                  >
                    <s.Component size={40} color={s.color} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === "over" && (
          <GameConclusionFlow
            gameName="Shape Sort"
            score={score}
            total={currentSettings.rounds}
            duration={0}
            skills={["Fine Motor", "Geometry", "Visual Matching"]}
            onAction={isSession ? onComplete : () => setPhase("idle")}
            actionLabel={isSession ? "Continue Journey" : "Play Again"}
          />
        )}
      </div>
    </div>
  );
}
