import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import { Sticker3D } from "../../components/AmbientEffects";

// Each animal: emoji, name, sound text, and real audio URL
const ANIMALS = [
  { id:"dog",      emoji:"🐶", name:"Dog",      sound:"Woof! Woof!",        color:"#FF8C42", bg:"#FFF0E8", audioUrl:"https://cdn.freesound.org/previews/557/557304_5265935-lq.mp3" },
  { id:"cat",      emoji:"🐱", name:"Cat",      sound:"Meow! Meow!",        color:"#FF9FF3", bg:"#FFE8FF", audioUrl:"https://cdn.freesound.org/previews/415/415209_2269796-lq.mp3" },
  { id:"cow",      emoji:"🐮", name:"Cow",      sound:"Moo! Moo!",          color:"#6BCB77", bg:"#E8FFE8", audioUrl:"https://cdn.freesound.org/previews/58/58277_634166-lq.mp3" },
  { id:"duck",     emoji:"🐥", name:"Duck",     sound:"Quack! Quack!",      color:"#FFD93D", bg:"#FFFACD", audioUrl:"https://cdn.freesound.org/previews/111/111789_1186697-lq.mp3" },
  { id:"lion",     emoji:"🦁", name:"Lion",     sound:"Roar!",              color:"#FF6B6B", bg:"#FFE5E5", audioUrl:"https://cdn.freesound.org/previews/460/460165_9415424-lq.mp3" },
  { id:"frog",     emoji:"🐸", name:"Frog",     sound:"Ribbit! Ribbit!",    color:"#4D96FF", bg:"#E5F0FF", audioUrl:"https://cdn.freesound.org/previews/194/194740_1062850-lq.mp3" },
  { id:"sheep",    emoji:"🐑", name:"Sheep",    sound:"Baa! Baa!",          color:"#A8DADC", bg:"#E8F8F8", audioUrl:"https://cdn.freesound.org/previews/430/430039_5738510-lq.mp3" },
  { id:"elephant", emoji:"🐘", name:"Elephant", sound:"Trumpet! Trumpet!",  color:"#8B5CF6", bg:"#F0E8FF", audioUrl:"https://cdn.freesound.org/previews/520/520328_6927782-lq.mp3" },
  { id:"bee",      emoji:"🐝", name:"Bee",      sound:"Buzz! Buzz!",        color:"#F59E0B", bg:"#FFFCE8", audioUrl:"https://cdn.freesound.org/previews/398/398165_2269796-lq.mp3" },
  { id:"horse",    emoji:"🐴", name:"Horse",    sound:"Neigh! Neigh!",      color:"#EC4899", bg:"#FFE8F5", audioUrl:"https://cdn.freesound.org/previews/322/322443_5828649-lq.mp3" },
  { id:"pig",      emoji:"🐷", name:"Pig",      sound:"Oink! Oink!",        color:"#FB923C", bg:"#FFF2E8", audioUrl:"https://cdn.freesound.org/previews/331/331848_5917506-lq.mp3" },
  { id:"bird",     emoji:"🐦", name:"Bird",     sound:"Tweet! Tweet!",      color:"#06B6D4", bg:"#E0FAFF", audioUrl:"https://cdn.freesound.org/previews/398/398917_1429152-lq.mp3" },
];

// Preload audio cache
const audioCache = {};
ANIMALS.forEach(a => {
  if (a.audioUrl) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = a.audioUrl;
    audioCache[a.id] = audio;
  }
});

// Play real animal sound with TTS fallback
function playAnimalSound(animal) {
  if (!animal) return;
  const cached = audioCache[animal.id];
  if (cached) {
    // Clone to allow overlapping playback
    const clone = cached.cloneNode();
    clone.volume = 1.0;
    clone.play().catch(() => {
      // Fallback to speech synthesis if audio fails
      speakText(animal.sound);
    });
    return;
  }
  // If no audio URL, use TTS
  speakText(animal.sound);
}

function speakText(text, rate = 0.8) {
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

export default function AnimalSoundGame({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [phase, setPhase] = useState(isSession ? "playing" : "level_select");
  const [activeLevel, setActiveLevel] = useState(level);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const [streak, setStreak] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [duration, setDuration] = useState(0);

  // Difficulty / Rounds configuration
  const roundsPerLevel = {
    easy: 6,
    medium: 10,
    hard: 15
  };
  const TOTAL_ROUNDS = roundsPerLevel[activeLevel] || 8;

  const presentAnimal = useCallback((animal) => {
    setCurrent(animal);
    setChoices(getChoices(animal, ANIMALS, 4));
    setTimeout(() => playAnimalSound(animal), 350);
  }, []);

  const buildQueue = useCallback(() => {
    const base = shuffle([...ANIMALS]);
    const q = [];
    while (q.length < TOTAL_ROUNDS) q.push(...base);
    return q.slice(0, TOTAL_ROUNDS);
  }, [TOTAL_ROUNDS]);

  const startGame = useCallback((lvl = activeLevel) => {
    setActiveLevel(lvl);
    const q = buildQueue(lvl);
    setScore(0);
    setRound(1);
    setStreak(0);
    setFeedback(null);
    setWrongId(null);
    setQueue(q.slice(1));
    presentAnimal(q[0]);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [activeLevel, buildQueue, presentAnimal]);

  const initialized = useRef(false);
  // Auto-start in session
  useEffect(() => {
    if (isSession && !initialized.current) {
      initialized.current = true;
      startGame(level);
    }
  }, [isSession, level, startGame]);

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
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        setPhase("over");
        if (isSession && onComplete) {
          onComplete({
            total_trials: TOTAL_ROUNDS,
            correct: score + (correct ? 1 : 0),
            accuracy: (score + (correct ? 1 : 0)) / TOTAL_ROUNDS,
            current_level: level
          });
        }
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

  const stars = score >= (TOTAL_ROUNDS * 0.9) ? 3 : score >= (TOTAL_ROUNDS * 0.6) ? 2 : 1;

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

      {/* Header - Suppressed in session */}
      {!isSession && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(16,185,129,0.12)", flexShrink:0 }}>
          <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>{round}/{TOTAL_ROUNDS}</div>
            <div style={{ fontSize:24, fontWeight:900, color:"#10B981" }}>⭐ {score}</div>
            {streak >= 2 && <div style={{ fontSize:14, fontWeight:800, color:"#FF8C42" }}>🔥×{streak}</div>}
          </div>
        </div>
      )}

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:22 }}>

        {/* Level Select */}
        {phase === "level_select" && !isSession && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20, padding: 24, zIndex: 10, width: "100%"
          }}>
            <Sticker3D animate={true}>
              <div style={{ fontSize: 60, filter: "drop-shadow(0 10px 24px rgba(16,185,129,0.35))" }}>🔊</div>
            </Sticker3D>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#10B981", textShadow: "0 4px 14px rgba(255,255,255,0.5)" }}>Animal Sounds!</div>
            <div style={{ fontSize: 16, color: "#444", marginBottom: 10 }}>Choose your difficulty:</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 360 }}>
              {[ 
                { id: "easy", label: "Easy", desc: "6 Sounds", colors: ["#6BCB77", "#4CAF50"] },
                { id: "medium", label: "Medium", desc: "10 Sounds", colors: ["#FF8C42", "#E57322"] },
                { id: "hard", label: "Hard", desc: "15 Sounds", colors: ["#FF6B6B", "#E05252"] }
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

        {/* Playing */}
        {(phase === "playing" || phase === "feedback") && current && (
          <>
            {/* Sound speaker card */}
            <div key={round} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#888" }}>Who makes this sound?</div>
              <button
                onClick={() => playAnimalSound(current)}
                className={phase === "playing" ? "speaker-btn" : ""}
                style={{ width:130, height:130, borderRadius:32, background:"linear-gradient(135deg,#10B981,#06B6D4)", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 10px 36px rgba(16,185,129,0.35)", color:"white", fontSize:52 }}
              >
                🔊
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:320, height:10, background:"#EEE", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${(round/TOTAL_ROUNDS)*100}%`, height:"100%", background:"linear-gradient(90deg,#10B981,#06B6D4)", borderRadius:10, transition:"width 0.4s ease" }} />
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
          <GameConclusionFlow
            gameName="Animal Sounds"
            score={score}
            total={TOTAL_ROUNDS}
            duration={duration}
            level={activeLevel === 'hard' ? 3 : activeLevel === 'medium' ? 2 : 1}
            skills={["Auditory Processing", "Vocabulary", "Association"]}
            onAction={isSession ? onComplete : () => setPhase("level_select")}
            actionLabel={isSession ? "Continue Journey" : "Play Again"}
          />
        )}
      </div>
    </div>
  );
}
