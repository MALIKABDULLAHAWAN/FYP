/**
 * Enhanced AI Service - Backend API Integration
 * Connects to Django backend AI endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// AI Agents Configuration (matches backend)
const AI_AGENTS = {
  buddy: {
    key: "buddy",
    name: "Buddy",
    role: "friendly_learning_companion",
    avatar: "🎮",
    color: "#4ECDC4",
    description: "Friendly learning companion for educational games"
  },
  story_weaver: {
    key: "story_weaver",
    name: "Story Weaver",
    role: "creative_storyteller",
    avatar: "📚",
    color: "#9B59B6",
    description: "Creative storyteller for magical adventures"
  },
  math_wizard: {
    key: "math_wizard",
    name: "Math Wizard",
    role: "patient_math_tutor",
    avatar: "🔢",
    color: "#FF6B6B",
    description: "Patient math tutor for learning numbers"
  },
  cozy: {
    key: "cozy",
    name: "Cozy",
    role: "gentle_therapy_companion",
    avatar: "🧸",
    color: "#84FAB0",
    description: "Gentle therapy companion for emotional support"
  },
  artie: {
    key: "artie",
    name: "Artie",
    role: "creative_inspirer",
    avatar: "🎨",
    color: "#FFD93D",
    description: "Creative coach for arts and imagination"
  },
  professor_paws: {
    key: "professor_paws",
    name: "Professor Paws",
    role: "curious_science_explainer",
    avatar: "🔬",
    color: "#4D96FF",
    description: "Science explorer for curious minds"
  },
  voice_assistant: {
    key: "voice_assistant",
    name: "Aura",
    role: "voice_assistant",
    avatar: "🎙️",
    color: "#9B59B6",
    description: "Voice-enabled AI assistant"
  }
};

// Get authentication token from localStorage
// Uses same keys as api/client.js
function getAuthToken() {
  return localStorage.getItem('dhyan_jwt') || localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

// API request helper
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}/therapy${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh or redirect to login
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Check AI service health
 */
export async function checkAIHealth() {
  try {
    return await apiRequest('/ai/health');
  } catch (error) {
    console.warn('AI health check failed:', error);
    return { available: false, agents: 0 };
  }
}

/**
 * Get all available AI agents
 */
export async function getAllAIAgents() {
  try {
    const agents = await apiRequest('/ai/agents');
    return agents;
  } catch (error) {
    console.warn('Failed to fetch agents from API, using local:', error);
    return Object.values(AI_AGENTS).map(agent => ({
      key: agent.key,
      name: agent.name,
      avatar: agent.avatar,
      color: agent.color
    }));
  }
}

/**
 * Get single AI agent configuration
 */
export function getAIAgent(agentKey) {
  return AI_AGENTS[agentKey] || AI_AGENTS.buddy;
}

/**
 * Call AI chat with backend API
 * @param {string} message - User's message
 * @param {string} agentKey - Which AI agent to use
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} AI response
 */
export async function callAIChat(message, agentKey = "buddy", conversationHistory = []) {
  const agent = AI_AGENTS[agentKey] || AI_AGENTS.buddy;
  
  try {
    // Format history for backend
    const history = conversationHistory.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const response = await apiRequest('/ai/chat', 'POST', {
      message,
      agent: agentKey,
      history,
      stream: false
    });
    
    return {
      text: response.text,
      agent: response.agent,
      model: response.model,
      processingTime: response.processing_time,
      cached: response.cached,
      error: response.error
    };
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    // Return fallback response
    return {
      text: generateFallbackResponse(message, agent),
      agent: agentKey,
      model: 'fallback',
      processingTime: 0,
      cached: false,
      error: error.message
    };
  }
}

/**
 * Generate a game question using AI
 */
export async function generateGameQuestion(gameType, difficulty, agentKey = "buddy") {
  try {
    return await apiRequest('/ai/game-question', 'POST', {
      game_type: gameType,
      difficulty: difficulty,
      agent: agentKey
    });
  } catch (error) {
    console.error('Game question generation failed:', error);
    // Return fallback question
    return getFallbackQuestion(gameType);
  }
}

/**
 * Get personalized hint
 */
export async function getPersonalizedHint(gameType, question, wrongAttempts, agentKey = "buddy") {
  try {
    const response = await apiRequest('/ai/hint', 'POST', {
      game_type: gameType,
      question,
      wrong_attempts: wrongAttempts,
      agent: agentKey
    });
    return response.hint;
  } catch (error) {
    return "Keep trying! You're getting closer! 💪";
  }
}

/**
 * Continue a story
 */
export async function continueStory(currentStory, childChoice, agentKey = "story_weaver", difficulty = 1) {
  try {
    const response = await apiRequest('/ai/continue-story', 'POST', {
      current_story: currentStory,
      child_choice: childChoice,
      agent: agentKey,
      difficulty: difficulty
    });
    return response.continuation;
  } catch (error) {
    return "What happens next? You decide! ✨";
  }
}

/**
 * Generate encouraging message
 */
export async function generateEncouragement(context = "") {
  try {
    const response = await apiRequest('/ai/encouragement', 'POST', { context });
    return response.message;
  } catch (error) {
    const encouragements = [
      "You're doing amazing! Keep it up! 🌟",
      "Wow, great effort! I'm so proud of you! 💪",
      "You're getting better every day! 🎉",
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }
}

/**
 * Explain a concept
 */
export async function explainConcept(concept, age = 8, agentKey = "professor_paws") {
  try {
    const response = await apiRequest('/ai/explain', 'POST', {
      concept,
      age,
      agent: agentKey
    });
    return response.explanation;
  } catch (error) {
    return `${concept} is really interesting! Let's explore it together! 🔍`;
  }
}

/**
 * Generate content (story, poem, activity)
 */
export async function generateContent(contentType, theme, age = 8, length = 'short', difficulty = 1) {
  try {
    return await apiRequest('/ai/generate-content', 'POST', {
      content_type: contentType,
      theme,
      age,
      length,
      difficulty
    });
  } catch (error) {
    return {
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`,
      content: `Once upon a time, there was a magical ${theme}...`,
      error: error.message
    };
  }
}

/**
 * Check if AI is configured (checks backend)
 */
export async function isAIConfigured() {
  const health = await checkAIHealth();
  return health.available;
}

// Fallback responses for offline mode
function generateFallbackResponse(message, agent) {
  const responses = {
    buddy: [
      "I'd love to help you with that! Let me think... 🤔",
      "Great question! Let's figure it out together! 💪",
      "You're doing amazing! Keep trying! 🌟",
      "That's a fun challenge! Here's a hint: look carefully! 💡"
    ],
    story_weaver: [
      "Once upon a time, in a magical land far away... ✨",
      "Let me tell you a story about a brave little hero! 🦸",
      "Imagine a world where animals could talk... 🐾",
      "Here's a tale of adventure and friendship! 🌈"
    ],
    math_wizard: [
      "Let's break this math problem into small steps! 1️⃣ 2️⃣ 3️⃣",
      "Math is like a puzzle - we just need to find the right pieces! 🧩",
      "Think of it like counting your favorite toys! 🧸",
      "You're getting better at this every day! 📈"
    ],
    cozy: [
      "How are you feeling today? I'm here to listen. 💙",
      "Let's take a deep breath together. In... and out... 🧘",
      "It's okay to have big feelings. They make us human! 🤗",
      "You're safe and loved. Everything will be okay. 🌸"
    ],
    artie: [
      "Let's create something amazing together! What do you imagine? 🎨",
      "How about drawing a magical creature? Give it rainbow colors! 🌈",
      "Your ideas are brilliant! Let's make them real! ✨",
      "Creativity is like magic - it's inside everyone! 🪄"
    ],
    professor_paws: [
      "What an interesting question! Let me tell you all about it! 🔍",
      "Did you know? The world is full of amazing facts! 🌍",
      "Science is like a treasure hunt for answers! 🗝️",
      "Curiosity makes you smarter every day! Keep asking! 🧠"
    ],
    voice_assistant: [
      "I'm here to help! What would you like to know? 🎙️",
      "That's an interesting question! Let me assist you! ✨",
      "I'm thinking about that for you! 💭",
      "How can I make your day better? 😊"
    ]
  };
  
  const agentResponses = responses[agent.key] || responses.buddy;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

function getFallbackQuestion(gameType) {
  const fallbacks = {
    math: { question: "What is 5 + 3?", answer: "8", hint: "Count on your fingers!" },
    spelling: { word: "happy", hint: "It means feeling good and joyful" },
    riddle: { question: "What has hands but cannot clap?", answer: "A clock", hint: "It tells time" },
    trivia: { question: "What color is the sky on a sunny day?", answer: "Blue", fact: "The sky looks blue because of how light scatters" },
    scene_description: { scene: "A park with children playing", questions: ["What do you see?"], answers: ["Children", "Trees", "Grass"] }
  };
  return fallbacks[gameType] || fallbacks.math;
}

// Legacy compatibility - maintain old function signatures
export async function callGroqAI(message, agentKey = "buddy", conversationHistory = []) {
  return callAIChat(message, agentKey, conversationHistory);
}

// Default export
export default {
  callAIChat,
  callGroqAI, // Legacy alias
  generateGameQuestion,
  getPersonalizedHint,
  continueStory,
  generateEncouragement,
  explainConcept,
  generateContent,
  getAIAgent,
  getAllAIAgents,
  isAIConfigured,
  checkAIHealth,
  AI_AGENTS
};
