/**
 * Problem Solving – Standalone Pattern Completion Game
 * Complete the pattern sequence by choosing the correct next item.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";

// Pattern definitions – each has a repeating unit and a display sequence
const PATTERNS = [
  // Color patterns
  { seq:["🔴","🔵","🔴","🔵","❓"], answer:"🔴", options:["🔴","🔵","🟡"],      hint:"color" },
  { seq:["🟡","🟢","🟡","🟢","❓"], answer:"🟡", options:["🟡","🟢","🔴"],      hint:"color" },
  { seq:["🔴","🔴","🔵","🔴","🔴","❓"], answer:"🔵", options:["🔵","🔴","🟡"], hint:"color" },
  { seq:["🟢","🟡","🔵","🟢","🟡","❓"], answer:"🔵", options:["🔵","🟢","🔴"], hint:"color" },
  // Animal patterns
  { seq:["🐶","🐱","🐶","🐱","❓"], answer:"🐶", options:["🐶","🐱","🐸"],      hint:"animal" },
  { seq:["🐸","🐰","🐸","🐰","❓"], answer:"🐸", options:["🐰","🐸","🐱"],      hint:"animal" },
  { seq:[" foxes ","🐻","🐼","🦊","🐻","❓"], answer:"🐼", options:["🐼","🦊","🐻"], hint:"animal" },
  // Fruit patterns
  { seq:["🍎","🍌","🍎","🍌","❓"], answer:"🍎", options:["🍎","🍌","🍇"],      hint:"fruit" },
  { seq:["🍊","🍇","🍊","🍇","❓"], answer:"🍊", options:["🍊","🍇","🍌"],      hint:"fruit" },
  { seq:["🍓","🍒","🍋","🍓","🍒","❓"], answer:"🍋", options:["🍋","🍓","🍒"], hint:"fruit" },
  // Shape/symbol patterns
  { seq:["⭐","🌙","⭐","🌙","❓"], answer:"⭐", options:["⭐","🌙","☀️"],       hint:"symbol" },
  { seq:["❤️","💙","💛","❤️","💙","❓"], answer:"💛", options:["💛","❤️","💙"],  hint:"symbol" },
  { seq:["🌸","🌺","🌻","🌸","🌺","❓"], answer:"🌻", options:["🌻","🌸","🌺"],  hint:"symbol" },
  // Number/size patterns
  { seq:["🔹","🔷","🔹","🔷","❓"], answer:"🔹", options:["🔹","🔷","🔶"],      hint:"shape" },
  { seq:["🔺","🔻","🔺","🔻","❓"], answer:"🔺", options:["🔺","🔻","🔷"],      hint:"shape" },
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
    [523, 659, 784].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.24, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.25);
    });
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "square";
    o.frequency.value = 200;
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

function playWin() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
}

const ROUNDS_PER_GAME = 10;

export default function ProblemSolving({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [phase, setPhase] = useState(isSession ? "playing" : "idle");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | "correct" | wrong-option
  const [streak, setStreak] = useState(0);
  const startTimeRef = useRef(null);
  const [endTime, setEndTime] = useState(null);

  const roundsToPlay = level === "easy" ? 6 : level === "medium" ? 10 : 15;

  const buildQueue = useCallback(() => {
    return shuffle(PATTERNS).slice(0, roundsToPlay);
  }, [roundsToPlay]);

  const startGame = useCallback(() => {
    const q = buildQueue();
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setQueue(q.slice(1));
    setCurrent(q[0]);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [buildQueue]);

  // Auto-start for guided sessions
  const initialized = useRef(false);
  useEffect(() => {
    if (isSession && !initialized.current) {
        initialized.current = true;
        startGame();
    }
  }, [isSession, startGame]);

  const handleOption = (opt) => {
    if (phase !== "playing" || feedback !== null || !current) return;
    const correct = opt === current.answer;
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback("correct");
    } else {
      playWrong();
      setStreak(0);
      setFeedback(opt); // mark the wrong choice
    }
    setTimeout(() => {
      setFeedback(null);
      if (queue.length === 0) {
        playWin();
        setEndTime(Date.now());
        setPhase("over");
      } else {
        setRound(r => r + 1);
        setCurrent(queue[0]);
        setQueue(q => q.slice(1));
      }
    }, correct ? 700 : 1000);
  };

  return (
    <div style={{ 
      minHeight:"calc(100vh - 70px)", 
      background:"linear-gradient(160deg,#F0F8FF 0%,#F8F0FF 50%,#FFFBEB 100%)", 
      fontFamily:"'Nunito','Inter',sans-serif", 
      display:"flex", 
      flexDirection:"column",
      padding: isSession ? "0" : "inherit"
    }}>
      <style>{`
        @keyframes seq-item-in { 0%{transform:scale(0.5) translateY(-10px);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes question-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes option-in { 0%{transform:scale(0.7) translateY(8px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes correct-bounce { 0%{transform:scale(1)} 30%{transform:scale(1.25)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes streak-pop { 0%{opacity:0;transform:scale(0)} 60%{transform:scale(1.2)} 100%{opacity:1;transform:scale(1)} }
        .seq-item { animation: seq-item-in 0.35s ease both; }
        .q-mark { animation: question-pulse 1.5s ease-in-out infinite; }
        .opt-btn { animation: option-in 0.3s ease both; transition:transform 0.12s; }
        .opt-btn:active { transform: scale(0.88) !important; }
        .opt-correct { animation: correct-bounce 0.4s ease; }
        .opt-wrong   { animation: wrong-shake   0.35s ease; }
      `}</style>

      {/* Header - Hid in session mode as state machine handles it */}
      {!isSession && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(99,102,241,0.12)", flexShrink:0 }}>
          <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {phase === "playing" && <div style={{ fontSize:15, fontWeight:700, color:"#888" }}>{round}/{roundsToPlay}</div>}
            <div style={{ fontSize:24, fontWeight:900, color:"#6366F1" }}>⭐ {score}</div>
            {streak >= 2 && <div key={streak} style={{ fontSize:14, fontWeight:800, color:"#FF8C42", animation:"streak-pop 0.3s ease" }}>🔥×{streak}</div>}
          </div>
        </div>
      )}

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:24 }}>

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ fontSize:80 }}>🧩</div>
            <div style={{ fontSize:34, fontWeight:900, color:"#6366F1" }}>What Comes Next?</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:290, lineHeight:1.5 }}>Look at the pattern and find the missing piece!</div>
            {/* Demo pattern */}
            <div style={{ display:"flex", gap:10, fontSize:38, background:"white", borderRadius:20, padding:"12px 20px", boxShadow:"0 4px 16px rgba(99,102,241,0.15)" }}>
              {["🔴","🔵","🔴","🔵","❓"].map((s, i) => (
                <span key={i} style={{ animation: s === "❓" ? "question-pulse 1.5s ease-in-out infinite" : "none" }}>{s}</span>
              ))}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(99,102,241,0.35)" }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing */}
        {phase === "playing" && current && (
          <>
            {/* Instruction */}
            <div style={{ fontSize:15, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:1 }}>What comes next?</div>

            {/* Pattern sequence */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", borderRadius:24, padding:"16px 20px", boxShadow:"0 8px 28px rgba(99,102,241,0.12)", flexWrap:"wrap", justifyContent:"center" }}>
              {current.seq.map((item, i) => (
                <div
                  key={`${round}_${i}`}
                  className={item === "❓" ? "q-mark" : "seq-item"}
                  style={{
                    width:60, height:60, borderRadius:16,
                    background: item === "❓" ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#F8F8FF",
                    border: item === "❓" ? "none" : "2px solid #E8E8FF",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize: item === "❓" ? 28 : 36,
                    color: item === "❓" ? "white" : "inherit",
                    boxShadow: item === "❓" ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                    fontWeight: item === "❓" ? 900 : "normal",
                    animationDelay: `${i * 0.06}s`,
                    flexShrink:0,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/roundsToPlay)*100}%`, height:"100%", background:"linear-gradient(90deg,#6366F1,#8B5CF6)", borderRadius:10, transition:"width 0.4s ease" }} />
            </div>

            {/* Options */}
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
              {current.options.map((opt, i) => {
                const isCorrect  = feedback === "correct"  && opt === current.answer;
                const isWrong    = feedback === opt        && opt !== current.answer;
                return (
                  <button
                    key={opt}
                    className={`opt-btn ${isCorrect ? "opt-correct" : isWrong ? "opt-wrong" : ""}`}
                    onClick={() => handleOption(opt)}
                    disabled={feedback !== null}
                    style={{
                      width:100, height:100, borderRadius:24,
                      border:`3px solid ${isCorrect ? "#6BCB77" : isWrong ? "#FF6B6B" : "#E8E8FF"}`,
                      background: isCorrect ? "linear-gradient(135deg,#6BCB77,#4CAF50)" : isWrong ? "#FFE5E5" : "white",
                      cursor: feedback !== null ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:52,
                      boxShadow: isCorrect ? "0 6px 20px rgba(107,203,119,0.4)" : "0 4px 14px rgba(99,102,241,0.1)",
                      animationDelay:`${i * 0.08}s`,
                      position:"relative",
                    }}
                    onMouseDown={e => feedback === null && (e.currentTarget.style.transform = "scale(0.9)")}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    onTouchStart={e => feedback === null && (e.currentTarget.style.transform = "scale(0.9)")}
                    onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {opt}
                    {isCorrect && <div style={{ position:"absolute", top:-10, right:-10, fontSize:24 }}>✅</div>}
                    {isWrong   && <div style={{ position:"absolute", top:-10, right:-10, fontSize:24 }}>❌</div>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Game over - Integrated StandaloneGameReport */}
        {phase === "over" && (
           <GameConclusionFlow 
             gameName="Problem Solving"
             score={score}
             total={roundsToPlay}
             duration={endTime && startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0}
             skills={["Pattern Recognition", "Logic", "Sequential Thinking"]}
             onAction={isSession ? onComplete : () => setPhase("idle")}
             actionLabel={isSession ? "Continue Journey" : "Play Again"}
           />
        )}
      </div>
    </div>
  );
}
