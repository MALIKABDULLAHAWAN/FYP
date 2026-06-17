import React, { memo, useMemo, useCallback } from 'react';
import LazyImageLoader from './LazyImageLoader';
import ProgressiveLoader from './ProgressiveLoader';
import './GameCard.css';

/**
 * OptimizedGameCard - Performance-optimized game card component
 * Uses React.memo, useMemo, and useCallback for optimal rendering
 */
const OptimizedGameCard = memo(({
  game,
  isSelected = false,
  onSelect,
  onImageLoad,
  onImageError,
  priority = 'medium',
  className = '',
  ...props
}) => {
  // Memoize computed values
  const cardClasses = useMemo(() => {
    return [
      'game-card',
      'optimized-game-card',
      isSelected ? 'selected' : '',
      className
    ].filter(Boolean).join(' ');
  }, [isSelected, className]);

  const difficultyColor = useMemo(() => {
    const colors = {
      Easy: '#7ED321',
      Medium: '#F5A623',
      Hard: '#E74C3C'
    };
    return colors[game.difficulty_level] || '#95A5A6';
  }, [game.difficulty_level]);

  const ageRangeText = useMemo(() => {
    if (!game.age_range) return 'All ages';
    return `Ages ${game.age_range.min_age}-${game.age_range.max_age}`;
  }, [game.age_range]);

  const therapeuticGoalsText = useMemo(() => {
    if (!game.therapeutic_goals || game.therapeutic_goals.length === 0) {
      return 'General therapy';
    }
    
    if (game.therapeutic_goals.length <= 2) {
      return game.therapeutic_goals.join(', ');
    }
    
    return `${game.therapeutic_goals[0]} +${game.therapeutic_goals.length - 1} more`;
  }, [game.therapeutic_goals]);

  // Memoize event handlers
  const handleCardClick = useCallback((event) => {
    event.preventDefault();
    onSelect?.(game);
  }, [game, onSelect]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(game);
    }
  }, [game, onSelect]);

  const handleImageLoad = useCallback(() => {
    onImageLoad?.(game.game_id);
  }, [game.game_id, onImageLoad]);

  const handleImageError = useCallback(() => {
    onImageError?.(game.game_id);
  }, [game.game_id, onImageError]);

  // Memoize image component
  const imageComponent = useMemo(() => (
    <LazyImageLoader
      src={game.image_url}
      alt={`${game.title} game illustration`}
      className="game-card-image"
      onLoad={handleImageLoad}
      onError={handleImageError}
      sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
    />
  ), [game.image_url, game.title, handleImageLoad, handleImageError]);

  // Memoize metadata component
  const metadataComponent = useMemo(() => (
    <div className="game-card-metadata">
      <div className="game-card-difficulty">
        <span 
          className="difficulty-indicator"
          style={{ backgroundColor: difficultyColor }}
          aria-label={`Difficulty: ${game.difficulty_level}`}
        >
          {game.difficulty_level}
        </span>
      </div>
      
      <div className="game-card-age-range">
        {ageRangeText}
      </div>
      
      <div className="game-card-goals">
        {therapeuticGoalsText}
      </div>
    </div>
  ), [difficultyColor, game.difficulty_level, ageRangeText, therapeuticGoalsText]);

  return (
    <ProgressiveLoader
      priority={priority}
      className="game-card-loader"
      skeleton={true}
    >
      <article
        className={cardClasses}
        onClick={handleCardClick}
        onKeyPress={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label={`Select ${game.title} game`}
        aria-pressed={isSelected}
        data-game-id={game.game_id}
        {...props}
      >
        <div className="game-card-image-container">
          {imageComponent}
        </div>
        
        <div className="game-card-content">
          <h3 className="game-card-title">
            {game.title}
          </h3>
          
          <p className="game-card-description">
            {game.description}
          </p>
          
          {metadataComponent}
        </div>
        
        {isSelected && (
          <div className="game-card-selected-indicator" aria-hidden="true">
            <span className="selected-checkmark">✓</span>
          </div>
        )}
      </article>
    </ProgressiveLoader>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.game.game_id === nextProps.game.game_id &&
    prevProps.game.title === nextProps.game.title &&
    prevProps.game.description === nextProps.game.description &&
    prevProps.game.difficulty_level === nextProps.game.difficulty_level &&
    prevProps.game.image_url === nextProps.game.image_url &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.priority === nextProps.priority &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.game.age_range) === JSON.stringify(nextProps.game.age_range) &&
    JSON.stringify(prevProps.game.therapeutic_goals) === JSON.stringify(nextProps.game.therapeutic_goals)
  );
});

OptimizedGameCard.displayName = 'OptimizedGameCard';

export default OptimizedGameCard;