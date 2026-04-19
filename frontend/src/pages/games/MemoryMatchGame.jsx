/**
 * Memory Match Game – Standalone (no backend required)
 * Emoji card pairs, 3 levels, CSS flip animation, star rewards.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Card emoji pool – 20 unique emoji pairs
const ALL_CARDS = [
  { id:"dog",       emoji:"🐶" },
  { id:"cat",       emoji:"🐱" },
  { id:"rabbit",    emoji:"🐰" },
  { id:"bear",      emoji:"🐼" },
  { id:"fox",       emoji:"🦊" },
  { id:"tiger",     emoji:"🐯" },
  { id:"frog",      emoji:"🐸" },
  { id:"pig",       emoji:"🐷" },
  { id:"butterfly", emoji:"🦋" },
  { id:"unicorn",   emoji:"🦄" },
  { id:"rainbow",   emoji:"🌈" },
  { id:"star",      emoji:"⭐" },
  { id:"balloon",   emoji:"🎈" },
  { id:"pizza",     emoji:"🍕" },
  { id:"icecream",  emoji:"🍦" },
  { id:"gamepad",   emoji:"🎮" },
  { id:"cake",      emoji:"🎂" },
  { id:"sun",       emoji:"🌞" },
  { id:"flower",    emoji:"🌸" },
  { id:"rocket",    emoji:"🚀" },
];

// Level configs: pairs, cols
const LEVELS = [
  { label:"Easy",   pairs:4,  cols:4, time:60  },
  { label:"Medium", pairs:8,  cols:4, time:90  },
  { label:"Hard",   pairs:12, cols:6, time:120 },
];

function playFlip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "sine";
    o.frequency.setValueAtTime(400, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    o.start(); o.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playMatch() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
}

function playWin() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.28);
    });
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

function buildDeck(pairs) {
  const selected = shuffle(ALL_CARDS).slice(0, pairs);
  const deck = [];
  selected.forEach(card => {
    deck.push({ uid: `${card.id}_A`, pairId: card.id, emoji: card.emoji });
    deck.push({ uid: `${card.id}_B`, pairId: card.id, emoji: card.emoji });
  });
  return shuffle(deck);
}

function MemoryCard({ card, isFlipped, isMatched, onClick, size }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size,
        perspective: 600,
        cursor: isMatched || isFlipped ? "default" : "pointer",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div style={{
        width:"100%", height:"100%",
        position:"relative",
        transformStyle:"preserve-3d",
        transform: (isFlipped || isMatched) ? "rotateY(180deg)" : "rotateY(0deg)",
        transition:"transform 0.38s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Front face (card back) */}
        <div style={{
          position:"absolute", inset:0,
          backfaceVisibility:"hidden",
          WebkitBackfaceVisibility:"hidden",
          borderRadius:14,
          background:"linear-gradient(135deg,#6366F1,#8B5CF6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          fontSize: size * 0.4,
        }}>
          ❓
        </div>
        {/* Back face (card front) */}
        <div style={{
          position:"absolute", inset:0,
          backfaceVisibility:"hidden",
          WebkitBackfaceVisibility:"hidden",
          transform:"rotateY(180deg)",
          borderRadius:14,
          background: isMatched
            ? "linear-gradient(135deg,#6BCB77,#4CAF50)"
            : "linear-gradient(135deg,#FFF9F0,#FFF0E8)",
          border: isMatched ? "3px solid #6BCB77" : "3px solid #FFD93D",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: isMatched
            ? "0 0 18px rgba(107,203,119,0.5)"
            : "0 4px 14px rgba(255,217,61,0.3)",
          fontSize: size * 0.52,
          transition:"background 0.3s, border-color 0.3s",
        }}>
          {card.emoji}
        </div>
      </div>
    </div>
  );
}

export default function MemoryMatchGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("level_select"); // level_select | playing | over
  const [levelIdx, setLevelIdx] = useState(0);
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]); // uids of face-up unmatched cards
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lock, setLock] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const timerRef = useRef(null);

  const level = LEVELS[levelIdx];

  // Start game
  const startGame = useCallback((idx) => {
    const lv = LEVELS[idx];
    setLevelIdx(idx);
    setDeck(buildDeck(lv.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTimeLeft(lv.time);
    setLock(false);
    setConfetti([]);
    setPhase("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Check win
  useEffect(() => {
    if (phase === "playing" && matched.size === level.pairs) {
      clearInterval(timerRef.current);
      playWin();
      spawnConfetti();
      setTimeout(() => setPhase("over"), 800);
    }
  }, [matched, phase, level]);

  const spawnConfetti = () => {
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      color: ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF9FF3","#FF8C42"][i % 6],
      size: 8 + Math.random() * 10,
    }));
    setConfetti(pieces);
  };

  const handleCardClick = (uid) => {
    if (lock || phase !== "playing") return;
    if (matched.has(uid.replace(/_[AB]$/, ""))) return;
    if (flipped.includes(uid)) return;
    if (flipped.length === 2) return;

    playFlip();
    const newFlipped = [...flipped, uid];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped.map(u => deck.find(c => c.uid === u));
      if (a.pairId === b.pairId) {
        // Match!
        playMatch();
        setMatched(prev => new Set([...prev, a.pairId]));
        setFlipped([]);
      } else {
        // No match – flip back after delay
        setLock(true);
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 900);
      }
    }
  };

  // Card size based on cols and viewport
  const cardSize = Math.min(
    Math.floor((Math.min(window.innerWidth, 600) - 48 - (level.cols - 1) * 8) / level.cols),
    90
  );

  const totalPairs = level.pairs;
  const matchedCount = matched.size;
  const isWin = matchedCount === totalPairs;
  const stars = isWin
    ? (moves <= totalPairs + 2 ? 3 : moves <= totalPairs + 6 ? 2 : 1)
    : timeLeft > 0 ? 1 : 0;

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#F0E8FF 0%,#E8F0FF 50%,#E8FFE8 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes level-card-in { 0%{transform:scale(0.8) translateY(20px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes over-in { 0%{opacity:0;transform:scale(0.85)} 100%{opacity:1;transform:scale(1)} }
        .level-card { animation: level-card-in 0.35s ease both; }
        .over-panel { animation: over-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .confetti-piece { position:absolute; border-radius:2px; animation:confetti-fall linear forwards; pointer-events:none; }
      `}</style>

      {/* Confetti */}
      {confetti.map(p => (
        <div key={p.id} className="confetti-piece" style={{ left:`${p.x}%`, top:0, width:p.size, height:p.size, background:p.color, animationDuration:`${1.2 + Math.random() * 0.8}s`, animationDelay:`${p.delay}s` }} />
      ))}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(99,102,241,0.12)", flexShrink:0, zIndex:10 }}>
        <button onClick={() => phase === "playing" ? setPhase("level_select") : navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        {phase === "playing" && (
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>
              {matchedCount}/{totalPairs} 🃏
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>
              👣 {moves}
            </div>
            <div style={{ background:timeLeft < 20 ? "#FF6B6B" : "#6366F1", color:"white", borderRadius:20, padding:"5px 14px", fontWeight:800, fontSize:18, minWidth:64, textAlign:"center", transition:"background 0.3s" }}>
              ⏱ {timeLeft}
            </div>
          </div>
        )}
        {phase !== "playing" && <div style={{ fontSize:22, fontWeight:900, color:"#6366F1" }}>🃏 Memory!</div>}
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"16px", gap:18 }}>

        {/* Level select */}
        {phase === "level_select" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, width:"100%", maxWidth:420 }}>
            <div style={{ fontSize:72 }}>🃏</div>
            <div style={{ fontSize:32, fontWeight:900, color:"#6366F1" }}>Memory Match!</div>
            <div style={{ fontSize:16, color:"#666" }}>Choose your level:</div>
            {LEVELS.map((lv, i) => {
              const colors = [
                ["#6BCB77","#4CAF50","#E8FFE8"],
                ["#FF8C42","#E57322","#FFF0E8"],
                ["#FF6B6B","#E05252","#FFE5E5"],
              ][i];
              return (
                <button
                  key={i}
                  className="level-card"
                  onClick={() => startGame(i)}
                  style={{
                    width:"100%", padding:"20px 24px", borderRadius:24,
                    background:`linear-gradient(135deg,${colors[0]},${colors[1]})`,
                    border:"none", cursor:"pointer", color:"white",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    boxShadow:`0 8px 24px ${colors[0]}44`,
                    animationDelay:`${i * 0.08}s`,
                    fontSize:18, fontWeight:800,
                  }}
                  onMouseDown={e => e.currentTarget.style.transform="scale(0.97)"}
                  onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
                  onTouchStart={e => e.currentTarget.style.transform="scale(0.97)"}
                  onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
                >
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <div style={{ fontSize:22, fontWeight:900 }}>{lv.label}</div>
                    <div style={{ fontSize:14, opacity:0.9 }}>{lv.pairs} pairs · {lv.time}s</div>
                  </div>
                  <div style={{ fontSize:38 }}>
                    {["🟢","🟡","🔴"][i]}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Game board */}
        {phase === "playing" && (
          <div style={{
            display:"grid",
            gridTemplateColumns: `repeat(${level.cols}, ${cardSize}px)`,
            gap:8,
          }}>
            {deck.map(card => {
              const isFlipped = flipped.includes(card.uid);
              const isMatched = matched.has(card.pairId);
              return (
                <MemoryCard
                  key={card.uid}
                  card={card}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  onClick={() => !isMatched && !isFlipped && !lock && handleCardClick(card.uid)}
                  size={cardSize}
                />
              );
            })}
          </div>
        )}

        {/* Game over panel */}
        {phase === "over" && (
          <div className="over-panel" style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:16, background:"white", borderRadius:32, padding:"36px 28px", boxShadow:"0 20px 60px rgba(99,102,241,0.2)", maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:72 }}>{isWin ? "🎉" : "⏱"}</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#6366F1" }}>
              {isWin ? "You Win!" : "Time's Up!"}
            </div>
            {isWin && <div style={{ fontSize:48, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>}
            <div style={{ fontSize:18, color:"#555", fontWeight:600 }}>
              {isWin
                ? `${matchedCount}/${totalPairs} pairs in ${moves} moves!`
                : `${matchedCount}/${totalPairs} pairs found`}
            </div>

            {/* Next level button if won and not on last level */}
            {isWin && levelIdx < LEVELS.length - 1 && (
              <button onClick={() => startGame(levelIdx + 1)} style={{ background:"linear-gradient(135deg,#6BCB77,#4CAF50)", color:"white", border:"none", borderRadius:50, padding:"14px 36px", fontSize:20, fontWeight:900, cursor:"pointer", width:"100%", boxShadow:"0 6px 20px rgba(107,203,119,0.4)" }}>
                Next Level →
              </button>
            )}

            <button onClick={() => startGame(levelIdx)} style={{ background:"linear-gradient(135deg,#FF8C42,#FF6B6B)", color:"white", border:"none", borderRadius:50, padding:"14px 36px", fontSize:20, fontWeight:900, cursor:"pointer", width:"100%", boxShadow:"0 6px 20px rgba(255,140,66,0.4)" }}>
              🔄 Play Again
            </button>
            <button onClick={() => setPhase("level_select")} style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"14px 36px", fontSize:20, fontWeight:900, cursor:"pointer", width:"100%", boxShadow:"0 6px 20px rgba(99,102,241,0.4)" }}>
              🏠 Choose Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
