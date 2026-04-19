import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import UiIcon from "../../components/ui/UiIcon";
import DifficultyIndicator from "../../components/DifficultyIndicator";
import SummaryPanel from "../../components/summarypanel";
import { generateContent, continueStory } from "../../services/aiServiceEnhanced";
import { AmbientParticles, FloatingOrbs, Sticker3D, SpringContainer, MagicalSparkles } from "../../components/AmbientEffects";

export default function StoryAdventure() {
  const navigate = useNavigate();
  const { childProfile } = useChild();

  const [storyNodes, setStoryNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [turns, setTurns] = useState(0);
  const [summaryData, setSummaryData] = useState(null);

  // Auto-scroll
  const storyEndRef = useRef(null);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storyNodes]);

  const handleStart = async (selectedTheme) => {
    setLoading(true);
    setStarted(true);
    setError("");
    setStoryNodes([]);
    setTurns(0);
    setSummaryData(null);

    try {
      const age = childProfile?.age || 6;
      // Start the story using AI backend with difficulty
      let initialResponse = await generateContent("story", selectedTheme, age, "short", difficulty);
      
      let content = typeof initialResponse === "string" ? initialResponse : initialResponse.content || initialResponse.title;

      if (initialResponse.error) {
         content = `Once upon a time, there was a magical ${selectedTheme}. You are about to embark on an adventure!`;
      }

      setStoryNodes([{
        text: content,
        type: "narrative"
      }]);
      setTurns(1);
      speak(content);
    } catch (_) {
      setError("Failed to start the magical journey!");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceText) => {
    if (turns >= 20) return;
    setLoading(true);
    
    // Add child's choice to the log
    setStoryNodes(prev => [...prev, { text: choiceText, type: "choice" }]);

    try {
      // Get all previous narrative content as current story context
      const currentStoryContext = storyNodes
         .filter(n => n.type === "narrative")
         .map(n => n.text)
         .join("\n\n");

      let nextPart = await continueStory(currentStoryContext, choiceText, "story_weaver", difficulty);
      
      setStoryNodes(prev => [...prev, { text: nextPart, type: "narrative" }]);
      const nextTurn = turns + 1;
      setTurns(nextTurn);
      speak(nextPart);

      // Check for completion
      if (nextTurn >= 20) {
        setSummaryData({
          total_trials: 20,
          correct: 20, // Infinite creativity is always 'correct'
          accuracy: 1.0,
          current_level: difficulty,
          suggestion: "Excellent creativity! Try a harder level next time for more complex storytelling."
        });
      }

    } catch (_) {
      setError("The magic connection broke! Try another path.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if (!text) return;
    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
      utterance.rate = 0.9;
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
    <div className="game-interface" style={{ position: "relative", minHeight: "100vh" }}>
      <AmbientParticles />
      <FloatingOrbs count={4} />

      <div className="game-header" style={{ position: "relative", zIndex: 10 }}>
        <div className="game-title-section">
          <div className="game-title">
            <UiIcon name="book" size={36} title="AI Story Adventures" />
            <span>AI Story Adventures</span>
          </div>
          <div className="game-subtitle">
            {started && turns < 20 ? `Chapter ${turns} of 20` : "Create an infinite story powered by AI!"}
          </div>
        </div>
        
        <div className="game-header-actions">
          <button className="btn btn-sm btn-outline" onClick={() => { window.speechSynthesis.cancel(); setStarted(false); }}>
            <UiIcon name="refresh" size={16} /> Start Over
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => { window.speechSynthesis.cancel(); navigate("/games"); }}>
            <UiIcon name="arrow-left" size={16} /> Back
          </button>
        </div>
      </div>

      <div className="container" style={{ position: "relative", zIndex: 10, maxWidth: "800px", padding: "24px" }}>
        
        {!started && (
          <div className="card-cute card-cute-lavender" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontFamily: "var(--font-fun)", color: "var(--cute-purple)", fontSize: "32px", marginBottom: "16px" }}>
              Choose Your Adventure!
            </h2>
            
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <DifficultyIndicator 
                difficulty={difficulty} 
                interactive={true} 
                onDifficultyChange={setDifficulty} 
              />
            </div>

            <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", marginBottom: 32 }}>
              Our AI Story Weaver will create a magical tale just for you. How should it start?
            </p>
            
            {loading ? (
              <div className="spinner" style={{ margin: "0 auto", width: "40px", height: "40px", borderWidth: "4px" }} />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
                {THEMES.map(t => (
                  <SpringContainer key={t.id} delay={0.1}>
                    <Sticker3D animate={true}>
                      <button
                        onClick={() => handleStart(t.id)}
                        style={{
                          background: "white",
                          border: `3px solid ${t.color}`,
                          borderRadius: "20px",
                          padding: "24px 32px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                          cursor: "pointer",
                          minWidth: "160px"
                        }}
                      >
                        <UiIcon name={t.icon} size={48} title="" />
                        <span style={{ fontSize: "18px", fontWeight: "bold", color: t.color }}>{t.label}</span>
                      </button>
                    </Sticker3D>
                  </SpringContainer>
                ))}
              </div>
            )}
          </div>
        )}

        {started && (
          <div className="story-container" style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>
            {storyNodes.map((node, i) => (
              <div 
                key={i} 
                className={`card-cute ${node.type === 'narrative' ? 'card-cute-cream' : 'card-cute-purple'}`}
                style={{ 
                  padding: "24px", 
                  background: node.type === 'narrative' ? "white" : "var(--cute-purple)",
                  color: node.type === 'narrative' ? "#333" : "white",
                  fontSize: "20px",
                  lineHeight: "1.6",
                  alignSelf: node.type === 'narrative' ? 'flex-start' : 'flex-end',
                  borderBottomRightRadius: node.type === 'narrative' ? '24px' : '4px',
                  borderBottomLeftRadius: node.type === 'narrative' ? '4px' : '24px',
                  maxWidth: "90%",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.05)"
                }}
              >
                {node.type === 'narrative' && (
                  <div style={{ marginBottom: "12px", color: "var(--cute-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <UiIcon name="book" size={20} title="" />
                    <span style={{ fontFamily: "var(--font-fun)", fontSize: "16px", fontWeight: "bold" }}>Story Weaver</span>
                  </div>
                )}
                {node.text}
              </div>
            ))}
            <div ref={storyEndRef} />
          </div>
        )}

        {summaryData && (
          <div style={{ marginTop: 24, animation: "bounceIn .8s" }}>
            <SummaryPanel 
               data={summaryData} 
               onExit={() => navigate("/games")} 
               lastTrialText={storyNodes[storyNodes.length - 1]?.text?.substring(0, 50) + "..."}
            />
          </div>
        )}

        {started && !loading && !error && !summaryData && (
          <div className="choices-section" style={{ position: "sticky", bottom: "24px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", padding: "20px", borderRadius: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontFamily: "var(--font-fun)", fontSize: "20px", color: "var(--cute-purple)", marginBottom: "16px", textAlign: "center" }}>
              <MagicalSparkles>What happens next?</MagicalSparkles>
            </h3>
            
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => handleChoice("I want to explore further!")} className="btn btn-primary" style={{ flex: "1", minWidth: "200px" }}>Explore Further 👀</button>
              <button onClick={() => handleChoice("I try to talk to them.")} className="btn btn-outline" style={{ flex: "1", minWidth: "200px" }}>Talk to Someone 👄</button>
              <button onClick={() => handleChoice("I look for a secret path.")} className="btn btn-outline" style={{ flex: "1", minWidth: "200px" }}>Find a Secret 🔍</button>
            </div>
            
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <input 
                 type="text" 
                 placeholder="Or type your own magical idea here..." 
                 className="form-control" 
                 id="customChoice"
                 onKeyPress={(e) => {
                   if (e.key === 'Enter' && e.target.value.trim()) {
                     handleChoice(e.target.value);
                     e.target.value = '';
                   }
                 }}
              />
            </div>
          </div>
        )}

        {loading && started && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "4px" }} />
            <p style={{ marginTop: "16px", color: "var(--cute-purple)", fontFamily: "var(--font-fun)", fontSize: "20px" }}>
              The Story Weaver is thinking...
            </p>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: "24px" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
