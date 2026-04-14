import React from 'react';
import { ChildFriendlyCard } from './ChildFriendlyCard';
import { ProgressIndicator } from './ProgressIndicator';
import './GameMetadataDisplay.css';

/**
 * GameMetadataDisplay Component
 * 
 * Displays comprehensive game metadata including:
 * - Title and description
 * - Therapeutic goals
 * - Difficulty level
 * - Age range
 * - Evidence base
 */
export function GameMetadataDisplay({ game, imageUrl = null }) {
  if (!game) {
    return null;
  }

  const difficultyColors = {
    Easy: '#2ECC71',
    Medium: '#F1C40F',
    Hard: '#E74C3C',
  };

  return (
    <ChildFriendlyCard variant="default" padding="large" className="game-metadata-display">
      {/* Game Image */}
      {imageUrl && (
        <div className="game-image-container">
          <img
            src={imageUrl}
            alt={game.title}
            className="game-image"
          />
        </div>
      )}

      {/* Title and Description */}
      <div className="game-header">
        <h2 className="game-title">{game.title}</h2>
        <p className="game-description">{game.description}</p>
      </div>

      {/* Metadata Grid */}
      <div className="metadata-grid">
        {/* Difficulty Level */}
        <div className="metadata-item">
          <label className="metadata-label">Difficulty Level</label>
          <div
            className="difficulty-badge"
            style={{ backgroundColor: difficultyColors[game.difficulty_level] }}
          >
            {game.difficulty_level}
          </div>
        </div>

        {/* Age Range */}
        <div className="metadata-item">
          <label className="metadata-label">Age Range</label>
          <div className="age-range">
            {game.age_range.min_age} - {game.age_range.max_age} years
          </div>
        </div>

        {/* Developmental Stage */}
        {game.age_range.developmental_stage && (
          <div className="metadata-item">
            <label className="metadata-label">Developmental Stage</label>
            <div className="developmental-stage">
              {game.age_range.developmental_stage}
            </div>
          </div>
        )}
      </div>

      {/* Therapeutic Goals */}
      <div className="therapeutic-goals-section">
        <h3 className="section-title">Therapeutic Goals</h3>
        <div className="goals-list">
          {game.therapeutic_goals.map((goal, index) => (
            <span key={index} className="goal-tag">
              {goal}
            </span>
          ))}
        </div>
      </div>

      {/* Evidence Base */}
      {game.evidence_base && game.evidence_base.length > 0 && (
        <div className="evidence-section">
          <h3 className="section-title">Evidence Base</h3>
          <div className="evidence-list">
            {game.evidence_base.map((ref, index) => (
              <div key={index} className="evidence-item">
                <div className="evidence-citation">{ref.citation}</div>
                <div className="evidence-meta">
                  <span className="evidence-year">{ref.publication_year}</span>
                  <span className="evidence-type">{ref.study_type}</span>
                  <span className="evidence-rating">
                    Effectiveness: {(ref.effectiveness_rating * 100).toFixed(0)}%
                  </span>
                  {ref.sample_size && (
                    <span className="evidence-sample">
                      N = {ref.sample_size}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Attribution */}
      {game.image_attribution && (
        <div className="attribution-section">
          <h3 className="section-title">Image Attribution</h3>
          <div className="attribution-details">
            <div className="attribution-item">
              <span className="attribution-label">Photographer:</span>
              <span className="attribution-value">{game.image_attribution.photographer}</span>
            </div>
            <div className="attribution-item">
              <span className="attribution-label">License:</span>
              <span className="attribution-value">{game.image_attribution.license}</span>
            </div>
            <div className="attribution-item">
              <span className="attribution-label">Source:</span>
              <span className="attribution-value">{game.image_attribution.source}</span>
            </div>
          </div>
        </div>
      )}
    </ChildFriendlyCard>
  );
}

export default GameMetadataDisplay;
