"""
AI CONTENT GENERATOR SERVICE
Uses Groq API and other free LLMs for dynamic educational content
"""

import os
import json
import requests
from typing import Dict, List, Optional
from django.conf import settings


class AIContentGenerator:
    """
    Generates dynamic educational content using free LLM APIs
    """
    
    def __init__(self):
        self.groq_api_key = os.getenv('GROQ_API_KEY', '')
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY', '')
        self.base_url = "https://api.groq.com/openai/v1"
        self.models = {
            'fast': 'llama-3.1-8b-instant',
            'balanced': 'llama-3.1-70b-versatile',
            'quality': 'mixtral-8x7b-32768'
        }
        self.cache = {}
    
    def _call_groq(self, messages: List[Dict], model: str = None, temperature: float = 0.7) -> Optional[str]:
        """Call Groq API for content generation"""
        if not self.groq_api_key:
            return None
        
        model = model or self.models['balanced']
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": 1024
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            
            return None
        except Exception as e:
            print(f"Groq API Error: {e}")
            return None
    
    def generate_story(self, theme: str, age: int = 8, length: str = 'short') -> Dict:
        """Generate an educational story opening chapter."""
        cache_key = f"story_{theme}_{age}_{length}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        theme_contexts = {
            "space":   "outer space, rockets, planets, and alien worlds",
            "forest":  "an enchanted forest full of talking animals and magic",
            "ocean":   "the deep ocean with mermaids, sea creatures, and sunken treasure",
            "castle":  "a medieval castle with dragons, knights, and wizards",
            "jungle":  "a lush jungle with exotic animals and hidden temples",
            "volcano": "a volcanic island with fire spirits and ancient mysteries",
        }
        context = theme_contexts.get(theme, f"a magical world of {theme}")

        word_target = {"short": "4-6", "medium": "7-9", "long": "10-12"}.get(length, "4-6")

        prompt = f"""You are a warm, imaginative storyteller for children aged {age}.

Write the OPENING CHAPTER of an adventure story set in {context}.

Requirements:
- Write {word_target} sentences that set the scene vividly
- Introduce the child as the hero ("You are…")
- Use age-appropriate vocabulary for a {age}-year-old
- End at an exciting moment of choice
- Provide exactly 3 specific, fun choices for what the child can do next
  (make them specific to the scene, not generic)

OUTPUT FORMAT — respond with ONLY this JSON (no markdown, no extra text):
{{
  "title": "<short adventure title>",
  "content": "<the opening chapter text>",
  "choices": [
    {{"label": "<short action phrase>", "icon": "<single emoji>"}},
    {{"label": "<short action phrase>", "icon": "<single emoji>"}},
    {{"label": "<short action phrase>", "icon": "<single emoji>"}}
  ]
}}"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['quality'], temperature=0.85)

        if response:
            try:
                json_str = self._extract_json(response)
                story = json.loads(json_str)
                # Ensure required keys exist
                if "content" in story:
                    self.cache[cache_key] = story
                    return story
            except Exception:
                pass

        return self._fallback_story(theme, age)
    
    def generate_poem(self, topic: str, style: str = 'rhyming') -> Dict:
        """Generate a poem for children"""
        cache_key = f"poem_{topic}_{style}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        prompt = f"""Write a {style} poem about {topic} for children aged 6-12.

Requirements:
- Fun and engaging
- Easy to understand
- 4-8 stanzas
- Rhyme scheme if rhyming style
- Include imagery children can visualize

Format as JSON with: title, content (array of stanzas), topic, rhyming_scheme"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['balanced'], temperature=0.9)
        
        if response:
            try:
                json_str = self._extract_json(response)
                poem = json.loads(json_str)
                self.cache[cache_key] = poem
                return poem
            except:
                return self._fallback_poem(topic)
        
        return self._fallback_poem(topic)
    
    def generate_riddle(self, difficulty: str = 'medium', category: str = 'general') -> Dict:
        """Generate a unique riddle"""
        prompt = f"""Create a {difficulty} difficulty riddle in the {category} category for children.

Requirements:
- Clever but solvable
- Age-appropriate
- Not too obscure
- Should make kids think

Format as JSON with: question, answer, hint, difficulty, category, explanation"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['fast'], temperature=0.8)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        return self._fallback_riddle(difficulty)
    
    def generate_math_problem(self, difficulty: str = 'easy', topic: str = 'arithmetic') -> Dict:
        """Generate a contextual math word problem"""
        prompt = f"""Create a {difficulty} math word problem about {topic} for elementary students.

Requirements:
- Real-world scenario kids can relate to
- Clear question
- Show your work explanation
- Age-appropriate context

Format as JSON with: 
- problem (the word problem text)
- answer (numerical answer)
- work_steps (array of solution steps)
- difficulty
- topic
- hint"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['fast'], temperature=0.7)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        return self._fallback_math(difficulty, topic)
    
    def generate_spelling_word(self, grade_level: int = 2) -> Dict:
        """Generate spelling word with definitions and usage"""
        prompt = f"""Generate a grade {grade_level} appropriate spelling word.

Requirements:
- Appropriate difficulty for grade {grade_level}
- Commonly used word
- Interesting definition
- Usage in a sentence
- Memory aid/mnemonic

Format as JSON with:
- word
- definition
- part_of_speech
- example_sentence
- syllables
- phonetic_spelling
- memory_aid
- difficulty_level"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['fast'], temperature=0.7)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        return self._fallback_spelling(grade_level)
    
    def generate_trivia_question(self, category: str = 'science', difficulty: str = 'medium') -> Dict:
        """Generate trivia question with multiple choice"""
        prompt = f"""Create a {difficulty} trivia question about {category} for children aged 8-12.

Requirements:
- Educational and interesting
- Four multiple choice options
- Only ONE correct answer
- Fun fact to learn more

Format as JSON with:
- question
- options (array of 4 strings)
- correct_answer (index 0-3)
- category
- difficulty
- fun_fact"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['balanced'], temperature=0.8)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        return self._fallback_trivia(category, difficulty)
    
    def generate_learning_activity(self, subject: str, skill_level: str, duration: int = 15) -> Dict:
        """Generate a complete learning activity/lesson plan"""
        prompt = f"""Create a {duration}-minute {subject} learning activity for {skill_level} level students.

Include:
- Learning objectives
- Materials needed (if any)
- Step-by-step instructions
- Assessment questions
- Extension activities

Format as JSON with:
- title
- subject
- duration_minutes
- objectives (array)
- materials (array)
- instructions (array of steps)
- assessment (array of questions)
- extensions (array)"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['quality'], temperature=0.7)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        return self._fallback_activity(subject, skill_level)
    
    def personalize_content(self, child_name: str, interests: List[str], content_type: str) -> str:
        """Personalize existing content with child's name and interests"""
        interests_str = ', '.join(interests)
        
        prompt = f"""Personalize this {content_type} for a child named {child_name} who loves {interests_str}.

Create a short, encouraging {content_type} (50-100 words) that:
- Uses their name naturally
- References their interests
- Is age-appropriate and positive
- {content_type} should be engaging

Return only the personalized text."""

        messages = [{"role": "user", "content": prompt}]
        return self._call_groq(messages, model=self.models['fast'], temperature=0.9) or \
               f"Hey {child_name}! Keep up the amazing work! 🌟"
    
    def analyze_child_response(self, question: str, child_answer: str, correct_answer: str) -> Dict:
        """Analyze child's response and provide feedback"""
        prompt = f"""Analyze this child's learning response:

Question: {question}
Child's Answer: {child_answer}
Correct Answer: {correct_answer}

Provide constructive feedback:
- Was the answer correct? (boolean)
- What misconception might they have? (if wrong)
- How to guide them to the right answer? (gentle hint)
- Encouraging message

Format as JSON:
- is_correct (boolean)
- misconception (string or null)
- guidance (string)
- encouragement (string)
- next_step (string)"""

        messages = [{"role": "user", "content": prompt}]
        response = self._call_groq(messages, model=self.models['balanced'], temperature=0.6)
        
        if response:
            try:
                json_str = self._extract_json(response)
                return json.loads(json_str)
            except:
                pass
        
        is_correct = child_answer.lower().strip() == correct_answer.lower().strip()
        return {
            'is_correct': is_correct,
            'misconception': None if is_correct else 'Possible confusion',
            'guidance': f"Think about: {correct_answer}" if not is_correct else "Great thinking!",
            'encouragement': "You're doing great! Keep trying!" if not is_correct else "Excellent work!",
            'next_step': 'Try another question' if is_correct else 'Review and try again'
        }
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text response"""
        # Try to find JSON between code blocks
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            return text[start:end].strip()
        
        # Try to find JSON between curly braces
        start = text.find('{')
        end = text.rfind('}') + 1
        if start >= 0 and end > start:
            return text[start:end]
        
        return text
    
    # ============ FALLBACK CONTENT ============
    
    def _fallback_story(self, theme: str, age: int) -> Dict:
        fallbacks = {
            "space":   {
                "title": "Lost in the Stars",
                "content": "You are an astronaut floating through the galaxy when your rocket starts beeping. A small green alien waves at you from a nearby asteroid. You have to decide what to do next!",
                "choices": [
                    {"label": "Wave back at the alien",  "icon": "👋"},
                    {"label": "Check the rocket alarm",  "icon": "🔧"},
                    {"label": "Fly closer to the asteroid", "icon": "🚀"},
                ],
            },
            "forest":  {
                "title": "The Enchanted Forest",
                "content": "You step into a glowing forest where the trees whisper your name. A tiny fairy lands on your shoulder and says she needs your help to find the lost golden acorn. The path splits in three directions!",
                "choices": [
                    {"label": "Follow the sparkling trail", "icon": "✨"},
                    {"label": "Ask the wise old tree",       "icon": "🌳"},
                    {"label": "Listen for the acorn's glow", "icon": "🌟"},
                ],
            },
            "ocean":   {
                "title": "Secrets of the Deep",
                "content": "You dive into the crystal-blue ocean and discover a hidden underwater city. A friendly dolphin swims up and nudges a glowing map into your hands. The map shows three paths to a sunken treasure!",
                "choices": [
                    {"label": "Follow the dolphin",          "icon": "🐬"},
                    {"label": "Read the glowing map",        "icon": "🗺️"},
                    {"label": "Swim toward the coral arch",  "icon": "🪸"},
                ],
            },
            "castle":  {
                "title": "The Dragon's Castle",
                "content": "You arrive at a towering castle where a friendly dragon is crying — someone stole the magic crown! The dragon asks for your help. You spot three clues near the castle gate.",
                "choices": [
                    {"label": "Examine the muddy footprints", "icon": "👣"},
                    {"label": "Ask the castle guard",          "icon": "⚔️"},
                    {"label": "Search the tower window",       "icon": "🏰"},
                ],
            },
        }
        fb = fallbacks.get(theme, {
            "title": f"The {theme.title()} Adventure",
            "content": f"You are about to begin an amazing adventure in a magical {theme}. Something incredible is waiting just around the corner!",
            "choices": [
                {"label": "Look around",   "icon": "👀"},
                {"label": "Keep going",    "icon": "🚶"},
                {"label": "Find a friend", "icon": "🤝"},
            ],
        })
        return fb
    
    def _fallback_poem(self, topic: str) -> Dict:
        return {
            'title': f'Ode to {topic.title()}',
            'content': [f'{topic} is wonderful,', 'It makes me smile each day,', 'I love to learn about it,', 'In every single way!'],
            'topic': topic,
            'rhyming_scheme': 'AABB'
        }
    
    def _fallback_riddle(self, difficulty: str) -> Dict:
        return {
            'question': 'What has keys but no locks?',
            'answer': 'A piano',
            'hint': 'You play it',
            'difficulty': difficulty,
            'category': 'general',
            'explanation': 'Pianos have keys (like a keyboard) but no locks'
        }
    
    def _fallback_math(self, difficulty: str, topic: str) -> Dict:
        return {
            'problem': 'If you have 5 apples and eat 2, how many do you have left?',
            'answer': 3,
            'work_steps': ['Start with 5 apples', 'Subtract 2 apples', '5 - 2 = 3'],
            'difficulty': difficulty,
            'topic': topic,
            'hint': 'Think about counting backwards'
        }
    
    def _fallback_spelling(self, grade_level: int) -> Dict:
        words = ['cat', 'house', 'beautiful', 'extraordinary']
        word = words[min(grade_level - 1, 3)]
        return {
            'word': word,
            'definition': f'A common word with {len(word)} letters',
            'part_of_speech': 'noun',
            'example_sentence': f'The {word} is nice.',
            'syllables': len(word) // 2,
            'phonetic_spelling': '-'.join(word),
            'memory_aid': f'Remember: {word[0]}...',
            'difficulty_level': grade_level
        }
    
    def _fallback_trivia(self, category: str, difficulty: str) -> Dict:
        return {
            'question': 'What is the capital of France?',
            'options': ['Paris', 'London', 'Berlin', 'Rome'],
            'correct_answer': 0,
            'category': category,
            'difficulty': difficulty,
            'fun_fact': 'Paris is known as the City of Light!'
        }
    
    def _fallback_activity(self, subject: str, skill_level: str) -> Dict:
        return {
            'title': f'{subject} Learning Activity',
            'subject': subject,
            'duration_minutes': 15,
            'objectives': ['Learn basics', 'Practice skills'],
            'materials': ['Paper', 'Pencil'],
            'instructions': ['Read the problem', 'Think about it', 'Write your answer'],
            'assessment': ['What did you learn?'],
            'extensions': ['Try harder problems']
        }


# Create singleton instance
content_generator = AIContentGenerator()
