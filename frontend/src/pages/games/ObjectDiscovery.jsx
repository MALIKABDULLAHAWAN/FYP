/**
 * Object Discovery – Standalone
 * Find all items belonging to the given category.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  {
    id:"animals", label:"Animals", emoji:"🦁", color:"#FF8C42", bg:"#FFF0E8",
    items:[
      { emoji:"🐶", yes:true  },{ emoji:"🐱", yes:true  },{ emoji:"🐸", yes:true  },
      { emoji:"🦊", yes:true  },{ emoji:"🐧", yes:true  },{ emoji:"🦋", yes:true  },
      { emoji:"🍕", yes:false },{ emoji:"🚗", yes:false },{ emoji:"🏠", yes:false },
      { emoji:"⭐", yes:false },
    ],
  },
  {
    id:"fruits", label:"Fruits", emoji:"🍎", color:"#FF6B6B", bg:"#FFE5E5",
    items:[
      { emoji:"🍎", yes:true  },{ emoji:"🍌", yes:true  },{ emoji:"🍇", yes:true  },
      { emoji:"🍓", yes:true  },{ emoji:"🍊", yes:true  },{ emoji:"🍒", yes:true  },
      { emoji:"🚀", yes:false },{ emoji:"📚", yes:false },{ emoji:"🎸", yes:false },
      { emoji:"🧦", yes:false },
    ],
  },
  {
    id:"vehicles", label:"Vehicles", emoji:"🚗", color:"#4D96FF", bg:"#E5F0FF",
    items:[
      { emoji:"🚗", yes:true  },{ emoji:"🚌", yes:true  },{ emoji:"✈️", yes:true  },
      { emoji:"🚂", yes:true  },{ emoji:"🛸", yes:true  },{ emoji:"🚁", yes:true  },
      { emoji:"🐰", yes:false },{ emoji:"🍦", yes:false },{ emoji:"🌸", yes:false },
      { emoji:"🎃", yes:false },
    ],
  },
  {
    id:"food", label:"Food", emoji:"🍔", color:"#F59E0B", bg:"#FFFCE8",
    items:[
      { emoji:"🍔", yes:true  },{ emoji:"🍕", yes:true  },{ emoji:"🌮", yes:true  },
      { emoji:"🍜", yes:true  },{ emoji:"🍩", yes:true  },{ emoji:"🍦", yes:true  },
      { emoji:"🎈", yes:false },{ emoji:"🐢", yes:false },{ emoji:"🎵", yes:false },
      { emoji:"🏆", yes:false },
    ],
  },
  {
    id:"toys", label:"Toys", emoji:"🎮", color:"#8B5CF6", bg:"#F0E8FF",
    items:[
      { emoji:"🎮", yes:true  },{ emoji:"🪀", yes:true  },{ emoji:"🎲", yes:true  },
      { emoji:"🪁", yes:true  },{ emoji:"🎯", yes:true  },{ emoji:"🧩", yes:true  },
      { emoji:"🌵", yes:false },{ emoji:"🍋", yes:false },{ emoji:"🐋", yes:false },
      { emoji:"🏔️", yes:false },
    ],
  },
  {
    id:"nature", label:"Nature", emoji:"🌿", color:"#6BCB77", bg:"#E8FFE8",
    items:[
      { emoji:"🌸", yes:true  },{ emoji:"🌻", yes:true  },{ emoji:"🌿", yes:true  },
      { emoji:"🍂", yes:true  },{ emoji:"🌈", yes:true  },{ emoji:"⛅", yes:true  },
      { emoji:"🎸", yes:false },{ emoji:"🛒", yes:false },{ emoji:"💻", yes:false },
      { emoji:"👟", yes:false },
    ],
  },
];

function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 784].forEach((f, i) => {
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
    o.connect(g); g.connect(ctx.destination); o.type = "square";
    o.frequency.value = 180;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.start(); o.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

function playWin() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
      const t = ctx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
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

export default function ObjectDiscovery() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [catIdx, setCatIdx] = useState(0);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [roundResult, setRoundResult] = useState(null); // "perfect" | "good" | "miss"

  const TOTAL_ROUNDS = CATEGORIES.length;

  const loadRound = useCallback((idx) => {
    const cat = CATEGORIES[idx];
    setItems(shuffle(cat.items));
    setSelected(new Set());
    setSubmitted(false);
    setRoundResult(null);
    setCatIdx(idx);
  }, []);

  const startGame = () => {
    setScore(0);
    setRound(0);
    loadRound(0);
    setPhase("playing");
  };

  const toggleItem = (i) => {
    if (submitted) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const submit = () => {
    if (submitted) return;
    const cat = CATEGORIES[catIdx];
    const correctYes = cat.items.filter(it => it.yes);
    const selectedItems = [...selected].map(i => cat.items[i]);
    const correctSelected = selectedItems.filter(it => it.yes).length;
    const wrongSelected   = selectedItems.filter(it => !it.yes).length;
    const missed          = correctYes.length - correctSelected;

    let pts = 0;
    let result = "miss";
    if (wrongSelected === 0 && missed === 0) {
      pts = 3; result = "perfect"; playWin();
    } else if (correctSelected >= correctYes.length * 0.6 && wrongSelected <= 1) {
      pts = 1; result = "good"; playCorrect();
    } else {
      playWrong();
    }

    setScore(s => s + pts);
    setSubmitted(true);
    setRoundResult(result);
  };

  const nextRound = () => {
    const nextIdx = round + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      setPhase("over");
    } else {
      setRound(nextIdx);
      loadRound(nextIdx);
    }
  };

  const cat = CATEGORIES[catIdx];
  const totalScore = score;
  const maxScore = TOTAL_ROUNDS * 3;
  const stars = totalScore >= maxScore - 2 ? 3 : totalScore >= maxScore / 2 ? 2 : 1;

  return (
    <div style={{ minHeight:"calc(100vh - 70px)", background:"linear-gradient(160deg,#FFFBEB 0%,#FFF0F5 50%,#F0F5FF 100%)", fontFamily:"'Nunito','Inter',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes item-pop { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes category-in { 0%{transform:translateY(-10px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        .item-btn { transition: transform 0.12s, box-shadow 0.12s; animation: item-pop 0.3s ease both; }
        .item-btn:active { transform: scale(0.9) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"2px solid rgba(245,158,11,0.12)", flexShrink:0 }}>
        <button onClick={() => navigate("/games")} style={{ background:"#FF6B6B", color:"white", border:"none", borderRadius:"50%", width:44, height:44, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {phase === "playing" && <div style={{ fontSize:15, fontWeight:700, color:"#888" }}>{round + 1}/{TOTAL_ROUNDS}</div>}
          <div style={{ fontSize:24, fontWeight:900, color:"#F59E0B" }}>⭐ {score}</div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", gap:18 }}>

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ fontSize:80 }}>🔍</div>
            <div style={{ fontSize:34, fontWeight:900, color:"#F59E0B" }}>Object Discovery!</div>
            <div style={{ fontSize:17, color:"#666", maxWidth:280, lineHeight:1.5 }}>Find all items that belong to the category!</div>
            <div style={{ display:"flex", gap:12, fontSize:36 }}>
              {CATEGORIES.slice(0,5).map(c => <span key={c.id}>{c.emoji}</span>)}
            </div>
            <button onClick={startGame} style={{ background:"linear-gradient(135deg,#F59E0B,#FB923C)", color:"white", border:"none", borderRadius:50, padding:"18px 52px", fontSize:26, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 28px rgba(245,158,11,0.35)" }}>
              ▶ Play!
            </button>
          </div>
        )}

        {/* Playing */}
        {phase === "playing" && (
          <>
            {/* Category banner */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:1 }}>Find all</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:cat.bg, border:`2px solid ${cat.color}`, borderRadius:24, padding:"10px 24px", boxShadow:`0 4px 16px ${cat.color}33` }}>
                <span style={{ fontSize:36 }}>{cat.emoji}</span>
                <span style={{ fontSize:26, fontWeight:900, color:cat.color }}>{cat.label}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width:"100%", maxWidth:340, height:8, background:"#EEE", borderRadius:8, overflow:"hidden" }}>
              <div style={{ width:`${((round)/TOTAL_ROUNDS)*100}%`, height:"100%", background:`linear-gradient(90deg,${cat.color},#FB923C)`, borderRadius:8, transition:"width 0.4s ease" }} />
            </div>

            {/* Items grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:10, width:"100%", maxWidth:380 }}>
              {items.map((item, i) => {
                const isSel = selected.has(i);
                const isRight = submitted && item.yes;
                const isWrong = submitted && isSel && !item.yes;
                const isMissed = submitted && !isSel && item.yes;
                return (
                  <button
                    key={i}
                    className="item-btn"
                    onClick={() => toggleItem(i)}
                    disabled={submitted}
                    style={{
                      height:68, borderRadius:18,
                      border:`3px solid ${isRight ? "#6BCB77" : isWrong ? "#FF6B6B" : isMissed ? "#FFD93D" : isSel ? cat.color : "#E0E0E0"}`,
                      background: isRight ? "#E8FFE8" : isWrong ? "#FFE5E5" : isMissed ? "#FFFACD" : isSel ? cat.bg : "white",
                      cursor: submitted ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:38, position:"relative",
                      boxShadow: isSel ? `0 4px 14px ${cat.color}44` : "0 2px 8px rgba(0,0,0,0.08)",
                      transform: isSel && !submitted ? "scale(1.06)" : "scale(1)",
                      animationDelay:`${i * 0.04}s`,
                    }}
                  >
                    {item.emoji}
                    {isSel && !submitted && <div style={{ position:"absolute", top:-6, right:-6, width:18, height:18, background:cat.color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"white", fontWeight:900 }}>✓</div>}
                    {isRight  && <div style={{ position:"absolute", top:-6, right:-6, fontSize:16 }}>✅</div>}
                    {isWrong  && <div style={{ position:"absolute", top:-6, right:-6, fontSize:16 }}>❌</div>}
                    {isMissed && <div style={{ position:"absolute", top:-6, right:-6, fontSize:16 }}>⚠️</div>}
                  </button>
                );
              })}
            </div>

            {/* Submit / Next */}
            {!submitted ? (
              <button
                onClick={submit}
                disabled={selected.size === 0}
                style={{ background: selected.size > 0 ? `linear-gradient(135deg,${cat.color},#FB923C)` : "#CCC", color:"white", border:"none", borderRadius:50, padding:"16px 48px", fontSize:22, fontWeight:900, cursor: selected.size > 0 ? "pointer" : "default", boxShadow: selected.size > 0 ? `0 6px 20px ${cat.color}44` : "none", width:"100%", maxWidth:320 }}
              >
                ✓ Check!
              </button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, width:"100%", maxWidth:320 }}>
                <div style={{ fontSize:36 }}>
                  {roundResult === "perfect" ? "🎉 Perfect!" : roundResult === "good" ? "👍 Good!" : "💪 Try again!"}
                </div>
                <button onClick={nextRound} style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"white", border:"none", borderRadius:50, padding:"16px 48px", fontSize:22, fontWeight:900, cursor:"pointer", width:"100%" }}>
                  {round + 1 < TOTAL_ROUNDS ? "Next →" : "Finish!"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Game over */}
        {phase === "over" && (
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:18, background:"white", borderRadius:32, padding:"36px 28px", boxShadow:"0 20px 60px rgba(245,158,11,0.2)", maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:80 }}>🎉</div>
            <div style={{ fontSize:30, fontWeight:900, color:"#F59E0B" }}>Great Explorer!</div>
            <div style={{ fontSize:52, letterSpacing:4 }}>{"⭐".repeat(stars)}</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#555" }}>
              Score: <b style={{ color:"#F59E0B" }}>{totalScore}</b> / {maxScore}
            </div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", width:"100%" }}>
              <button onClick={startGame} style={{ background:"linear-gradient(135deg,#FF6B6B,#FFD93D)", color:"white", border:"none", borderRadius:50, padding:"15px 32px", fontSize:20, fontWeight:900, cursor:"pointer", flex:1 }}>🔄 Again!</button>
              <button onClick={() => navigate("/games")} style={{ background:"linear-gradient(135deg,#F59E0B,#FB923C)", color:"white", border:"none", borderRadius:50, padding:"15px 32px", fontSize:20, fontWeight:900, cursor:"pointer", flex:1 }}>🏠 Games</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
