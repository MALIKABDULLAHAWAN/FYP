import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UiIcon from './ui/UiIcon';
import visualEffects from '../services/VisualEffects';
import audioFeedback from '../services/AudioFeedback';
import { SuccessBurst } from './AmbientEffects';
import './AchievementDisplay.css';

export default function AchievementDisplay({ achievements, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showBurst, setShowBurst] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (achievements.length > 0) {
      // Play level up sound for achievements
      audioFeedback.play('levelUp');
      setShowBurst(true);
    }
  }, [achievements]);

  if (!achievements.length || !isVisible) return null;

  const currentAchievement = achievements[currentIndex];
  const isLast = currentIndex >= achievements.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIsVisible(false);
      onClose?.();
    } else {
      setCurrentIndex(prev => prev + 1);
      audioFeedback.play('success');
      setShowBurst(true);
    }
  };

  return (
    <div className="achievement-overlay" onClick={handleNext}>
      <SuccessBurst trigger={showBurst} onComplete={() => setShowBurst(false)} />
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          ref={containerRef}
          initial={{ scale: 0.5, opacity: 0, y: 50, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
          exit={{ scale: 1.2, opacity: 0, rotate: 5 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="achievement-display-premium" 
          onClick={e => e.stopPropagation()}
        >
          {/* Magical Background Sparkles */}
          <div className="magical-card-bg" />
          
          <motion.div 
            className="achievement-badge-premium"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
          >
            <div 
              className="achievement-icon-premium"
              style={{ background: currentAchievement.color }}
            >
              <UiIcon name={currentAchievement.icon} size={64} />
            </div>
            <div className="achievement-glow-premium" style={{ background: currentAchievement.color }} />
          </motion.div>
          
          <motion.div 
            className="achievement-content-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="achievement-label-premium">New Achievement!</div>
            <h2 className="achievement-name-premium">{currentAchievement.name}</h2>
            <p className="achievement-description-premium">{currentAchievement.description}</p>
          </motion.div>

          <div className="achievement-progress-premium">
            {achievements.map((_, idx) => (
              <motion.div 
                key={idx}
                initial={false}
                animate={{ 
                  scale: idx === currentIndex ? 1.4 : 1,
                  backgroundColor: idx === currentIndex ? currentAchievement.color : idx < currentIndex ? "#10b981" : "#e2e8f0"
                }}
                className="progress-dot-premium"
              />
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="achievement-btn-premium" 
            onClick={handleNext}
            style={{ backgroundImage: `linear-gradient(135deg, ${currentAchievement.color}, #7c3aed)` }}
          >
            {isLast ? "I'm Amazing! 🌟" : "What's Next? 🚀"}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
