import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";

const COLORS = [
  { fill: "rgba(255,107,107,0.65)", stroke: "#FF6B6B", glow: "#FF6B6B55" },
  { fill: "rgba(255,217,61,0.65)",  stroke: "#FFD93D", glow: "#FFD93D55" },
  { fill: "rgba(107,203,119,0.65)", stroke: "#6BCB77", glow: "#6BCB7755" },
  { fill: "rgba(77,150,255,0.65)",  stroke: "#4D96FF", glow: "#4D96FF55" },
  { fill: "rgba(255,159,243,0.65)", stroke: "#FF9FF3", glow: "#FF9FF355" },
  { fill: "rgba(255,140,66,0.65)",  stroke: "#FF8C42", glow: "#FF8C4255" },
  { fill: "rgba(168,218,220,0.65)", stroke: "#A8DADC", glow: "#A8DADC55" },
  { fill: "rgba(196,161,255,0.65)", stroke: "#C4A1FF", glow: "#C4A1FF55" },
];

const BUBBLE_ICONS = ["⭐","🌟","🎀","🎈","🌸","💫","🦋","🌈","🎵","🍭","🌺","✨"];

function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function playWin() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch (e) {}
}

let _uid = 0;

export default function BubblePopGame({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState(isSession ? "playing" : "level_select");
  const [activeLevel, setActiveLevel] = useState(level);
  const [poppedSet, setPoppedSet] = useState(new Set());
  const areaRef = useRef(null);
  const spawnRef = useRef(null);
  const countRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [duration, setDuration] = useState(0);
  // Track score in a ref so timer callback always has the latest value
  const scoreRef = useRef(0);

  const settings = {
    easy:   { time: 60, spawnInterval: 850, minDur: 4.5, maxDur: 9.0 },
    medium: { time: 45, spawnInterval: 650, minDur: 3.5, maxDur: 7.0 },
    hard:   { time: 30, spawnInterval: 450, minDur: 2.5, maxDur: 5.0 }
  };
  const currentSettings = settings[activeLevel] || settings.easy;

  const spawnBubble = () => {
    if (!areaRef.current) return;
    const w = areaRef.current.clientWidth || 360;
    const size = 62 + Math.random() * 68;
    const left = 10 + Math.random() * Math.max(10, w - size - 20);
    const dur = currentSettings.minDur + Math.random() * (currentSettings.maxDur - currentSettings.minDur);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const icon = BUBBLE_ICONS[Math.floor(Math.random() * BUBBLE_ICONS.length)];
    const id = _uid++;
    setBubbles(prev => [...prev.slice(-28), { id, size, left, dur, color, icon }]);
  };

  const startGame = (selectedLevel = activeLevel) => {
    setActiveLevel(selectedLevel);
    _uid = 0;
    scoreRef.current = 0;
    setScore(0);
    setBubbles([]);
    setPoppedSet(new Set());
    setTimeLeft(settings[selectedLevel]?.time || settings.easy.time);
    startTimeRef.current = Date.now();
    setPhase("playing");
  };

  // Auto-start when used in therapy session
  useEffect(() => {
    if (isSession) {
      startGame(level);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSession, level]);

  // Bubble spawner
  useEffect(() => {
    if (phase !== "playing") return;
    spawnBubble();
    spawnRef.current = setInterval(spawnBubble, currentSettings.spawnInterval);
    return () => clearInterval(spawnRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSettings.spawnInterval]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "playing") return;
    countRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
          setPhase("over");
          clearInterval(countRef.current);
          clearInterval(spawnRef.current);
          playWin();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countRef.current);
  }, [phase]);

  const popBubble = (id) => {
    if (poppedSet.has(id)) return;
    playPop();
    scoreRef.current += 1;
    setScore(s => s + 1);
    setPoppedSet(prev => new Set([...prev, id]));
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== id));
      setPoppedSet(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 280);
  };

  const onBubbleGone = (id) => {
    if (!poppedSet.has(id)) setBubbles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 70px)",
      background: "linear-gradient(170deg,#87CEEB 0%,#98E4FF 45%,#B8F4FF 100%)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Nunito','Inter',sans-serif"
    }}>
      <style>{`
        @keyframes bbl-rise { from { transform: translateY(0) scale(1); } to { transform: translateY(-115vh) scale(0.75); } }
        @keyframes bbl-pop  { 0%{transform:scale(1);opacity:1} 55%{transform:scale(1.9);opacity:0.6} 100%{transform:scale(0);opacity:0} }
        .bbl { position:absolute; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; user-select:none; will-change:transform; touch-action:manipulation; }
        .bbl-alive { animation: bbl-rise linear forwards; }
        .bbl-dead  { animation: bbl-pop 0.28s ease-out forwards !important; pointer-events:none; }
        @keyframes cloud-drift { 0%{transform:translateX(0)} 50%{transform:translateX(18px)} 100%{transform:translateX(0)} }
        .cloud { position:absolute; background:rgba(255,255,255,0.75); border-radius:50px; pointer-events:none; animation:cloud-drift linear infinite; }
        @keyframes score-pop { 0%{transform:scale(1)} 40%{transform:scale(1.3)} 100%{transform:scale(1)} }
        .score-num { animation: score-pop 0.25s ease; }
      `}</style>

      {/* Decorative clouds */}
      <div className="cloud" style={{ top: 55, left: "7%",   width: 130, height: 38, animationDuration: "8s"  }} />
      <div className="cloud" style={{ top: 95, right: "18%", width: 95,  height: 28, animationDuration: "11s" }} />
      <div className="cloud" style={{ top: 38, left: "52%",  width: 110, height: 32, animationDuration: "14s" }} />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "11px 18px", background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(12px)", borderBottom: "2px solid rgba(77,150,255,0.18)"
      }}>
        <button onClick={() => navigate("/games")} style={{
          background: "#FF6B6B", color: "white", border: "none",
          borderRadius: "50%", width: 44, height: 44, fontSize: 22,
          cursor: "pointer", boxShadow: "0 4px 12px #FF6B6B44", lineHeight: 1
        }}>←</button>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div key={score} className="score-num" style={{ fontSize: 26, fontWeight: 900, color: "#4D96FF" }}>🫧 {score}</div>
          <div style={{
            background: timeLeft < 10 ? "#FF6B6B" : "#6BCB77",
            color: "white", borderRadius: 20, padding: "6px 16px",
            fontWeight: 800, fontSize: 20, minWidth: 72, textAlign: "center",
            transition: "background 0.3s"
          }}>⏱ {timeLeft}</div>
        </div>
      </div>

      {/* Game area */}
      <div ref={areaRef} style={{ position: "relative", width: "100%", height: "calc(100vh - 135px)", overflow: "hidden" }}>
        {bubbles.map(b => (
          <div
            key={b.id}
            className={`bbl ${poppedSet.has(b.id) ? "bbl-dead" : "bbl-alive"}`}
            onClick={() => !poppedSet.has(b.id) && popBubble(b.id)}
            onAnimationEnd={() => onBubbleGone(b.id)}
            style={{
              left: b.left,
              bottom: -(b.size + 20),
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.88), ${b.color.fill})`,
              border: `3px solid ${b.color.stroke}`,
              boxShadow: `0 0 22px ${b.color.glow}, inset 0 0 14px rgba(255,255,255,0.4)`,
              fontSize: b.size * 0.38,
              animationDuration: `${b.dur}s`,
            }}
          >
            {b.icon}
          </div>
        ))}

        {/* Level Select */}
        {phase === "level_select" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20, padding: 24, zIndex: 10,
            background: "linear-gradient(170deg,#87CEEB 0%,#98E4FF 45%,#B8F4FF 100%)"
          }}>
            <div style={{ fontSize: 60, filter: "drop-shadow(0 10px 24px rgba(77,150,255,0.35))" }}>🫧</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#4D96FF", textShadow: "0 4px 14px rgba(255,255,255,0.5)" }}>Bubble Pop!</div>
            <div style={{ fontSize: 16, color: "#444", marginBottom: 10 }}>Choose your challenge:</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 360 }}>
              {[ 
                { id: "easy", label: "Easy", desc: "Slower bubbles", colors: ["#6BCB77", "#4CAF50"] },
                { id: "medium", label: "Medium", desc: "Standard speed", colors: ["#FF8C42", "#E57322"] },
                { id: "hard", label: "Hard", desc: "Fast bubbles!", colors: ["#FF6B6B", "#E05252"] }
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
                    <div style={{ fontSize: 14, opacity: 0.9 }}>{lv.desc} · {settings[lv.id]?.time}s</div>
                  </div>
                  <div style={{ fontSize: 32 }}>
                    {["🟢", "🟡", "🔴"][i]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game over - Diagnostic Report */}
        {phase === "over" && (
          <GameConclusionFlow
            gameName="Bubble Pop"
            score={score}
            total={50}
            duration={duration}
            skills={["Fine Motor", "Focus", "Visual Tracking"]}
            onAction={isSession ? onComplete : () => setPhase("level_select")}
            actionLabel={isSession ? "Continue Journey" : "Play Again"}
          />
        )}
      </div>
    </div>
  );
}
