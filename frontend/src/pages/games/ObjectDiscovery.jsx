import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, RotateCcw, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  AmbientParticles, 
  MagicalSparkles, 
  SuccessBurst 
} from "../../components/AmbientEffects";
import { useChild } from "../../hooks/useChild";
import GameConclusionFlow from "../../components/GameConclusionFlow";

const CATEGORIES = [
  {
    id: "animals", label: "Animals", icon: "🦁", color: "#FF8C42", bg: "#FFF0E8",
    items: [
      { label: "Dog", emoji: "🐶", yes: true }, { label: "Cat", emoji: "🐱", yes: true }, { label: "Frog", emoji: "🐸", yes: true },
      { label: "Fox", emoji: "🦊", yes: true }, { label: "Penguin", emoji: "🐧", yes: true }, { label: "Butterfly", emoji: "🦋", yes: true },
      { label: "Pizza", emoji: "🍕", yes: false }, { label: "Car", emoji: "🚗", yes: false }, { label: "House", emoji: "🏠", yes: false },
      { label: "Star", emoji: "⭐", yes: false },
    ],
  },
  {
    id: "fruits", label: "Fruits", icon: "🍎", color: "#FF6B6B", bg: "#FFE5E5",
    items: [
      { label: "Apple", emoji: "🍎", yes: true }, { label: "Banana", emoji: "🍌", yes: true }, { label: "Grapes", emoji: "🍇", yes: true },
      { label: "Strawberry", emoji: "🍓", yes: true }, { label: "Orange", emoji: "🍊", yes: true }, { label: "Cherry", emoji: "🍒", yes: true },
      { label: "Rocket", emoji: "🚀", yes: false }, { label: "Books", emoji: "📚", yes: false }, { label: "Guitar", emoji: "🎸", yes: false },
      { label: "Socks", emoji: "🧦", yes: false },
    ],
  },
  {
    id: "toys", label: "Toys", icon: "🧸", color: "#8B5CF6", bg: "#F5F3FF",
    items: [
      { label: "Teddy", emoji: "🧸", yes: true }, { label: "Ball", emoji: "⚽", yes: true }, { label: "Robot", emoji: "🤖", yes: true },
      { label: "Train", emoji: "🚂", yes: true }, { label: "Blocks", emoji: "🧱", yes: true }, { label: "Kite", emoji: "🪁", yes: true },
      { label: "Tree", emoji: "🌳", yes: false }, { label: "Cloud", emoji: "☁️", yes: false }, { label: "Phone", emoji: "📱", yes: false },
      { label: "Cup", emoji: "🥤", yes: false },
    ],
  }
];

const SpringBtn = ({ children, onClick, disabled, style }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    style={{
      border: "none",
      cursor: disabled ? "default" : "pointer",
      ...style
    }}
  >
    {children}
  </motion.button>
);

export default function ObjectDiscovery({ isSession = false, level: initialLevel = "easy", onComplete }) {
  const navigate = useNavigate();
  const { childProfile } = useChild();
  const [level, setLevel] = useState(initialLevel);
  const [phase, setPhase] = useState(isSession ? "playing" : "idle"); 
  const [catIdx, setCatIdx] = useState(0);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const startTimeRef = useRef(null);
  const [endTime, setEndTime] = useState(null);

  const currentCategory = CATEGORIES[catIdx % CATEGORIES.length];

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const startRound = useCallback((idx) => {
    const cat = CATEGORIES[idx % CATEGORIES.length];
    setItems(shuffle(cat.items));
    setSelected(new Set());
    setSubmitted(false);
    setRound(idx);
    setShowWin(false);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    startRound(0);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [startRound]);

  // Auto-start for sessions
  const initialized = useRef(false);
  useEffect(() => {
    if (isSession && !initialized.current) {
        initialized.current = true;
        startGame();
    }
  }, [isSession, startGame]);

  const toggleItem = (i) => {
    if (submitted) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    const correctItems = items.filter(it => it.yes);
    const correctCount = correctItems.length;
    const selectedCorrect = [...selected].filter(i => items[i].yes).length;
    const selectedWrong = [...selected].filter(i => !items[i].yes).length;

    // Award partial points or full points
    if (selectedCorrect === correctCount && selectedWrong === 0) {
      setScore(s => s + 1); // We'll count rounds as "score" for report
      setShowWin(true);
    }
    setSubmitted(true);
  };

  const nextRound = () => {
    const maxRounds = level === "easy" ? 2 : level === "medium" ? 3 : CATEGORIES.length;
    if (round + 1 < maxRounds) {
      startRound(round + 1);
    } else {
      setEndTime(Date.now());
      setPhase("over");
    }
  };

  const totalRounds = level === "easy" ? 2 : level === "medium" ? 3 : CATEGORIES.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
      fontFamily: "'Fredoka', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: isSession ? "0" : "20px"
    }}>
      <AmbientParticles count={10} />
      
      {/* Header - Hid in session mode as state machine handles it */}
      {!isSession && (
        <div style={{
          maxWidth: "900px", margin: "0 auto 30px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)",
          padding: "15px 25px", borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: currentCategory?.color, padding: 8, borderRadius: 12 }}>
              <Search size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, color: "#4a4a4a", fontSize: 18 }}>Object Discovery</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#f59e0b" }}>⭐ {score}</div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", padding: isSession ? "20px" : "0" }}>
        {phase === "idle" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ fontSize: 100, marginBottom: 20 }}>🦁</div>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#2d3748", marginBottom: 20 }}>Ready to Explore?</h1>
            <p style={{ fontSize: 18, color: "#718096", marginBottom: 24 }}>Find all the things that belong together!</p>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
              {['easy', 'medium', 'hard'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 16,
                    border: '2px solid',
                    borderColor: level === lvl ? '#FF8C42' : '#E2E8F0',
                    background: level === lvl ? '#FFF0E8' : 'white',
                    color: level === lvl ? '#FF8C42' : '#64748B',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <SpringBtn onClick={startGame} style={{
              background: "linear-gradient(135deg, #FF8C42, #FB923C)",
              color: "white", padding: "20px 60px", borderRadius: "50px",
              fontSize: 24, fontWeight: 900, boxShadow: "0 10px 25px rgba(255, 140, 66, 0.4)"
            }}>
              Start Search!
            </SpringBtn>
          </motion.div>
        )}

        {phase === "playing" && (
          <div>
            <div style={{ marginBottom: 30 }}>
              <h2 style={{ fontSize: 14, color: "#718096", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Can you find all the...</h2>
              <motion.div
                key={currentCategory?.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                  display: "inline-block", padding: "12px 30px", background: currentCategory?.bg,
                  borderRadius: "20px", border: `2px solid ${currentCategory?.color}`,
                  color: currentCategory?.color, fontSize: 32, fontWeight: 900
                }}
              >
                {currentCategory?.icon} {currentCategory?.label}
              </motion.div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 15, marginBottom: 40
            }}>
              {items.map((item, idx) => {
                const isSelected = selected.has(idx);
                const isCorrect = submitted && item.yes && isSelected;
                const isWrong = submitted && !item.yes && isSelected;
                const isMissed = submitted && item.yes && !isSelected;

                return (
                  <motion.div
                    key={idx}
                    whileHover={!submitted ? { scale: 1.05 } : {}}
                    whileTap={!submitted ? { scale: 0.95 } : {}}
                    onClick={() => toggleItem(idx)}
                    style={{
                      height: 130, background: "white", borderRadius: "24px",
                      boxShadow: isSelected ? `0 8px 24px ${currentCategory.color}33` : "0 4px 12px rgba(0,0,0,0.03)",
                      border: `3px solid ${isCorrect ? "#48bb78" : isWrong ? "#f56565" : isSelected ? currentCategory.color : "transparent"}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: submitted ? "default" : "pointer", position: "relative"
                    }}
                  >
                    <span style={{ fontSize: 44 }}>{item.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#718096", marginTop: 8 }}>{item.label}</span>
                    <AnimatePresence>
                      {isSelected && !submitted && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: "absolute", top: -8, right: -8, background: currentCategory.color, color: "white", borderRadius: "50%", padding: 2 }}><CheckCircle2 size={24} /></motion.div>
                      )}
                      {isMissed && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: -8, right: -8, background: "#f59e0b", color: "white", borderRadius: "50%", padding: 2 }}><AlertCircle size={24} /></motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {!submitted ? (
              <SpringBtn onClick={handleSubmit} disabled={selected.size === 0} style={{
                background: selected.size > 0 ? currentCategory.color : "#cbd5e0",
                color: "white", padding: "18px 50px", borderRadius: "50px",
                fontSize: 20, fontWeight: 900
              }}>
                Check My Finds!
              </SpringBtn>
            ) : (
              <SpringBtn onClick={nextRound} style={{
                background: "#6366f1", color: "white", padding: "18px 50px", borderRadius: "50px",
                fontSize: 20, fontWeight: 900
              }}>
                {round + 1 < totalRounds ? "Next Task →" : "See Summary"}
              </SpringBtn>
            )}
          </div>
        )}

        {showWin && <SuccessBurst />}
        
        {phase === "over" && (
           <GameConclusionFlow 
             gameName="Object Discovery"
             score={score}
             total={totalRounds}
             duration={endTime && startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0}
             skills={["Categorization", "Visual Scanning", "Attention"]}
             onAction={isSession ? onComplete : () => setPhase("idle")}
             actionLabel={isSession ? "Continue Journey" : "Play Again"}
           />
        )}
      </div>
    </div>
  );
}
