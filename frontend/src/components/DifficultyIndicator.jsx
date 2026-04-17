/**
 * DifficultyIndicator Component
 * 
 * Displays difficulty level with visual indicators and information
 * Used in game selection, game interface, and progress tracking
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React from 'react';
import GameMetadataService from '../services/GameMetadataService.js';
import './DifficultyIndicator.css';

const DifficultyIndicator = ({
  difficulty = 1,
  showLabel = true,
  showDescription = false,
  size = 'medium',
  interactive = false,
  onDifficultyChange = null,
}) => {
  const indicator = GameMetadataService.getDifficultyIndicator(difficulty);

  const handleDifficultyClick = (newDifficulty) => {
    if (interactive && onDifficultyChange) {
      onDifficultyChange(newDifficulty);
    }
  };

  return (
    <div className={`difficulty-indicator difficulty-${size}`}>
      <div
        className="difficulty-badge"
        style={{ backgroundColor: indicator.color }}
        role="img"
        aria-label={`${indicator.displayLabel} difficulty`}
      >
        <span className="difficulty-icon">{indicator.icon}</span>
      </div>

      {showLabel && (
        <div className="difficulty-label">
          <span className="difficulty-text">{indicator.displayLabel}</span>
          {indicator.ageRange && (
            <span className="difficulty-age-range">{indicator.ageRange}</span>
          )}
        </div>
      )}

      {showDescription && (
        <div className="difficulty-description">
          <p>{indicator.description}</p>
        </div>
      )}

      {interactive && (
        <div className="difficulty-selector">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              className={`difficulty-option ${difficulty === level ? 'active' : ''}`}
              onClick={() => handleDifficultyClick(level)}
              aria-pressed={difficulty === level}
              title={`Switch to Level ${level}`}
            >
              {level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DifficultyIndicator;
