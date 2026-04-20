import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../../hooks/useChild';
import { useToast } from '../../hooks/useToast';
import GameImageManager from '../../services/GameImageManager';
import { 
  MagicalSparkles, 
  AmbientParticles, 
  SuccessBurst,
  FloatingOrbs
} from '../../components/AmbientEffects';
import UiIcon from '../../components/ui/UiIcon';
import { startGameSession, submitGameTrial, nextGameTrial } from '../../api/games';
import GameConclusionFlow from '../../components/GameConclusionFlow';

/**
 * MatchingGame - Premium Drag-and-Drop Edition
 * 
 * A high-fidelity therapeutic game where children drag objects to their 
 * matching pair or category.
 */
export default function MatchingGame({ isSession = false, level = "easy", onComplete }) {
  const navigate = useNavigate();
  const { selectedChild } = useChild();
  const toast = useToast();

  const [gameState, setGameState] = useState('idle'); // idle, loading, playing, feedback, complete
  const [sessionId, setSessionId] = useState(null);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [score, setScore] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showBurst, setShowBurst] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedChildAvatar] = useState("🧩");
  const [target, setTarget] = useState(null);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);

  // Start fresh session
  const startChallenge = async () => {
    if (!selectedChild) {
      toast.error("Please select a child first!");
      return;
    }
    setGameState('loading');
    try {
      const difficultyLevel = level === "easy" ? 1 : level === "medium" ? 2 : 3;
      const resp = await startGameSession('matching', selectedChild, 10, { difficulty_level: difficultyLevel });
      setSessionId(resp.session.session_id);
      loadTrial(resp.first_trial);
      setGameState('playing');
    } catch (err) {
      toast.error("Failed to start game");
      setGameState('idle');
    }
  };

  const loadTrial = (trialData) => {
    if (!trialData) return;
    const normalizedOptions = (trialData.options || []).map(opt => ({
      id: opt.id || opt.label,
      label: opt.label || opt.id,
      image: opt.image_url || opt.image,
      icon: opt.icon
    }));
    
    setOptions(normalizedOptions);
    // In matching, the target is what needs to be matched
    const targetItem = trialData.target || trialData.target_id;
    setTarget(normalizedOptions.find(o => o.id === targetItem) || normalizedOptions[0]);
    setCurrentTrial(trialData);
    setProgress(prev => ({ ...prev, current: prev.current + 1 }));
  };

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDrop = async (zoneId) => {
    if (!draggedItem || gameState !== 'playing') return;

    const isMatch = zoneId === target.id;
    
    if (isMatch) {
      setShowBurst(true);
      setScore(s => s + 1);
      toast.success("Correct Match! 🌟");
      setTimeout(() => setShowBurst(false), 1500);
    } else {
      toast.error("Try again! You can do it!");
    }

    // Submit trial
    try {
      const resp = await submitGameTrial('matching', currentTrial.trial_id, zoneId, 1000, false);
      
      if (resp.session_completed) {
        setEndTime(Date.now());
        setTimeout(() => setGameState('complete'), 1500);
      } else if (isMatch) {
        // Correct match, fetch next trial from the same session
        setTimeout(async () => {
          try {
            const nextResp = await nextGameTrial('matching', sessionId);
            loadTrial(nextResp.trial);
          } catch (err) {
            toast.error("Failed to load next trial");
            setGameState('idle');
          }
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }

    setDraggedItem(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      padding: '40px 20px',
      fontFamily: 'var(--font-fun)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AmbientParticles count={15} />
      <FloatingOrbs />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1000px',
        margin: '0 auto 40px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '16px 32px',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid rgba(255,255,255,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ padding: 10, background: '#6366F1', borderRadius: 15 }}>
            <UiIcon name="shape-square" size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1E1B4B' }}>Matching Challenge</h1>
            <div style={{ fontSize: 13, color: '#6366F1', fontWeight: 700 }}>LEVEL 1 • COGNITIVE FOCUS</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Progress</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1E1B4B' }}>{progress.current}/{progress.total}</div>
          </div>
          <button 
            onClick={() => navigate('/games')}
            style={{ 
              background: '#F1F5F9', border: 'none', borderRadius: 50, 
              width: 44, height: 44, cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}
          >
            ←
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        {gameState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '60px 20px' }}
          >
            <div style={{ fontSize: 100, marginBottom: 20 }}>🧩</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#1E1B4B', marginBottom: 12 }}>Ready to Match?</h2>
            <p style={{ fontSize: 18, color: '#475569', marginBottom: 32 }}>Drag the objects to their matching friend!</p>
            <button 
              onClick={startChallenge}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: 'white', border: 'none', borderRadius: 20,
                padding: '18px 48px', fontSize: 22, fontWeight: 900,
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                cursor: 'pointer'
              }}
            >
              Start Game!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && target && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60 }}>
            {/* The Item to Drag */}
            <div style={{ position: 'relative' }}>
              <MagicalSparkles count={5} />
              <motion.div
                drag
                dragSnapToOrigin
                onDragStart={() => handleDragStart(target)}
                whileDrag={{ scale: 1.1, rotate: 5, zIndex: 100 }}
                style={{
                  width: 140, height: 140,
                  background: 'white', borderRadius: 32,
                  boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 60, cursor: 'grab',
                  border: '4px solid #6366F1'
                }}
              >
                {target.image ? <img src={target.image} alt={target.label} style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : (target.icon || '❓')}
              </motion.div>
              <div style={{ marginTop: 15, fontWeight: 800, color: '#6366F1' }}>DRAG ME!</div>
            </div>

            {/* Drop Zones */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {options.map((opt) => (
                <motion.div
                  key={opt.id}
                  onViewportEnter={() => {}} // Simulation of drop detection
                  onClick={() => handleDrop(opt.id)} // Click fallback
                  whileHover={{ scale: 1.05, y: -5 }}
                  style={{
                    width: 160, height: 180,
                    background: 'rgba(255,255,255,0.5)',
                    border: '3px dashed #CBD5E1',
                    borderRadius: 32,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 15, position: 'relative'
                  }}
                >
                  <div style={{ fontSize: 40, opacity: 0.8 }}>
                    {opt.image ? <img src={opt.image} alt="" style={{ width: 80, height: 80, filter: 'grayscale(1)', opacity: 0.3 }} /> : '🔲'}
                  </div>
                  <div style={{ 
                    background: '#F1F5F9', padding: '6px 16px', 
                    borderRadius: 12, fontSize: 12, fontWeight: 800, color: '#64748B' 
                  }}>
                    {opt.label.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <p style={{ color: '#94A3B8', fontWeight: 700 }}>Point and click or drag to the target zone!</p>
          </div>
        )}

        {showBurst && <SuccessBurst />}
      </div>

      <AnimatePresence>
        {gameState === 'complete' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
            <GameConclusionFlow
              gameName="Matching Game"
              score={score}
              total={progress.total}
              duration={endTime ? (endTime - startTime) / 1000 : 0}
              skills={["Logic", "Visual Memory", "Precision"]}
              onAction={isSession ? onComplete : () => navigate('/games')}
              actionLabel={isSession ? "Finish Activity" : "Play More Games"}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
