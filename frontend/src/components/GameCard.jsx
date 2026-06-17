import React from 'react';
import { ChildFriendlyButton } from './ChildFriendlyButton';
import DifficultyIndicator from './DifficultyIndicator';
import './GameCard.css';

/**
 * GameCard Component
 * 
 * Displays a game with:
 * - Game image with proper attribution
 * - Game title and brief description
 * - Difficulty level and age range
 * - Therapeutic goals as tags
 * - Hover state with visual feedback
 * - Responsive sizing for different viewports
 * 
 * Requirements: 4.3, 8.1, 9.1, 14.1
 */
export function GameCard({
  game,
  imageUrl = null,
  onSelect = null,
  isSelected = false,
  showAttribution = false,
}) {
  if (!game) {
    return null;
  }

  const handleClick = () => {
    if (onSelect) {
      onSelect(game);
    }
  };

  return (
    <div
      className={`game-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-pressed={isSelected}
    >
      {/* Game Image */}
      <div className="game-card-image-container">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={game.title}
            className="game-card-image"
          />
        ) : (
          <div className="game-card-image-placeholder">
            <span className="placeholder-text">No Image</span>
          </div>
        )}
        {isSelected && (
          <div className="game-card-selected-badge">
            <span className="selected-checkmark">✓</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="game-card-content">
        {/* Title */}
        <h3 className="game-card-title">{game.title}</h3>

        {/* Description */}
        <p className="game-card-description">
          {game.description.length > 100
            ? `${game.description.substring(0, 100)}...`
            : game.description}
        </p>

        {/* Metadata Row */}
        <div className="game-card-metadata">
          {/* Difficulty */}
          <div className="metadata-item">
            <DifficultyIndicator
              difficulty={game.difficulty_level}
              showLabel={true}
              size="small"
            />
          </div>

          {/* Age Range */}
          <div className="metadata-item">
            <span className="age-range-label">
              Ages {game.age_range.min_age}-{game.age_range.max_age}
            </span>
          </div>
        </div>

        {/* Therapeutic Goals */}
        {game.therapeutic_goals && game.therapeutic_goals.length > 0 && (
          <div className="game-card-goals">
            {game.therapeutic_goals.slice(0, 2).map((goal, index) => (
              <span key={index} className="goal-tag">
                {goal}
              </span>
            ))}
            {game.therapeutic_goals.length > 2 && (
              <span className="goal-tag more-goals">
                +{game.therapeutic_goals.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Attribution */}
        {showAttribution && game.image_attribution && (
          <div className="game-card-attribution">
            <small className="attribution-text">
              Photo by {game.image_attribution.photographer}
            </small>
          </div>
        )}
      </div>

      {/* Select Button */}
      <div className="game-card-actions">
        <ChildFriendlyButton
          onClick={handleClick}
          variant={isSelected ? 'primary' : 'secondary'}
          size="small"
        >
          {isSelected ? 'Selected' : 'Select'}
        </ChildFriendlyButton>
      </div>
    </div>
  );
}

export default GameCard;
