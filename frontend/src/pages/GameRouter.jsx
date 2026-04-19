import { useNavigate } from "react-router-dom";

// All therapy games with child-friendly metadata
const GAMES = [
  // ── Sensory / Simple ──────────────────────────────────────────────────────
  {
    code: "bubble_pop",
    path: "/games/bubble-pop",
    emoji: "🫧",
    name: "Bubble Pop",
    tagline: "Pop the floating bubbles!",
    color: "#87CEEB",
    grad: "linear-gradient(135deg,#87CEEB,#4D96FF)",
    skills: ["Focus","Reaction","Fun"],
    difficulty: "Easy",
    diffColor: "#6BCB77",
    new: true,
    standalone: true,
  },
  {
    code: "color_match",
    path: "/games/color-match",
    emoji: "🎨",
    name: "Color Match",
    tagline: "Sort things by their color!",
    color: "#FF6B6B",
    grad: "linear-gradient(135deg,#FF6B6B,#FFD93D)",
    skills: ["Colors","Sorting","Vision"],
    difficulty: "Easy",
    diffColor: "#6BCB77",
    new: true,
    standalone: true,
  },
  {
    code: "shape_sort",
    path: "/games/shape-sort",
    emoji: "🔷",
    name: "Shape Sort",
    tagline: "Put shapes in the right bucket!",
    color: "#8B5CF6",
    grad: "linear-gradient(135deg,#8B5CF6,#EC4899)",
    skills: ["Shapes","Sorting","Matching"],
    difficulty: "Easy",
    diffColor: "#6BCB77",
    new: true,
    standalone: true,
  },
  // ── Social / Emotional ───────────────────────────────────────────────────
  {
    code: "emotion_face",
    path: "/games/emotion-face",
    emoji: "😊",
    name: "How Do I Feel?",
    tagline: "Match the face to the feeling!",
    color: "#EC4899",
    grad: "linear-gradient(135deg,#EC4899,#8B5CF6)",
    skills: ["Emotions","Social","Listening"],
    difficulty: "Easy",
    diffColor: "#6BCB77",
    new: true,
    standalone: true,
  },
  {
    code: "animal_sounds",
    path: "/games/animal-sounds",
    emoji: "🐶",
    name: "Animal Sounds",
    tagline: "Who makes that sound?",
    color: "#10B981",
    grad: "linear-gradient(135deg,#10B981,#06B6D4)",
    skills: ["Animals","Listening","Vocabulary"],
    difficulty: "Easy",
    diffColor: "#6BCB77",
    new: true,
    standalone: true,
  },
  {
    code: "emotion_gesture_quest",
    path: "/games/emotion-gesture-quest",
    emoji: "🙌",
    name: "Emotion & Gesture",
    tagline: "Show your feelings with your face!",
    color: "#3B82F6",
    grad: "linear-gradient(135deg,#3B82F6,#6366F1)",
    skills: ["Emotions","Gestures","Camera"],
    difficulty: "Medium",
    diffColor: "#FF8C42",
    standalone: false,
  },
  // ── Memory / Cognitive ───────────────────────────────────────────────────
  {
    code: "memory_match",
    path: "/games/memory-match",
    emoji: "🃏",
    name: "Memory Match",
    tagline: "Flip cards and find the pairs!",
    color: "#EC4899",
    grad: "linear-gradient(135deg,#EC4899,#FF8C42)",
    skills: ["Memory","Concentration","Recall"],
    difficulty: "Medium",
    diffColor: "#FF8C42",
    standalone: true,
  },
  {
    code: "object_discovery",
    path: "/games/object-discovery",
    emoji: "🔍",
    name: "Find It!",
    tagline: "Find all items in the category!",
    color: "#F59E0B",
    grad: "linear-gradient(135deg,#F59E0B,#FB923C)",
    skills: ["Categories","Vocabulary","Thinking"],
    difficulty: "Medium",
    diffColor: "#FF8C42",
    standalone: true,
  },
  {
    code: "problem_solving",
    path: "/games/problem-solving",
    emoji: "🧩",
    name: "What Comes Next?",
    tagline: "Complete the pattern!",
    color: "#6366F1",
    grad: "linear-gradient(135deg,#6366F1,#8B5CF6)",
    skills: ["Patterns","Logic","Thinking"],
    difficulty: "Medium",
    diffColor: "#FF8C42",
    standalone: true,
  },
  // ── Advanced / AI ────────────────────────────────────────────────────────
  {
    code: "story_adventure",
    path: "/games/story-adventure",
    emoji: "📖",
    name: "Story Adventure",
    tagline: "Go on a magical AI story!",
    color: "#7C3AED",
    grad: "linear-gradient(135deg,#7C3AED,#EC4899)",
    skills: ["Reading","Imagination","Choices"],
    difficulty: "Advanced",
    diffColor: "#FF6B6B",
    standalone: false,
  },
  {
    code: "scene_description",
    path: "/games/scene-description",
    emoji: "🖼️",
    name: "Describe the Scene",
    tagline: "Tell me what you see!",
    color: "#8B5CF6",
    grad: "linear-gradient(135deg,#8B5CF6,#6366F1)",
    skills: ["Language","Description","Speech"],
    difficulty: "Advanced",
    diffColor: "#FF6B6B",
    standalone: false,
  },
];

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Advanced: 2 };

export default function GameRouter() {
  const navigate = useNavigate();
  const easy   = GAMES.filter(g => g.difficulty === "Easy");
  const medium = GAMES.filter(g => g.difficulty === "Medium");
  const adv    = GAMES.filter(g => g.difficulty === "Advanced");

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#F8F0FF 0%,#F0F8FF 50%,#FFF8F0 100%)", fontFamily:"'Nunito','Inter',sans-serif" }}>
      <style>{`
        @keyframes title-wave { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes card-hover-lift { to { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.15); } }
        .game-card { transition:transform 0.2s, box-shadow 0.2s; cursor:pointer; }
        .game-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.15); }
        .game-card:active { transform:scale(0.97); }
        .new-badge { animation: title-wave 1.5s ease-in-out infinite; display:inline-block; }
        @keyframes emoji-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .emoji-icon { animation: emoji-bounce 2.5s ease-in-out infinite; display:inline-block; }
      `}</style>

      {/* Hero banner */}
      <div style={{ background:"linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)", color:"white", padding:"32px 20px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.08, backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
        <div style={{ fontSize:56, marginBottom:8 }}>🎮</div>
        <h1 style={{ fontSize:32, fontWeight:900, margin:"0 0 8px", textShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>Therapy Games</h1>
        <p style={{ fontSize:16, opacity:0.9, margin:0, maxWidth:320, marginLeft:"auto", marginRight:"auto" }}>Fun games to learn and grow! 🌟</p>
        {/* Stat pills */}
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginTop:20, flexWrap:"wrap" }}>
          {[["🎮","13 Games"],["⭐","Earn Stars"],["🏆","Get Better"]].map(([ic,lb]) => (
            <div key={lb} style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:20, padding:"6px 16px", fontSize:14, fontWeight:700, border:"1px solid rgba(255,255,255,0.3)" }}>{ic} {lb}</div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"20px 16px 40px" }}>
        <GameSection title="🌟 Easy Games" subtitle="Perfect for starting out!" games={easy} navigate={navigate} bgColor="#E8FFE8" borderColor="#6BCB77" />
        <GameSection title="🔥 Medium Games" subtitle="Ready for a challenge?" games={medium} navigate={navigate} bgColor="#FFF3E0" borderColor="#FF8C42" />
        <GameSection title="🚀 Advanced Games" subtitle="For master players!" games={adv} navigate={navigate} bgColor="#F3E8FF" borderColor="#8B5CF6" />
      </div>
    </div>
  );
}

function GameSection({ title, subtitle, games, navigate, bgColor, borderColor }) {
  if (!games.length) return null;
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:"#333", margin:0 }}>{title}</h2>
      </div>
      <p style={{ fontSize:14, color:"#888", margin:"0 0 14px" }}>{subtitle}</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
        {games.map(g => <GameCard key={g.code} game={g} navigate={navigate} bgColor={bgColor} borderColor={borderColor} />)}
      </div>
    </div>
  );
}

function GameCard({ game, navigate, bgColor, borderColor }) {
  return (
    <div
      className="game-card"
      onClick={() => navigate(game.path)}
      style={{ background:"white", borderRadius:24, overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", position:"relative", border:`2px solid transparent` }}
    >
      {/* Gradient top strip */}
      <div style={{ height:6, background:game.grad }} />

      {/* Badges */}
      <div style={{ position:"absolute", top:16, right:14, display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
        {game.new && (
          <span className="new-badge" style={{ background:"#FF6B6B", color:"white", fontSize:10, fontWeight:900, borderRadius:8, padding:"2px 8px" }}>NEW</span>
        )}
        {game.standalone && (
          <span style={{ background:"#6BCB77", color:"white", fontSize:9, fontWeight:800, borderRadius:8, padding:"2px 6px" }}>✓ WORKS OFFLINE</span>
        )}
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        {/* Emoji icon */}
        <div className="emoji-icon" style={{ fontSize:52, marginBottom:10, display:"block", textAlign:"center" }}>
          {game.emoji}
        </div>

        <div style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#222", marginBottom:4 }}>{game.name}</div>
          <div style={{ fontSize:13, color:"#666", lineHeight:1.4 }}>{game.tagline}</div>
        </div>

        {/* Difficulty */}
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <span style={{ background: game.diffColor + "22", color:game.diffColor, fontWeight:800, fontSize:11, borderRadius:8, padding:"3px 10px" }}>
            {game.difficulty}
          </span>
        </div>

        {/* Skills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, justifyContent:"center", marginBottom:14 }}>
          {game.skills.map(s => (
            <span key={s} style={{ background:"#F0F0FF", color:"#6366F1", fontSize:10, fontWeight:700, borderRadius:6, padding:"2px 7px" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={e => { e.stopPropagation(); navigate(game.path); }}
        style={{ width:"100%", padding:"14px", background:game.grad, color:"white", border:"none", cursor:"pointer", fontSize:16, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
        onMouseDown={e => e.currentTarget.style.opacity = "0.85"}
        onMouseUp={e => e.currentTarget.style.opacity = "1"}
      >
        ▶ Play Now!
      </button>
    </div>
  );
}
