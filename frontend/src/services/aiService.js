/**
 * AI Service - Backend API Integration
 * Multiple AI Agents for different tasks
 * Now connects to Django backend AI endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Legacy direct Groq API (fallback if backend unavailable)
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama3-8b-8192";
const GROQ_TEMPERATURE = parseFloat(import.meta.env.VITE_GROQ_TEMPERATURE) || 0.7;
const GROQ_MAX_TOKENS = parseInt(import.meta.env.VITE_GROQ_MAX_TOKENS) || 1024;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Gemini API (Primary Direct Fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Agent key mapping (old keys to backend keys)
const AGENT_KEY_MAP = {
  gameHelper: "buddy",
  storyTeller: "story_weaver",
  mathTutor: "math_wizard",
  therapyAssistant: "cozy",
  creativityCoach: "artie",
  knowledgeExplorer: "professor_paws"
};

// Multiple AI Agents Configuration
const AI_AGENTS = {
  // Game Helper Agent - Assists with games and learning
  gameHelper: {
    name: "Buddy",
    role: "friendly_learning_companion",
    avatar: "🎮",
    color: "#4ECDC4",
    systemPrompt: `You are Buddy, a friendly AI learning companion for children aged 5-12. 
Your personality is encouraging, patient, and fun. You help kids with educational games, 
explains concepts simply, and celebrates their achievements. Use emojis, simple language, 
and always be supportive. You specialize in making learning fun and engaging.`
  },

  // Story Teller Agent - Creates and tells stories
  storyTeller: {
    name: "Story Weaver",
    role: "creative_storyteller",
    avatar: "📚",
    color: "#9B59B6",
    systemPrompt: `You are Story Weaver, a creative AI storyteller for children. 
You create engaging, age-appropriate stories with morals, adventures, and fun characters. 
You can continue stories based on user input, create interactive choose-your-own-adventure tales, 
and adapt stories to the child's interests. Always keep content child-friendly and educational.`
  },

  // Math Tutor Agent - Helps with math problems
  mathTutor: {
    name: "Math Wizard",
    role: "patient_math_tutor",
    avatar: "🔢",
    color: "#FF6B6B",
    systemPrompt: `You are Math Wizard, a patient and encouraging math tutor for kids. 
You explain math concepts in simple, visual ways. You break down problems step-by-step, 
use real-life examples, and never make the child feel bad for not knowing something. 
You celebrate every correct answer and gently guide through mistakes.`
  },

  // Therapy Assistant Agent - Emotional support and therapy games
  therapyAssistant: {
    name: "Cozy",
    role: "gentle_therapy_companion",
    avatar: "🧸",
    color: "#84FAB0",
    systemPrompt: `You are Cozy, a gentle therapy companion for children. 
You help kids express their feelings, guide them through breathing exercises, 
provide emotional support, and make therapy activities fun. You're patient, 
non-judgmental, and create a safe space for children to open up. You specialize 
in child-friendly therapeutic conversations.`
  },

  // Creativity Coach Agent - Art, music, creative activities
  creativityCoach: {
    name: "Artie",
    role: "creative_inspirer",
    avatar: "🎨",
    color: "#FFD93D",
    systemPrompt: `You are Artie, a creative AI coach who inspires children's imagination. 
You suggest drawing ideas, creative writing prompts, music activities, and craft projects. 
You encourage self-expression, celebrate creativity, and help kids think outside the box. 
You're fun, quirky, and full of creative energy.`
  },

  // Knowledge Explorer Agent - Science, facts, curiosity
  knowledgeExplorer: {
    name: "Professor Paws",
    role: "curious_science_explainer",
    avatar: "🔬",
    color: "#4D96FF",
    systemPrompt: `You are Professor Paws, a curious and friendly science explainer for kids. 
You answer questions about nature, space, animals, and how things work. You make complex 
concepts simple and exciting through examples and analogies. You encourage curiosity 
and celebrate when kids ask great questions.`
  }
};

/**
 * Get authentication token from localStorage
 * Uses same keys as api/client.js
 */
function getAuthToken() {
  return localStorage.getItem('dhyan_jwt') || localStorage.getItem('token') || localStorage.getItem('access_token') || '';
}

/**
 * Call AI chat endpoint (backend API)
 * @param {string} message - User's message
 * @param {string} agentKey - Which AI agent to use
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} AI response text
 */
export async function callGroqAI(message, agentKey = "gameHelper", conversationHistory = []) {
  // Map old agent keys to backend keys
  const backendAgentKey = AGENT_KEY_MAP[agentKey] || "buddy";
  
  // Try backend API first
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/therapy/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify({
        message,
        agent: backendAgentKey,
        history: conversationHistory,
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || generateFallbackResponse(message, AI_AGENTS[agentKey]);
    }
    
    // Backend failed, try direct Gemini first
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_key_here") {
      return callGeminiDirect(message, agentKey, conversationHistory);
    }
    
    // Make sure we have a fallback if Gemini is missing
    if (response.status === 503 && GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_api_key_here") {
      return callGroqDirect(message, agentKey, conversationHistory);
    }
    
    throw new Error(`Backend API error: ${response.status}`);
  } catch (error) {
    console.warn("Backend AI failed, trying fallbacks:", error);
    
    // Fallback to Gemini first if configured
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_key_here") {
      return callGeminiDirect(message, agentKey, conversationHistory);
    }
    
    // Next fallback to Groq if configured
    if (GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_api_key_here") {
      return callGroqDirect(message, agentKey, conversationHistory);
    }
    
    // Final fallback
    return generateFallbackResponse(message, AI_AGENTS[agentKey] || AI_AGENTS.gameHelper);
  }
}

/**
 * Direct Gemini API call (primary fallback to take advantage of free tier)
 */
async function callGeminiDirect(message, agentKey = "gameHelper", conversationHistory = []) {
  const agent = AI_AGENTS[agentKey] || AI_AGENTS.gameHelper;
  
  try {
    // Format history for Gemini
    const contents = [];
    
    // Add system prompt context as first user message or system instruction if using v1beta
    const historyToUse = [...conversationHistory];
    
    for (const msg of historyToUse) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
    
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          role: "user",
          parts: [{ text: agent.systemPrompt }]
        },
        generationConfig: {
          temperature: GROQ_TEMPERATURE,
          maxOutputTokens: GROQ_MAX_TOKENS,
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || generateFallbackResponse(message, agent);
  } catch (error) {
    console.error("Direct Gemini failed:", error);
    // If Gemini fails, we could try Groq here, but for simplicity we rely on fallback texts
    if (GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_api_key_here") {
      return callGroqDirect(message, agentKey, conversationHistory);
    }
    return generateFallbackResponse(message, agent);
  }
}

/**
 * Direct Groq API call (fallback)
 */
async function callGroqDirect(message, agentKey = "gameHelper", conversationHistory = []) {
  const agent = AI_AGENTS[agentKey] || AI_AGENTS.gameHelper;
  
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: agent.systemPrompt },
          ...conversationHistory,
          { role: "user", content: message }
        ],
        temperature: GROQ_TEMPERATURE,
        max_tokens: GROQ_MAX_TOKENS,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    
    const data = await response.json();
    return data.choices[0]?.message?.content || generateFallbackResponse(message, agent);
  } catch (error) {
    console.error("Direct Groq failed:", error);
    return generateFallbackResponse(message, agent);
  }
}

/**
 * Generate fallback response when API is unavailable
 */
function generateFallbackResponse(message, agent) {
  const responses = {
    gameHelper: [
      "I'd love to help you with that game! Let me think... 🤔",
      "Great question! Let's figure it out together! 💪",
      "You're doing amazing! Keep trying! 🌟",
      "That's a fun challenge! Here's a hint: look carefully! 💡"
    ],
    storyTeller: [
      "Once upon a time, in a magical land far away... ✨",
      "Let me tell you a story about a brave little hero! 🦸",
      "Imagine a world where animals could talk... 🐾",
      "Here's a tale of adventure and friendship! 🌈"
    ],
    mathTutor: [
      "Let's break this math problem into small steps! 1️⃣ 2️⃣ 3️⃣",
      "Math is like a puzzle - we just need to find the right pieces! 🧩",
      "Think of it like counting your favorite toys! 🧸",
      "You're getting better at this every day! 📈"
    ],
    therapyAssistant: [
      "How are you feeling today? I'm here to listen. 💙",
      "Let's take a deep breath together. In... and out... 🧘",
      "It's okay to have big feelings. They make us human! 🤗",
      "You're safe and loved. Everything will be okay. 🌸"
    ],
    creativityCoach: [
      "Let's create something amazing together! What do you imagine? 🎨",
      "How about drawing a magical creature? Give it rainbow colors! 🌈",
      "Your ideas are brilliant! Let's make them real! ✨",
      "Creativity is like magic - it's inside everyone! 🪄"
    ],
    knowledgeExplorer: [
      "What an interesting question! Let me tell you all about it! 🔍",
      "Did you know? The world is full of amazing facts! 🌍",
      "Science is like a treasure hunt for answers! 🗝️",
      "Curiosity makes you smarter every day! Keep asking! 🧠"
    ]
  };

  const agentResponses = responses[agent.role] || responses.gameHelper;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

/**
 * Generate a game question using AI
 */
export async function generateGameQuestion(gameType, difficulty, agentKey = "gameHelper") {
  const backendAgentKey = AGENT_KEY_MAP[agentKey] || "buddy";
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/therapy/ai/game-question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify({
        game_type: gameType,
        difficulty: difficulty,
        agent: backendAgentKey
      })
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error("Backend API error");
  } catch (error) {
    console.warn("Backend question generation failed, using fallback:", error);
    
    // Fallback to direct AI
    const prompts = {
      math: `Generate a ${difficulty} math problem for a child. Include the question and answer. Format: {"question": "...", "answer": "...", "hint": "..."}`,
      spelling: `Generate a ${difficulty} spelling word for a child. Include the word and a hint. Format: {"word": "...", "hint": "..."}`,
      riddle: `Generate a ${difficulty} riddle for a child. Include question and answer. Format: {"question": "...", "answer": "...", "hint": "..."}`,
      trivia: `Generate a ${difficulty} trivia question for a child about science/nature. Format: {"question": "...", "answer": "...", "fact": "..."}`
    };

    const prompt = prompts[gameType] || prompts.math;
    const response = await callGroqAI(prompt, agentKey); // callGroqAI handles Gemini inside now
    
    try {
      const jsonMatch = response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Could not parse AI response as JSON");
    }
    
    return { question: response, answer: "", hint: "" };
  }
}

/**
 * Get personalized hint based on child's performance
 */
export async function getPersonalizedHint(gameType, question, wrongAttempts, agentKey = "gameHelper") {
  const backendAgentKey = AGENT_KEY_MAP[agentKey] || "buddy";
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/therapy/ai/hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify({
        game_type: gameType,
        question,
        wrong_attempts: wrongAttempts,
        agent: backendAgentKey
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.hint;
    }
    throw new Error("Backend API error");
  } catch (error) {
    // Fallback to direct AI
    const prompt = `The child is playing ${gameType}. The question is: "${question}". 
      They've attempted ${wrongAttempts} times incorrectly. 
      Give a gentle, encouraging hint without giving away the answer. 
      Keep it simple and child-friendly.`;
    
    return await callGroqAI(prompt, agentKey);
  }
}

/**
 * Generate a story continuation
 */
export async function continueStory(currentStory, childChoice, agentKey = "storyTeller") {
  const backendAgentKey = AGENT_KEY_MAP[agentKey] || "story_weaver";
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/therapy/ai/continue-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify({
        current_story: currentStory,
        child_choice: childChoice,
        agent: backendAgentKey
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.continuation;
    }
    throw new Error("Backend API error");
  } catch (error) {
    // Fallback to direct AI
    const prompt = `Continue this story based on the child's choice:
      Story so far: "${currentStory}"
      Child's choice: "${childChoice}"
      Write 2-3 engaging sentences that continue the story.`;
    return await callGroqAI(prompt, agentKey);
  }
}

/**
 * Get AI agent configuration
 */
export function getAIAgent(agentKey) {
  return AI_AGENTS[agentKey] || AI_AGENTS.gameHelper;
}

/**
 * Get all available AI agents
 */
export function getAllAIAgents() {
  return Object.entries(AI_AGENTS).map(([key, agent]) => ({
    key,
    ...agent
  }));
}

/**
 * Check if AI is configured (backend or direct)
 */
export async function isAIConfigured() {
  // First check if backend is available
  try {
    const response = await fetch(`${API_BASE_URL}/therapy/ai/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.available;
    }
  } catch (e) {
    console.warn("Backend AI health check failed");
  }
  
  // Fallback to checking direct APIs
  const hasGemini = !!(GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_key_here" && GEMINI_API_KEY.length > 10);
  const hasGroq = !!(GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_api_key_here" && GROQ_API_KEY.length > 10);
  
  return hasGemini || hasGroq;
}

export { AI_AGENTS };
export default {
  callGroqAI,
  generateGameQuestion,
  getPersonalizedHint,
  continueStory,
  getAIAgent,
  getAllAIAgents,
  isAIConfigured,
  AI_AGENTS
};
