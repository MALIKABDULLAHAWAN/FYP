import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import UiIcon from "../../components/ui/UiIcon";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import { generateContent, continueStory } from "../../services/aiServiceEnhanced";
import { AmbientParticles, FloatingOrbs } from "../../components/AmbientEffects";

// Themes defined at module level so they're always available
const THEMES = [
  { id: "space",   label: "Space Explorer",  emoji: "🚀", color: "#4D96FF", bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" },
  { id: "forest",  label: "Magical Forest",  emoji: "🌳", color: "#48bb78", bg: "linear-gradient(135deg, #134e5e, #71b280)" },
  { id: "ocean",   label: "Deep Sea Diver",  emoji: "🌊", color: "#0BC5EA", bg: "linear-gradient(135deg, #005c97, #363795)" },
  { id: "castle",  label: "Dragon Castle",   emoji: "🏰", color: "#ED64A6", bg: "linear-gradient(135deg, #4b1248, #f10711)" },
];

const MAX_TURNS_SESSION = 5;
const MAX_TURNS_FREE    = 7;

export default function StoryAdventure({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();

  const [storyNodes,     setStoryNodes]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [started,        setStarted]        = useState(false);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [phase,          setPhase]          = useState(isSession ? "playing" : "idle");
  const [turns,          setTurns]          = useState(0);
  const [selectedTheme,  setSelectedTheme]  = useState(null);
  const [startTime]                         = useState(Date.now());
  const [endTime,        setEndTime]        = useState(null);

  const storyEndRef  = useRef(null);
  const initialized  = useRef(false);

  const maxTurns = isSession ? MAX_TURNS_SESSION : MAX_TURNS_FREE;

  // Auto-scroll to latest story node
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyNodes]);

  // Auto-start for session mode
  useEffect(() => {
    if (isSession && !initialized.current) {
      initialized.current = true;
      const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
      handleStart(theme);
    }
  }, [isSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = (text) => {
    if (!text || typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
      utterance.rate  = 0.95;
      utterance.pitch = 1.1;
      synth.speak(utterance);
    } catch (e) {
      // Speech synthesis not available — silent fail
    }
  };

  const handleStart = async (theme) => {
    setLoading(true);
    setStarted(true);
    setError("");
    setStoryNodes([]);
    setTurns(0);
    setSelectedTheme(theme);
    setPhase("playing");

    try {
      const age = childProfile?.age || 7;
      const difficultyNum = level === "hard" ? 3 : level === "medium" ? 2 : 1;
      const result = await generateContent("story", theme.id, age, "short", difficultyNum);

      const content =
        typeof result === "string"
          ? result
          : result?.content || result?.title || `Once upon a time in a ${theme.label}…`;

      const choices = Array.isArray(result?.choices) && result.choices.length > 0
        ? result.choices
        : defaultChoices(theme.id);

      setStoryNodes([{ text: content, type: "narrative" }]);
      setCurrentChoices(choices);
      setTurns(1);
      speak(content);
    } catch (_) {
      setError("Couldn't start the adventure. Tap a theme to try again!");
      setStarted(false);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice) => {
    if (loading) return;

    const nextTurn = turns + 1;

    // Append the child's choice as a bubble
    setStoryNodes(prev => [...prev, { text: choice.label, icon: choice.icon, type: "choice" }]);
    setCurrentChoices([]);
    setLoading(true);
    setError("");

    // If this was the last turn, wrap up
    if (nextTurn >= maxTurns) {
      try {
        const storyContext = storyNodes
          .filter(n => n.type === "narrative")
          .map(n => n.text)
          .join("\n\n");

        const result = await continueStory(storyContext, choice.label, "story_weaver", 0);
        const narrative = result?.narrative || result || "And so the adventure came to a wonderful end! You were the hero all along. 🌟";

        setStoryNodes(prev => [...prev, { text: narrative, type: "narrative" }]);
        speak(narrative);
      } catch (_) {
        setStoryNodes(prev => [...prev, {
          text: "And so the adventure came to a wonderful end! You were the hero all along. 🌟",
          type: "narrative"
        }]);
      } finally {
        setLoading(false);
        setTimeout(finishGame, 1800);
      }
      setTurns(nextTurn);
      return;
    }

    try {
      const storyContext = storyNodes
        .filter(n => n.type === "narrative")
        .map(n => n.text)
        .join("\n\n");

      const turnsLeft = maxTurns - nextTurn;
      const result = await continueStory(storyContext, choice.label, "story_weaver", turnsLeft);

      const narrative = result?.narrative || result || "The adventure continues…";
      const nextChoices =
        Array.isArray(result?.choices) && result.choices.length > 0
          ? result.choices
          : defaultChoices(selectedTheme?.id || "forest");

      setStoryNodes(prev => [...prev, { text: narrative, type: "narrative" }]);
      setCurrentChoices(nextChoices);
      setTurns(nextTurn);
      speak(narrative);
    } catch (_) {
      setError("The story magic flickered! Try a different path.");
      // Restore choices so the player isn't stuck
      setCurrentChoices(defaultChoices(selectedTheme?.id || "forest"));
    } finally {
      setLoading(false);
    }
  };

  const finishGame = () => {
    window.speechSynthesis?.cancel();
    setEndTime(Date.now());
    setPhase("over");
    if (onComplete) onComplete({ turns, theme: selectedTheme?.id });
  };

  const handleReplay = () => {
    setPhase("idle");
    setStarted(false);
    setStoryNodes([]);
    setCurrentChoices([]);
    setTurns(0);
    setSelectedTheme(null);
    setError("");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="game-interface"
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: isSession ? "0" : "20px",
        background: selectedTheme?.bg || "var(--bg-base, #f8f9ff)",
        transition: "background 0.8s ease",
      }}
    >
      <AmbientParticles />
      <FloatingOrbs count={4} />

      {/* Header — only in standalone mode */}
      {!isSession && phase !== "over" && (
        <div className="game-header" style={{ position: "relative", zIndex: 10 }}>
          <div className="game-title-section">
            <div className="game-title">
              <UiIcon name="book" size={36} title="AI Story Adventures" />
              <span>AI Story Adventures</span>
            </div>
          </div>
          <div className="game-header-actions">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => { window.speechSynthesis?.cancel(); navigate("/games"); }}
            >
              <UiIcon name="arrow-left" size={16} /> Back
            </button>
          </div>
        </div>
      )}

      <div
        className="container"
        style={{ position: "relative", zIndex: 10, maxWidth: "800px", padding: "24px", margin: "0 auto" }}
      >

        {/* ── Theme picker ── */}
        {phase === "idle" && (
          <div
            className="card-cute card-cute-lavender"
            style={{ textAlign: "center", padding: "40px 20px" }}
          >
            <h2 style={{ fontFamily: "var(--font-fun)", color: "var(--cute-purple)", fontSize: "32px", marginBottom: "8px" }}>
              Choose Your Adventure!
            </h2>
            <p style={{ color: "#666", marginBottom: "32px" }}>
              Pick a world and let the story begin ✨
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleStart(t)}
                  disabled={loading}
                  className="btn btn-outline"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "24px 32px",
                    borderRadius: 24,
                    borderColor: t.color,
                    color: t.color,
                    fontWeight: 700,
                    fontSize: "15px",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = `0 8px 24px ${t.color}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: 48 }}>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            {loading && (
              <p style={{ marginTop: 24, color: "#4F46E5", fontWeight: 700 }}>
                Weaving your story… ✨
              </p>
            )}
            {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          </div>
        )}

        {/* ── Story playing ── */}
        {phase === "playing" && started && (
          <>
            {/* Turn progress bar */}
            <TurnProgress current={turns} max={maxTurns} theme={selectedTheme} />

            <div
              className="story-container"
              style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "160px", marginTop: "16px" }}
            >
              {storyNodes.map((node, i) => (
                <StoryBubble key={i} node={node} isLatest={i === storyNodes.length - 1} />
              ))}

              {/* Inline loading indicator — doesn't block existing story */}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px" }}>
                  <ThinkingDots />
                  <span style={{ color: "#6366F1", fontWeight: 700, fontSize: "15px" }}>
                    Story Weaver is thinking…
                  </span>
                </div>
              )}

              <div ref={storyEndRef} />
            </div>

            {/* Choice panel — fixed at bottom */}
            {!loading && !error && currentChoices.length > 0 && (
              <ChoicePanel choices={currentChoices} onChoice={handleChoice} />
            )}

            {error && (
              <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 200, maxWidth: 600, width: "90%" }}>
                <div className="alert alert-error" style={{ borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span>{error}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => { setError(""); setCurrentChoices(defaultChoices(selectedTheme?.id || "forest")); }}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Game over ── */}
        {phase === "over" && (
          <GameConclusionFlow
            results={{
              gameName: "Story Adventure",
              score: Math.round((turns / maxTurns) * 100),
              total_trials: maxTurns,
              accuracy: 1.0,
              duration: endTime ? (endTime - startTime) / 1000 : 0,
              skills: ["Creativity", "Language", "Decision Making"],
              level: level === "hard" ? 3 : level === "medium" ? 2 : 1,
            }}
            onReplay={handleReplay}
            onHome={() => navigate("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TurnProgress({ current, max, theme }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          Chapter {current} of {max}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {max - current > 0 ? `${max - current} chapters left` : "Final chapter!"}
        </span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: theme?.color || "#6366F1",
            borderRadius: 99,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function StoryBubble({ node, isLatest }) {
  const isNarrative = node.type === "narrative";
  return (
    <div
      style={{
        padding: "20px 24px",
        background: isNarrative
          ? "rgba(255,255,255,0.92)"
          : "linear-gradient(135deg, #6366F1, #8B5CF6)",
        color: isNarrative ? "#1a1a2e" : "white",
        fontSize: isNarrative ? "19px" : "16px",
        lineHeight: "1.65",
        alignSelf: isNarrative ? "flex-start" : "flex-end",
        borderRadius: "20px",
        borderBottomRightRadius: isNarrative ? "20px" : "4px",
        borderBottomLeftRadius: isNarrative ? "4px" : "20px",
        maxWidth: "88%",
        boxShadow: isLatest
          ? "0 8px 32px rgba(0,0,0,0.18)"
          : "0 4px 12px rgba(0,0,0,0.08)",
        backdropFilter: "blur(8px)",
        animation: isLatest ? "fadeSlideIn 0.35s ease" : "none",
      }}
    >
      {node.icon && <span style={{ fontSize: 26, marginRight: 10 }}>{node.icon}</span>}
      {node.text}
    </div>
  );
}

function ChoicePanel({ choices, onChoice }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "800px",
        padding: "0 20px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          padding: "20px 24px",
          borderRadius: "28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <p style={{ textAlign: "center", marginBottom: 16, color: "#4F46E5", fontWeight: 800, fontSize: "15px" }}>
          What happens next?
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => onChoice(choice)}
              style={{
                background: "white",
                border: "2.5px solid #6366F1",
                borderRadius: "20px",
                padding: "14px 18px",
                flex: "1 1 0",
                minWidth: "120px",
                maxWidth: "220px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.18s",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#6366F1";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "inherit";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "28px" }}>{choice.icon || "✨"}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>
                {choice.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6366F1",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultChoices(themeId) {
  const byTheme = {
    space:  [{ label: "Fly to the nearest star",  icon: "⭐" }, { label: "Scan for alien life",    icon: "👽" }, { label: "Fix the rocket engine", icon: "🔧" }],
    forest: [{ label: "Follow the glowing path",  icon: "✨" }, { label: "Talk to the wise owl",   icon: "🦉" }, { label: "Cross the magic bridge", icon: "🌉" }],
    ocean:  [{ label: "Dive deeper into the dark", icon: "🔦" }, { label: "Follow the dolphin",    icon: "🐬" }, { label: "Open the treasure chest", icon: "🪙" }],
    castle: [{ label: "Sneak past the dragon",    icon: "🐉" }, { label: "Find the secret door",   icon: "🚪" }, { label: "Call for the wizard",    icon: "🧙" }],
  };
  return byTheme[themeId] || [
    { label: "Look around",   icon: "👀" },
    { label: "Keep going",    icon: "🚶" },
    { label: "Find a friend", icon: "🤝" },
  ];
}
