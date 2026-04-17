import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChild, ChildSelector } from "../hooks/useChild";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

const GAMES = [
  {
    code: "emotion_gesture_quest",
    path: "/games/emotion-gesture-quest",
    name: "Emotion & Gesture Quest",
    iconName: "smile",
    description: "Show emotions (happy, sad, angry) and gestures (thumbs up, down, finger)! Interactive therapy for autistic students.",
    color: "rgba(59, 130, 246, 0.25)",
    border: "rgba(59, 130, 246, 0.4)",
    skills: ["Emotion Recognition", "Gesture Commands", "Engagement"],
    difficulty: "All Levels",
    difficultyColor: "#7c3aed",
    recommended: true,
    playTime: "5-10 min",
  },
  {
    code: "ja",
    path: "/games/ja",
    name: "Joint Attention",
    iconName: "eye",
    description: "Practice looking where someone points. Builds shared attention and social engagement skills.",
    color: "rgba(99, 102, 241, 0.25)",
    border: "rgba(99, 102, 241, 0.4)",
    skills: ["Social Engagement", "Shared Attention", "Following Gaze"],
    difficulty: "Beginner",
    difficultyColor: "#48bb78",
    recommended: true,
    playTime: "5-10 min",
  },
  {
    code: "matching",
    path: "/games/matching",
    name: "Shape Matching",
    iconName: "shape-square",
    description: "Match identical shapes and objects. Builds visual discrimination and categorization skills.",
    color: "rgba(16, 185, 129, 0.25)",
    border: "rgba(16, 185, 129, 0.4)",
    skills: ["Visual Discrimination", "Matching", "Pattern Recognition"],
    difficulty: "Beginner",
    difficultyColor: "#48bb78",
    recommended: true,
    playTime: "5-10 min",
  },
  {
    code: "memory_match",
    path: "/games/memory-match",
    name: "Memory Match",
    iconName: "cards",
    description: "Flip cards and find matching pairs! Builds visual memory, concentration, and recall skills.",
    color: "rgba(236, 72, 153, 0.25)",
    border: "rgba(236, 72, 153, 0.4)",
    skills: ["Visual Memory", "Concentration", "Pattern Recall"],
    difficulty: "Intermediate",
    difficultyColor: "#f6ad55",
    recommended: false,
    playTime: "10-15 min",
  },
  {
    code: "object_discovery",
    path: "/games/object-discovery",
    name: "Object Discovery",
    iconName: "search",
    description: "Find and categorize objects by type. Builds receptive language and vocabulary.",
    color: "rgba(245, 158, 11, 0.25)",
    border: "rgba(245, 158, 11, 0.4)",
    skills: ["Receptive Language", "Categorization", "Vocabulary"],
    difficulty: "Intermediate",
    difficultyColor: "#f6ad55",
    recommended: false,
    playTime: "10-15 min",
  },
  {
    code: "problem_solving",
    path: "/games/problem-solving",
    name: "Problem Solving",
    iconName: "puzzle",
    description: "Complete patterns and sequences. Builds logical thinking and executive function.",
    color: "rgba(239, 68, 68, 0.25)",
    border: "rgba(239, 68, 68, 0.4)",
    skills: ["Pattern Logic", "Sequencing", "Executive Function"],
    difficulty: "Advanced",
    difficultyColor: "#fc8181",
    recommended: false,
    playTime: "15-20 min",
  },
  {
    code: "scene_description",
    path: "/games/scene-description",
    name: "Scene Description",
    iconName: "picture",
    description: "Describe images and scenarios. Builds descriptive language and expressive communication skills.",
    color: "rgba(147, 51, 234, 0.25)",
    border: "rgba(147, 51, 234, 0.4)",
    skills: ["Expressive Language", "Vocabulary", "Communication"],
    difficulty: "Advanced",
    difficultyColor: "#fc8181",
    recommended: false,
  },
  {
    code: "story_adventure",
    path: "/games/story-adventure",
    name: "AI Story Adventures",
    iconName: "book",
    description: "Go on a magical, infinite journey created just for you by the Story Weaver AI!",
    color: "rgba(107, 70, 193, 0.25)",
    border: "rgba(107, 70, 193, 0.4)",
    skills: ["Imagination", "Reading", "Decision Making", "Creativity"],
    difficulty: "Advanced",
    difficultyColor: "#fc8181",
    recommended: true,
    playTime: "10-20 min",
  },
];

export default function GameRouter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { childProfile } = useChild();

  const recommendedGames = GAMES.filter(g => g.recommended);
  const otherGames = GAMES.filter(g => !g.recommended);

  return (
    <div className="page-wrapper">
      <div className="container page-content">
      <div className="header">
        <div>
          <div className="h1" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UiIcon name="games" size={40} title="" />
            Therapy Games
          </div>
          <div className="sub">
            Choose a fun game to learn and grow! Select a child first, then pick a game.
          </div>
        </div>
      </div>

      <div className="card-cute card-cute-lavender" style={{ marginBottom: 32, padding: "32px", textAlign: "center" }}>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
          <div className="animate-bounce-soft">
            <UiIcon name="star" size={56} title="" />
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-fun)", fontSize: "28px", fontWeight: "800", background: "linear-gradient(135deg, var(--cute-primary) 0%, var(--cute-purple) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "12px" }}>
          Ready to Play and Learn?
        </div>
        <div style={{ fontSize: "16px", color: "var(--color-text-secondary)", marginBottom: "20px", maxWidth: "500px", margin: "0 auto 20px" }}>
          Each game helps you develop new skills while having fun! 🎮
        </div>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <div className="badge-cute badge-cute-success">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--cute-success)", display: "inline-block", marginRight: "6px" }} />
            Beginner
          </div>
          <div className="badge-cute badge-cute-primary">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--cute-warning)", display: "inline-block", marginRight: "6px" }} />
            Intermediate
          </div>
          <div className="badge-cute badge-cute-pink">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--cute-error)", display: "inline-block", marginRight: "6px" }} />
            Advanced
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24, padding: "18px 20px" }}>
        <ChildSelector />
      </div>

      {recommendedGames.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 20 }}>
            <div className="animate-bounce-soft">
              <UiIcon name="recommended" size={32} title="" />
            </div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-fun)", fontSize: "24px", fontWeight: "800", color: "var(--cute-primary)" }}>Recommended For You</h2>
            <span className="badge-cute badge-cute-primary">
              Great for beginners!
            </span>
          </div>
          <div className="game-grid-cute">
            {recommendedGames.map((game) => (
              <GameCard key={game.code} game={game} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 20 }}>
          <UiIcon name="target" size={32} />
          <h2 style={{ margin: 0, fontFamily: "var(--font-fun)", fontSize: "24px", fontWeight: "800", color: "var(--cute-purple)" }}>All Games</h2>
        </div>
        <div className="divider-cute" style={{ marginBottom: 24 }} />
        <div className="game-grid-cute">
          {otherGames.map((game) => (
            <GameCard key={game.code} game={game} navigate={navigate} />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function GameCard({ game, navigate }) {
  const getCuteCardClass = () => {
    if (game.code === "ja") return "card-cute-primary";
    if (game.code === "matching") return "card-cute-mint";
    if (game.code === "memory_match") return "card-cute-lavender";
    if (game.code === "object_discovery") return "card-cute-cream";
    if (game.code === "story_adventure") return "card-cute-purple";
    return "";
  };

  // Prevent accidental serialization of DOM/react objects
  // Only pass primitive values to navigation/state
  const handleCardClick = () => {
    navigate(game.path);
  };
  return (
    <div
      className={`game-card-cute ${getCuteCardClass()}`}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer"
      }}
      onClick={handleCardClick}
    >
      {game.recommended && (
        <div className="badge-cute badge-cute-primary" style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 10
        }}>
          <UiIcon name="star" size={12} title="" />
          Recommended
        </div>
      )}

      <div style={{ padding: "24px" }}>
        <div style={{ 
          marginBottom: "16px", 
          display: "flex", 
          justifyContent: "center",
          padding: "16px",
          background: game.color,
          borderRadius: "var(--radius-xl)",
          width: "fit-content",
          margin: "0 auto 16px"
        }}>
          <div className="animate-wiggle">
            <UiIcon name={game.iconName} size={48} title={game.name} />
          </div>
        </div>

        <div style={{ fontFamily: "var(--font-fun)", fontSize: "22px", fontWeight: "800", marginBottom: "12px", textAlign: "center" }}>
          {game.name}
        </div>

        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span className="badge-cute" style={{
            background: game.difficultyColor + "20",
            color: game.difficultyColor
          }}>
            {game.difficulty}
          </span>
        </div>

        <div style={{ fontSize: "14px", marginBottom: "16px", lineHeight: "1.6", textAlign: "center", color: "var(--color-text-secondary)" }}>
          {game.description}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
          <UiIcon name="clock" size={16} title="" />
          {game.playTime}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
          {game.skills.map((s) => (
            <span key={s} className="badge-cute badge-cute-primary" style={{ fontSize: "10px" }}>{s}</span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-cute btn-cute-primary"
        style={{
          width: "100%",
          padding: "16px 24px",
          borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}
      >
        <UiIcon name="play" size={18} title="" />
        <span>Play Now!</span>
      </button>
    </div>
  );
}
