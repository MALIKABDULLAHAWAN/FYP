"""
WEBSOCKET ROUTING CONFIGURATION
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Game room for multiplayer
    re_path(r'ws/game/(?P<room_code>\w+)/$', consumers.GameRoomConsumer.as_asgi()),
    
    # Progress tracking for therapists/parents
    re_path(r'ws/progress/(?P<child_id>\d+)/$', consumers.ProgressTrackingConsumer.as_asgi()),
    
    # Notifications
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', consumers.NotificationConsumer.as_asgi()),
    
    # Voice agent
    re_path(r'ws/voice/(?P<session_id>\w+)/$', consumers.VoiceAgentConsumer.as_asgi()),
]
