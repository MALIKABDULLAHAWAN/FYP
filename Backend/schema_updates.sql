-- Schema updates for game sessions and child profiles
-- This file documents the new tables and fields added for child-friendly UI enhancement

-- ============================================================================
-- CHILD PROFILES TABLE EXTENSIONS
-- ============================================================================
-- The following fields are added to the patients_childprofile table:
--
-- preferred_difficulty VARCHAR(20) - Child's preferred game difficulty (easy, medium, hard)
-- therapeutic_focus_areas JSONB - Array of therapeutic goals
-- age_group VARCHAR(10) - Age group classification (3-5, 6-8, 9-12)
-- accessibility_preferences JSONB - Accessibility settings
-- game_history JSONB - Array of recent game IDs
-- progress_metrics JSONB - Progress tracking data

-- ============================================================================
-- GAME SESSIONS TABLE
-- ============================================================================
-- New table for recording game session data with performance metrics

CREATE TABLE IF NOT EXISTS therapy_gamesession (
    id BIGINT PRIMARY KEY,
    child_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    therapist_id BIGINT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    therapeutic_goals_targeted JSONB NOT NULL DEFAULT '[]',
    child_engagement_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    therapist_notes TEXT NOT NULL DEFAULT '',
    observations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT therapy_gamesession_child_id_fk FOREIGN KEY (child_id) REFERENCES patients_childprofile(id) ON DELETE CASCADE,
    CONSTRAINT therapy_gamesession_game_id_fk FOREIGN KEY (game_id) REFERENCES therapy_gameimage(id) ON DELETE PROTECT,
    CONSTRAINT therapy_gamesession_therapist_id_fk FOREIGN KEY (therapist_id) REFERENCES accounts_user(id) ON DELETE PROTECT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS therapy_gamesession_child_created_idx ON therapy_gamesession(child_id, created_at);
CREATE INDEX IF NOT EXISTS therapy_gamesession_game_created_idx ON therapy_gamesession(game_id, created_at);
CREATE INDEX IF NOT EXISTS therapy_gamesession_therapist_created_idx ON therapy_gamesession(therapist_id, created_at);
CREATE INDEX IF NOT EXISTS therapy_gamesession_started_at_idx ON therapy_gamesession(started_at);

-- ============================================================================
-- PERFORMANCE METRICS STRUCTURE (stored in JSONB)
-- ============================================================================
-- Example performance_metrics JSON structure:
-- {
--   "score": 85,                          -- 0-100
--   "accuracy": 0.92,                     -- 0-1
--   "completion_percentage": 1.0,         -- 0-1
--   "difficulty_adjusted": false,         -- boolean
--   "time_per_task_seconds": [5, 4, 6]   -- array of times
-- }

-- ============================================================================
-- OBSERVATIONS STRUCTURE (stored in JSONB)
-- ============================================================================
-- Example observations JSON structure:
-- {
--   "behavior_notes": "Child was engaged and focused",
--   "progress_indicators": ["improved_attention", "better_articulation"],
--   "areas_for_improvement": ["needs_more_practice_with_difficult_sounds"]
-- }

-- ============================================================================
-- PROGRESS METRICS STRUCTURE (stored in JSONB in child_profiles)
-- ============================================================================
-- Example progress_metrics JSON structure:
-- {
--   "total_sessions": 15,
--   "average_score": 82.5,
--   "games_completed": 8,
--   "therapeutic_goals_progress": {
--     "speech-articulation": {
--       "sessions_completed": 5,
--       "average_performance": 85.0,
--       "last_session_date": "2024-01-15T10:30:00Z"
--     },
--     "social-awareness": {
--       "sessions_completed": 3,
--       "average_performance": 78.0,
--       "last_session_date": "2024-01-14T14:20:00Z"
--     }
--   }
-- }

-- ============================================================================
-- ACCESSIBILITY PREFERENCES STRUCTURE (stored in JSONB in child_profiles)
-- ============================================================================
-- Example accessibility_preferences JSON structure:
-- {
--   "text_size_multiplier": 1.2,          -- 1.0-2.0
--   "animation_enabled": true,
--   "high_contrast_mode": false,
--   "screen_reader_enabled": false,
--   "reduced_motion": false
-- }

-- ============================================================================
-- THERAPEUTIC FOCUS AREAS (stored as JSONB array in child_profiles)
-- ============================================================================
-- Example therapeutic_focus_areas:
-- [
--   "speech-articulation",
--   "social-awareness",
--   "fine-motor-skills"
-- ]
--
-- Supported values:
-- - speech-articulation
-- - language-development
-- - social-awareness
-- - emotional-regulation
-- - fine-motor-skills
-- - gross-motor-skills
-- - cognitive-development
-- - problem-solving
-- - memory-enhancement
-- - attention-building
