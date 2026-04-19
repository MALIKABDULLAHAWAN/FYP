"""
API ENDPOINTS FOR AI CONTENT GENERATION
Uses free LLM APIs (Groq) for dynamic educational content
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from ..ai_services.content_generator import content_generator


@require_http_methods(["GET", "POST"])
def generate_story(request):
    """Generate an AI educational story
    GET/POST /api/v1/therapy/ai/generate-story/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        theme = data.get('theme', 'friendship')
        age = int(data.get('age', 8))
        length = data.get('length', 'short')
        
        story = content_generator.generate_story(theme, age, length)
        
        return JsonResponse({
            'success': True,
            'data': story,
            'generated_by': 'AI (Groq/LLaMA)',
            'theme': theme,
            'target_age': age
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET", "POST"])
def generate_poem(request):
    """Generate an AI poem
    GET/POST /api/v1/therapy/ai/generate-poem/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        topic = data.get('topic', 'nature')
        style = data.get('style', 'rhyming')
        
        poem = content_generator.generate_poem(topic, style)
        
        return JsonResponse({
            'success': True,
            'data': poem,
            'generated_by': 'AI (Groq/LLaMA)',
            'topic': topic
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET", "POST"])
def generate_riddle(request):
    """Generate an AI riddle
    GET/POST /api/v1/therapy/ai/generate-riddle/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        difficulty = data.get('difficulty', 'medium')
        category = data.get('category', 'general')
        
        riddle = content_generator.generate_riddle(difficulty, category)
        
        return JsonResponse({
            'success': True,
            'data': riddle,
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET", "POST"])
def generate_math_problem(request):
    """Generate an AI math word problem
    GET/POST /api/v1/therapy/ai/generate-math/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        difficulty = data.get('difficulty', 'easy')
        topic = data.get('topic', 'arithmetic')
        
        problem = content_generator.generate_math_problem(difficulty, topic)
        
        return JsonResponse({
            'success': True,
            'data': problem,
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET", "POST"])
def generate_spelling_word(request):
    """Generate AI spelling content
    GET/POST /api/v1/therapy/ai/generate-spelling/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        grade_level = int(data.get('grade_level', 2))
        
        word_data = content_generator.generate_spelling_word(grade_level)
        
        return JsonResponse({
            'success': True,
            'data': word_data,
            'generated_by': 'AI (Groq/LLaMA)',
            'grade_level': grade_level
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET", "POST"])
def generate_trivia(request):
    """Generate AI trivia question
    GET/POST /api/v1/therapy/ai/generate-trivia/
    """
    try:
        if request.method == "POST":
            data = json.loads(request.body)
        else:
            data = request.GET
        
        category = data.get('category', 'science')
        difficulty = data.get('difficulty', 'medium')
        
        trivia = content_generator.generate_trivia_question(category, difficulty)
        
        return JsonResponse({
            'success': True,
            'data': trivia,
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def generate_learning_activity(request):
    """Generate complete learning activity
    POST /api/v1/therapy/ai/generate-activity/
    """
    try:
        data = json.loads(request.body)
        
        subject = data.get('subject', 'math')
        skill_level = data.get('skill_level', 'beginner')
        duration = int(data.get('duration', 15))
        
        activity = content_generator.generate_learning_activity(
            subject, skill_level, duration
        )
        
        return JsonResponse({
            'success': True,
            'data': activity,
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def personalize_content(request):
    """Personalize content for child
    POST /api/v1/therapy/ai/personalize/
    """
    try:
        data = json.loads(request.body)
        
        child_name = data.get('child_name', 'Friend')
        interests = data.get('interests', ['learning'])
        content_type = data.get('content_type', 'encouragement')
        
        personalized = content_generator.personalize_content(
            child_name, interests, content_type
        )
        
        return JsonResponse({
            'success': True,
            'data': {
                'text': personalized,
                'child_name': child_name,
                'interests': interests,
                'content_type': content_type
            },
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def analyze_response(request):
    """Analyze child's response and provide feedback
    POST /api/v1/therapy/ai/analyze-response/
    """
    try:
        data = json.loads(request.body)
        
        question = data.get('question', '')
        child_answer = data.get('child_answer', '')
        correct_answer = data.get('correct_answer', '')
        
        analysis = content_generator.analyze_child_response(
            question, child_answer, correct_answer
        )
        
        return JsonResponse({
            'success': True,
            'data': analysis,
            'analyzed_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def batch_generate(request):
    """Batch generate content for a full game session
    POST /api/v1/therapy/ai/batch-generate/
    """
    try:
        data = json.loads(request.body)
        
        game_type = data.get('game_type', 'mixed')
        count = int(data.get('count', 5))
        difficulty = data.get('difficulty', 'medium')
        
        results = []
        
        generators = {
            'riddles': content_generator.generate_riddle,
            'math': lambda: content_generator.generate_math_problem(difficulty),
            'spelling': lambda: content_generator.generate_spelling_word(2 if difficulty == 'easy' else 4),
            'trivia': lambda: content_generator.generate_trivia_question('general', difficulty)
        }
        
        generator = generators.get(game_type, generators['trivia'])
        
        for _ in range(count):
            content = generator()
            if content:
                results.append(content)
        
        return JsonResponse({
            'success': True,
            'data': {
                'game_type': game_type,
                'count': len(results),
                'items': results,
                'difficulty': difficulty
            },
            'generated_by': 'AI (Groq/LLaMA)'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
