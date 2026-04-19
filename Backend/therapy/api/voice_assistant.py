"""
API Endpoints for DHYAN Voice Assistant
"""

import os
import tempfile
from pathlib import Path
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json

# Import voice assistant service
try:
    from therapy.ai_services.voice_assistant import get_voice_assistant
    VOICE_ASSISTANT_AVAILABLE = True
except ImportError as e:
    print(f"[VoiceAPI] Voice assistant not available: {e}")
    VOICE_ASSISTANT_AVAILABLE = False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_voice_command(request):
    """
    Process a text-based voice command
    
    POST /api/v1/therapy/voice/command/
    
    Body:
    {
        "command": "tell me a joke",
        "generate_audio": true
    }
    
    Response:
    {
        "success": true,
        "command": "tell me a joke",
        "response": "Why did the chicken...",
        "audio_url": "/media/voice/response_xxx.mp3",
        "chunks": ["chunk1", "chunk2"]
    }
    """
    try:
        if not VOICE_ASSISTANT_AVAILABLE:
            return JsonResponse({
                'success': False,
                'error': 'Voice assistant service not available'
            }, status=503)
        
        # Parse request
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        command = data.get('command', '').strip()
        generate_audio = data.get('generate_audio', True)
        
        if not command:
            return JsonResponse({
                'success': False,
                'error': 'No command provided'
            }, status=400)
        
        # Get voice assistant
        assistant = get_voice_assistant()
        
        # Process command
        result = assistant.process_command(command, generate_audio=generate_audio)
        
        # Build audio URLs if audio was generated
        if result.get('audio_paths'):
            from django.conf import settings
            audio_urls = []
            for path in result['audio_paths']:
                # Make path relative to audio_cache to get voice_cache filename
                rel_path = Path(path).relative_to(assistant.audio_cache)
                audio_urls.append(f"/media/voice_cache/{rel_path}")
            result['audio_urls'] = audio_urls
            result['audio_url'] = audio_urls[0] if audio_urls else None
        
        # Remove server paths from response
        result.pop('audio_paths', None)
        result.pop('audio_path', None)
        
        return JsonResponse({
            'success': True,
            **result
        })
        
    except Exception as e:
        print(f"[VoiceAPI] Error processing command: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_voice_audio(request):
    """
    Process an audio file voice command
    
    POST /api/v1/therapy/voice/audio/
    
    Form data:
    - audio: Audio file (wav, mp3, etc.)
    - child_id: Optional child ID
    
    Response:
    {
        "success": true,
        "transcription": "tell me a joke",
        "response": "Why did the chicken...",
        "audio_url": "/media/voice/response_xxx.mp3"
    }
    """
    try:
        if not VOICE_ASSISTANT_AVAILABLE:
            return JsonResponse({
                'success': False,
                'error': 'Voice assistant service not available'
            }, status=503)
        
        # Check for audio file
        if 'audio' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No audio file provided'
            }, status=400)
        
        audio_file = request.FILES['audio']
        child_id = request.POST.get('child_id') or request.data.get('child_id')
        
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        
        try:
            # Get voice assistant
            assistant = get_voice_assistant()
            
            # Process audio
            result = assistant.process_audio_command(tmp_path, child_id=child_id)
            
            # Build audio URLs
            if result.get('audio_paths'):
                from django.conf import settings
                audio_urls = []
                for path in result['audio_paths']:
                    rel_path = Path(path).relative_to(assistant.audio_cache)
                    audio_urls.append(f"/media/voice_cache/{rel_path}")
                result['audio_urls'] = audio_urls
                result['audio_url'] = audio_urls[0] if audio_urls else None
            
            # Clean up paths
            result.pop('audio_paths', None)
            result.pop('audio_path', None)
            
            return JsonResponse(result)
            
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
        
    except Exception as e:
        print(f"[VoiceAPI] Error processing audio: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_voice_playback(request):
    """
    Stop current voice playback
    
    POST /api/v1/therapy/voice/stop/
    """
    try:
        if not VOICE_ASSISTANT_AVAILABLE:
            return JsonResponse({
                'success': False,
                'error': 'Voice assistant not available'
            }, status=503)
        
        assistant = get_voice_assistant()
        assistant.stop_playback()
        
        return JsonResponse({
            'success': True,
            'message': 'Playback stopped'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_voice_history(request):
    """
    Clear conversation history
    
    POST /api/v1/therapy/voice/clear-history/
    """
    try:
        if not VOICE_ASSISTANT_AVAILABLE:
            return JsonResponse({
                'success': False,
                'error': 'Voice assistant not available'
            }, status=503)
        
        assistant = get_voice_assistant()
        assistant.clear_history()
        
        return JsonResponse({
            'success': True,
            'message': 'Conversation history cleared'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def voice_assistant_status(request):
    """
    Get voice assistant status
    
    GET /api/v1/therapy/voice/status/
    """
    return JsonResponse({
        'available': VOICE_ASSISTANT_AVAILABLE,
        'features': {
            'text_commands': True,
            'audio_commands': VOICE_ASSISTANT_AVAILABLE,
            'speaker_recognition': False,  # Not implemented yet
            'music_playback': False,  # Requires mpg123 setup
        }
    })
