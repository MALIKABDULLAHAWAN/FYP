/**
 * Core type definitions for the Emoji Replacement System
 * Provides TypeScript-like interfaces using JSDoc for therapeutic image management
 */

/**
 * @typedef {Object} ImageAsset
 * @property {string} url - URL to the therapeutic photograph
 * @property {string} altText - Descriptive alt text (minimum 10 characters)
 * @property {number} width - Image width in pixels
 * @property {number} height - Image height in pixels
 * @property {AccessibilityData} accessibility - Accessibility compliance data
 * @property {TherapeuticMetadata} therapeuticContext - Therapeutic appropriateness data
 */

/**
 * @typedef {Object} AccessibilityData
 * @property {number} colorContrast - Color contrast ratio for therapeutic use
 * @property {boolean} screenReaderCompatible - Screen reader compatibility flag
 * @property {string} focusIndicator - Focus indicator style for keyboard navigation
 */

/**
 * @typedef {Object} TherapeuticMetadata
 * @property {boolean} ageAppropriate - Age appropriateness for ASD population
 * @property {boolean} culturallySensitive - Cultural sensitivity validation
 * @property {string} license - Usage license for therapeutic applications
 * @property {string[]} therapeuticGoals - Associated therapeutic objectives
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} suitable - Overall suitability for therapeutic use
 * @property {string[]} errors - Validation errors that prevent usage
 * @property {string[]} warnings - Validation warnings for review
 * @property {string} validatedAt - ISO timestamp of validation
 */

/**
 * @typedef {Object} EmojiMapping
 * @property {string} emoji - Original emoji character
 * @property {string} context - Therapeutic context (header, stat, navigation, etc.)
 * @property {string} category - Asset category (therapist, medical, ui, activity)
 * @property {string} subcategory - Specific asset type within category
 */

/**
 * @typedef {Object} GameMetadata
 * @property {string} id - Unique game identifier
 * @property {string} name - Display name for the game
 * @property {string[]} therapeuticGoals - Evidence-based therapeutic objectives
 * @property {number} difficultyLevel - Difficulty level (1-5)
 * @property {Reference[]} evidenceBase - Research references supporting the game
 * @property {Adaptation[]} adaptations - Available therapeutic adaptations
 */

/**
 * @typedef {Object} Reference
 * @property {string} title - Research paper or resource title
 * @property {string} authors - Authors of the reference
 * @property {string} journal - Publication journal or source
 * @property {number} year - Publication year
 * @property {string} doi - Digital Object Identifier
 */

/**
 * @typedef {Object} Adaptation
 * @property {string} name - Adaptation name
 * @property {string} description - Detailed description of the adaptation
 * @property {string[]} targetNeeds - Specific therapeutic needs addressed
 * @property {boolean} evidenceBased - Whether adaptation is research-supported
 */

/**
 * @typedef {Object} ChildProfile
 * @property {string} id - Unique child identifier
 * @property {string} fullName - Child's full name
 * @property {string} dateOfBirth - Date of birth (ISO format)
 * @property {string[]} therapeuticNeeds - Identified therapeutic needs
 * @property {boolean} needsVisualSupports - Requires visual support adaptations
 * @property {boolean} needsExtendedTime - Requires extended response time
 */

/**
 * @typedef {Object} EnhancedComponent
 * @property {React.Component} component - Enhanced React component
 * @property {EmojiMapping[]} replacements - Applied emoji replacements
 * @property {ValidationResult} validation - Component validation results
 * @property {string} enhancedAt - ISO timestamp of enhancement
 */

export {
  // Export types for JSDoc usage - actual exports are the typedef comments above
};