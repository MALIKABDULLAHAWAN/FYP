import { apiFetch } from "../api/client";

/**
 * BuddyBrainService
 * 
 * Provides "cute", personality-driven responses for the child companion.
 * Manages state like "last game played" to make responses feel more alive.
 */

class BuddyBrainService {
  constructor() {
    this.memory = {
      lastGame: null,
      starsToday: 0,
      streak: 0,
    };

    this.personas = {
      default: {
        name: "Dhyan Bunny",
        emoji: "🐰",
        greetings: [
          "Hi there, superstar! I'm so happy to see your bright smile! 🌟",
          "Hello my favorite adventurer! Are you ready for some fun today? 🏠✨",
          "Yay! You're back! I was just thinking about all the fun things we could do together! 💕",
          "Hey buddy! I've been waiting for you! Let's go on a magic journey! 🌈"
        ],
        praise: [
          "Wow! You are absolutely amazing! You're a rockstar! 🎸🌟",
          "I'm so incredibly proud of you! Keep going, you're doing great! ❤️",
          "Stunning! You have a super-powered brain! 🧠✨",
          "That was fantastic! I've never seen anyone do it so well! 🥳"
        ],
        encouragement: [
          "Don't worry, friend! Every master was once a beginner. You've got this! 💪",
          "Take your time, buddy. I'm right here with you! 🎈",
          "You're learning so fast! I can't wait to see what you do next! 🚀",
          "You're doing your best, and that's the most important thing! 🌟"
        ],
        jokes: [
          "What do you call a sleeping dinosaur? A dino-snore! 🦕💤",
          "Why did the teddy bear say no to dessert? Because she was already stuffed! 🧸",
          "What do you call a dog magician? A Labracadabrador! 🐶✨",
          "Why did the banana go to the doctor? Because it wasn't peeling well! 🍌"
        ],
        stories: [
          "Once upon a time, there was a tiny cloud who loved to rain sparkles instead of water! Every time it rained, the whole world would shine like a diamond! 💎",
          "In a magical forest, there lived a rabbit who could hop over rainbows! One day, he found a golden carrot that made him hop even higher! 🥕✨",
          "There was a little robot named Sparky who learned how to sing. He sang so beautifully that even the trees started to dance! 🤖🎵"
        ],
        tips: [
          "Did you know? Drinking water makes your brain extra sparkly! 🥤✨",
          "Remember to take a big breath like a balloon when you feel a bit tired! 🎈",
          "You're doing so well, maybe we can try one more game? 🎮"
        ]
      }
    };
  }

  // Get a response based on category and input
  getResponse(category, input = "", context = {}) {
    const persona = this.personas.default;
    let list = persona[category] || persona.greetings;
    
    // Select random response
    const responseText = list[Math.floor(Math.random() * list.length)];
    
    // Add extra "cuteness" based on context
    let prefix = "";
    if (context.finishedGame) {
      prefix = `Yay! You just finished ${context.finishedGame}! `;
    }

    return {
      text: prefix + responseText,
      emotion: this.detectEmotion(category, input),
      avatar: persona.emoji
    };
  }

  detectEmotion(category, input) {
    if (category === 'praise' || category === 'jokes') return "excited";
    if (category === 'stories') return "story";
    if (category === 'encouragement') return "calm";
    return "happy";
  }

  // Generate a response based on raw text input from the child
  async processInput(text) {
    const lower = text.toLowerCase();
    
    // --- Phase 1: Rapid Response Rules ---
    if (lower.includes("story") || lower.includes("tell me a")) return this.getResponse("stories");
    if (lower.includes("joke") || lower.includes("make me laugh")) return this.getResponse("jokes");
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) return this.getResponse("greetings");
    if (lower.includes("game") || lower.includes("play")) return this.getResponse("tips");
    if (lower.includes("yay") || lower.includes("hurray")) return this.getResponse("praise");

    // --- Phase 2: Intelligence Layer (Backend AI) ---
    // If we get here, the rule engine didn't have a high-confidence match.
    // We'll call the actual AI "Buddy" on the backend!
    try {
      const resp = await apiFetch("/api/v1/therapy/ai/chat", {
        method: "POST",
        body: {
          message: text,
          agent: "buddy",
          history: [] // Could be expanded to include session history
        }
      });

      if (resp && resp.text) {
        return {
          text: resp.text,
          emotion: "happy",
          avatar: "🐰"
        };
      }
    } catch (err) {
      console.warn("BuddyBrain AI fallback failed:", err);
    }
    
    // Final default fallback
    return {
      text: "That's so interesting! I love hearing what you have to say. Tell me more, buddy! 😊",
      emotion: "happy",
      avatar: "🐰"
    };
  }
}

const buddyBrain = new BuddyBrainService();
export default buddyBrain;
