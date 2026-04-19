# Technical Design Document: Child-Friendly UI Enhancement

## Overview

This design document outlines the comprehensive technical implementation of the child-friendly UI enhancement for the Dhyan therapy application. The enhancement transforms the interface from a clinical, text-heavy design into a visually engaging, therapeutically appropriate experience for children ages 3-12 with autism spectrum disorder.

The design builds upon the existing emoji removal infrastructure and introduces three major systems:
1. **Child-Friendly Visual Design System** - Color palette, typography, components, and responsive layouts
2. **Therapeutic Sticker Management System** - Decorative background elements that enhance engagement without distraction
3. **Game Metadata & Image Database** - Comprehensive game information with therapeutic photographs and evidence-based data

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Pages: Dashboard, TherapistConsole, GameInterface, etc)   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────────┐ ┌▼──────────────┐
│ Visual Design│ │   Sticker   │ │   Game Meta  │
│   System     │ │  Management │ │   Database   │
└───────┬──────┘ └──┬──────────┘ └┬──────────────┘
        │           │             │
        └───────────┼─────────────┘
                    │
        ┌───────────▼────────────┐
        │  Emoji Replacement     │
        │  Service (Existing)    │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  Asset Management      │
        │  & Caching             │
        └────────────────────────┘
```

### Component Hierarchy

```
App
├── Layout
│   ├── Navigation (child-friendly)
│   ├── MainContent
│   │   ├── Dashboard
│   │   ├── TherapistConsole
│   │   │   └── GameSelector (with metadata display)
│   │   ├── GameInterface
│   │   │   ├── GameImage (therapeutic photograph)
│   │   │   ├── GameContent
│   │   │   └── ProgressIndicator
│   │   └── ProfilePage
│   └── StickerLayer (background decorations)
└── Toast/Notifications
```

### Service Architecture

**Visual Design Service**
- Color palette management
- Typography system
- Component styling
- Responsive breakpoint handling

**Sticker Management Service**
- Sticker asset loading and caching
- Placement strategy and positioning
- Rotation and variety management
- Accessibility validation

**Game Metadata Service** (extends existing)
- Game information CRUD operations
- Metadata validation and versioning
- Query and filtering system
- Evidence base management

**Image Management Service**
- Therapeutic photograph storage
- Image optimization and compression
- Attribution and licensing tracking
- Fallback asset handling



## UI/UX Design System

### Color Palette

**Primary Colors** (therapeutic and engaging)
- Warm Blue: `#4A90E2` - Calming, trust-building
- Soft Green: `#7ED321` - Growth, nature, positivity
- Warm Orange: `#F5A623` - Energy, enthusiasm, warmth
- Soft Purple: `#BD10E0` - Creativity, imagination

**Secondary Colors** (support and feedback)
- Success Green: `#2ECC71` - Positive reinforcement
- Warning Yellow: `#F1C40F` - Attention, caution
- Error Red: `#E74C3C` - Error states (with sufficient contrast)
- Neutral Gray: `#95A5A6` - Disabled states, secondary text

**Background Colors**
- Primary Background: `#FFFFFF` - Clean, non-overwhelming
- Secondary Background: `#F8F9FA` - Subtle differentiation
- Accent Background: `#E8F4F8` - Highlight important areas

**Accessibility Requirements**
- All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Color is never the only indicator of state or meaning
- Color combinations tested for color-blind accessibility

### Typography System

**Font Family**
- Primary: "Quicksand" (rounded, child-friendly sans-serif)
- Fallback: "Segoe UI", "Roboto", sans-serif
- Rationale: Rounded letterforms reduce visual harshness and are more engaging for children

**Font Sizes & Hierarchy**
- Display (Page Titles): 32px, weight 700, line-height 1.2
- Heading 1 (Section Titles): 24px, weight 700, line-height 1.3
- Heading 2 (Subsections): 20px, weight 600, line-height 1.3
- Body Text: 16px, weight 400, line-height 1.6
- Small Text (Labels, Captions): 14px, weight 400, line-height 1.5
- Minimum size: 16px for body text (supports accessibility and readability)

**Font Weights**
- Regular: 400 (body text, descriptions)
- Semi-bold: 600 (labels, emphasis)
- Bold: 700 (headings, important information)

### Component Design

**Buttons**
- Minimum size: 44x44px (touch target)
- Border radius: 12px (rounded, child-friendly)
- Padding: 12px 24px (comfortable spacing)
- States:
  - Default: Warm Blue background, white text
  - Hover: Darker shade with subtle scale (1.05x)
  - Focus: 3px outline in Warm Blue
  - Disabled: Gray background, reduced opacity
- Transitions: 200ms ease-in-out

**Cards**
- Border radius: 16px
- Box shadow: 0 2px 8px rgba(0,0,0,0.1)
- Padding: 20px
- Background: White with subtle hover lift effect
- Used for: Game selection, metadata display, progress tracking

**Navigation**
- Horizontal layout with icon + label
- Icons: 24x24px, child-friendly illustrations
- Labels: 14px, semi-bold
- Active state: Warm Blue background with rounded pill shape
- Touch-friendly spacing: 16px between items

**Input Fields**
- Border radius: 8px
- Border: 2px solid Soft Green
- Padding: 12px 16px
- Focus state: 3px outline in Warm Blue
- Placeholder text: Light gray, 14px
- Error state: Red border with error message below

**Progress Indicators**
- Circular progress: 60px diameter, 4px stroke width
- Linear progress: Full width, 8px height
- Color: Warm Blue to Success Green gradient
- Animation: Smooth transition over 300ms

### Sticker Placement Strategy

**Sticker Characteristics**
- Size: 60-120px (varies by placement)
- Opacity: 0.7-0.85 (visible but not overwhelming)
- Placement zones: Corners and edges of content areas
- Rotation: Random 0-15 degrees for natural feel

**Placement Locations**
- Top-left corner: 80px from edges
- Top-right corner: 80px from edges
- Bottom-left corner: 80px from edges
- Bottom-right corner: 80px from edges
- Between sections: Centered, 40px spacing

**Sticker Rotation Strategy**
- 5-7 different sticker designs per page type
- Rotation based on: page type, time of day, session count
- Ensures variety without overwhelming
- Stickers never repeat on same page load

**Accessibility Considerations**
- Stickers have `aria-hidden="true"` (decorative only)
- Stickers never obscure interactive elements
- Stickers don't interfere with keyboard navigation
- Stickers respect `prefers-reduced-motion` (fade instead of animate)

### Responsive Breakpoints

**Mobile (320px - 640px)**
- Single column layout
- Buttons: 100% width with 12px margins
- Font sizes: Reduced by 10% for body text
- Stickers: 50-80px size
- Touch targets: Minimum 48x48px

**Tablet (641px - 1024px)**
- Two column layout where appropriate
- Buttons: 48% width with 2% gap
- Font sizes: Standard
- Stickers: 80-100px size
- Touch targets: Minimum 44x44px

**Desktop (1025px+)**
- Multi-column layouts
- Buttons: Auto width with max-width constraints
- Font sizes: Standard
- Stickers: 100-120px size
- Touch targets: Minimum 44x44px (maintained for consistency)



## Game Metadata System

### Database Schema

**Games Table**
```
games {
  game_id: UUID (primary key)
  title: String (max 100 chars)
  description: String (max 500 chars)
  therapeutic_goals: Array<String> (e.g., ["speech-articulation", "social-awareness"])
  difficulty_level: Enum (Easy, Medium, Hard)
  age_range: Object {
    min_age: Integer (3-12)
    max_age: Integer (3-12)
    developmental_stage: String (e.g., "early-childhood", "middle-childhood")
  }
  image_url: String (URL to therapeutic photograph)
  image_attribution: Object {
    photographer: String
    license: String (e.g., "CC-BY-4.0")
    source: String
    usage_rights: String
  }
  evidence_base: Array<Object> {
    citation: String (APA format)
    publication_year: Integer
    effectiveness_rating: Float (0-1)
    sample_size: Integer
    study_type: String (e.g., "RCT", "observational")
  }
  created_at: Timestamp
  updated_at: Timestamp
  version: Integer (for audit trail)
  is_active: Boolean
}
```

**Game Sessions Table**
```
game_sessions {
  session_id: UUID (primary key)
  child_id: UUID (foreign key)
  game_id: UUID (foreign key)
  therapist_id: UUID (foreign key)
  started_at: Timestamp
  completed_at: Timestamp
  duration_seconds: Integer
  performance_metrics: Object {
    score: Integer
    accuracy: Float (0-1)
    completion_percentage: Float (0-1)
    difficulty_adjusted: Boolean
  }
  therapeutic_goals_targeted: Array<String>
  notes: String (therapist observations)
  created_at: Timestamp
}
```

**Child Profiles Enhancement**
```
child_profiles {
  child_id: UUID (primary key)
  ... (existing fields)
  preferred_difficulty: Enum (Easy, Medium, Hard)
  therapeutic_focus_areas: Array<String>
  age_group: String (3-5, 6-8, 9-12)
  accessibility_preferences: Object {
    text_size_multiplier: Float (1.0-2.0)
    animation_enabled: Boolean
    high_contrast_mode: Boolean
    screen_reader_enabled: Boolean
  }
  game_history: Array<UUID> (recent game_ids)
  progress_metrics: Object {
    total_sessions: Integer
    average_score: Float
    games_completed: Integer
    therapeutic_goals_progress: Object
  }
}
```

### Image Storage and Optimization

**Image Management Pipeline**
1. **Upload**: Therapist uploads therapeutic photograph
2. **Validation**: System verifies:
   - Image is real photograph (not AI-generated)
   - Meets therapeutic appropriateness criteria
   - Proper licensing and attribution
3. **Optimization**:
   - Convert to WebP format (primary) with JPEG fallback
   - Generate responsive sizes: 320px, 640px, 1024px widths
   - Compress to <200KB for mobile, <500KB for desktop
   - Generate thumbnail (120px) for preview
4. **Storage**: Store in CDN with cache headers
5. **Attribution**: Embed metadata in image EXIF data

**Image URL Structure**
```
/assets/games/{game_id}/image-{size}.{format}
/assets/games/{game_id}/thumbnail.webp
```

**Supported Formats**
- Primary: WebP (modern browsers)
- Fallback: JPEG (older browsers)
- Thumbnail: WebP or PNG

### Metadata Fields and Validation

**Validation Rules**

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| title | String | 1-100 chars, no special chars | Yes |
| description | String | 1-500 chars | Yes |
| therapeutic_goals | Array | Min 1, max 5 items from predefined list | Yes |
| difficulty_level | Enum | Easy, Medium, Hard | Yes |
| age_range.min_age | Integer | 3-12, <= max_age | Yes |
| age_range.max_age | Integer | 3-12, >= min_age | Yes |
| image_url | String | Valid URL, accessible, <5MB | Yes |
| image_attribution | Object | All fields required if image provided | Yes |
| evidence_base | Array | Min 1 citation, valid APA format | Yes |

**Therapeutic Goals Taxonomy**
- Speech Articulation
- Language Development
- Social Awareness
- Emotional Regulation
- Fine Motor Skills
- Gross Motor Skills
- Cognitive Development
- Problem Solving
- Memory Enhancement
- Attention Building

### Query and Filtering System

**Query Interface**
```javascript
// Filter by age and difficulty
getGamesByAgeAndDifficulty(childAge, difficulty)

// Filter by therapeutic goals
getGamesByTherapeuticGoals(goalArray)

// Combined filtering
getGamesByMultipleCriteria({
  ageRange: [min, max],
  difficulty: 'Medium',
  therapeuticGoals: ['speech-articulation'],
  isActive: true
})

// Search by title or description
searchGames(searchTerm)

// Get recommended games for child
getRecommendedGames(childId, limit = 5)
```

**Filtering Logic**
- Age appropriateness: Exact match within age_range
- Difficulty: Exact match or range (Easy, Easy-Medium, etc.)
- Therapeutic goals: At least one match required
- Active status: Only return is_active = true
- Sorting: By relevance, recency, or effectiveness rating



## Implementation Strategy

### Emoji Removal Approach

**Leveraging Existing Infrastructure**
The existing EmojiReplacer service provides:
- Emoji detection and classification
- Context-aware replacement mapping
- Therapeutic asset management
- Accessibility validation

**Integration Points**
1. **Component Processing**: All components pass through EmojiReplacer during render
2. **Asset Substitution**: Emojis replaced with:
   - SVG icons (for UI elements)
   - Therapeutic illustrations (for decorative elements)
   - Text labels (for accessibility)
3. **Fallback Handling**: ErrorHandlingService provides alternatives if assets fail to load

**Verification Strategy**
- Automated scanning of component code for emoji characters
- Runtime detection of emoji in rendered output
- Accessibility audit to ensure replacements are properly labeled

### Component Refactoring Plan

**Phase 1: Visual Design System (Week 1-2)**
1. Create `DesignSystemProvider` component
   - Provides color palette, typography, spacing tokens
   - Uses React Context for theme management
2. Create reusable components:
   - `ChildFriendlyButton` - Rounded, accessible buttons
   - `ChildFriendlyCard` - Game cards with metadata
   - `ProgressIndicator` - Visual progress tracking
   - `ResponsiveContainer` - Breakpoint-aware layout
3. Update existing components:
   - Navigation: Add icons, improve spacing
   - Dashboard: Apply new color palette and typography
   - TherapistConsole: Enhance with game metadata display

**Phase 2: Sticker Management System (Week 2-3)**
1. Create `StickerManager` service
   - Load sticker assets from CDN
   - Manage sticker rotation and placement
   - Handle responsive sizing
2. Create `StickerLayer` component
   - Renders stickers in background
   - Respects accessibility preferences
   - Handles animations with motion preferences
3. Integrate into Layout component
   - Add sticker layer behind main content
   - Ensure stickers don't interfere with interactions

**Phase 3: Game Metadata System (Week 3-4)**
1. Extend `GameMetadataService`
   - Add database schema implementation
   - Implement CRUD operations
   - Add query and filtering methods
2. Create `GameImageManager` service
   - Handle image upload and optimization
   - Manage CDN storage and caching
   - Track attribution and licensing
3. Create UI components:
   - `GameMetadataDisplay` - Show game information
   - `GameSelector` - Browse and filter games
   - `GameCard` - Display game with image and metadata

**Phase 4: Integration and Testing (Week 4-5)**
1. Integrate all systems into existing pages
2. Update TherapistConsole with enhanced game selection
3. Update GameInterface with therapeutic photographs
4. Comprehensive testing and refinement

### Sticker Integration

**Sticker Asset Management**
```
/public/assets/stickers/
├── animals/
│   ├── butterfly.svg
│   ├── bird.svg
│   └── ...
├── nature/
│   ├── flower.svg
│   ├── tree.svg
│   └── ...
└── objects/
    ├── star.svg
    ├── heart.svg
    └── ...
```

**Sticker Selection Algorithm**
```javascript
function selectStickers(pageType, sessionCount) {
  const availableStickers = getStickersForPageType(pageType);
  const stickerCount = 3 + (sessionCount % 2); // 3-4 stickers
  
  // Deterministic but varied selection
  const seed = pageType + Math.floor(sessionCount / 10);
  const shuffled = shuffle(availableStickers, seed);
  
  return shuffled.slice(0, stickerCount);
}
```

**Placement Algorithm**
```javascript
function calculateStickerPositions(stickers, containerWidth, containerHeight) {
  const positions = [];
  const zones = [
    { x: 20, y: 20 },      // top-left
    { x: 80, y: 20 },      // top-right
    { x: 20, y: 80 },      // bottom-left
    { x: 80, y: 80 }       // bottom-right
  ];
  
  stickers.forEach((sticker, index) => {
    const zone = zones[index % zones.length];
    const x = (containerWidth * zone.x) / 100;
    const y = (containerHeight * zone.y) / 100;
    const rotation = Math.random() * 15 - 7.5; // -7.5 to +7.5 degrees
    
    positions.push({ x, y, rotation, opacity: 0.75 });
  });
  
  return positions;
}
```

### Game Metadata API Endpoints

**REST API Design**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/games` | List all games with filtering |
| GET | `/api/games/:gameId` | Get specific game metadata |
| POST | `/api/games` | Create new game (therapist only) |
| PUT | `/api/games/:gameId` | Update game metadata |
| DELETE | `/api/games/:gameId` | Soft delete game |
| GET | `/api/games/recommended/:childId` | Get recommended games for child |
| GET | `/api/games/search?q=term` | Search games by title/description |
| POST | `/api/games/:gameId/image` | Upload game image |
| GET | `/api/games/:gameId/image/:size` | Get optimized image |
| POST | `/api/sessions` | Record game session |
| GET | `/api/sessions/:childId` | Get child's session history |

**Query Parameters**
```
GET /api/games?
  age_min=6&
  age_max=8&
  difficulty=Medium&
  goals=speech-articulation,social-awareness&
  sort=effectiveness&
  limit=10&
  offset=0
```

### Image Optimization Pipeline

**Processing Steps**
1. **Validation**
   - Check file size (<5MB)
   - Verify MIME type (image/jpeg, image/png, image/webp)
   - Scan for therapeutic appropriateness
   - Verify licensing and attribution

2. **Optimization**
   - Convert to WebP (primary format)
   - Generate responsive sizes:
     - Thumbnail: 120x120px
     - Mobile: 320x320px
     - Tablet: 640x640px
     - Desktop: 1024x1024px
   - Compress each size to target file size

3. **Storage**
   - Upload to CDN with cache headers
   - Set cache-control: public, max-age=31536000 (1 year)
   - Store metadata in database

4. **Delivery**
   - Use `<picture>` element with WebP + JPEG fallback
   - Implement lazy loading for off-screen images
   - Use srcset for responsive images

**Image Optimization Configuration**
```javascript
const imageOptimizationConfig = {
  formats: ['webp', 'jpeg'],
  sizes: [
    { width: 120, quality: 85 },   // thumbnail
    { width: 320, quality: 80 },   // mobile
    { width: 640, quality: 80 },   // tablet
    { width: 1024, quality: 75 }   // desktop
  ],
  maxFileSize: 5 * 1024 * 1024,    // 5MB
  targetFileSize: {
    thumbnail: 20 * 1024,          // 20KB
    mobile: 100 * 1024,            // 100KB
    tablet: 200 * 1024,            // 200KB
    desktop: 300 * 1024            // 300KB
  }
};
```



## Data Models

### Game Metadata Structure

```typescript
interface GameMetadata {
  // Identification
  game_id: string;                    // UUID
  title: string;                      // Max 100 chars
  description: string;                // Max 500 chars
  
  // Therapeutic Information
  therapeutic_goals: string[];        // Array of goal identifiers
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  age_range: {
    min_age: number;                  // 3-12
    max_age: number;                  // 3-12
    developmental_stage: string;      // e.g., "early-childhood"
  };
  
  // Visual Assets
  image_url: string;                  // URL to therapeutic photograph
  image_attribution: {
    photographer: string;
    license: string;                  // e.g., "CC-BY-4.0"
    source: string;
    usage_rights: string;
  };
  
  // Evidence Base
  evidence_base: EvidenceReference[];
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  version: number;
  is_active: boolean;
}

interface EvidenceReference {
  citation: string;                   // APA format
  publication_year: number;
  effectiveness_rating: number;       // 0-1
  sample_size: number;
  study_type: 'RCT' | 'observational' | 'case-study';
  url?: string;                       // Link to study
}
```

### Child Profile Enhancements

```typescript
interface ChildProfile {
  // Existing fields
  child_id: string;
  name: string;
  age: number;
  diagnosis: string;
  
  // New fields for child-friendly UI
  preferred_difficulty: 'Easy' | 'Medium' | 'Hard';
  therapeutic_focus_areas: string[];  // Array of therapeutic goals
  age_group: '3-5' | '6-8' | '9-12';
  
  // Accessibility Preferences
  accessibility_preferences: {
    text_size_multiplier: number;     // 1.0-2.0
    animation_enabled: boolean;
    high_contrast_mode: boolean;
    screen_reader_enabled: boolean;
    reduced_motion: boolean;
  };
  
  // Game History & Progress
  game_history: string[];             // Recent game_ids
  progress_metrics: {
    total_sessions: number;
    average_score: number;            // 0-100
    games_completed: number;
    therapeutic_goals_progress: {
      [goal: string]: {
        sessions_completed: number;
        average_performance: number;
        last_session_date: Date;
      };
    };
  };
  
  // Preferences
  preferred_sticker_style?: string;   // e.g., "animals", "nature"
  color_preference?: string;          // Preferred primary color
}
```

### Session Tracking

```typescript
interface GameSession {
  // Identification
  session_id: string;                 // UUID
  child_id: string;
  game_id: string;
  therapist_id: string;
  
  // Timing
  started_at: Date;
  completed_at?: Date;
  duration_seconds: number;
  
  // Performance Metrics
  performance_metrics: {
    score: number;                    // 0-100
    accuracy: number;                 // 0-1
    completion_percentage: number;    // 0-1
    difficulty_adjusted: boolean;     // Was difficulty changed during session?
    time_per_task_seconds: number[];  // Array of times for each task
  };
  
  // Therapeutic Data
  therapeutic_goals_targeted: string[];
  child_engagement_level: 'low' | 'medium' | 'high';
  
  // Therapist Notes
  therapist_notes: string;
  observations: {
    behavior_notes: string;
    progress_indicators: string[];
    areas_for_improvement: string[];
  };
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}
```

### Progress Metrics

```typescript
interface ProgressMetrics {
  // Overall Progress
  total_sessions: number;
  total_playtime_minutes: number;
  average_session_duration_minutes: number;
  
  // Performance Tracking
  average_score: number;              // 0-100
  score_trend: number[];              // Last 10 scores
  accuracy_trend: number[];           // Last 10 accuracy values
  
  // Goal Progress
  therapeutic_goals_progress: {
    [goal: string]: {
      sessions_completed: number;
      average_performance: number;    // 0-100
      improvement_percentage: number; // vs. first session
      last_session_date: Date;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  
  // Game-Specific Progress
  games_completed: number;
  games_in_progress: number;
  favorite_games: string[];           // Top 3 by engagement
  
  // Difficulty Progression
  difficulty_progression: {
    current_difficulty: 'Easy' | 'Medium' | 'Hard';
    recommended_difficulty: 'Easy' | 'Medium' | 'Hard';
    difficulty_changes: Array<{
      date: Date;
      from: string;
      to: string;
      reason: string;
    }>;
  };
  
  // Engagement Metrics
  engagement_score: number;           // 0-100
  consistency_score: number;          // 0-100 (based on session frequency)
  
  // Metadata
  calculated_at: Date;
  period: 'weekly' | 'monthly' | 'all-time';
}
```

### Visual Design Tokens

```typescript
interface DesignTokens {
  // Colors
  colors: {
    primary: {
      blue: '#4A90E2';
      green: '#7ED321';
      orange: '#F5A623';
      purple: '#BD10E0';
    };
    secondary: {
      success: '#2ECC71';
      warning: '#F1C40F';
      error: '#E74C3C';
      neutral: '#95A5A6';
    };
    background: {
      primary: '#FFFFFF';
      secondary: '#F8F9FA';
      accent: '#E8F4F8';
    };
  };
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Quicksand';
      fallback: 'Segoe UI, Roboto, sans-serif';
    };
    sizes: {
      display: '32px';
      h1: '24px';
      h2: '20px';
      body: '16px';
      small: '14px';
    };
    weights: {
      regular: 400;
      semibold: 600;
      bold: 700;
    };
  };
  
  // Spacing
  spacing: {
    xs: '4px';
    sm: '8px';
    md: '16px';
    lg: '24px';
    xl: '32px';
  };
  
  // Border Radius
  borderRadius: {
    small: '8px';
    medium: '12px';
    large: '16px';
    full: '9999px';
  };
  
  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)';
    medium: '0 2px 8px rgba(0,0,0,0.1)';
    large: '0 4px 16px rgba(0,0,0,0.15)';
  };
  
  // Breakpoints
  breakpoints: {
    mobile: '320px';
    tablet: '641px';
    desktop: '1025px';
  };
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Emoji Removal

*For any* rendered component in the application, the output SHALL NOT contain any emoji characters.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Emoji Replacement with Appropriate Alternatives

*For any* emoji detected in component code, the system SHALL replace it with an appropriate UI element, icon, or text label that maintains semantic meaning.

**Validates: Requirements 1.5**

### Property 3: Minimum Font Size for Body Text

*For any* body text element in the application, the computed font-size SHALL be >= 16px.

**Validates: Requirements 2.3**

### Property 4: Button Design with Rounded Corners

*For any* interactive button element, the border-radius SHALL be > 0px, and the element SHALL have defined hover and focus states with visual feedback.

**Validates: Requirements 2.4**

### Property 5: Touch Target Minimum Size

*For any* interactive element (button, link, input), the computed dimensions SHALL be >= 44x44px.

**Validates: Requirements 2.5**

### Property 6: Stickers Do Not Obscure Content

*For any* sticker element, it SHALL be positioned in a background layer (z-index < main content) and SHALL NOT overlap with interactive elements or primary content areas.

**Validates: Requirements 3.2**

### Property 7: Sticker Variety Across Page Loads

*For any* page type, when loaded multiple times within a session, the set of displayed stickers SHALL vary (at least 2 different stickers shown across 3 consecutive loads).

**Validates: Requirements 3.3**

### Property 8: Sticker Visual Clarity

*For any* sticker element, the opacity SHALL be < 1.0, and the contrast ratio between foreground text and background (including sticker) SHALL meet WCAG AA standards (4.5:1 for normal text).

**Validates: Requirements 3.4**

### Property 9: Sticker Responsiveness Across Viewports

*For any* sticker element, when viewport size changes, the sticker SHALL scale proportionally and reposition to maintain appropriate placement without distortion.

**Validates: Requirements 3.5**

### Property 10: Stickers Are Decorative Only

*For any* sticker element, clicking or interacting with it SHALL NOT trigger any game logic, navigation, or state changes.

**Validates: Requirements 3.6**

### Property 11: Game Metadata Completeness

*For any* game in the database, the metadata object SHALL include all required fields: game_id, title, description, therapeutic_goals, difficulty_level, age_range, image_url, image_attribution, and evidence_base.

**Validates: Requirements 4.2, 6.1**

### Property 12: Game Image Display with Attribution

*For any* game displayed in the UI, the associated therapeutic photograph SHALL be visible, and attribution information (photographer, license, source) SHALL be displayed.

**Validates: Requirements 4.3, 5.3**

### Property 13: Evidence Base Information Presence

*For any* game reviewed by a therapist, the evidence base information SHALL include at least one research citation in APA format with publication year and effectiveness rating.

**Validates: Requirements 4.4, 10.1, 10.2**

### Property 14: Age Appropriateness Validation

*For any* game selection attempt, the system SHALL validate that the child's age falls within the game's age_range, and SHALL prevent selection if not age-appropriate.

**Validates: Requirements 4.5, 7.1, 7.2**

### Property 15: Image Validation and Fallback

*For any* game image that fails to load, the system SHALL display an appropriate fallback image, and the fallback SHALL meet the same therapeutic appropriateness criteria.

**Validates: Requirements 5.2, 5.4**

### Property 16: Image Cache Quality Preservation

*For any* cached game image, the cached version SHALL be identical to the original in terms of dimensions, format, and therapeutic appropriateness criteria.

**Validates: Requirements 5.5**

### Property 17: Metadata Persistence Round Trip

*For any* game metadata created or updated, storing and then retrieving the metadata SHALL result in an identical object with all fields preserved.

**Validates: Requirements 6.2**

### Property 18: Metadata Query Filtering

*For any* query with filters (age_range, difficulty_level, therapeutic_goals), all returned games SHALL match the specified criteria, and no matching games SHALL be excluded.

**Validates: Requirements 6.3**

### Property 19: Metadata Version History

*For any* metadata update, the version number SHALL increment by 1, and the previous version SHALL be retrievable from the audit trail.

**Validates: Requirements 6.4**

### Property 20: Metadata Export Formats

*For any* metadata export operation, the exported data SHALL be valid JSON or CSV (depending on format requested) and SHALL be parseable back into the original metadata structure.

**Validates: Requirements 6.5**

### Property 21: Developmental Stage Consideration

*For any* age appropriateness validation, the system SHALL consider both chronological age and developmental stage, and SHALL reject games if either criterion is not met.

**Validates: Requirements 7.3, 7.4**

### Property 22: Difficulty Level Display

*For any* game displayed in the UI, the difficulty level (Easy, Medium, Hard) SHALL be clearly visible and unambiguous.

**Validates: Requirements 8.1**

### Property 23: Difficulty Recommendation Based on Progress

*For any* child with completed game sessions, the system SHALL recommend a difficulty level based on their average performance score and trend.

**Validates: Requirements 8.2, 8.3**

### Property 24: Real-Time Difficulty Adjustment

*For any* active game session, the difficulty level SHALL be adjustable during gameplay, and the adjustment SHALL take effect immediately.

**Validates: Requirements 8.4**

### Property 25: Therapeutic Goals Display

*For any* game displayed, the specific therapeutic objectives (e.g., "Improve speech articulation") SHALL be visible and clearly labeled.

**Validates: Requirements 9.1, 9.3**

### Property 26: Evidence References in Goals Display

*For any* therapeutic goal displayed, supporting research citations SHALL be present and properly formatted.

**Validates: Requirements 9.2**

### Property 27: Session Report Goal Documentation

*For any* completed game session, the session report SHALL document all therapeutic goals that were targeted during that session.

**Validates: Requirements 9.4**

### Property 28: Success Rates and Outcome Data Display

*For any* game reviewed by a therapist, success rates and outcome data from clinical studies SHALL be displayed if available.

**Validates: Requirements 10.3, 10.4**

### Property 29: Touch Target Sizing on Tablet

*For any* interactive element on a tablet viewport (641px - 1024px), the minimum dimension SHALL be >= 44px.

**Validates: Requirements 11.1**

### Property 30: Spacing on Desktop Viewport

*For any* interactive element on a desktop viewport (>= 1025px), the padding and margins SHALL provide comfortable spacing (>= 16px).

**Validates: Requirements 11.2**

### Property 31: Screen Reader Accessibility

*For any* interactive element, an appropriate ARIA label or description SHALL be present and SHALL be child-friendly and clear.

**Validates: Requirements 12.1**

### Property 32: Keyboard Navigation Support

*For any* interactive element, it SHALL be reachable via keyboard navigation, and SHALL have a visible focus indicator.

**Validates: Requirements 12.2**

### Property 33: Color Contrast Compliance

*For any* text element, the contrast ratio between text color and background color SHALL meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 12.3**

### Property 34: Text Resizing Support

*For any* text element, when text size is increased up to 200%, the layout SHALL remain functional and readable without horizontal scrolling.

**Validates: Requirements 12.4**

### Property 35: Reduced Motion Preference Respect

*For any* animation, when the user has set prefers-reduced-motion to reduce, animations SHALL be disabled or replaced with non-animated transitions.

**Validates: Requirements 12.5**

### Property 36: Page Load Time Performance

*For any* page load, the time to interactive SHALL be <= 2 seconds on a standard broadband connection (3 Mbps).

**Validates: Requirements 13.1**

### Property 37: Image Optimization

*For any* game image, the file size SHALL be <= 300KB for desktop and <= 100KB for mobile, and the format SHALL be WebP or JPEG.

**Validates: Requirements 13.2**

### Property 38: Interactive Element Response Time

*For any* user interaction (click, tap, input), the system response time SHALL be <= 100ms.

**Validates: Requirements 13.3**

### Property 39: Animation Frame Rate

*For any* sticker animation, the frame rate SHALL be maintained at 60fps without stuttering or frame drops.

**Validates: Requirements 13.4**

### Property 40: Game Card Display Completeness

*For any* game card in the therapist console, it SHALL display the game image, title, and key metadata (difficulty, age range, therapeutic goals).

**Validates: Requirements 14.1**

### Property 41: Game Filtering Functionality

*For any* filter applied in the therapist console (by age, difficulty, therapeutic goals), the displayed games SHALL match all specified criteria.

**Validates: Requirements 14.2**

### Property 42: Selection Confirmation Display

*For any* game selection, a confirmation dialog SHALL display the game's metadata and require explicit confirmation before proceeding.

**Validates: Requirements 14.3**

### Property 43: Session Display with Progress Tracking

*For any* active session, the session display SHALL show the current game and real-time progress updates.

**Validates: Requirements 14.4**

### Property 44: Game Interface Image Display

*For any* game start, the game image SHALL be displayed prominently, and clear instructions SHALL be present.

**Validates: Requirements 15.1**

### Property 45: Progress Indicator Updates

*For any* active game, the progress indicator SHALL update in real-time to reflect advancement through the game.

**Validates: Requirements 15.2**

### Property 46: Metadata Persistence Immediacy

*For any* metadata creation or update, the data SHALL be persisted to the database within 100ms.

**Validates: Requirements 16.1**

### Property 47: Session Data Recording

*For any* completed game session, the session data (timestamp, performance metrics, targeted goals) SHALL be recorded in the database.

**Validates: Requirements 16.2**

### Property 48: Cross-Device Data Consistency

*For any* data accessed from different devices, the data SHALL be identical and up-to-date across all devices.

**Validates: Requirements 16.3**

### Property 49: Offline Data Caching and Synchronization

*For any* data created or modified while offline, the data SHALL be cached locally, and SHALL be synchronized to the server when connection is restored.

**Validates: Requirements 16.4**



## Error Handling

### Image Loading Failures

**Scenario**: Game image fails to load from CDN

**Handling Strategy**:
1. Detect image load failure (onerror event)
2. Log error with context (game_id, image_url, timestamp)
3. Select appropriate fallback image from ErrorHandlingService
4. Display fallback with visual indicator (optional "image unavailable" label)
5. Retry loading original image after 5 seconds (max 3 retries)
6. Alert therapist if persistent failure after retries

**Fallback Image Selection**:
- Primary: Generic therapeutic illustration matching game type
- Secondary: Solid color background with game icon
- Tertiary: Placeholder with text description

### Metadata Validation Failures

**Scenario**: Game metadata fails validation during creation/update

**Handling Strategy**:
1. Identify validation error (missing field, invalid format, etc.)
2. Return detailed error message to user
3. Highlight problematic field in UI
4. Provide suggestions for correction
5. Log validation failure for audit trail
6. Prevent save until all validations pass

**Validation Error Messages** (child-friendly):
- "Please add a game title" (instead of "title field required")
- "Age range must be between 3 and 12" (instead of "invalid age_range")
- "Please choose at least one therapeutic goal" (instead of "therapeutic_goals array empty")

### Age Appropriateness Validation Failures

**Scenario**: Child attempts to play age-inappropriate game

**Handling Strategy**:
1. Check child age against game age_range
2. If not appropriate, prevent selection
3. Display message: "This game is for older/younger children"
4. Suggest age-appropriate alternatives
5. Log attempt for therapist review
6. Allow therapist override with confirmation

### Sticker Loading Failures

**Scenario**: Sticker asset fails to load

**Handling Strategy**:
1. Detect sticker load failure
2. Remove failed sticker from display
3. Attempt to load alternative sticker
4. If all stickers fail, continue without stickers (graceful degradation)
5. Log sticker failures for monitoring
6. Alert admin if sticker failure rate exceeds threshold

### Database Connection Failures

**Scenario**: Database becomes unavailable

**Handling Strategy**:
1. Detect connection failure
2. Switch to offline mode
3. Cache all operations locally
4. Display message: "Working offline - changes will sync when connected"
5. Queue all mutations for sync
6. Attempt reconnection every 5 seconds
7. Sync queued operations when connection restored

### Performance Degradation

**Scenario**: Page load time exceeds 2 seconds

**Handling Strategy**:
1. Implement progressive loading:
   - Load critical content first (game title, basic metadata)
   - Load images asynchronously
   - Load stickers last
2. Show loading indicators for non-critical content
3. Cache aggressively to improve subsequent loads
4. Alert admin if performance consistently poor
5. Implement lazy loading for off-screen content

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test specific game metadata with known values
- Test error scenarios (missing images, invalid data)
- Test accessibility features with specific configurations
- Test integration points between services

**Property-Based Tests**: Verify universal properties across all inputs
- Test emoji removal across all possible component types
- Test metadata persistence with randomly generated data
- Test filtering with various combinations of criteria
- Test responsive design across viewport sizes
- Test accessibility compliance with various configurations

### Unit Testing Strategy

**Test Categories**:

1. **Component Tests**
   - ChildFriendlyButton: Renders with correct styles, responds to clicks
   - GameCard: Displays all metadata fields, handles missing images
   - StickerLayer: Renders stickers, respects accessibility preferences
   - ProgressIndicator: Updates correctly, displays accurate progress

2. **Service Tests**
   - GameMetadataService: CRUD operations, validation, filtering
   - StickerManager: Sticker selection, placement, rotation
   - ImageManager: Upload, optimization, caching
   - EmojiReplacer: Emoji detection, replacement, verification

3. **Integration Tests**
   - TherapistConsole: Game selection flow, metadata display
   - GameInterface: Image loading, progress tracking, difficulty adjustment
   - ChildProfile: Age validation, preference management

4. **Accessibility Tests**
   - Color contrast verification
   - Keyboard navigation
   - Screen reader compatibility
   - Text resizing support

5. **Performance Tests**
   - Page load time measurement
   - Image optimization verification
   - Animation frame rate monitoring
   - Response time measurement

### Property-Based Testing Configuration

**Testing Framework**: fast-check (JavaScript) or equivalent

**Test Structure**:
```javascript
// Example property test
describe('Emoji Removal Property', () => {
  it('should remove all emojis from rendered components', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (componentCode) => {
          const result = processComponent(componentCode);
          const hasEmoji = /\p{Emoji}/u.test(result);
          return !hasEmoji;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage**:

| Property | Test Library | Min Iterations | Tag |
|----------|--------------|-----------------|-----|
| Emoji Removal | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 1: Complete Emoji Removal |
| Font Size Compliance | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 3: Minimum Font Size |
| Touch Target Size | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 5: Touch Target Minimum Size |
| Metadata Persistence | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 17: Metadata Persistence Round Trip |
| Query Filtering | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 18: Metadata Query Filtering |
| Color Contrast | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 33: Color Contrast Compliance |
| Responsive Design | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 29-30: Responsive Sizing |
| Sticker Variety | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 7: Sticker Variety |
| Age Validation | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 14: Age Appropriateness Validation |
| Image Optimization | fast-check | 100 | Feature: ui-enhancement-children-friendly, Property 37: Image Optimization |

### Test Data Generators

**Game Metadata Generator**:
```javascript
const gameMetadataArbitrary = fc.record({
  game_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  therapeutic_goals: fc.array(
    fc.sampled(...therapeuticGoalsList),
    { minLength: 1, maxLength: 5 }
  ),
  difficulty_level: fc.sampled('Easy', 'Medium', 'Hard'),
  age_range: fc.record({
    min_age: fc.integer({ min: 3, max: 10 }),
    max_age: fc.integer({ min: 4, max: 12 })
  }),
  image_url: fc.webUrl(),
  image_attribution: fc.record({
    photographer: fc.string({ minLength: 1, maxLength: 100 }),
    license: fc.sampled('CC-BY-4.0', 'CC-BY-SA-4.0', 'proprietary'),
    source: fc.string({ minLength: 1, maxLength: 100 })
  }),
  evidence_base: fc.array(evidenceReferenceArbitrary, { minLength: 1 })
});
```

**Child Profile Generator**:
```javascript
const childProfileArbitrary = fc.record({
  child_id: fc.uuid(),
  age: fc.integer({ min: 3, max: 12 }),
  preferred_difficulty: fc.sampled('Easy', 'Medium', 'Hard'),
  accessibility_preferences: fc.record({
    text_size_multiplier: fc.float({ min: 1.0, max: 2.0 }),
    animation_enabled: fc.boolean(),
    high_contrast_mode: fc.boolean(),
    screen_reader_enabled: fc.boolean()
  })
});
```

### Accessibility Testing

**Automated Checks**:
- axe-core for accessibility violations
- WAVE for color contrast
- Lighthouse for accessibility score

**Manual Testing**:
- Screen reader testing (NVDA, JAWS)
- Keyboard navigation testing
- Color blindness simulation
- Text resizing verification

### Performance Testing

**Metrics to Monitor**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 2s
- Image load time: < 500ms per image

**Testing Tools**:
- Lighthouse CI for automated performance testing
- WebPageTest for detailed performance analysis
- Chrome DevTools for local testing

### Test Execution Plan

**Phase 1: Unit Tests** (Week 1-2)
- Component tests for all new components
- Service tests for metadata and sticker management
- Accessibility tests for color contrast and keyboard navigation

**Phase 2: Property-Based Tests** (Week 2-3)
- Emoji removal properties
- Metadata persistence and filtering
- Responsive design properties
- Age validation properties

**Phase 3: Integration Tests** (Week 3-4)
- End-to-end flows (game selection, play, progress tracking)
- Cross-service integration
- Error handling scenarios

**Phase 4: Performance & Accessibility** (Week 4-5)
- Performance testing and optimization
- Accessibility audit and remediation
- Load testing with multiple concurrent users

