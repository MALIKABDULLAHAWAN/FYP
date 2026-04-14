# Game Sessions and Child Profiles Implementation

## Overview

This document describes the implementation of game session recording and child profile enhancements for the child-friendly UI enhancement feature.

## Database Schema Changes

### 1. Child Profile Extensions

The `patients_childprofile` table has been extended with the following fields:

#### New Fields

| Field | Type | Description |
|-------|------|-------------|
| `preferred_difficulty` | VARCHAR(20) | Child's preferred game difficulty (easy, medium, hard) |
| `therapeutic_focus_areas` | JSONB | Array of therapeutic goals (e.g., ["speech-articulation", "social-awareness"]) |
| `age_group` | VARCHAR(10) | Age group classification (3-5, 6-8, 9-12) |
| `accessibility_preferences` | JSONB | Accessibility settings (text_size_multiplier, animation_enabled, etc.) |
| `game_history` | JSONB | Array of recent game IDs |
| `progress_metrics` | JSONB | Progress tracking data (total_sessions, average_score, etc.) |

#### Migration

- File: `Backend/patients/migrations/0002_extend_child_profile.py`
- Adds all new fields with appropriate defaults

### 2. Game Sessions Table

A new `therapy_gamesession` table has been created to record game session data.

#### Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `child_id` | BIGINT | Foreign key to child_profile |
| `game_id` | BIGINT | Foreign key to game_image |
| `therapist_id` | BIGINT | Foreign key to user (therapist) |
| `started_at` | TIMESTAMP | Session start time |
| `completed_at` | TIMESTAMP | Session completion time (nullable) |
| `duration_seconds` | INTEGER | Total session duration |
| `performance_metrics` | JSONB | Performance data (score, accuracy, etc.) |
| `therapeutic_goals_targeted` | JSONB | Array of therapeutic goals |
| `child_engagement_level` | VARCHAR(20) | Engagement level (low, medium, high) |
| `therapist_notes` | TEXT | Therapist observations |
| `observations` | JSONB | Structured observations |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |

#### Indexes

- `(child_id, created_at)` - Query sessions by child
- `(game_id, created_at)` - Query sessions by game
- `(therapist_id, created_at)` - Query sessions by therapist
- `(started_at)` - Query sessions by date

#### Migration

- File: `Backend/therapy/migrations/0002_add_game_session.py`
- Creates the GameSession model with all fields and indexes

## Django Models

### ChildProfile Model

**Location:** `Backend/patients/models.py`

**New Methods:**

```python
def calculate_progress_metrics(self):
    """Calculate and update progress metrics based on game sessions"""
```

This method:
- Counts total game sessions
- Calculates average score across all sessions
- Counts completed games
- Calculates progress per therapeutic goal
- Updates the `progress_metrics` field

### GameSession Model

**Location:** `Backend/therapy/models.py`

**Key Fields:**
- `child` - ForeignKey to ChildProfile
- `game` - ForeignKey to GameImage
- `therapist` - ForeignKey to User
- `performance_metrics` - JSONB with score, accuracy, completion_percentage, difficulty_adjusted
- `observations` - JSONB with behavior_notes, progress_indicators, areas_for_improvement

**Methods:**

```python
def record_session_completion(self, performance_metrics=None, observations=None, therapist_notes=""):
    """Record session completion with performance data"""
```

This method:
- Sets `completed_at` timestamp
- Records performance metrics
- Records observations
- Calculates duration
- Updates child's progress metrics

## API Endpoints

### Game Sessions

#### List/Create Game Sessions
- **URL:** `/api/therapy/children/<child_id>/game-sessions`
- **Methods:** GET, POST
- **Permission:** IsAuthenticated, IsAdminOrTherapist

**GET Response:**
```json
[
  {
    "id": 1,
    "child_id": 5,
    "child_email": "child@example.com",
    "game_id": 10,
    "game_name": "Memory Match",
    "therapist_id": 2,
    "therapist_email": "therapist@example.com",
    "started_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:45:00Z",
    "duration_seconds": 900,
    "performance_metrics": {
      "score": 85,
      "accuracy": 0.92,
      "completion_percentage": 1.0,
      "difficulty_adjusted": false
    },
    "therapeutic_goals_targeted": ["memory-enhancement", "attention-building"],
    "child_engagement_level": "high",
    "therapist_notes": "Child was very engaged",
    "observations": {
      "behavior_notes": "Focused and attentive",
      "progress_indicators": ["improved_attention"],
      "areas_for_improvement": []
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:45:00Z"
  }
]
```

**POST Request:**
```json
{
  "game_id": 10,
  "therapeutic_goals_targeted": ["memory-enhancement", "attention-building"]
}
```

**POST Response:** (201 Created)
```json
{
  "id": 1,
  "child_id": 5,
  "child_email": "child@example.com",
  "game_id": 10,
  "game_name": "Memory Match",
  "therapist_id": 2,
  "therapist_email": "therapist@example.com",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "duration_seconds": 0,
  "performance_metrics": {},
  "therapeutic_goals_targeted": ["memory-enhancement", "attention-building"],
  "child_engagement_level": "medium",
  "therapist_notes": "",
  "observations": {},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get/Update Game Session
- **URL:** `/api/therapy/game-sessions/<session_id>`
- **Methods:** GET, POST
- **Permission:** IsAuthenticated, IsAdminOrTherapist

**GET Response:** Same as above

**POST Request (Record Completion):**
```json
{
  "completed_at": "2024-01-15T10:45:00Z",
  "duration_seconds": 900,
  "performance_metrics": {
    "score": 85,
    "accuracy": 0.92,
    "completion_percentage": 1.0,
    "difficulty_adjusted": false
  },
  "child_engagement_level": "high",
  "therapist_notes": "Child was very engaged and focused",
  "observations": {
    "behavior_notes": "Focused and attentive throughout",
    "progress_indicators": ["improved_attention", "better_memory"],
    "areas_for_improvement": ["needs_more_practice"]
  }
}
```

**POST Response:** (200 OK)
```json
{
  "id": 1,
  "child_id": 5,
  "child_email": "child@example.com",
  "game_id": 10,
  "game_name": "Memory Match",
  "therapist_id": 2,
  "therapist_email": "therapist@example.com",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:45:00Z",
  "duration_seconds": 900,
  "performance_metrics": {
    "score": 85,
    "accuracy": 0.92,
    "completion_percentage": 1.0,
    "difficulty_adjusted": false
  },
  "therapeutic_goals_targeted": ["memory-enhancement", "attention-building"],
  "child_engagement_level": "high",
  "therapist_notes": "Child was very engaged and focused",
  "observations": {
    "behavior_notes": "Focused and attentive throughout",
    "progress_indicators": ["improved_attention", "better_memory"],
    "areas_for_improvement": ["needs_more_practice"]
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:45:00Z"
}
```

### Child Progress Metrics

#### Get Child Progress Metrics
- **URL:** `/api/therapy/children/<child_id>/progress-metrics`
- **Method:** GET
- **Permission:** IsAuthenticated, IsAdminOrTherapist

**Response:**
```json
{
  "total_sessions": 15,
  "average_score": 82.5,
  "games_completed": 8,
  "therapeutic_goals_progress": {
    "speech-articulation": {
      "sessions_completed": 5,
      "average_performance": 85.0,
      "last_session_date": "2024-01-15T10:45:00Z"
    },
    "memory-enhancement": {
      "sessions_completed": 3,
      "average_performance": 78.0,
      "last_session_date": "2024-01-14T14:20:00Z"
    }
  }
}
```

## Serializers

### GameSessionSerializer
- Serializes GameSession model
- Includes related child, game, and therapist information
- Read-only fields: id, started_at, created_at, updated_at

### CreateGameSessionSerializer
- Validates child_profile_id and game_id
- Accepts optional therapeutic_goals_targeted

### RecordGameSessionSerializer
- Validates performance_metrics (score 0-100, accuracy 0-1, completion_percentage 0-1)
- Accepts optional observations and therapist_notes
- Validates child_engagement_level

### ChildProgressMetricsSerializer
- Returns calculated progress metrics
- All fields are read-only

## Usage Examples

### Creating a Game Session

```python
from therapy.models import GameSession, GameImage
from patients.models import ChildProfile
from django.contrib.auth import get_user_model

User = get_user_model()

child = ChildProfile.objects.get(id=5)
game = GameImage.objects.get(id=10)
therapist = User.objects.get(id=2)

session = GameSession.objects.create(
    child=child,
    game=game,
    therapist=therapist,
    therapeutic_goals_targeted=["memory-enhancement", "attention-building"],
)
```

### Recording Session Completion

```python
session.record_session_completion(
    performance_metrics={
        "score": 85,
        "accuracy": 0.92,
        "completion_percentage": 1.0,
        "difficulty_adjusted": False,
    },
    observations={
        "behavior_notes": "Child was engaged",
        "progress_indicators": ["improved_attention"],
        "areas_for_improvement": [],
    },
    therapist_notes="Great session today!",
)
```

### Calculating Child Progress

```python
child = ChildProfile.objects.get(id=5)
child.calculate_progress_metrics()

print(child.progress_metrics)
# {
#   "total_sessions": 15,
#   "average_score": 82.5,
#   "games_completed": 8,
#   "therapeutic_goals_progress": {...}
# }
```

## Data Structures

### Performance Metrics (JSONB)

```json
{
  "score": 85,
  "accuracy": 0.92,
  "completion_percentage": 1.0,
  "difficulty_adjusted": false,
  "time_per_task_seconds": [5, 4, 6]
}
```

### Observations (JSONB)

```json
{
  "behavior_notes": "Child was engaged and focused",
  "progress_indicators": ["improved_attention", "better_memory"],
  "areas_for_improvement": ["needs_more_practice_with_difficult_sounds"]
}
```

### Progress Metrics (JSONB in ChildProfile)

```json
{
  "total_sessions": 15,
  "average_score": 82.5,
  "games_completed": 8,
  "therapeutic_goals_progress": {
    "speech-articulation": {
      "sessions_completed": 5,
      "average_performance": 85.0,
      "last_session_date": "2024-01-15T10:45:00Z"
    }
  }
}
```

### Accessibility Preferences (JSONB in ChildProfile)

```json
{
  "text_size_multiplier": 1.2,
  "animation_enabled": true,
  "high_contrast_mode": false,
  "screen_reader_enabled": false,
  "reduced_motion": false
}
```

## Running Migrations

To apply the migrations:

```bash
cd Backend
python manage.py migrate patients
python manage.py migrate therapy
```

## Testing

The implementation includes:
- Model validation
- Serializer validation
- API endpoint testing
- Permission checking

To run tests:

```bash
cd Backend
python manage.py test therapy.tests
python manage.py test patients.tests
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **8.2:** Difficulty level management with tracking
- **8.3:** Real-time difficulty adjustment support
- **16.1:** Data persistence with immediate saving
- **16.2:** Session data recording with timestamp and performance metrics

## Future Enhancements

1. **Difficulty Adaptation Algorithm:** Implement automatic difficulty adjustment based on performance
2. **Progress Visualization:** Create charts and graphs for progress tracking
3. **Goal-Based Recommendations:** Recommend games based on therapeutic goals
4. **Session Analytics:** Detailed analytics on session effectiveness
5. **Export Functionality:** Export progress reports for therapists
