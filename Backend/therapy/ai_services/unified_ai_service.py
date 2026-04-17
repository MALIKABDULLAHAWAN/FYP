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
            name="Buddy",
            avatar="🎮",
            color="#4ECDC4",
            system_prompt="""You are Buddy, a friendly AI learning companion for children aged 5-12. 
Your personality is encouraging, patient, and fun. You help kids with educational games, 
explains concepts simply, and celebrates their achievements. Use emojis, simple language, 
and always be supportive. You specialize in making learning fun and engaging.""",
            model="llama-3.3-70b-versatile",
            temperature=0.8
        ),
        
        "story_weaver": AIAgent(
            key="story_weaver",
            name="Story Weaver",
            avatar="📚",
            color="#9B59B6",
            system_prompt="""You are Story Weaver, a creative AI storyteller for children. 
You create engaging, age-appropriate stories with morals, adventures, and fun characters. 
You can continue stories based on user input, create interactive choose-your-own-adventure tales, 
and adapt stories to the child's interests. Always keep content child-friendly and educational.""",
            model="llama-3.3-70b-versatile",
            temperature=0.9
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
            name="Aura",
            avatar="🎙️",
            color="#9B59B6",
            system_prompt="""You are Aura, a friendly and helpful voice assistant with a cute and playful personality. 
You aim to assist users with a wide range of questions and tasks, 
providing clear and concise answers with a touch of fun. Keep responses short and engaging.""",
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=512
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
    
    def generate_response(
        self, 
        message: str, 
        agent_key: str = "buddy",
        history: List[Dict] = None,
        use_cache: bool = True,
        stream: bool = False
    ) -> AIResponse:
        """
        Generate AI response
        
        Args:
            message: User message
            agent_key: Which AI agent to use
            history: Conversation history
            use_cache: Whether to use caching
            stream: Whether to stream response
            
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
            fallback = self._generate_fallback_response(message, agent)
            return AIResponse(
                text=fallback,
                agent_key=agent_key,
                model="fallback",
                processing_time=time.time() - start_time,
                error="AI service not available, using fallback"
            )
        
        # Build messages
        messages = [{"role": "system", "content": agent.system_prompt}]
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
            fallback = self._generate_fallback_response(message, agent)
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
    
    def _generate_fallback_response(self, message: str, agent: AIAgent) -> str:
        """Generate fallback response when AI is unavailable"""
        fallbacks = {
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
        
        agent_fallbacks = fallbacks.get(agent.key, fallbacks["buddy"])
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
        agent_key: str = "story_weaver"
    ) -> str:
        """Continue a story based on child's choice"""
        prompt = f"""Continue this story based on the child's choice:
    
Story so far: "{current_story}"
Child's choice: "{child_choice}"

Write 2-3 engaging sentences that continue the story and end with a question or choice for the child."""
        
        response = self.generate_response(prompt, agent_key)
        return response.text if not response.error else "What happens next? You decide! ✨"
    
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
