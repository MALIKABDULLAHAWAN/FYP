import { useEffect, useState } from 'react';
import UiIcon from './ui/UiIcon';
import visualEffects from '../services/VisualEffects';
import audioFeedback from '../services/AudioFeedback';
import './AchievementDisplay.css';

export default function AchievementDisplay({ achievements, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (achievements.length > 0) {
      // Play level up sound for achievements
      audioFeedback.play('levelUp');
      
      // Visual celebration
      const container = document.querySelector('.achievement-display');
      if (container) {
        visualEffects.celebrate(container, { count: 30, duration: 2000 });
      }
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
    }
  };

  return (
    <div className="achievement-overlay" onClick={handleNext}>
      <div className="achievement-display" onClick={e => e.stopPropagation()}>
        <div className="achievement-badge">
          <div 
            className="achievement-icon"
            style={{ background: currentAchievement.color }}
          >
            <UiIcon name={currentAchievement.icon} size={48} />
          </div>
          <div className="achievement-glow" style={{ background: currentAchievement.color }} />
        </div>
        
        <div className="achievement-content">
          <div className="achievement-label">Achievement Unlocked!</div>
          <h2 className="achievement-name">{currentAchievement.name}</h2>
          <p className="achievement-description">{currentAchievement.description}</p>
        </div>

        <div className="achievement-progress">
          {achievements.map((_, idx) => (
            <div 
              key={idx}
              className={`progress-dot ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <button className="achievement-btn" onClick={handleNext}>
          {isLast ? 'Awesome!' : 'Next'}
        </button>
      </div>
    </div>
  );
}
