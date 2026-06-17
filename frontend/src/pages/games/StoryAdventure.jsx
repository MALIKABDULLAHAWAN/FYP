import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import UiIcon from "../../components/ui/UiIcon";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import { generateContent, continueStory } from "../../services/storyService";
import { AmbientParticles, FloatingOrbs } from "../../components/AmbientEffects";

// Themes with multi-language support
const THEMES = [
  { 
    id: "space",   
    label: { en: "Space Explorer", ur: "خلا کا مہم جو" },
    emoji: "🚀", 
    color: "#4D96FF", 
    bg: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" 
  },
  { 
    id: "forest",  
    label: { en: "Magical Forest", ur: "جادوئی جنگل" },
    emoji: "🌳", 
    color: "#48bb78", 
    bg: "linear-gradient(135deg, #134e5e, #71b280)" 
  },
  { 
    id: "ocean",   
    label: { en: "Deep Sea Diver", ur: "گہرے سمندر میں غوطہ خور" },
    emoji: "🌊", 
    color: "#0BC5EA", 
    bg: "linear-gradient(135deg, #005c97, #363795)" 
  },
  { 
    id: "castle",  
    label: { en: "Dragon Castle", ur: "ڈریگن کا قلعہ" },
    emoji: "🏰", 
    color: "#ED64A6", 
    bg: "linear-gradient(135deg, #4b1248, #f10711)" 
  },
];

// Language-specific UI text
const UI_TEXT = {
  en: {
    title: "AI Story Adventures",
    chooseAdventure: "Choose Your Adventure!",
    pickWorld: "Pick a world and let the story begin ✨",
    weavingStory: "Weaving your story… ✨",
    chapterOf: "Chapter",
    of: "of",
    chaptersLeft: "chapters left",
    finalChapter: "Final chapter!",
    whatHappensNext: "What happens next?",
    storyWeaverThinking: "Story Weaver is thinking…",
    storyMagicFlickered: "The story magic flickered! Try a different path.",
    tryAgain: "Try again",
    storyAdventure: "Story Adventure",
    creativity: "Creativity",
    language: "Language",
    decisionMaking: "Decision Making",
  },
  ur: {
    title: "AI کہانی کی مہم جوئی",
    chooseAdventure: "اپنی مہم جوئی منتخب کریں!",
    pickWorld: "ایک دنیا منتخب کریں اور کہانی شروع کریں ✨",
    weavingStory: "آپ کی کہانی بن رہی ہے… ✨",
    chapterOf: "باب",
    of: "میں سے",
    chaptersLeft: "باب باقی ہیں",
    finalChapter: "آخری باب!",
    whatHappensNext: "اگلا کیا ہوتا ہے؟",
    storyWeaverThinking: "کہانی بننے والا سوچ رہا ہے…",
    storyMagicFlickered: "کہانی کا جادو ختم ہو گیا! کوئی اور راستہ آزمائیں۔",
    tryAgain: "دوبارہ کوشش کریں",
    storyAdventure: "کہانی کی مہم جوئی",
    creativity: "تخلیقی صلاحیت",
    language: "زبان",
    decisionMaking: "فیصلہ کرنے کی صلاحیت",
  }
};

const MAX_TURNS_SESSION = 5;
const MAX_TURNS_FREE    = 7;

// Get saved language or default to English
function getSavedLanguage() {
  return localStorage.getItem("dhyan_story_language") || "en";
}

function setSavedLanguage(lang) {
  localStorage.setItem("dhyan_story_language", lang);
}

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
  const [language,       setLanguage]       = useState(getSavedLanguage());

  const storyEndRef  = useRef(null);
  const initialized  = useRef(false);

  const maxTurns = isSession ? MAX_TURNS_SESSION : MAX_TURNS_FREE;
  const t = UI_TEXT[language] || UI_TEXT.en;

  // Auto-scroll to latest story node
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyNodes]);

  // Load voices when component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Voices may not be loaded immediately
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices are now loaded
      };
    }
  }, [language]);

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
      
      // For Urdu, preserve all characters. For English, clean special characters
      let cleanText = text;
      if (language === "ur") {
        // Keep Urdu text intact, only remove some problematic characters
        cleanText = text.replace(/[^\w\s!?.,'":;\-()]/g, "");
      } else {
        cleanText = text.replace(/[^\w\s!?.,']/g, "");
      }
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      
      // Set language
      if (language === "ur") {
        utterance.lang = "ur-PK";
      } else {
        utterance.lang = "en-US";
      }

      // Try to find a voice that matches language preference
      const voices = synth.getVoices();
      
      if (language === "ur") {
        // For Urdu, try to find Urdu voice first
        const urduVoice = voices.find(v => v.lang.startsWith("ur"));
        if (urduVoice) {
          utterance.voice = urduVoice;
        } else {
          // Fallback to any available voice
          if (voices.length > 0) {
            utterance.voice = voices[0];
          }
        }
      } else {
        // For English
        const englishVoice = voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
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
      const result = await generateContent("story", theme.id, age, "short", difficultyNum, language);

      const content =
        typeof result === "string"
          ? result
          : result?.content || result?.title || `Once upon a time in a ${getThemeLabel(theme, language)}…`;

      const choices = Array.isArray(result?.choices) && result.choices.length > 0
        ? result.choices
        : defaultChoices(theme.id, language);

      setStoryNodes([{ text: content, type: "narrative" }]);
      setCurrentChoices(choices);
      setTurns(1);
      speak(content);
    } catch (_) {
      setError(t.storyMagicFlickered);
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

        const result = await continueStory(storyContext, choice.label, "story_weaver", 0, language);
        const narrative = result?.narrative || result || (language === "ur" ? "اور یوں مہم جوئی کا خوبصورت اختتام ہوا! تم ہی ہیرو تھے۔ 🌟" : "And so the adventure came to a wonderful end! You were the hero all along. 🌟");

        setStoryNodes(prev => [...prev, { text: narrative, type: "narrative" }]);
        speak(narrative);
      } catch (_) {
        const endMessage = language === "ur" ? "اور یوں مہم جوئی کا خوبصورت اختتام ہوا! تم ہی ہیرو تھے۔ 🌟" : "And so the adventure came to a wonderful end! You were the hero all along. 🌟";
        setStoryNodes(prev => [...prev, {
          text: endMessage,
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
      const result = await continueStory(storyContext, choice.label, "story_weaver", turnsLeft, language);

      const narrative = result?.narrative || result || (language === "ur" ? "مہم جوئی جاری ہے…" : "The adventure continues…");
      const nextChoices =
        Array.isArray(result?.choices) && result.choices.length > 0
          ? result.choices
          : defaultChoices(selectedTheme?.id || "forest", language);

      setStoryNodes(prev => [...prev, { text: narrative, type: "narrative" }]);
      setCurrentChoices(nextChoices);
      setTurns(nextTurn);
      speak(narrative);
    } catch (_) {
      setError(t.storyMagicFlickered);
      // Restore choices so the player isn't stuck
      setCurrentChoices(defaultChoices(selectedTheme?.id || "forest", language));
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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setSavedLanguage(newLang);
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
              <UiIcon name="book" size={36} title={t.title} />
              <span>{t.title}</span>
            </div>
          </div>
          <div className="game-header-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {phase === "idle" && (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "2px solid #6366F1",
                  background: "white",
                  color: "#1a1a2e",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <option value="en">English</option>
                <option value="ur">اردو</option>
              </select>
            )}
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
              {t.chooseAdventure}
            </h2>
            <p style={{ color: "#666", marginBottom: "32px" }}>
              {t.pickWorld}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleStart(theme)}
                  disabled={loading}
                  className="btn btn-outline"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "24px 32px",
                    borderRadius: 24,
                    borderColor: theme.color,
                    color: theme.color,
                    fontWeight: 700,
                    fontSize: "15px",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = `0 8px 24px ${theme.color}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: 48 }}>{theme.emoji}</span>
                  <span>{getThemeLabel(theme, language)}</span>
                </button>
              ))}
            </div>
            {loading && (
              <p style={{ marginTop: 24, color: "#4F46E5", fontWeight: 700 }}>
                {t.weavingStory}
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
                    {t.storyWeaverThinking}
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
                    onClick={() => { setError(""); setCurrentChoices(defaultChoices(selectedTheme?.id || "forest", language)); }}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {t.tryAgain}
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
              gameName: t.storyAdventure,
              score: Math.round((turns / maxTurns) * 100),
              total_trials: maxTurns,
              accuracy: 1.0,
              duration: endTime ? (endTime - startTime) / 1000 : 0,
              skills: [t.creativity, t.language, t.decisionMaking],
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
  const language = getSavedLanguage();
  const t = UI_TEXT[language] || UI_TEXT.en;
  
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          {t.chapterOf} {current} {t.of} {max}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          {max - current > 0 ? `${max - current} ${t.chaptersLeft}` : t.finalChapter}
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
  const language = getSavedLanguage();
  const t = UI_TEXT[language] || UI_TEXT.en;
  
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
          {t.whatHappensNext}
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

function getThemeLabel(theme, language) {
  return typeof theme.label === "object" ? (theme.label[language] || theme.label.en) : theme.label;
}

function defaultChoices(themeId, language = "en") {
  const byTheme = {
    space: {
      en: [{ label: "Fly to the nearest star",  icon: "⭐" }, { label: "Scan for alien life",    icon: "👽" }, { label: "Fix the rocket engine", icon: "🔧" }],
      ur: [{ label: "قریب ترین ستارے کی طرف اڑیں",  icon: "⭐" }, { label: "بیگانہ زندگی کی تلاش کریں",    icon: "👽" }, { label: "راکٹ کا انجن ٹھیک کریں", icon: "🔧" }],
    },
    forest: {
      en: [{ label: "Follow the glowing path",  icon: "✨" }, { label: "Talk to the wise owl",   icon: "🦉" }, { label: "Cross the magic bridge", icon: "🌉" }],
      ur: [{ label: "روشن راستے کی پیروی کریں",  icon: "✨" }, { label: "عقلمند الو سے بات کریں",   icon: "🦉" }, { label: "جادوئی پل عبور کریں", icon: "🌉" }],
    },
    ocean: {
      en: [{ label: "Dive deeper into the dark", icon: "🔦" }, { label: "Follow the dolphin",    icon: "🐬" }, { label: "Open the treasure chest", icon: "🪙" }],
      ur: [{ label: "اندھیرے میں گہرائی میں غوطہ لگائیں", icon: "🔦" }, { label: "ڈالفن کی پیروی کریں",    icon: "🐬" }, { label: "خزانے کا صندوق کھولیں", icon: "🪙" }],
    },
    castle: {
      en: [{ label: "Sneak past the dragon",    icon: "🐉" }, { label: "Find the secret door",   icon: "🚪" }, { label: "Call for the wizard",    icon: "🧙" }],
      ur: [{ label: "ڈریگن کے پاس سے چھپ کر نکلیں",    icon: "🐉" }, { label: "خفیہ دروازہ تلاش کریں",   icon: "🚪" }, { label: "جادوگر کو بلائیں",    icon: "🧙" }],
    },
  };
  
  const themeChoices = byTheme[themeId];
  if (themeChoices) {
    return themeChoices[language] || themeChoices.en;
  }
  
  return language === "ur" 
    ? [
        { label: "ارد گرد دیکھیں",   icon: "👀" },
        { label: "آگے بڑھتے رہیں",    icon: "🚶" },
        { label: "کوئی دوست تلاش کریں", icon: "🤝" },
      ]
    : [
        { label: "Look around",   icon: "👀" },
        { label: "Keep going",    icon: "🚶" },
        { label: "Find a friend", icon: "🤝" },
      ];
}
