"""
AI API Endpoints
REST API endpoints for AI services
"""

import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache

from ..ai_services.unified_ai_service import (
    get_ai_service, 
    AIAgentRegistry,
    AIResponse
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    """
    Main AI chat endpoint
    Generate response from any AI agent
    """
    try:
        data = request.data
        message = data.get('message', '').strip()
        agent_key = data.get('agent', 'buddy')
        history = data.get('history', [])
        stream = data.get('stream', False)
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate agent
        if not AIAgentRegistry.agent_exists(agent_key):
            return Response(
                {'error': f'Unknown agent: {agent_key}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get AI service
        ai_service = get_ai_service()
        
        # Generate response
        response = ai_service.generate_response(
            message=message,
            agent_key=agent_key,
            history=history,
            stream=stream
        )
        
        if response.error and not response.text:
            return Response(
                {
                    'error': response.error,
                    'text': 'I apologize, but I\'m having trouble right now. Please try again!',
                    'agent': agent_key
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        return Response({
            'text': response.text,
            'agent': response.agent_key,
            'model': response.model,
            'processing_time': response.processing_time,
            'cached': response.cached,
            'error': response.error
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_agents(request):
    """Get list of all available AI agents"""
    agents = AIAgentRegistry.get_all_agents()
    return Response([
        {
            'key': agent.key,
            'name': agent.name,
            'avatar': agent.avatar,
            'color': agent.color,
        }
        for agent in agents
    ])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_game_question(request):
    """Generate AI-powered game question"""
    try:
        data = request.data
        game_type = data.get('game_type')
        difficulty = data.get('difficulty')
        agent_key = data.get('agent', 'buddy')
        
        if not game_type or not difficulty:
            return Response(
                {'error': 'game_type and difficulty are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = get_ai_service()
        question_data = ai_service.generate_game_question(game_type, difficulty, agent_key)
        
        return Response(question_data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_personalized_hint(request):
    """Get AI-generated personalized hint"""
    try:
        data = request.data
        game_type = data.get('game_type')
        question = data.get('question')
        wrong_attempts = data.get('wrong_attempts', 0)
        agent_key = data.get('agent', 'buddy')
        
        if not all([game_type, question]):
            return Response(
                {'error': 'game_type and question are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = get_ai_service()
        hint = ai_service.get_personalized_hint(game_type, question, wrong_attempts, agent_key)
        
        return Response({'hint': hint})
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def continue_story(request):
    """Continue a story based on child's input"""
    try:
        data = request.data
        current_story = data.get('current_story')
        child_choice = data.get('child_choice')
        agent_key = data.get('agent', 'story_weaver')
        
        if not all([current_story, child_choice]):
            return Response(
                {'error': 'current_story and child_choice are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = get_ai_service()
        continuation = ai_service.continue_story(current_story, child_choice, agent_key)
        
        return Response({'continuation': continuation})
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_encouragement(request):
    """Generate encouraging message for child"""
    try:
        data = request.data or {}
        context = data.get('context', '')
        
        ai_service = get_ai_service()
        message = ai_service.generate_encouragement(context)
        
        return Response({'message': message})
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def explain_concept(request):
    """Explain a concept in age-appropriate way"""
    try:
        data = request.data
        concept = data.get('concept')
        age = data.get('age', 8)
        agent_key = data.get('agent', 'professor_paws')
        
        if not concept:
            return Response(
                {'error': 'concept is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = get_ai_service()
        explanation = ai_service.explain_concept(concept, age, agent_key)
        
        return Response({
            'concept': concept,
            'explanation': explanation,
            'age': age
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_health(request):
    """Check AI service health"""
    ai_service = get_ai_service()
    
    return Response({
        'available': ai_service.is_available(),
        'agents': len(AIAgentRegistry.get_all_agents()),
        'agent_list': [a.key for a in AIAgentRegistry.get_all_agents()]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_content(request):
    """Generate educational content using AI"""
    try:
        from ..ai_services.content_generator import AIContentGenerator
        
        data = request.data
        content_type = data.get('content_type')
        theme = data.get('theme')
        age = data.get('age', 8)
        length = data.get('length', 'short')
        
        if not content_type or not theme:
            return Response(
                {'error': 'content_type and theme are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        generator = AIContentGenerator()
        
        if content_type == 'story':
            content = generator.generate_story(theme, age, length)
        elif content_type == 'poem':
            content = generator.generate_poem(theme)
        elif content_type == 'activity':
            content = generator.generate_activity(theme, age)
        else:
            return Response(
                {'error': f'Unknown content_type: {content_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(content)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
