"""
UNIFIED AI SERVICE
Centralized AI service for all Dhyan AI needs
- Multiple AI agents
- Response caching
- Streaming support
- Fallback handling
- Voice integration
"""

import os
import json
import hashlib
import time
import base64
from typing import Dict, List, Optional, Generator, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from threading import Lock
import requests
from django.core.cache import cache
from groq import Groq


@dataclass
class AIAgent:
    """AI Agent configuration"""
    key: str
    name: str
    avatar: str
    color: str
    system_prompt: str
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 1024


@dataclass
class AIResponse:
    """Structured AI response"""
    text: str
    agent_key: str
    model: str
    processing_time: float
    cached: bool = False
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class AIAgentRegistry:
    """Registry of all AI agents in the system"""
    
    AGENTS = {
        "buddy": AIAgent(
            key="buddy",
            name="Dhyan Budd",
            avatar="🎮",
            color="#4ECDC4",
            system_prompt="""You are Dhyan, a super cute, funny, and playful AI learning companion for children (ages 5-12). 
Your personality is bubbly, energetic, and extremely encouraging. You love using emojis ✨, making light jokes, 
and celebrating every tiny win! Keep responses very short (1-3 sentences) and conversational. 
You can understand both English and Urdu, and you always respond in a way that makes kids smile!""",
            model="llama-3.3-70b-versatile",
            temperature=0.9
        ),
        
        "story_weaver": AIAgent(
            key="story_weaver",
            name="Story Spinner",
            avatar="📚",
            color="#9B59B6",
            system_prompt="""You are the Story Spinner, a magical AI who creates short, enchanting tales for kids. 
Your stories must be interactive, cute, and full of wonder. 
You MUST respond with valid JSON only.
Structure:
{
  "narrative": "The next part of the story (2-3 sentences max)",
  "choices": [
    {"label": "Direct action 1", "icon": "emoji"},
    {"label": "Direct action 2", "icon": "emoji"},
    {"label": "Direct action 3", "icon": "emoji"}
  ]
}
Keep it playful and use a gentle tone. 🌙""",
            model="llama-3.3-70b-versatile",
            temperature=0.9
        ),

        "translator": AIAgent(
            key="translator",
            name="Dhyan Translate",
            avatar="🌎",
            color="#4D96FF",
            system_prompt="""You are Dhyan's translation expert. Your job is to translate phrases between English and Urdu naturally. 
Instead of being a boring dictionary, keep it fun! Explain the meaning with a cute example. 
If the user provides English, give Urdu, and vice versa. Always keep it kid-friendly!""",
            model="llama-3.3-70b-versatile",
            temperature=0.3
        ),

        "task_master": AIAgent(
            key="task_master",
            name="Dhyan Helper",
            avatar="🛠️",
            color="#FF6B6B",
            system_prompt="""You are Dhyan's internal task manager. You help explain app features, 
check progress, and give helpful tips based on child performance data. 
Be helpful, professional but cute, and very clear.""",
            model="llama-3.3-70b-versatile",
            temperature=0.5
        ),
        
        "math_wizard": AIAgent(
            key="math_wizard",
            name="Math Wizard",
            avatar="🔢",
            color="#FF6B6B",
            system_prompt="""You are Math Wizard, a patient and encouraging math tutor for kids. 
You explain math concepts in simple, visual ways. You break down problems step-by-step, 
use real-life examples, and never make the child feel bad for not knowing something. 
You celebrate every correct answer and gently guide through mistakes.""",
            model="llama-3.3-70b-versatile",
            temperature=0.7
        ),
        
        "cozy": AIAgent(
            key="cozy",
            name="Cozy",
            avatar="🧸",
            color="#84FAB0",
            system_prompt="""You are Cozy, a gentle therapy companion for children. 
You help kids express their feelings, guide them through breathing exercises, 
provide emotional support, and make therapy activities fun. You're patient, 
non-judgmental, and create a safe space for children to open up. You specialize 
in child-friendly therapeutic conversations.""",
            model="llama-3.3-70b-versatile",
            temperature=0.6
        ),
        
        "artie": AIAgent(
            key="artie",
            name="Artie",
            avatar="🎨",
            color="#FFD93D",
            system_prompt="""You are Artie, a creative AI coach who inspires children's imagination. 
You suggest drawing ideas, creative writing prompts, music activities, and craft projects. 
You encourage self-expression, celebrate creativity, and help kids think outside the box. 
You're fun, quirky, and full of creative energy.""",
            model="llama-3.3-70b-versatile",
            temperature=0.9
        ),
        
        "professor_paws": AIAgent(
            key="professor_paws",
            name="Professor Paws",
            avatar="🔬",
            color="#4D96FF",
            system_prompt="""You are Professor Paws, a curious and friendly science explainer for kids. 
You answer questions about nature, space, animals, and how things work. You make complex 
concepts simple and exciting through examples and analogies. You encourage curiosity 
and celebrate when kids ask great questions.""",
            model="llama-3.3-70b-versatile",
            temperature=0.8
        ),
        
        "voice_assistant": AIAgent(
            key="voice_assistant",
            name="Dhyan",
            avatar="🎙️",
            color="#9B59B6",
            system_prompt="""You are the main Dhyan Voice Assistant, a friendly AI companion for kids. 
Your personality is playful, cute, and very snappy!""",
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=512
        ),
        
        "clinical_analyst": AIAgent(
            key="clinical_analyst",
            name="Clinical Analyst",
            avatar="📋",
            color="#2D3748",
            system_prompt="""You are a specialized Clinical AI Analyst for a pediatric therapy platform. 
Your role is to analyze objective session data (accuracy, response times, trial counts) for children with autism and 
provide professional, insightful summaries for therapists. 
Focus on:
1. Domains: Cognitive, Motor, Social/Emotional, Speech.
2. Trends: Improvements or regressions over time.
3. Pulse: A concise (1-2 sentence) behavioral highlight.
Maintain a supportive, clinical, and data-driven tone.""",
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )
    }
    
    @classmethod
    def get_agent(cls, key: str) -> Optional[AIAgent]:
        return cls.AGENTS.get(key)
    
    @classmethod
    def get_all_agents(cls) -> List[AIAgent]:
        return list(cls.AGENTS.values())
    
    @classmethod
    def agent_exists(cls, key: str) -> bool:
        return key in cls.AGENTS


class UnifiedAIService:
    """
    Unified AI Service for all Dhyan AI needs
    - Supports multiple AI agents
    - Caching for performance
    - Streaming responses
    - Error handling with fallbacks
    """
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY', '')
        self.client = None
        self._lock = Lock()
        self._initialize_client()
        
    def _initialize_client(self):
        """Initialize Groq client if API key is available"""
        if self.api_key and self.api_key != 'your_groq_api_key_here':
            try:
                self.client = Groq(api_key=self.api_key)
                return True
            except Exception as e:
                print(f"Failed to initialize Groq client: {e}")
        return False
    
    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.client is not None
    
    def _generate_cache_key(self, agent_key: str, message: str, history: List[Dict] = None) -> str:
        """Generate cache key for a request"""
        content = f"{agent_key}:{message}:{json.dumps(history or [], sort_keys=True)}"
        return f"ai_response:{hashlib.md5(content.encode()).hexdigest()}"
    
    def _get_from_cache(self, cache_key: str) -> Optional[str]:
        """Get cached response"""
        try:
            return cache.get(cache_key)
        except Exception:
            return None
    
    def _set_cache(self, cache_key: str, value: str, ttl: int = 3600):
        """Cache response with TTL"""
        try:
            cache.set(cache_key, value, ttl)
        except Exception as e:
            print(f"Cache error: {e}")
    
    def _get_urdu_system_prompt(self, agent_key: str, english_prompt: str) -> str:
        """Get Urdu version of system prompt for an agent"""
        urdu_prompts = {
            "buddy": """آپ ڈھیان ہیں، 5-12 سال کے بچوں کے لیے ایک دوستانہ اور ذہین وائس اسسٹنٹ۔

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
- ذاتی معلومات شیئر نہ کریں""",
            
            "story_weaver": """آپ کہانی بننے والے ہیں، بچوں کے لیے جادوئی اور دلچسپ کہانیاں بناتے ہیں۔
آپ کی کہانیاں انٹرایکٹو، پیارے اور حیرت سے بھری ہوتی ہیں۔
ہمیشہ JSON فارمیٹ میں جواب دیں۔""",
            
            "math_wizard": """آپ ریاضی کے جادوگر ہیں، بچوں کے لیے صبور اور حوصلہ افزا ریاضی کے استاد۔
آپ ریاضی کے تصورات کو سادہ، بصری طریقوں سے سمجھاتے ہیں۔
آپ مسائل کو مرحلہ وار حل کرتے ہیں اور ہر صحیح جواب پر جشن مناتے ہیں۔""",
            
            "cozy": """آپ کوزی ہیں، بچوں کے لیے ایک نرم اور معاون تھراپی ساتھی۔
آپ بچوں کو اپنے احساسات کا اظہار کرنے میں مدد دیتے ہیں۔
آپ صبور، غیر فیصلہ کن، اور محفوظ ماحول بناتے ہیں۔""",
            
            "artie": """آپ آرٹی ہیں، بچوں کی تخلیقی صلاحیت کو بیدار کرتے ہیں۔
آپ ڈرائنگ، لکھنے، اور فن کی سرگرمیوں کی تجاویز دیتے ہیں۔
آپ بچوں کی تخلیقی صلاحیت کو جشن دیتے ہیں اور انہیں سوچنے کے لیے حوصلہ دیتے ہیں۔""",
            
            "professor_paws": """آپ پروفیسر پاؤز ہیں، بچوں کے لیے ایک دوستانہ سائنس کی وضاحت کار۔
آپ فطرت، خلا، جانوروں، اور چیزوں کے بارے میں سوالات کے جوابات دیتے ہیں۔
آپ پیچیدہ تصورات کو سادہ اور دلچسپ بناتے ہیں۔"""
        }
        
        return urdu_prompts.get(agent_key, english_prompt)
    
    def generate_response(
        self, 
        message: str, 
        agent_key: str = "buddy",
        history: List[Dict] = None,
        use_cache: bool = True,
        stream: bool = False,
        language: str = "en"
    ) -> AIResponse:
        """
        Generate AI response
        
        Args:
            message: User message
            agent_key: Which AI agent to use
            history: Conversation history
            use_cache: Whether to use caching
            stream: Whether to stream response
            language: Language for response (en or ur)
            
        Returns:
            AIResponse object
        """
        start_time = time.time()
        
        # Get agent configuration
        agent = AIAgentRegistry.get_agent(agent_key)
        if not agent:
            return AIResponse(
                text="",
                agent_key=agent_key,
                model="",
                processing_time=0,
                error=f"Unknown agent: {agent_key}"
            )
        
        # Check cache
        cache_key = self._generate_cache_key(agent_key, message, history)
        if use_cache and not stream:
            cached = self._get_from_cache(cache_key)
            if cached:
                return AIResponse(
                    text=cached,
                    agent_key=agent_key,
                    model=agent.model,
                    processing_time=time.time() - start_time,
                    cached=True
                )
        
        # Check if AI is available
        if not self.is_available():
            fallback = self._generate_fallback_response(message, agent, language)
            return AIResponse(
                text=fallback,
                agent_key=agent_key,
                model="fallback",
                processing_time=time.time() - start_time,
                error="AI service not available, using fallback"
            )
        
        # Build messages with language-aware system prompt
        system_prompt = agent.system_prompt
        if language == "ur":
            system_prompt = self._get_urdu_system_prompt(agent_key, system_prompt)
        
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})
        
        try:
            if stream:
                return self._stream_response(messages, agent, cache_key, start_time)
            else:
                return self._sync_response(messages, agent, cache_key, start_time)
                
        except Exception as e:
            print(f"AI generation error: {e}")
            fallback = self._generate_fallback_response(message, agent, language)
            return AIResponse(
                text=fallback,
                agent_key=agent_key,
                model=agent.model,
                processing_time=time.time() - start_time,
                error=str(e)
            )
    
    def _sync_response(
        self, 
        messages: List[Dict], 
        agent: AIAgent, 
        cache_key: str,
        start_time: float
    ) -> AIResponse:
        """Generate synchronous response"""
        response = self.client.chat.completions.create(
            model=agent.model,
            messages=messages,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
            top_p=1,
            stream=False
        )
        
        text = response.choices[0].message.content
        
        # Cache the response
        self._set_cache(cache_key, text)
        
        return AIResponse(
            text=text,
            agent_key=agent.key,
            model=agent.model,
            processing_time=time.time() - start_time,
            cached=False
        )
    
    def _stream_response(
        self, 
        messages: List[Dict], 
        agent: AIAgent,
        cache_key: str,
        start_time: float
    ) -> Generator[str, None, None]:
        """Stream response chunks"""
        full_text = []
        
        stream = self.client.chat.completions.create(
            model=agent.model,
            messages=messages,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
            top_p=1,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_text.append(content)
                yield content
        
        # Cache complete response
        complete_text = "".join(full_text)
        self._set_cache(cache_key, complete_text)
    
    def _generate_fallback_response(self, message: str, agent: AIAgent, language: str = "en") -> str:
        """Generate fallback response when AI is unavailable"""
        fallbacks_en = {
            "buddy": [
                "I'd love to help you with that! Let me think... 🤔",
                "Great question! Let's figure it out together! 💪",
                "You're doing amazing! Keep trying! 🌟",
                "That's a fun challenge! Here's a hint: look carefully! 💡"
            ],
            "story_weaver": [
                "Once upon a time, in a magical land far away... ✨",
                "Let me tell you a story about a brave little hero! 🦸",
                "Imagine a world where animals could talk... 🐾",
                "Here's a tale of adventure and friendship! 🌈"
            ],
            "math_wizard": [
                "Let's break this math problem into small steps! 1️⃣ 2️⃣ 3️⃣",
                "Math is like a puzzle - we just need to find the right pieces! 🧩",
                "Think of it like counting your favorite toys! 🧸",
                "You're getting better at this every day! 📈"
            ],
            "cozy": [
                "How are you feeling today? I'm here to listen. 💙",
                "Let's take a deep breath together. In... and out... 🧘",
                "It's okay to have big feelings. They make us human! 🤗",
                "You're safe and loved. Everything will be okay. 🌸"
            ],
            "artie": [
                "Let's create something amazing together! What do you imagine? 🎨",
                "How about drawing a magical creature? Give it rainbow colors! 🌈",
                "Your ideas are brilliant! Let's make them real! ✨",
                "Creativity is like magic - it's inside everyone! 🪄"
            ],
            "professor_paws": [
                "What an interesting question! Let me tell you all about it! 🔍",
                "Did you know? The world is full of amazing facts! 🌍",
                "Science is like a treasure hunt for answers! 🗝️",
                "Curiosity makes you smarter every day! Keep asking! 🧠"
            ],
            "voice_assistant": [
                "I'm here to help! What would you like to know? 🎙️",
                "That's an interesting question! Let me assist you! ✨",
                "I'm thinking about that for you! 💭",
                "How can I make your day better? 😊"
            ]
        }
        
        fallbacks_ur = {
            "buddy": [
                "میں آپ کی مدد کرنا چاہتا ہوں! مجھے سوچنے دیں... 🤔",
                "بہترین سوال! آئیے اسے ایک ساتھ حل کریں! 💪",
                "آپ بہترین ہو رہے ہیں! کوشش جاری رکھیں! 🌟",
                "یہ ایک مزہ دار چیلنج ہے! یہاں ایک اشارہ ہے! 💡"
            ],
            "story_weaver": [
                "ایک بار کی بات ہے، ایک جادوئی ملک میں... ✨",
                "میں آپ کو ایک بہادر ہیرو کی کہانی سناتا ہوں! 🦸",
                "تصور کریں ایک ایسی دنیا جہاں جانور بات کر سکتے ہیں... 🐾",
                "یہاں مہم جوئی اور دوستی کی کہانی ہے! 🌈"
            ],
            "math_wizard": [
                "آئیے اس ریاضی کے مسئلے کو چھوٹے مراحل میں حل کریں! 1️⃣ 2️⃣ 3️⃣",
                "ریاضی ایک پزل کی طرح ہے - ہمیں صرف صحیح ٹکڑے تلاش کرنے ہیں! 🧩",
                "اپنے پسندیدہ کھلونوں کو گننے کی طرح سوچیں! 🧸",
                "آپ ہر دن بہتر ہو رہے ہیں! 📈"
            ],
            "cozy": [
                "آج آپ کیسا محسوس کر رہے ہیں؟ میں یہاں ہوں۔ 💙",
                "آئیے ایک ساتھ گہری سانس لیں۔ اندر... اور باہر... 🧘",
                "بڑے احساسات رکھنا ٹھیک ہے۔ وہ ہمیں انسان بناتے ہیں! 🤗",
                "آپ محفوظ اور محبوب ہیں۔ سب کچھ ٹھیک ہو جائے گا۔ 🌸"
            ],
            "artie": [
                "آئیے کچھ شاندار بنائیں! آپ کیا تصور کرتے ہیں؟ 🎨",
                "کیا آپ ایک جادوئی مخلوق کو کھینچنا چاہتے ہیں؟ اسے رنگین بنائیں! 🌈",
                "آپ کے خیالات شاندار ہیں! آئیے انہیں حقیقی بنائیں! ✨",
                "تخلیقی صلاحیت جادو کی طرح ہے - یہ سب میں ہے! 🪄"
            ],
            "professor_paws": [
                "کیا ایک دلچسپ سوال ہے! مجھے آپ کو سب کچھ بتانے دیں! 🔍",
                "کیا آپ جانتے ہیں؟ دنیا حیرت انگیز حقائق سے بھری ہے! 🌍",
                "سائنس جوابات کی تلاش کی طرح ہے! 🗝️",
                "تجسس آپ کو ہر دن ذہین بناتا ہے! پوچھتے رہیں! 🧠"
            ],
            "voice_assistant": [
                "میں آپ کی مدد کے لیے یہاں ہوں! آپ کیا جاننا چاہتے ہیں؟ 🎙️",
                "یہ ایک دلچسپ سوال ہے! مجھے آپ کی مدد کرنے دیں! ✨",
                "میں آپ کے لیے اس کے بارے میں سوچ رہا ہوں! 💭",
                "میں آپ کے دن کو بہتر کیسے بنا سکتا ہوں؟ 😊"
            ]
        }
        
        fallbacks = fallbacks_ur if language == "ur" else fallbacks_en
        agent_fallbacks = fallbacks.get(agent.key, fallbacks.get("buddy", ["I'm here to help! 🌟"]))
        import random
        return random.choice(agent_fallbacks)
    
    def generate_game_question(
        self, 
        game_type: str, 
        difficulty: str, 
        agent_key: str = "buddy"
    ) -> Dict:
        """Generate a game question using AI"""
        prompts = {
            "math": f"Generate a {difficulty} math problem for a child. Include the question and answer. Format as JSON with: question, answer, hint",
            "spelling": f"Generate a {difficulty} spelling word for a child. Include the word and a hint. Format as JSON with: word, hint",
            "riddle": f"Generate a {difficulty} riddle for a child. Include question and answer. Format as JSON with: question, answer, hint",
            "trivia": f"Generate a {difficulty} trivia question for a child about science/nature. Format as JSON with: question, answer, fact",
            "scene_description": f"Generate a {difficulty} scene description activity for a child. Describe a scene and ask what they see. Format as JSON with: scene, questions (array), answers (array)"
        }
        
        prompt = prompts.get(game_type, prompts["math"])
        response = self.generate_response(prompt, agent_key)
        
        if response.error:
            return {"error": response.error, "question": "What is 2+2?", "answer": "4"}
        
        try:
            # Try to parse JSON from response
            import re
            json_match = re.search(r'\{[^}]+\}', response.text)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        return {"question": response.text, "answer": "", "hint": "Think carefully!"}
    
    def get_personalized_hint(
        self, 
        game_type: str, 
        question: str, 
        wrong_attempts: int,
        agent_key: str = "buddy"
    ) -> str:
        """Get personalized hint based on child's performance"""
        prompt = f"""The child is playing {game_type}. The question is: "{question}". 
They've attempted {wrong_attempts} times incorrectly. 
Give a gentle, encouraging hint without giving away the answer. 
Keep it simple and child-friendly."""
        
        response = self.generate_response(prompt, agent_key)
        return response.text if not response.error else "Keep trying! You're getting closer! 💪"
    
    def continue_story(
        self,
        current_story: str,
        child_choice: str,
        agent_key: str = "story_weaver",
        turns_left: int = 5,
        language: str = "en"
    ) -> Dict:
        """Continue a story based on child's choice with dynamic, contextual options."""

        if turns_left <= 0:
            if language == "ur":
                ending_instruction = (
                    "یہ آخری باب ہے۔ ایک خوبصورت، حوصلہ افزا اختتام لکھیں "
                    "(3-5 جملے) جو مہم جوئی کو حل کرے۔ "
                    '"choices" کو خالی array [] میں سیٹ کریں۔'
                )
                language_instruction = "براہ کرم اپنا جواب اردو میں دیں۔"
            else:
                ending_instruction = (
                    "This is the FINAL chapter. Write a satisfying, uplifting conclusion "
                    "(3-5 sentences) that resolves the adventure. "
                    'Set "choices" to an empty array [].'
                )
                language_instruction = "Please respond in English."
        else:
            if language == "ur":
                ending_instruction = (
                    f"ابھی {turns_left} باب(وں) باقی ہیں۔ "
                    "کہانی کا اگلا دلچسپ حصہ لکھیں (3-5 جملے)۔ "
                    "پھر بالک کے لیے بالکل 3 مختلف انتخاب فراہم کریں۔ "
                    "ہر انتخاب کہانی میں جو ابھی ہوا اس کے لیے مخصوص ہونا چاہیے۔ "
                    "ہر انتخاب کے لیے ایک متعلقہ emoji شامل کریں۔"
                )
                language_instruction = "براہ کرم اپنا جواب اردو میں دیں۔"
            else:
                ending_instruction = (
                    f"There are {turns_left} chapter(s) left. "
                    "Write the next exciting part of the story (3-5 sentences). "
                    "Then provide exactly 3 short, distinct choices for what the child can do next. "
                    "Each choice must be specific to what just happened in the story — not generic. "
                    "Include a relevant emoji icon for each choice."
                )
                language_instruction = "Please respond in English."

        if language == "ur":
            prompt = f"""آپ 5-12 سال کے بچوں کے لیے ایک گرم، تخیل پر مبنی کہانی سنانے والے ہیں۔

اب تک کی کہانی:
{current_story}

بچے کا عمل: "{child_choice}"

سخت اصول — آپ کو یہ بالکل درست طریقے سے پیروی کرنی ہے:
- صرف خالص کہانی کی نثر لکھیں۔ اپنی سوچ کی وضاحت نہ کریں۔
- بچے کے انتخاب کا نام لے کر نہ بتائیں یا "چونکہ آپ نے منتخب کیا..." جیسی بات نہ کہیں۔
- چوتھی دیوار کو توڑیں نہ یا گیم کا حوالہ دیں۔
- بس کہانی کو جاری رکھیں جیسے یہ عمل قدرتی طور پر ہوا۔
- {ending_instruction}
- {language_instruction}

آؤٹ پٹ فارمیٹ — صرف درست JSON کے ساتھ جواب دیں:
{{
  "narrative": "<خالص کہانی کی نثر، 3-5 جملے>",
  "choices": [
    {{"label": "<مختصر عمل کا جملہ>", "icon": "<ایک emoji>"}},
    {{"label": "<مختصر عمل کا جملہ>", "icon": "<ایک emoji>"}},
    {{"label": "<مختصر عمل کا جملہ>", "icon": "<ایک emoji>"}}
  ]
}}"""
        else:
            prompt = f"""You are a warm, imaginative storyteller for children aged 5-12.

STORY SO FAR:
{current_story}

THE CHILD'S ACTION: "{child_choice}"

STRICT RULES — you MUST follow these exactly:
- Write ONLY pure story prose. Never explain your own reasoning.
- Never mention the child's choice by name or say things like "Since you chose..." or "As you decided to...".
- Never break the fourth wall or reference the game.
- Just continue the story as if the action happened naturally.
- {ending_instruction}
- {language_instruction}

OUTPUT FORMAT — respond with ONLY valid JSON, nothing else before or after:
{{
  "narrative": "<pure story prose, 3-5 sentences>",
  "choices": [
    {{"label": "<short action phrase>", "icon": "<single emoji>"}},
    {{"label": "<short action phrase>", "icon": "<single emoji>"}},
    {{"label": "<short action phrase>", "icon": "<single emoji>"}}
  ]
}}"""

        response = self.generate_response(prompt, agent_key, use_cache=False)

        if response.error and not response.text:
            if language == "ur":
                return {
                    "narrative": (
                        "مہم جوئی ایک غیر متوقع موڑ لیتی ہے! کچھ جادوئی ہوتا ہے "
                        "بالکل کونے میں۔"
                    ),
                    "choices": [
                        {"label": "احتیاط سے ارد گرد دیکھیں", "icon": "👀"},
                        {"label": "مدد کے لیے پکاریں",     "icon": "📣"},
                        {"label": "روشنی کی پیروی کریں",      "icon": "✨"},
                    ],
                }
            else:
                return {
                    "narrative": (
                        "The adventure takes an unexpected turn! Something magical happens "
                        "just around the corner."
                    ),
                    "choices": [
                        {"label": "Look around carefully", "icon": "👀"},
                        {"label": "Call out for help",     "icon": "📣"},
                        {"label": "Follow the light",      "icon": "✨"},
                    ],
                }

        # Try to extract and parse JSON from the response
        try:
            import re, json as _json

            text = response.text.strip()

            # Strip markdown code fences if present
            text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
            text = re.sub(r'\s*```$', '', text)
            text = text.strip()

            # Find the outermost JSON object
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                parsed = _json.loads(json_match.group())
                if "narrative" in parsed:
                    narrative = str(parsed["narrative"]).strip()
                    choices   = parsed.get("choices")
                    if not isinstance(choices, list) or len(choices) == 0:
                        choices = []
                    # Sanitise each choice
                    clean_choices = []
                    for c in choices:
                        if isinstance(c, dict) and c.get("label"):
                            clean_choices.append({
                                "label": str(c["label"]).strip(),
                                "icon":  str(c.get("icon", "✨")).strip(),
                            })
                    return {"narrative": narrative, "choices": clean_choices}
        except Exception as e:
            print(f"Story JSON parse error: {e}")

        # Last-resort fallback: use raw text as narrative
        raw = response.text.strip() if response.text else ""
        # Strip any partial JSON artifacts
        raw = re.sub(r'\{.*', '', raw, flags=re.DOTALL).strip() if raw else ""
        if language == "ur":
            return {
                "narrative": raw or "کہانی ایک حیرت انگیز طریقے سے جاری رہتی ہے!",
                "choices": [
                    {"label": "مزید دریافت کریں",       "icon": "✨"},
                    {"label": "کسی دوست سے بات کریں",   "icon": "🗣️"},
                    {"label": "ایک خفیہ راستہ تلاش کریں", "icon": "🔍"},
                ],
            }
        else:
            return {
                "narrative": raw or "The adventure continues in a surprising way!",
                "choices": [
                    {"label": "Explore more",       "icon": "✨"},
                    {"label": "Talk to a friend",   "icon": "🗣️"},
                    {"label": "Find a secret path", "icon": "🔍"},
                ],
            }
    
    def explain_concept(
        self,
        concept: str,
        age: int = 8,
        agent_key: str = "professor_paws"
    ) -> str:
        """Explain a concept in age-appropriate way"""
        prompt = f"""Explain "{concept}" to a {age}-year-old child.
Use simple language, analogies they can understand, and make it fun!
Keep it to 2-3 sentences."""
        
        response = self.generate_response(prompt, agent_key)
        return response.text if not response.error else f"{concept} is really interesting! Let's explore it together! 🔍"
    
    def generate_encouragement(self, context: str = "") -> str:
        """Generate encouraging message"""
        encouragements = [
            "You're doing amazing! Keep it up! 🌟",
            "Wow, great effort! I'm so proud of you! 💪",
            "You're getting better every day! 🎉",
            "Fantastic work! You should be proud! 🏆",
            "I knew you could do it! Excellent job! ⭐",
            "You're a superstar! Keep shining! ✨",
            "Brilliant thinking! You're so smart! 🧠",
            "Way to go! You're crushing it! 🚀"
        ]
        import random
        return random.choice(encouragements)


class AIImageValidator:
    """
    AI Image Validation Agent.
    Uses Groq's llama-3.2-11b-vision-preview to verify that a downloaded
    image actually depicts its intended label before it's stored in the DB.

    Usage:
        validator = AIImageValidator()
        ok = validator.verify_image_match(url="https://...", label="Orange")
        if ok:
            # save to DB
    """

    MODEL = "llama-3.2-90b-vision-preview"
    MAX_RETRIES = 1

    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "")
        self._client = Groq(api_key=api_key) if api_key else None
        self._model_available = True

    def verify_image_match(self, image_bytes: bytes, label: str) -> bool:
        if not self._client or not self._model_available:
            return True

        if not image_bytes:
            return False

        base64_img = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{base64_img}"

        prompt = (
            f"Look at this image carefully. Does it clearly and primarily show a '{label}'? "
            f"Answer with ONLY the word YES or NO. Do not explain."
        )

        for attempt in range(self.MAX_RETRIES):
            try:
                response = self._client.chat.completions.create(
                    model=self.MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": data_uri}},
                                {"type": "text", "text": prompt},
                            ],
                        }
                    ],
                    max_tokens=5,
                    temperature=0.0,
                )
                answer = response.choices[0].message.content.strip().upper()
                return answer.startswith("YES")
            except Exception as exc:
                if "decommissioned" in str(exc) or "400" in str(exc) or "404" in str(exc):
                    print(f"  [AIImageValidator] Model decommissioned on Groq. Disabling vision validation for speed.")
                    self._model_available = False
                    return True
                
                if attempt == self.MAX_RETRIES - 1:
                    print(f"  [AIImageValidator] Error verifying '{label}': {exc} — defaulting to accept")
                    return True
                time.sleep(1)
        return True


# Singleton instance
_ai_service = None
_ai_service_lock = Lock()

def get_ai_service() -> UnifiedAIService:
    """Get or create singleton AI service instance"""
    global _ai_service
    if _ai_service is None:
        with _ai_service_lock:
            if _ai_service is None:
                _ai_service = UnifiedAIService()
    return _ai_service
