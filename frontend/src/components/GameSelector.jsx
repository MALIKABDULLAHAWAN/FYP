import React, { useState, useEffect } from 'react';
import { GameCard } from './GameCard';
import GameMetadataService from '../services/GameMetadataService';
import GameImageManager from '../services/GameImageManager';
import './GameSelector.css';
import '../styles/professional.css';

/**
 * GameSelector Component
 * 
 * Implements game browsing interface with:
 * - Game browsing with card layout
 * - Filtering controls (by age, difficulty, therapeutic goals)
 * - Search functionality
 * - Game cards with images, titles, and key metadata
 * - Selection confirmation dialog
 * - Age appropriateness validation
 * 
 * Requirements: 4.1, 4.5, 7.1, 7.2, 14.2, 14.3
 */
export function GameSelector({
  childAge = null,
  childDevelopmentalStage = null,
  therapistId = null,
  onGameSelected = null,
  onCancel = null,
  showFilters = true,
}) {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameImages, setGameImages] = useState({});
  const [ageValidation, setAgeValidation] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [showOverrideConfirmation, setShowOverrideConfirmation] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const metadataService = GameMetadataService;
  const imageManager = GameImageManager.getInstance();

  // Load games on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const allGames = metadataService.getAllGames(false);
        setGames(allGames);
        
        // Load images for all games
        const images = {};
        for (const game of allGames) {
          try {
            const imageUrl = await imageManager.getImageUrl(game.game_id, 'thumbnail');
            images[game.game_id] = imageUrl;
          } catch (err) {
            console.warn(`Failed to load image for game ${game.game_id}:`, err);
          }
        }
        setGameImages(images);
        setError(null);
      } catch (err) {
        console.error('Failed to load games:', err);
        setError('Failed to load games. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = games;

    // Age filter
    if (childAge !== null) {
      filtered = filtered.filter(
        (game) =>
          game.age_range.min_age <= childAge &&
          childAge <= game.age_range.max_age
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(
        (game) => game.difficulty_level === selectedDifficulty
      );
    }

    // Therapeutic goals filter
    if (selectedGoals.length > 0) {
      filtered = filtered.filter((game) =>
        selectedGoals.some((goal) => game.therapeutic_goals.includes(goal))
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(term) ||
          game.description.toLowerCase().includes(term)
      );
    }

    setFilteredGames(filtered);
  }, [games, childAge, selectedDifficulty, selectedGoals, searchTerm]);

  const handleGameSelect = (game) => {
    // Validate age appropriateness if childAge is provided
    if (childAge !== null) {
      const validation = metadataService.validateAgeAppropriate(
        childAge,
        game,
        childDevelopmentalStage
      );
      setAgeValidation(validation);

      if (!validation.isAppropriate && !validation.hasOverride) {
        // Get alternatives
        const alts = metadataService.getAgeAppropriateAlternatives(childAge, game);
        setAlternatives(alts);
        setSelectedGame(game);
        // Don't show confirmation yet - show validation warning first
        return;
      }
    }

    setSelectedGame(game);
    setShowConfirmation(true);
  };

  const handleConfirmOverride = () => {
    if (selectedGame && therapistId) {
      metadataService.logTherapistOverride(
        null, // childId would come from parent context
        selectedGame.game_id,
        therapistId,
        overrideReason || 'Therapist override for clinical reasons'
      );
      setShowOverrideConfirmation(false);
      setOverrideReason('');
      setShowConfirmation(true);
    }
  };

  const handleProceedWithSelection = () => {
    setShowConfirmation(true);
    setAgeValidation(null);
    setAlternatives([]);
  };

  const handleConfirmSelection = () => {
    if (selectedGame && onGameSelected) {
      onGameSelected(selectedGame);
    }
    setShowConfirmation(false);
  };

  const handleCancelSelection = () => {
    setShowConfirmation(false);
    setSelectedGame(null);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const toggleGoal = (goal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  const therapeuticGoals = [
    'Speech Articulation',
    'Language Development',
    'Social Awareness',
    'Emotional Regulation',
    'Fine Motor Skills',
    'Gross Motor Skills',
    'Cognitive Development',
    'Problem Solving',
    'Memory Enhancement',
    'Attention Building',
  ];

  if (loading) {
    return (
      <div className="game-selector-loading">
        <div className="loading-spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-selector-error">
        <p>{error}</p>
        <button onClick={handleCancel} className="btn btn-cute btn-cute-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="game-selector">
      {/* Header */}
      <div className="game-selector-header">
        <h2 className="selector-title">Choose a Game</h2>
        {childAge !== null && (
          <p className="selector-subtitle">
            Showing games for age {childAge}
          </p>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="game-selector-filters">
          {/* Search */}
          <div className="filter-group">
            <label htmlFor="game-search" className="filter-label">
              Search Games
            </label>
            <input
              id="game-search"
              type="text"
              className="search-input"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search games"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="filter-group">
            <label className="filter-label">Difficulty Level</label>
            <div className="filter-options">
              {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                <button
                  key={difficulty}
                  className={`filter-button ${
                    selectedDifficulty === difficulty ? 'active' : ''
                  }`}
                  onClick={() =>
                    setSelectedDifficulty(
                      selectedDifficulty === difficulty ? '' : difficulty
                    )
                  }
                  aria-pressed={selectedDifficulty === difficulty}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Therapeutic Goals Filter */}
          <div className="filter-group">
            <label className="filter-label">Therapeutic Goals</label>
            <div className="filter-goals">
              {therapeuticGoals.map((goal) => (
                <button
                  key={goal}
                  className={`goal-filter-button ${
                    selectedGoals.includes(goal) ? 'active' : ''
                  }`}
                  onClick={() => toggleGoal(goal)}
                  aria-pressed={selectedGoals.includes(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="game-selector-results-info">
        <p className="results-count">
          {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <ResponsiveContainer className="game-selector-grid">
          {filteredGames.map((game) => (
            <GameCard
              key={game.game_id}
              game={game}
              imageUrl={gameImages[game.game_id]}
              onSelect={handleGameSelect}
              isSelected={selectedGame?.game_id === game.game_id}
              showAttribution={true}
            />
          ))}
        </ResponsiveContainer>
      ) : (
        <div className="game-selector-empty">
          <p className="empty-message">
            No games found matching your criteria.
          </p>
          <p className="empty-suggestion">
            Try adjusting your filters or search term.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="game-selector-actions">
        <button
          onClick={handleCancel}
          className="btn btn-cute btn-cute-secondary"
        >
          Cancel
        </button>
      </div>

      {/* Age Appropriateness Validation Warning */}
      {ageValidation && !ageValidation.isAppropriate && !ageValidation.hasOverride && selectedGame && (
        <div className="validation-overlay">
          <div className="validation-dialog">
            <h3 className="validation-title">Age Appropriateness Warning</h3>
            <p className="validation-message">{ageValidation.reason}</p>

            {/* Suggested Alternatives */}
            {alternatives.length > 0 && (
              <div className="alternatives-section">
                <h4 className="alternatives-title">Suggested Age-Appropriate Alternatives:</h4>
                <div className="alternatives-list">
                  {alternatives.map((alt) => (
                    <div key={alt.game_id} className="alternative-item">
                      <p className="alternative-title">{alt.title}</p>
                      <p className="alternative-age">
                        Ages {alt.age_range.min_age}-{alt.age_range.max_age}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedGame(alt);
                          setAgeValidation(null);
                          setAlternatives([]);
                          setShowConfirmation(true);
                        }}
                        className="btn btn-cute btn-cute-secondary btn-sm"
                      >
                        Select This Game
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Therapist Override Option */}
            {therapistId && (
              <div className="override-section">
                <p className="override-label">Therapist Override:</p>
                <textarea
                  className="override-reason-input"
                  placeholder="Enter reason for override (required)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  aria-label="Reason for therapist override"
                />
                <div className="override-actions">
                  <button
                    onClick={handleConfirmOverride}
                    className="btn btn-cute btn-cute-primary"
                    disabled={!overrideReason.trim()}
                  >
                    Override & Continue
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="validation-actions">
              <button
                onClick={() => {
                  setAgeValidation(null);
                  setAlternatives([]);
                  setSelectedGame(null);
                  setOverrideReason('');
                }}
                className="btn btn-cute btn-cute-secondary"
              >
                Choose Different Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && selectedGame && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3 className="confirmation-title">Confirm Selection</h3>
            <p className="confirmation-message">
              You selected: <strong>{selectedGame.title}</strong>
            </p>
            <p className="confirmation-details">
              Age: {selectedGame.age_range.min_age}-{selectedGame.age_range.max_age} years
              <br />
              Difficulty: {selectedGame.difficulty_level}
            </p>
            <div className="confirmation-actions">
              <button
                onClick={handleConfirmSelection}
                className="btn btn-cute btn-cute-primary"
              >
                Play Game
              </button>
              <button
                onClick={handleCancelSelection}
                className="btn btn-cute btn-cute-secondary"
              >
                Choose Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameSelector;
