import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";

const COLOR_BUCKETS = [
  { id: "red",    label: "🔴", bg: "#FF6B6B", light: "#FFE5E5", text: "#C0392B" },
  { id: "yellow", label: "🟡", bg: "#FFD93D", light: "#FFFACD", text: "#B7860B" },
  { id: "green",  label: "🟢", bg: "#6BCB77", light: "#E8FFF0", text: "#1A7D2E" },
  { id: "blue",   label: "🔵", bg: "#4D96FF", light: "#E5F0FF", text: "#1A56CC" },
];

const ITEMS = [
  { emoji: "🍎", color: "red",    name: "Apple"      },
  { emoji: "🍓", color: "red",    name: "Strawberry" },
  { emoji: "🌹", color: "red",    name: "Rose"       },
  { emoji: "🍒", color: "red",    name: "Cherry"     },
  { emoji: "❤️", color: "red",    name: "Heart"      },
  { emoji: "🍌", color: "yellow", name: "Banana"     },
  { emoji: "🌻", color: "yellow", name: "Sunflower"  },
  { emoji: "⭐", color: "yellow", name: "Star"       },
  { emoji: "🐝", color: "yellow", name: "Bee"        },
  { emoji: "🌟", color: "yellow", name: "Gold Star"  },
  { emoji: "🐸", color: "green",  name: "Frog"       },
  { emoji: "🥦", color: "green",  name: "Broccoli"   },
  { emoji: "🌿", color: "green",  name: "Leaf"       },
  { emoji: "🐢", color: "green",  name: "Turtle"     },
  { emoji: "🥝", color: "green",  name: "Kiwi"       },
  { emoji: "🌊", color: "blue",   name: "Wave"       },
  { emoji: "🫐", color: "blue",   name: "Blueberry"  },
  { emoji: "🐟", color: "blue",   name: "Fish"       },
  { emoji: "💧", color: "blue",   name: "Drop"       },
  { emoji: "🦋", color: "blue",   name: "Butterfly"  },
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

export default function ColorMatchGame({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState(isSession ? "playing" : "level_select");
  const [activeLevel, setActiveLevel] = useState(level);
  const [feedback, setFeedback] = useState(null);
  const [wrongBucket, setWrongBucket] = useState(null);
  const [streak, setStreak] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [duration, setDuration] = useState(0);

  const currentSettings = useMemo(() => {
    const s = {
      easy:   { bucketCount: 3, rounds: 8  },
      medium: { bucketCount: 4, rounds: 12 },
      hard:   { bucketCount: 4, rounds: 20 }
    };
    return s[activeLevel] || s.easy;
  }, [activeLevel]);

  const activeBuckets = useMemo(() =>
    COLOR_BUCKETS.slice(0, currentSettings.bucketCount)
  , [currentSettings.bucketCount]);

  const buildQueue = useCallback((lvlSettings) => {
    const activeB = COLOR_BUCKETS.slice(0, lvlSettings.bucketCount);
    const validColors = activeB.map(b => b.id);
    const validItems = ITEMS.filter(item => validColors.includes(item.color));
    return shuffle(validItems).slice(0, lvlSettings.rounds);
  }, []);

  const startGame = useCallback((lvl = activeLevel) => {
    setActiveLevel(lvl);
    const s = {
      easy:   { bucketCount: 3, rounds: 8  },
      medium: { bucketCount: 4, rounds: 12 },
      hard:   { bucketCount: 4, rounds: 20 }
    };
    const lvlSettings = s[lvl] || s.easy;
    const q = buildQueue(lvlSettings);
    setQueue(q.slice(1));
    setCurrent(q[0]);
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setWrongBucket(null);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [activeLevel, buildQueue]);

  const initialized = useRef(false);
  useEffect(() => {
    if (isSession && !initialized.current) {
      initialized.current = true;
      startGame(level);
    }
  }, [isSession, level, startGame]);

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
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        setPhase("over");
      } else {
        setCurrent(queue[0]);
        setQueue(q => q.slice(1));
        setRound(r => r + 1);
        setPhase("playing");
      }
    }, correct ? 700 : 1000);
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 70px)",
      background: "linear-gradient(160deg,#FFF9F0 0%,#FFF0F5 50%,#F0F8FF 100%)",
      fontFamily: "'Nunito','Inter',sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        @keyframes item-bounce { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes correct-flash { 0%{background:rgba(107,203,119,0.15)} 100%{background:transparent} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes streak-pop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        .correct-anim { animation: correct-flash 0.7s ease; }
        .wrong-anim   { animation: wrong-shake  0.4s ease; }
        .bucket-btn:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
      `}</style>

      {/* Header - only shown in standalone mode */}
      {!isSession && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 18px", background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)", borderBottom: "2px solid rgba(99,102,241,0.12)", flexShrink: 0
        }}>
          <button onClick={() => navigate("/games")} style={{
            background: "#FF6B6B", color: "white", border: "none",
            borderRadius: "50%", width: 44, height: 44, fontSize: 22, cursor: "pointer", lineHeight: 1
          }}>←</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#888" }}>{round}/{currentSettings.rounds}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#6366F1" }}>⭐ {score}</div>
            {streak >= 2 && (
              <div style={{ fontSize: 14, fontWeight: 800, color: "#FF8C42", animation: "streak-pop 0.3s ease" }}>
                🔥×{streak}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 20px", gap: 28
      }}>

        {/* Level Select */}
        {phase === "level_select" && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20, padding: 24, zIndex: 10, width: "100%"
          }}>
            <div style={{ fontSize: 60, filter: "drop-shadow(0 10px 24px rgba(99,102,241,0.35))" }}>🎨</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#6366F1", textShadow: "0 4px 14px rgba(255,255,255,0.5)" }}>Color Match!</div>
            <div style={{ fontSize: 16, color: "#444", marginBottom: 10 }}>Choose your difficulty:</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 360 }}>
              {[ 
                { id: "easy", label: "Easy", desc: "3 Colors, 8 Items", colors: ["#6BCB77", "#4CAF50"] },
                { id: "medium", label: "Medium", desc: "4 Colors, 12 Items", colors: ["#FF8C42", "#E57322"] },
                { id: "hard", label: "Hard", desc: "4 Colors, 20 Items", colors: ["#FF6B6B", "#E05252"] }
              ].map((lv, i) => (
                <button
                  key={lv.id}
                  onClick={() => startGame(lv.id)}
                  style={{
                    width: "100%", padding: "16px 24px", borderRadius: 24,
                    background: `linear-gradient(135deg,${lv.colors[0]},${lv.colors[1]})`,
                    border: "none", cursor: "pointer", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: `0 8px 24px ${lv.colors[0]}44`,
                    fontSize: 18, fontWeight: 800,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>{lv.label}</div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>{lv.desc}</div>
                  </div>
                  <div style={{ fontSize: 32 }}>
                    {["🟢", "🟡", "🔴"][i]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Playing & Feedback */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Current item to sort */}
            <div
              className={feedback === "correct" ? "correct-anim" : ""}
              key={round}
              style={{
                width: 160, height: 160, borderRadius: 32,
                background: "white",
                boxShadow: "0 8px 32px rgba(99,102,241,0.15)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontSize: 90, position: "relative",
                animation: "item-bounce 0.4s ease"
              }}
            >
              {current.emoji}
              {feedback === "correct" && (
                <div style={{ position: "absolute", top: -12, right: -12, fontSize: 36, animation: "streak-pop 0.3s ease" }}>✅</div>
              )}
              {feedback === "wrong" && (
                <div style={{ position: "absolute", top: -12, right: -12, fontSize: 36 }}>❌</div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ width: "100%", maxWidth: 320, height: 10, background: "#EEE", borderRadius: 10, overflow: "hidden" }}>
              <div style={{
                width: `${(round / currentSettings.rounds) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg,#6366F1,#EC4899)",
                borderRadius: 10,
                transition: "width 0.4s ease"
              }} />
            </div>

            {/* Color bucket buttons */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${activeBuckets.length > 3 ? 2 : 3}, 1fr)`,
              gap: 14, width: "100%", maxWidth: 360
            }}>
              {activeBuckets.map(b => {
                const isWrong = wrongBucket === b.id;
                return (
                  <button
                    key={b.id}
                    className={`bucket-btn ${isWrong ? "wrong-anim" : ""}`}
                    onClick={() => handleBucket(b.id)}
                    disabled={phase === "feedback"}
                    style={{
                      height: 80, borderRadius: 20,
                      border: `3px solid ${b.bg}`,
                      background: isWrong ? "#FFE5E5" : b.light,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 42,
                      transition: "transform 0.12s, box-shadow 0.12s",
                      boxShadow: `0 4px 16px ${b.bg}33`,
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Game Over - Diagnostic Report */}
        {phase === "over" && (
          <GameConclusionFlow
            gameName="Color Match"
            score={score}
            total={currentSettings.rounds}
            duration={duration}
            level={activeLevel === 'hard' ? 3 : activeLevel === 'medium' ? 2 : 1}
            skills={["Visual Perception", "Categorization", "Color Recognition"]}
            onAction={isSession ? onComplete : () => setPhase("level_select")}
            actionLabel={isSession ? "Continue Journey" : "Play Again"}
          />
        )}
      </div>
    </div>
  );
}
