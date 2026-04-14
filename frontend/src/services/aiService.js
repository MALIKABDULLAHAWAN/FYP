/**
 * AI Service - Groq API Integration
 * Multiple AI Agents for different tasks
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama3-8b-8192";
const GROQ_TEMPERATURE = parseFloat(import.meta.env.VITE_GROQ_TEMPERATURE) || 0.7;
const GROQ_MAX_TOKENS = parseInt(import.meta.env.VITE_GROQ_MAX_TOKENS) || 1024;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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
 * Call Groq API with a message
 * @param {string} message - User's message
 * @param {string} agentKey - Which AI agent to use
 * @param {string} conversationHistory - Previous messages for context
 * @returns {Promise<string>} AI response
 */
export async function callGroqAI(message, agentKey = "gameHelper", conversationHistory = []) {
  const agent = AI_AGENTS[agentKey] || AI_AGENTS.gameHelper;
  
  if (!GROQ_API_KEY || GROQ_API_KEY === "gsk_your_api_key_here") {
    console.warn("Groq API key not configured. Using fallback response.");
    return generateFallbackResponse(message, agent);
  }

  try {
    const messages = [
      { role: "system", content: agent.systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: GROQ_TEMPERATURE,
        max_tokens: GROQ_MAX_TOKENS,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || generateFallbackResponse(message, agent);
  } catch (error) {
    console.error("AI Service Error:", error);
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
  const prompts = {
    math: `Generate a ${difficulty} math problem for a child. Include the question and answer. Format: {"question": "...", "answer": "...", "hint": "..."}`,
    spelling: `Generate a ${difficulty} spelling word for a child. Include the word and a hint. Format: {"word": "...", "hint": "..."}`,
    riddle: `Generate a ${difficulty} riddle for a child. Include question and answer. Format: {"question": "...", "answer": "...", "hint": "..."}`,
    trivia: `Generate a ${difficulty} trivia question for a child about science/nature. Format: {"question": "...", "answer": "...", "fact": "..."}`
  };

  const prompt = prompts[gameType] || prompts.math;
  const response = await callGroqAI(prompt, agentKey);
  
  try {
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log("Could not parse AI response as JSON, using text response");
  }
  
  return { question: response, answer: "", hint: "" };
}

/**
 * Get personalized hint based on child's performance
 */
export async function getPersonalizedHint(gameType, question, wrongAttempts, agentKey = "gameHelper") {
  const prompt = `The child is playing ${gameType}. The question is: "${question}". 
    They've attempted ${wrongAttempts} times incorrectly. 
    Give a gentle, encouraging hint without giving away the answer. 
    Keep it simple and child-friendly.`;
  
  return await callGroqAI(prompt, agentKey);
}

/**
 * Generate a story continuation
 */
export async function continueStory(currentStory, childChoice, agentKey = "storyTeller") {
  const prompt = `Continue this story based on the child's choice:
    
    Story so far: "${currentStory}"
    Child's choice: "${childChoice}"
    
    Write 2-3 engaging sentences that continue the story and end with a question or choice for the child.`;
  
  return await callGroqAI(prompt, agentKey);
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
 * Check if Groq API is configured
 */
export function isAIConfigured() {
  return GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_api_key_here" && GROQ_API_KEY.length > 10;
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
