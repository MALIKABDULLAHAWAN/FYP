import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Each animal: emoji, name, and what sound text to speak
const ANIMALS = [
  { id:"dog",      emoji:"🐶", name:"Dog",      sound:"Woof! Woof!",        color:"#FF8C42", bg:"#FFF0E8" },
  { id:"cat",      emoji:"🐱", name:"Cat",      sound:"Meow! Meow!",        color:"#FF9FF3", bg:"#FFE8FF" },
  { id:"cow",      emoji:"🐮", name:"Cow",      sound:"Moo! Moo!",          color:"#6BCB77", bg:"#E8FFE8" },
  { id:"duck",     emoji:"🐥", name:"Duck",     sound:"Quack! Quack!",      color:"#FFD93D", bg:"#FFFACD" },
  { id:"lion",     emoji:"🦁", name:"Lion",     sound:"Roar!",              color:"#FF6B6B", bg:"#FFE5E5" },
  { id:"frog",     emoji:"🐸", name:"Frog",     sound:"Ribbit! Ribbit!",    color:"#4D96FF", bg:"#E5F0FF" },
  { id:"sheep",    emoji:"🐑", name:"Sheep",    sound:"Baa! Baa!",          color:"#A8DADC", bg:"#E8F8F8" },
  { id:"elephant", emoji:"🐘", name:"Elephant", sound:"Trumpet! Trumpet!",  color:"#8B5CF6", bg:"#F0E8FF" },
  { id:"bee",      emoji:"🐝", name:"Bee",      sound:"Buzz! Buzz!",        color:"#F59E0B", bg:"#FFFCE8" },
  { id:"horse",    emoji:"🐴", name:"Horse",    sound:"Neigh! Neigh!",      color:"#EC4899", bg:"#FFE8F5" },
  { id:"pig",      emoji:"🐷", name:"Pig",      sound:"Oink! Oink!",        color:"#FB923C", bg:"#FFF2E8" },
  { id:"bird",     emoji:"🐦", name:"Bird",     sound:"Tweet! Tweet!",      color:"#06B6D4", bg:"#E0FAFF" },
];

function speak(text, rate = 0.8) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1.2;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.type = "sawtooth";
    o.frequency.value = 160;
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.28);
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
  const others = shuffle(all.filter(a => a.id !== correct.id)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

const ROUNDS = 12;

export default function AnimalSoundGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const [streak, setStreak] = useState(0);

  const presentAnimal = useCallback((animal) => {
    setCurrent(animal);
    setChoices(getChoices(animal, ANIMALS, 4));
    setTimeout(() => speak(animal.sound), 350);
  }, []);

  const buildQueue = useCallback(() => {
    const base = shuffle([...ANIMALS]);
    const q = [];
    while (q.length < ROUNDS) q.push(...base);
    return q.slice(0, ROUNDS);
  }, []);

  const startGame = () => {
    const q = buildQueue();
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setWrongId(null);
    setQueue(q.slice(1));
    presentAnimal(q[0]);
    setPhase("playing");
  };

  const handleChoice = (animal) => {
    if (phase !== "playing" || !current) return;
    const correct = animal.id === current.id;
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback("correct");
    } else {
      playWrong();
      setStreak(0);
      setFeedback("wrong");
      setWrongId(animal.id);
      setTimeout(() => speak(current.sound), 300);
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
          presentAnimal(q[0]);
          return q.slice(1);
        });
        setPhase("playing");
      }
    }, correct ? 700 : 1200);
  };

  const stars = score >= 11 ? 3 : score >= 8 ? 2 : 1;

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#F0FDF4 0%,#FFFBEB 50%,#FFF0F5 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes speaker-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes animal-in { 0%{transform:scale(0.3) rotate(-25deg);opacity:0} 65%{transform:scale(1.12) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes correct-bounce { 0%{transform:scale(1)} 30%{transform:scale(1.2)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }
        @keyframes card-in { 0%{transform:scale(0.7) translateY(10px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        .speaker-btn { animation: speaker-pulse 1.5s ease-in-out infinite; }
        .animal-anim { animation: animal-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-anim { animation: card-in 0.3s ease both; }
        .wrong-anim { animation: wrong-shake 0.35s ease; }
        .correct-anim { animation: correct-bounce 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(16,185,129,0.12)", flexShrink:0 }}>
        <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {phase !== "idle" && <div style={{ fontSize:15, fontWeight:700, color:"#888" }}>{round}/{ROUNDS}</div>}
          <div style={{ fontSize:24, fontWeight:900, color:"#10B981" }}>⭐ {score}</div>
          {streak >= 2 && <div style={{ fontSize:14, fontWeight:800, color:"#FF8C42" }}>🔥×{streak}</div>}
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:22 }}>

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ fontSize:80, filter:"drop-shadow(0 8px 20px rgba(16,185,129,0.3))" }}>🔊</div>
            <div style={{ fontSize:34, fontWeight:900, color:"#10B981" }}>Animal Sounds!</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:290, lineHeight:1.5 }}>Listen to the sound and tap the right animal!</div>
            <div style={{ display:"flex", gap:12, fontSize:38 }}>
              {["🐶","🐱","🐮","🐥","🦁"].map(e => <span key={e}>{e}</span>)}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#10B981,#06B6D4)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(16,185,129,0.35)" }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Sound speaker card */}
            <div key={round} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>Who makes this sound?</div>
              <button
                onClick={() => speak(current.sound)}
                className={phase === "playing" ? "speaker-btn" : ""}
                style={{ width:130, height:130, borderRadius:32, background:"linear-gradient(135deg,#10B981,#06B6D4)", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 10px 36px rgba(16,185,129,0.35)", color:"white", fontSize:52 }}
              >
                🔊
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/ROUNDS)*100}%`, height:"100%", background:"linear-gradient(90deg,#10B981,#06B6D4)", borderRadius:10, transition:"width 0.4s ease" }} />
            </div>

            {/* Animal choices - 2x2 grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, width:"100%", maxWidth:360 }}>
              {choices.map((animal, idx) => {
                const isWrong   = wrongId === animal.id;
                const isCorrect = feedback === "correct" && animal.id === current.id;
                return (
                  <button
                    key={animal.id}
                    className={`card-anim ${isWrong ? "wrong-anim" : isCorrect ? "correct-anim" : ""}`}
                    onClick={() => handleChoice(animal)}
                    disabled={phase === "feedback"}
                    style={{
                      height:96, borderRadius:22,
                      border:`3px solid ${isCorrect ? "#6BCB77" : isWrong ? "#FF6B6B" : animal.color}`,
                      background: isWrong ? "#FFE5E5" : isCorrect ? "#E8FFE8" : animal.bg,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:58,
                      boxShadow: `0 4px 16px ${animal.color}33`,
                      transition:"transform 0.12s",
                      animationDelay: `${idx * 0.07}s`,
                      position:"relative",
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.91)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    onTouchStart={e => e.currentTarget.style.transform = "scale(0.91)"}
                    onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {animal.emoji}
                    {isCorrect && <div style={{ position:"absolute", top:-10, right:-10, fontSize:26 }}>✅</div>}
                    {isWrong   && <div style={{ position:"absolute", top:-10, right:-10, fontSize:26 }}>❌</div>}
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
            <div style={{ fontSize:30, fontWeight:900, color:"#10B981" }}>Fantastic!</div>
            <div style={{ fontSize:52, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#555" }}>Score: <b style={{ color:"#10B981" }}>{score}</b> / {ROUNDS}</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
              <button onClick={startGame} style={{ background:"linear-gradient(135deg,#FF6B6B,#FFD93D)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🔄 Again!</button>
              <button onClick={() => navigate("/games")} style={{ background:"linear-gradient(135deg,#10B981,#06B6D4)", color:"white", border:"none", borderRadius:50, padding:"15px 38px", fontSize:22, fontWeight:900, cursor:"pointer" }}>🏠 Games</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
