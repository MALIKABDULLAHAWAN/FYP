/**
 * Game AI Service - Provides encouragement and hints for games
 * Uses simple fallback messages instead of AI generation
 */

/**
 * Generate encouragement message based on performance
 */
export async function generateEncouragement(performanceText) {
  const messages = [
    "🌟 Amazing work! You're doing great!",
    "🎉 Fantastic performance! Keep it up!",
    "💪 You're crushing it! Well done!",
    "🚀 Excellent effort! You're improving!",
    "⭐ Outstanding! You're a superstar!",
    "🏆 Champion! That was impressive!",
    "✨ Brilliant! You're on fire!",
    "🎯 Perfect! You nailed it!",
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get personalized hint for a game prompt
 */
export async function getPersonalizedHint(gameCode, prompt, wrongAttempts) {
  const hints = [
    "💡 Take your time and think carefully!",
    "🤔 Look at all the options before choosing!",
    "👀 Pay close attention to the details!",
    "🎯 Focus on what the question is asking!",
    "✨ You're getting closer! Try again!",
    "🌟 Don't give up! You can do this!",
    "💪 One more try! You've got this!",
    "🚀 Keep going! You're almost there!",
  ];
  
  return hints[Math.floor(Math.random() * hints.length)];
}
