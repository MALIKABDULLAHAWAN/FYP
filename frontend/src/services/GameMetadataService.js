/**
 * GameMetadataService
 * 
 * Manages game metadata with:
 * - CRUD operations
 * - Validation with comprehensive error handling
 * - Version tracking and audit trail
 * - Soft delete support
 * - Age validation with user-friendly messages
 */

import unifiedErrorHandler from './ErrorHandlers/index.js';

class GameMetadataService {
  constructor() {
    this.games = new Map();
    this.auditLog = [];
    this.therapistOverrides = [];
    this.nextId = 1;
  }

  /**
   * Validate game metadata
   */
  validateMetadata(data) {
    const errors = [];

    // Title validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (data.title.length < 1 || data.title.length > 100) {
      errors.push('Title must be between 1 and 100 characters');
    }

    // Description validation
    if (!data.description || typeof data.description !== 'string') {
      errors.push('Description is required and must be a string');
    } else if (data.description.length < 1 || data.description.length > 500) {
      errors.push('Description must be between 1 and 500 characters');
    }

    // Therapeutic goals validation
    if (!Array.isArray(data.therapeutic_goals) || data.therapeutic_goals.length === 0) {
      errors.push('At least one therapeutic goal is required');
    } else if (data.therapeutic_goals.length > 5) {
      errors.push('Maximum 5 therapeutic goals allowed');
    }

    // Difficulty level validation
    if (typeof data.difficulty_level === 'number') {
      if (data.difficulty_level < 1 || data.difficulty_level > 5) {
        errors.push('Difficulty level must be between 1 and 5');
      }
    } else {
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      if (!data.difficulty_level || !validDifficulties.includes(data.difficulty_level)) {
        errors.push('Difficulty level must be 1-5 or Easy/Medium/Hard');
      }
    }

    // Age range validation
    if (!data.age_range || typeof data.age_range !== 'object') {
      errors.push('Age range is required');
    } else {
      const { min_age, max_age } = data.age_range;
      if (typeof min_age !== 'number' || min_age < 3 || min_age > 12) {
        errors.push('Minimum age must be between 3 and 12');
      }
      if (typeof max_age !== 'number' || max_age < 3 || max_age > 12) {
        errors.push('Maximum age must be between 3 and 12');
      }
      if (min_age > max_age) {
        errors.push('Minimum age cannot be greater than maximum age');
      }
    }

    // Image URL validation
    if (!data.image_url || typeof data.image_url !== 'string') {
      errors.push('Image URL is required');
    } else {
      try {
        new URL(data.image_url);
      } catch {
        errors.push('Image URL must be a valid URL');
      }
    }

    // Image attribution validation
    if (!data.image_attribution || typeof data.image_attribution !== 'object') {
      errors.push('Image attribution is required');
    } else {
      const { photographer, license, source } = data.image_attribution;
      if (!photographer || typeof photographer !== 'string') {
        errors.push('Photographer name is required in attribution');
      }
      if (!license || typeof license !== 'string') {
        errors.push('License is required in attribution');
      }
      if (!source || typeof source !== 'string') {
        errors.push('Source is required in attribution');
      }
    }

    // Evidence base validation
    if (!Array.isArray(data.evidence_base) || data.evidence_base.length === 0) {
      errors.push('At least one evidence reference is required');
    } else {
      data.evidence_base.forEach((ref, index) => {
        if (!ref.citation || typeof ref.citation !== 'string') {
          errors.push(`Evidence reference ${index + 1}: Citation is required`);
        }
        if (typeof ref.publication_year !== 'number' || ref.publication_year < 1900) {
          errors.push(`Evidence reference ${index + 1}: Valid publication year is required`);
        }
        if (typeof ref.effectiveness_rating !== 'number' || ref.effectiveness_rating < 0 || ref.effectiveness_rating > 1) {
          errors.push(`Evidence reference ${index + 1}: Effectiveness rating must be between 0 and 1`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new game with comprehensive error handling
   */
  createGame(data) {
    try {
      const validation = this.validateMetadata(data);
      if (!validation.valid) {
        // Handle validation failure with user-friendly messages
        const errorResult = unifiedErrorHandler.handleMetadataValidation(
          data,
          validation,
          'create-game'
        );
        
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const gameId = `game-${this.nextId++}`;
      const now = new Date().toISOString();

      const game = {
        game_id: gameId,
        ...data,
        created_at: now,
        updated_at: now,
        version: 1,
        is_active: true,
      };

      this.games.set(gameId, game);
      this.logAudit('CREATE', gameId, null, game);

      return game;
    } catch (error) {
      // Handle system error during game creation
      const errorResult = unifiedErrorHandler.handleMetadataValidation(
        data,
        { errors: [error.message] },
        'create-game-system-error'
      );
      
      throw error;
    }
  }

  /**
   * Read a game by ID
   */
  getGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    return game;
  }

  /**
   * Get all active games
   */
  getAllGames(includeInactive = false) {
    const games = Array.from(this.games.values());
    if (!includeInactive) {
      return games.filter(g => g.is_active);
    }
    return games;
  }

  /**
   * Update a game with comprehensive error handling
   */
  updateGame(gameId, updates) {
    try {
      const game = this.getGame(gameId);
      
      // Validate updated data
      const updatedData = { ...game, ...updates };
      const validation = this.validateMetadata(updatedData);
      if (!validation.valid) {
        // Handle validation failure with user-friendly messages
        const errorResult = unifiedErrorHandler.handleMetadataValidation(
          updatedData,
          validation,
          'update-game'
        );
        
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const now = new Date().toISOString();
      const oldGame = { ...game };

      game.updated_at = now;
      game.version += 1;
      Object.assign(game, updates);

      this.logAudit('UPDATE', gameId, oldGame, game);

      return game;
    } catch (error) {
      // Handle system error during game update
      const errorResult = unifiedErrorHandler.handleMetadataValidation(
        updates,
        { errors: [error.message] },
        'update-game-system-error'
      );
      
      throw error;
    }
  }

  /**
   * Soft delete a game
   */
  deleteGame(gameId) {
    const game = this.getGame(gameId);
    const oldGame = { ...game };

    game.is_active = false;
    game.updated_at = new Date().toISOString();
    game.version += 1;

    this.logAudit('DELETE', gameId, oldGame, game);

    return game;
  }

  /**
   * Get games by age and difficulty
   */
  getGamesByAgeAndDifficulty(childAge, difficulty) {
    return this.getAllGames().filter(game => {
      const ageMatch = childAge >= game.age_range.min_age && childAge <= game.age_range.max_age;
      const difficultyMatch = game.difficulty_level === difficulty;
      return ageMatch && difficultyMatch;
    });
  }

  /**
   * Get games by therapeutic goals
   */
  getGamesByTherapeuticGoals(goals) {
    return this.getAllGames().filter(game => {
      return goals.some(goal => game.therapeutic_goals.includes(goal));
    });
  }

  /**
   * Get games by multiple criteria
   */
  getGamesByMultipleCriteria(criteria) {
    let results = this.getAllGames();

    if (criteria.ageRange) {
      const [minAge, maxAge] = criteria.ageRange;
      results = results.filter(game => {
        return minAge >= game.age_range.min_age && maxAge <= game.age_range.max_age;
      });
    }

    if (criteria.difficulty) {
      results = results.filter(game => game.difficulty_level === criteria.difficulty);
    }

    if (criteria.therapeuticGoals && criteria.therapeuticGoals.length > 0) {
      results = results.filter(game => {
        return criteria.therapeuticGoals.some(goal => game.therapeutic_goals.includes(goal));
      });
    }

    if (criteria.sort) {
      results = this.sortGames(results, criteria.sort);
    }

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Search games by title or description
   */
  searchGames(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.getAllGames().filter(game => {
      return (
        game.title.toLowerCase().includes(term) ||
        game.description.toLowerCase().includes(term)
      );
    });
  }

  /**
   * Get recommended games for a child
   */
  getRecommendedGames(childAge, therapeuticGoals = [], limit = 5) {
    let recommendations = this.getAllGames().filter(game => {
      const ageMatch = childAge >= game.age_range.min_age && childAge <= game.age_range.max_age;
      const goalMatch = therapeuticGoals.length === 0 || 
        therapeuticGoals.some(goal => game.therapeutic_goals.includes(goal));
      return ageMatch && goalMatch;
    });

    // Sort by effectiveness rating
    recommendations = this.sortGames(recommendations, 'effectiveness');
    
    return recommendations.slice(0, limit);
  }

  /**
   * Validate if a game is age-appropriate for a child with comprehensive error handling
   * 
   * Considers:
   * - Chronological age against game's age_range
   * - Developmental stage appropriateness
   * - Therapist overrides
   * 
   * Returns: {
   *   isAppropriate: boolean,
   *   reason: string,
   *   hasOverride: boolean,
   *   overrideDetails: object|null,
   *   errorId?: string (if validation fails)
   * }
   */
  validateAgeAppropriate(childAge, game, childDevelopmentalStage = null) {
    try {
      if (!game || typeof childAge !== 'number') {
        const errorResult = unifiedErrorHandler.handleAgeValidation(
          childAge,
          { age_range: { min_age: 0, max_age: 0 } },
          {
            isAppropriate: false,
            reason: 'Invalid input parameters'
          },
          'invalid-parameters'
        );

        return {
          isAppropriate: false,
          reason: 'Invalid input parameters',
          hasOverride: false,
          overrideDetails: null,
          errorId: errorResult.errorId
        };
      }

      // Check if there's an active therapist override for this game
      const override = this.therapistOverrides.find(
        (o) => o.game_id === game.game_id && o.is_active
      );

      if (override) {
        return {
          isAppropriate: true,
          reason: `Therapist override applied: ${override.reason}`,
          hasOverride: true,
          overrideDetails: override,
        };
      }

      // Check chronological age
      const withinAgeRange =
        childAge >= game.age_range.min_age && childAge <= game.age_range.max_age;

      if (!withinAgeRange) {
        const reason =
          childAge < game.age_range.min_age
            ? `Child is too young. Game is for ages ${game.age_range.min_age}-${game.age_range.max_age}`
            : `Child is too old. Game is for ages ${game.age_range.min_age}-${game.age_range.max_age}`;

        // Handle age validation failure with user-friendly messaging
        const errorResult = unifiedErrorHandler.handleAgeValidation(
          childAge,
          game,
          {
            isAppropriate: false,
            reason
          },
          'age-range-mismatch'
        );

        return {
          isAppropriate: false,
          reason,
          hasOverride: false,
          overrideDetails: null,
          errorId: errorResult.errorId,
          alternatives: errorResult.alternatives,
          userMessage: errorResult.userMessage
        };
      }

      // Check developmental stage if provided
      if (childDevelopmentalStage && game.age_range.developmental_stage) {
        const stageMatch = this.isDevelopmentalStageAppropriate(
          childDevelopmentalStage,
          game.age_range.developmental_stage
        );

        if (!stageMatch) {
          const errorResult = unifiedErrorHandler.handleAgeValidation(
            childAge,
            game,
            {
              isAppropriate: false,
              reason: `Game is not appropriate for developmental stage: ${childDevelopmentalStage}`
            },
            'developmental-stage-mismatch'
          );

          return {
            isAppropriate: false,
            reason: `Game is not appropriate for developmental stage: ${childDevelopmentalStage}`,
            hasOverride: false,
            overrideDetails: null,
            errorId: errorResult.errorId,
            alternatives: errorResult.alternatives,
            userMessage: errorResult.userMessage
          };
        }
      }

      return {
        isAppropriate: true,
        reason: 'Game is age-appropriate',
        hasOverride: false,
        overrideDetails: null,
      };
    } catch (error) {
      // Handle system error during validation
      const errorResult = unifiedErrorHandler.handleAgeValidation(
        childAge,
        game,
        {
          isAppropriate: false,
          reason: 'System error during validation'
        },
        'system-error'
      );

      return {
        isAppropriate: false,
        reason: 'System error during validation',
        hasOverride: false,
        overrideDetails: null,
        errorId: errorResult.errorId,
        systemError: true
      };
    }
  }

  /**
   * Check if developmental stages are compatible
   */
  isDevelopmentalStageAppropriate(childStage, gameStage) {
    const stageHierarchy = {
      'early-childhood': 0,
      'middle-childhood': 1,
      'late-childhood': 2,
    };

    const childLevel = stageHierarchy[childStage] ?? -1;
    const gameLevel = stageHierarchy[gameStage] ?? -1;

    if (childLevel === -1 || gameLevel === -1) {
      return true; // Unknown stages are considered compatible
    }

    // Allow games at same level or one level below (for reinforcement)
    return childLevel >= gameLevel - 1;
  }

  /**
   * Get age-appropriate alternative games
   * 
   * Returns games that are:
   * - Age-appropriate for the child
   * - Similar therapeutic goals to the original game
   * - Different difficulty or type
   */
  getAgeAppropriateAlternatives(childAge, game, limit = 3) {
    const alternatives = this.getAllGames().filter((g) => {
      // Skip the original game
      if (g.game_id === game.game_id) {
        return false;
      }

      // Must be age-appropriate
      const validation = this.validateAgeAppropriate(childAge, g);
      if (!validation.isAppropriate) {
        return false;
      }

      // Should share at least one therapeutic goal
      const hasCommonGoal = g.therapeutic_goals.some((goal) =>
        game.therapeutic_goals.includes(goal)
      );

      return hasCommonGoal;
    });

    // Sort by effectiveness rating
    alternatives.sort((a, b) => {
      const avgA =
        a.evidence_base.reduce((sum, ref) => sum + ref.effectiveness_rating, 0) /
        a.evidence_base.length;
      const avgB =
        b.evidence_base.reduce((sum, ref) => sum + ref.effectiveness_rating, 0) /
        b.evidence_base.length;
      return avgB - avgA;
    });

    return alternatives.slice(0, limit);
  }

  /**
   * Log therapist override for age-inappropriate game selection
   * 
   * Tracks when a therapist overrides age appropriateness validation
   * with confirmation and reasoning
   */
  logTherapistOverride(childId, gameId, therapistId, reason, confirmationToken = null) {
    const game = this.getGame(gameId);

    const override = {
      override_id: `override-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      child_id: childId,
      game_id: gameId,
      therapist_id: therapistId,
      reason,
      confirmation_token: confirmationToken,
      timestamp: new Date().toISOString(),
      is_active: true,
    };

    this.therapistOverrides.push(override);

    // Log to audit trail
    this.logAudit('THERAPIST_OVERRIDE', gameId, null, {
      override_id: override.override_id,
      child_id: childId,
      therapist_id: therapistId,
      reason,
    });

    return override;
  }

  /**
   * Get therapist overrides for a game
   */
  getTherapistOverrides(gameId) {
    return this.therapistOverrides.filter((o) => o.game_id === gameId);
  }

  /**
   * Revoke a therapist override
   */
  revokeTherapistOverride(overrideId) {
    const override = this.therapistOverrides.find((o) => o.override_id === overrideId);
    if (override) {
      override.is_active = false;
      this.logAudit('REVOKE_OVERRIDE', override.game_id, null, {
        override_id: overrideId,
      });
    }
    return override;
  }

  /**
   * Sort games
   */
  sortGames(games, sortBy) {
    const sorted = [...games];

    switch (sortBy) {
      case 'effectiveness':
        sorted.sort((a, b) => {
          const avgA = a.evidence_base.reduce((sum, ref) => sum + ref.effectiveness_rating, 0) / a.evidence_base.length;
          const avgB = b.evidence_base.reduce((sum, ref) => sum + ref.effectiveness_rating, 0) / b.evidence_base.length;
          return avgB - avgA;
        });
        break;
      case 'recency':
        sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return sorted;
  }

  /**
   * Get audit trail for a game
   */
  getAuditTrail(gameId) {
    return this.auditLog.filter(entry => entry.game_id === gameId);
  }

  /**
   * Log audit entry
   */
  logAudit(action, gameId, oldData, newData) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      game_id: gameId,
      old_data: oldData,
      new_data: newData,
    });
  }

  /**
   * Export games to JSON
   */
  exportToJSON() {
    const games = this.getAllGames();
    return JSON.stringify(games, null, 2);
  }

  /**
   * Export games to CSV
   */
  exportToCSV() {
    const games = this.getAllGames();
    if (games.length === 0) return '';

    const headers = [
      'Game ID',
      'Title',
      'Description',
      'Difficulty Level',
      'Min Age',
      'Max Age',
      'Therapeutic Goals',
      'Created At',
      'Updated At',
    ];

    const rows = games.map(game => [
      game.game_id,
      `"${game.title}"`,
      `"${game.description}"`,
      game.difficulty_level,
      game.age_range.min_age,
      game.age_range.max_age,
      `"${game.therapeutic_goals.join(', ')}"`,
      game.created_at,
      game.updated_at,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Calculate difficulty recommendation based on child progress
   * 
   * Analyzes child's performance metrics to recommend appropriate difficulty level
   * 
   * Returns: {
   *   recommendedDifficulty: 'Easy' | 'Medium' | 'Hard',
   *   reason: string,
   *   confidence: number (0-1),
   *   performanceMetrics: object
   * }
   */
  calculateDifficultyRecommendation(childId, childProgress) {
    if (!childId || !childProgress) {
      return {
        recommendedDifficulty: 'Easy',
        reason: 'Insufficient data for recommendation',
        confidence: 0,
        performanceMetrics: {},
      };
    }

    const {
      averageScore = 0,
      completionRate = 0,
      sessionCount = 0,
      recentScores = [],
      currentDifficulty = 'Easy',
    } = childProgress;

    // Calculate performance trend
    let trend = 'stable';
    if (recentScores.length >= 3) {
      const recent = recentScores.slice(-3);
      const older = recentScores.slice(-6, -3);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg + 5) {
          trend = 'improving';
        } else if (recentAvg < olderAvg - 5) {
          trend = 'declining';
        }
      }
    }

    // Recommendation logic
    let recommendedDifficulty = currentDifficulty;
    let reason = '';
    let confidence = 0.5;

    if (sessionCount < 2) {
      // Not enough data
      recommendedDifficulty = 'Easy';
      reason = 'Insufficient session history for recommendation';
      confidence = 0.3;
    } else if (averageScore >= 85 && completionRate >= 0.9) {
      // Child is excelling - recommend harder
      if (currentDifficulty === 'Easy') {
        recommendedDifficulty = 'Medium';
        reason = 'Child is excelling at Easy level (avg score 85+, completion 90%+)';
        confidence = 0.85;
      } else if (currentDifficulty === 'Medium') {
        recommendedDifficulty = 'Hard';
        reason = 'Child is excelling at Medium level (avg score 85+, completion 90%+)';
        confidence = 0.85;
      } else {
        recommendedDifficulty = 'Hard';
        reason = 'Child is performing excellently at Hard level';
        confidence = 0.9;
      }
    } else if (averageScore >= 70 && completionRate >= 0.75) {
      // Child is doing well - maintain or slightly increase
      if (currentDifficulty === 'Easy' && trend === 'improving') {
        recommendedDifficulty = 'Medium';
        reason = 'Child is ready for Medium difficulty (avg score 70+, improving trend)';
        confidence = 0.75;
      } else {
        recommendedDifficulty = currentDifficulty;
        reason = 'Child is performing well at current difficulty level';
        confidence = 0.8;
      }
    } else if (averageScore < 50 || completionRate < 0.5) {
      // Child is struggling - recommend easier
      if (currentDifficulty === 'Hard') {
        recommendedDifficulty = 'Medium';
        reason = 'Child is struggling at Hard level (avg score <50 or completion <50%)';
        confidence = 0.85;
      } else if (currentDifficulty === 'Medium') {
        recommendedDifficulty = 'Easy';
        reason = 'Child is struggling at Medium level (avg score <50 or completion <50%)';
        confidence = 0.85;
      } else {
        recommendedDifficulty = 'Easy';
        reason = 'Child needs more support at current difficulty level';
        confidence = 0.8;
      }
    } else if (trend === 'declining' && currentDifficulty !== 'Easy') {
      // Declining trend - recommend easier
      if (currentDifficulty === 'Hard') {
        recommendedDifficulty = 'Medium';
        reason = 'Child performance is declining, recommend Medium difficulty';
        confidence = 0.75;
      } else if (currentDifficulty === 'Medium') {
        recommendedDifficulty = 'Easy';
        reason = 'Child performance is declining, recommend Easy difficulty';
        confidence = 0.75;
      }
    } else {
      // Moderate performance - maintain current
      recommendedDifficulty = currentDifficulty;
      reason = 'Child is performing adequately at current difficulty level';
      confidence = 0.7;
    }

    return {
      recommendedDifficulty,
      reason,
      confidence,
      performanceMetrics: {
        averageScore,
        completionRate,
        sessionCount,
        trend,
        recentScoresCount: recentScores.length,
      },
    };
  }

  /**
   * Adjust difficulty in real-time during gameplay
   * 
   * Monitors performance metrics during active session and adjusts difficulty
   * if child is clearly struggling or excelling
   * 
   * Returns: {
   *   difficultyAdjusted: boolean,
   *   oldDifficulty: string,
   *   newDifficulty: string,
   *   reason: string,
   *   adjustmentTimestamp: string
   * }
   */
  adjustDifficultyInRealtime(sessionId, performanceMetrics) {
    if (!sessionId || !performanceMetrics) {
      return {
        difficultyAdjusted: false,
        oldDifficulty: null,
        newDifficulty: null,
        reason: 'Invalid session or performance data',
        adjustmentTimestamp: new Date().toISOString(),
      };
    }

    const {
      currentDifficulty = 1,
      currentScore = 0,
      tasksCompleted = 0,
      tasksFailed = 0,
      timeSpentSeconds = 0,
      taskCount = 0,
    } = performanceMetrics;

    let difficultyAdjusted = false;
    let newLevel = typeof currentDifficulty === 'number' ? currentDifficulty : 2; // Default to mid if non-numeric
    let reason = '';

    // Calculate real-time metrics
    const failureRate = taskCount > 0 ? tasksFailed / taskCount : 0;
    const successRate = taskCount > 0 ? tasksCompleted / taskCount : 0;
    const avgTimePerTask = taskCount > 0 ? timeSpentSeconds / taskCount : 0;

    // Adjustment thresholds
    const STRUGGLE_THRESHOLD = 0.5; // 50% failure rate
    const EXCEL_THRESHOLD = 0.95; // 95% success rate
    const SLOW_THRESHOLD = 120; // 2 minutes per task

    if (failureRate >= STRUGGLE_THRESHOLD && currentScore < 40) {
      // Child is clearly struggling
      if (newLevel > 1) {
        newLevel -= 1;
        reason = `Real-time adjustment: High failure rate (${(failureRate * 100).toFixed(0)}%) and low score (${currentScore}%). Dropping to Level ${newLevel}.`;
        difficultyAdjusted = true;
      }
    } else if (successRate >= EXCEL_THRESHOLD && currentScore >= 90) {
      // Child is excelling
      if (newLevel < 5) {
        newLevel += 1;
        reason = `Real-time adjustment: Excellent performance (${(successRate * 100).toFixed(0)}% success, ${currentScore}% score). Raising to Level ${newLevel}.`;
        difficultyAdjusted = true;
      }
    }

    return {
      difficultyAdjusted,
      oldDifficulty: currentDifficulty,
      newDifficulty: newLevel,
      reason,
      adjustmentTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Get difficulty indicator for UI display
   * 
   * Returns visual and textual representation of difficulty level
   * 
   * Returns: {
   *   difficulty: string,
   *   displayLabel: string,
   *   color: string,
   *   icon: string,
   *   description: string,
   *   ageRange: string
   * }
   */
  getDifficultyIndicator(difficulty) {
    const indicators = {
      1: {
        difficulty: 1,
        displayLabel: 'Level 1',
        color: '#2ECC71', // Green
        icon: '⭐',
        description: 'Foundation building and core skills',
        ageRange: 'Beginner',
      },
      2: {
        difficulty: 2,
        displayLabel: 'Level 2',
        color: '#7ED321', // Light Green
        icon: '⭐⭐',
        description: 'Developing independence and accuracy',
        ageRange: 'Intermediate',
      },
      3: {
        difficulty: 3,
        displayLabel: 'Level 3',
        color: '#F1C40F', // Yellow
        icon: '⭐⭐⭐',
        description: 'Standard therapeutic challenge',
        ageRange: 'Advanced',
      },
      4: {
        difficulty: 4,
        displayLabel: 'Level 4',
        color: '#F39C12', // Orange
        icon: '⭐⭐⭐⭐',
        description: 'Complex logic and rapid response',
        ageRange: 'Mastery',
      },
      5: {
        difficulty: 5,
        displayLabel: 'Level 5',
        color: '#E74C3C', // Red
        icon: '⭐⭐⭐⭐⭐',
        description: 'Peak cognitive and sensory integration',
        ageRange: 'Elite',
      },
      // Legacy mapping
      Easy: { difficulty: 1, displayLabel: 'Easy', color: '#2ECC71', icon: '⭐', description: 'Beginner', ageRange: 'Ages 3-5' },
      Medium: { difficulty: 3, displayLabel: 'Medium', color: '#F1C40F', icon: '⭐⭐⭐', description: 'Intermediate', ageRange: 'Ages 6-8' },
      Hard: { difficulty: 5, displayLabel: 'Hard', color: '#E74C3C', icon: '⭐⭐⭐⭐⭐', description: 'Advanced', ageRange: 'Ages 9-12' },
    };

    return indicators[difficulty] || indicators[1] || indicators.Medium;
  }

  /**
   * Track difficulty change in session history
   * 
   * Records when and why difficulty was changed during a session
   * for audit trail and progress analysis
   * 
   * Returns: {
   *   changeId: string,
   *   sessionId: string,
   *   oldDifficulty: string,
   *   newDifficulty: string,
   *   reason: string,
   *   timestamp: string,
   *   performanceAtChange: object
   * }
   */
  trackDifficultyChange(sessionId, oldDifficulty, newDifficulty, reason, performanceMetrics = {}) {
    if (!sessionId || !oldDifficulty || !newDifficulty) {
      throw new Error('sessionId, oldDifficulty, and newDifficulty are required');
    }

    const changeId = `difficulty-change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const difficultyChange = {
      changeId,
      sessionId,
      oldDifficulty,
      newDifficulty,
      reason,
      timestamp: new Date().toISOString(),
      performanceAtChange: {
        score: performanceMetrics.score || 0,
        completionRate: performanceMetrics.completionRate || 0,
        tasksCompleted: performanceMetrics.tasksCompleted || 0,
        tasksFailed: performanceMetrics.tasksFailed || 0,
      },
    };

    // Log to audit trail
    this.logAudit('DIFFICULTY_CHANGE', sessionId, { difficulty: oldDifficulty }, { difficulty: newDifficulty });

    return difficultyChange;
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.games.clear();
    this.auditLog = [];
    this.therapistOverrides = [];
    this.nextId = 1;
  }
}

// Export singleton instance
export default new GameMetadataService();
