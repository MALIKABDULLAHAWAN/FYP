import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import UiIcon from "../../components/ui/UiIcon";
import DifficultyIndicator from "../../components/DifficultyIndicator";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import { generateContent, continueStory } from "../../services/aiServiceEnhanced";
import { AmbientParticles, FloatingOrbs, Sticker3D, SpringContainer, MagicalSparkles } from "../../components/AmbientEffects";

export default function StoryAdventure({ isSession = false, level = "easy", onComplete }) {

  const [storyNodes, setStoryNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState(isSession ? (level === "easy" ? 1 : level === "medium" ? 2 : 3) : 1);
  const [turns, setTurns] = useState(0);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [phase, setPhase] = useState(isSession ? "playing" : "idle");
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);

  // Auto-scroll
  const storyEndRef = useRef(null);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyNodes]);

  // Auto-start for sessions
  const initialized = useRef(false);
  useEffect(() => {
    if (isSession && !initialized.current) {
      initialized.current = true;
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)].id;
      handleStart(randomTheme);
    }
  }, [isSession]);

  const handleStart = async (selectedTheme) => {
    setLoading(true);
    setStarted(true);
    setError("");
    setStoryNodes([]);
    setTurns(0);
    setPhase("playing");

    try {
      const age = childProfile?.age || 6;
      let initialResponse = await generateContent("story", selectedTheme, age, "short", difficulty);
      
      let content = typeof initialResponse === "string" ? initialResponse : initialResponse.content || initialResponse.title;
      let choices = initialResponse.choices || [
        { label: "Look around", icon: "👀" },
        { label: "Keep going", icon: "🚶" },
        { label: "Find a friend", icon: "🤝" }
      ];

      if (initialResponse.error) {
         content = `Once upon a time, there was a magical ${selectedTheme}. You are about to embark on an adventure!`;
      }

      setStoryNodes([{
        text: content,
        type: "narrative"
      }]);
      setCurrentChoices(choices);
      setTurns(1);
      speak(content);
    } catch (_) {
      setError("Failed to start the magical journey!");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceText, icon) => {
    const maxTurns = isSession ? 4 : 6;
    if (turns >= maxTurns) {
       finishGame();
       return;
    }
    setLoading(true);
    
    setStoryNodes(prev => [...prev, { text: choiceText, icon, type: "choice" }]);

    try {
      const currentStoryContext = storyNodes
         .filter(n => n.type === "narrative")
         .map(n => n.text)
         .join("\n\n");

      const turnsLeft = maxTurns - turns;
      let result = await continueStory(currentStoryContext, choiceText, "story_weaver", turnsLeft);
      
      const narrative = result.narrative || result;
      const nextChoices = result.choices || [];

      setStoryNodes(prev => [...prev, { text: narrative, type: "narrative" }]);
      setCurrentChoices(nextChoices);
      
      const nextTurn = turns + 1;
      setTurns(nextTurn);
      speak(narrative);

      if (nextTurn >= maxTurns || (nextChoices.length === 0 && nextTurn > 2)) {
        finishGame();
      }

    } catch (_) {
      setError("The magic connection broke! Try another path.");
    } finally {
      setLoading(false);
    }
  };

  const finishGame = () => {
    setEndTime(Date.now());
    setPhase("over");
  };

  const speak = (text) => {
    if (!text) return;
    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      synth.cancel();
      synth.speak(utterance);
    } catch (e) {
      console.log('Speech synthesis failed', e);
    }
  };

  const THEMES = [
    { id: "space", label: "Space Explorer", icon: "rocket", color: "#4D96FF" },
    { id: "forest", label: "Magical Forest", icon: "tree", color: "#48bb78" },
    { id: "ocean", label: "Deep Sea Diver", icon: "water", color: "#0BC5EA" },
    { id: "castle", label: "Dragon Castle", icon: "building", color: "#ED64A6" }
  ];

  return (
    <div className="game-interface" style={{ position: "relative", minHeight: "100vh", padding: isSession ? "0" : "20px" }}>
      <AmbientParticles />
      <FloatingOrbs count={4} />

      {!isSession && phase !== "over" && (
        <div className="game-header" style={{ position: "relative", zIndex: 10 }}>
          <div className="game-title-section">
            <div className="game-title">
              <UiIcon name="book" size={36} title="AI Story Adventures" />
              <span>AI Story Adventures</span>
            </div>
          </div>
          <div className="game-header-actions">
            <button className="btn btn-sm btn-outline" onClick={() => { window.speechSynthesis.cancel(); navigate("/games"); }}>
              <UiIcon name="arrow-left" size={16} /> Back
            </button>
          </div>
        </div>
      )}

      <div className="container" style={{ position: "relative", zIndex: 10, maxWidth: "800px", padding: "24px", margin: "0 auto" }}>
        
        {phase === "idle" && !isSession && (
          <div className="card-cute card-cute-lavender" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontFamily: "var(--font-fun)", color: "var(--cute-purple)", fontSize: "32px", marginBottom: "16px" }}>
              Choose Your Adventure!
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: 32 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => handleStart(t.id)} className="btn btn-outline" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 24, borderRadius: 24 }}>
                  <span style={{ fontSize: 40 }}>{t.icon === 'rocket' ? '🚀' : t.icon === 'tree' ? '🌳' : t.icon === 'water' ? '🌊' : '🏰'}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "playing" && started && (
          <div className="story-container" style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "120px" }}>
            {storyNodes.map((node, i) => (
              <div 
                key={i} 
                className={`card-cute ${node.type === 'narrative' ? 'card-cute-cream' : 'card-cute-purple'}`}
                style={{ 
                  padding: "24px", 
                  background: node.type === 'narrative' ? "white" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: node.type === 'narrative' ? "#333" : "white",
                  fontSize: "22px",
                  lineHeight: "1.6",
                  alignSelf: node.type === 'narrative' ? 'flex-start' : 'flex-end',
                  borderRadius: "24px",
                  borderBottomRightRadius: node.type === 'narrative' ? '24px' : '4px',
                  borderBottomLeftRadius: node.type === 'narrative' ? '4px' : '24px',
                  maxWidth: "90%",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
                }}
              >
                {node.icon && <span style={{ fontSize: 30, marginRight: 12 }}>{node.icon}</span>}
                {node.text}
              </div>
            ))}
            <div ref={storyEndRef} />
          </div>
        )}

        {phase === "over" && (
          <GameConclusionFlow 
            results={{
              gameName: "Story Adventure",
              score: turns,
              total_trials: isSession ? 4 : 6,
              accuracy: 1.0,
              duration: endTime ? (endTime - startTime) / 1000 : 0,
              skills: ["Creativity", "Language", "Making Choices"]
            }}
            onReplay={() => {
              setPhase("idle");
              setStarted(false);
            }}
            onHome={() => navigate("/dashboard")}
          />
        )}

        {phase === "playing" && !loading && !error && currentChoices.length > 0 && (
          <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "800px", padding: "0 20px", zIndex: 100 }}>
            <div style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", padding: "24px", borderRadius: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
               <h4 style={{ marginBottom: 20, color: "#4F46E5", fontWeight: 800 }}>What happens next?</h4>
               <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                 {currentChoices.map((choice, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleChoice(choice.label, choice.icon)}
                      style={{
                        background: "white",
                        border: `3px solid #6366F1`,
                        borderRadius: "24px",
                        padding: "16px",
                        flex: 1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        minWidth: 0
                      }}
                    >
                      <span style={{ fontSize: "32px" }}>{choice.icon || '✨'}</span>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#1E1B4B", textAlign: "center" }}>
                        {choice.label}
                      </span>
                    </button>
                 ))}
               </div>
            </div>
          </div>
        )}

        {loading && phase === "playing" && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ width: "60px", height: "60px", margin: "0 auto" }} />
            <p style={{ marginTop: "24px", color: "#4F46E5", fontWeight: 800, fontSize: "20px" }}>The Story Weaver is thinking...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">{error}</div>
        )}
      </div>
    </div>
  );
}
