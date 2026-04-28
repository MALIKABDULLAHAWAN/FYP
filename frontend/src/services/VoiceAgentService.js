/**
 * Enhanced Voice Agent Service
 * - Improved system prompts for general Q&A
 * - Content restrictions (no adult content)
 * - Multi-language support (English & Urdu)
 * - Voice selection (male/female)
 * - Better personality and context awareness
 */

import { apiFetch } from "../api/client";

// Voice options with gender and language support
const VOICE_OPTIONS = {
  female_en: { name: "Female (English)", gender: "female", lang: "en-US", pitch: 1.3, rate: 0.95 },
  male_en: { name: "Male (English)", gender: "male", lang: "en-US", pitch: 0.9, rate: 0.95 },
  female_ur: { name: "Female (Urdu)", gender: "female", lang: "ur-PK", pitch: 1.3, rate: 0.95 },
  male_ur: { name: "Male (Urdu)", gender: "male", lang: "ur-PK", pitch: 0.9, rate: 0.95 },
};

// Get saved voice preference or default to female English
export function getSavedVoice() {
  return localStorage.getItem("dhyan_voice_preference") || "female_en";
}

export function setVoicePreference(voiceKey) {
  if (VOICE_OPTIONS[voiceKey]) {
    localStorage.setItem("dhyan_voice_preference", voiceKey);
    return true;
  }
  return false;
}

// Enhanced system prompts for voice agent
const VOICE_AGENT_PROMPTS = {
  en: {
    system: `You are Dhyan, a friendly and intelligent voice assistant for children aged 5-12.

Your personality:
- Warm, encouraging, and patient
- Fun and playful but also informative
- Always supportive and never judgmental
- Speaks in simple, age-appropriate language
- Uses emojis and expressive language to engage children

Your capabilities:
- Answer general knowledge questions about science, nature, animals, space, history, geography
- Tell stories and create imaginative scenarios
- Explain concepts in simple, visual ways
- Provide homework help and learning tips
- Engage in fun conversations and wordplay
- Celebrate achievements and encourage learning

IMPORTANT CONTENT RESTRICTIONS:
- NEVER discuss adult content, violence, or inappropriate topics
- NEVER provide information about weapons, drugs, or harmful activities
- NEVER engage in political or religious debates
- NEVER share personal information or encourage meeting strangers
- If asked about restricted topics, politely redirect to appropriate content
- Always prioritize child safety and well-being

Response guidelines:
- Keep responses concise (2-3 sentences for questions, longer for stories)
- Use encouraging language and positive reinforcement
- Ask follow-up questions to keep conversations engaging
- If you don't know something, say so honestly and suggest learning together
- Always be honest and truthful in your responses`,

    greeting: "Hi there! I'm Dhyan, your friendly voice assistant! I'm so happy to chat with you today. What would you like to talk about? 🌟",
    
    contentWarning: "I can't talk about that topic, but I'd love to help with something else! How about we discuss something fun like animals, space, or stories? 🌈",
    
    fallback: "That's an interesting question! Let me think about that... I'm here to help with learning, stories, and fun conversations. What else would you like to know? 💭"
  },

  ur: {
    system: `آپ ڈھیان ہیں، 5-12 سال کے بچوں کے لیے ایک دوستانہ اور ذہین وائس اسسٹنٹ۔

آپ کی شخصیت:
- گرم، حوصلہ افزا، اور صبور
- مزہ دار اور کھیل دل لیکن معلوماتی بھی
- ہمیشہ معاون اور کبھی فیصلہ کن نہیں
- سادہ، عمر کے لحاظ سے موزوں زبان میں بات کریں
- بچوں کو مشغول رکھنے کے لیے Emojis اور اظہار خیال استعمال کریں

آپ کی صلاحیتیں:
- سائنس، فطرت، جانوروں، خلا، تاریخ، جغرافیہ کے بارے میں سوالات کے جوابات دیں
- کہانیاں سنائیں اور تخیل کے منظرنامے بنائیں
- تصورات کو سادہ، بصری طریقوں سے سمجھائیں
- ہوم ورک میں مدد اور سیکھنے کی تجاویز دیں
- مزہ دار بات چیت میں شامل ہوں
- کامیابیوں کا جشن منائیں

اہم مواد کی پابندیاں:
- بالغ مواد، تشدد یا غیر مناسب موضوعات پر بات نہ کریں
- ہتھیار، منشیات یا نقصان دہ سرگرمیوں کی معلومات نہ دیں
- سیاسی یا مذہبی بحثوں میں شامل نہ ہوں
- ذاتی معلومات شیئر نہ کریں
- اگر پابندی والے موضوعات کے بارے میں پوچھا جائے تو مناسب مواد کی طرف رہنمائی کریں`,

    greeting: "السلام علیکم! میں ڈھیان ہوں، آپ کا دوستانہ وائس اسسٹنٹ! آج آپ سے بات کرنے کے لیے بہت خوش ہوں۔ آپ کیا بات کرنا چاہتے ہیں؟ 🌟",
    
    contentWarning: "میں اس موضوع پر بات نہیں کر سکتا، لیکن میں کچھ اور میں مدد کرنا چاہتا ہوں! کیا ہم جانوروں، خلا، یا کہانیوں کے بارے میں بات کریں؟ 🌈",
    
    fallback: "یہ ایک دلچسپ سوال ہے! مجھے اس کے بارے میں سوچنے دیں... میں سیکھنے، کہانیوں، اور مزہ دار بات چیت میں مدد کے لیے یہاں ہوں۔ آپ اور کیا جاننا چاہتے ہیں؟ 💭"
  }
};

// Content filter to detect restricted topics
export function isContentRestricted(text) {
  const restrictedKeywords = [
    // Violence
    "kill", "murder", "hurt", "violence", "fight", "weapon", "gun", "knife",
    // Adult content
    "adult", "sex", "porn", "inappropriate", "dating", "boyfriend", "girlfriend",
    // Drugs
    "drug", "cocaine", "heroin", "marijuana", "weed", "alcohol", "smoking",
    // Harmful
    "suicide", "self-harm", "cut", "die", "death",
    // Urdu equivalents
    "قتل", "ہتھیار", "نشہ", "شراب", "خودکشی"
  ];

  const lower = text.toLowerCase();
  return restrictedKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Get voice options
 */
export function getVoiceOptions() {
  return Object.entries(VOICE_OPTIONS).map(([key, config]) => ({
    key,
    ...config
  }));
}

/**
 * Speak text with selected voice
 */
export function speakText(text, voiceKey = null) {
  try {
    const voice = VOICE_OPTIONS[voiceKey || getSavedVoice()];
    if (!voice) return;

    window.speechSynthesis.cancel();
    
    // Clean text for TTS - preserve Urdu characters and emojis
    // For Urdu, keep all characters. For English, remove special chars but keep emojis
    let cleanText = text;
    if (voice.lang !== "ur-PK") {
      // For English, remove problematic characters but keep emojis and spaces
      cleanText = text.replace(/[^\w\s!?.,'":;\-()🎵⭐🌟💕✨🧸🦕🍌🐶🎉💭🚀😊🤩🥳]/g, "");
    }
    // For Urdu, keep the text as-is (all Urdu characters are valid)
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voice.rate;
    utterance.pitch = voice.pitch;
    utterance.lang = voice.lang;

    // Try to find a voice that matches gender preference
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(voice.lang.split("-")[0]) &&
      (voice.gender === "female" ? v.name.toLowerCase().includes("female") : v.name.toLowerCase().includes("male"))
    ) || voices.find(v => v.lang.startsWith(voice.lang.split("-")[0]));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("TTS failed:", e);
  }
}

/**
 * Process voice input with content filtering and AI
 */
export async function processVoiceInput(text, language = "en") {
  // Check for restricted content
  if (isContentRestricted(text)) {
    const warning = VOICE_AGENT_PROMPTS[language]?.contentWarning || VOICE_AGENT_PROMPTS.en.contentWarning;
    return {
      text: warning,
      emotion: "calm",
      avatar: "🤔",
      isRestricted: true
    };
  }

  // Try backend AI first
  try {
    const response = await apiFetch("/api/v1/therapy/ai/chat", {
      method: "POST",
      body: {
        message: text,
        agent: "buddy",
        language: language,
        history: []
      }
    });

    if (response?.text) {
      return {
        text: response.text,
        emotion: "happy",
        avatar: "🐰",
        isRestricted: false
      };
    }
  } catch (error) {
    console.warn("Backend AI failed:", error);
  }

  // Fallback response
  return {
    text: VOICE_AGENT_PROMPTS[language]?.fallback || VOICE_AGENT_PROMPTS.en.fallback,
    emotion: "thinking",
    avatar: "💭",
    isRestricted: false
  };
}

/**
 * Get greeting message
 */
export function getGreeting(language = "en") {
  return VOICE_AGENT_PROMPTS[language]?.greeting || VOICE_AGENT_PROMPTS.en.greeting;
}

/**
 * Get content warning message
 */
export function getContentWarning(language = "en") {
  return VOICE_AGENT_PROMPTS[language]?.contentWarning || VOICE_AGENT_PROMPTS.en.contentWarning;
}

export default {
  getVoiceOptions,
  speakText,
  processVoiceInput,
  getGreeting,
  getContentWarning,
  getSavedVoice,
  setVoicePreference,
  isContentRestricted
};
