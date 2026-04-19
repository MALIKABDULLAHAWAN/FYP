"""
WEBSOCKET CONSUMERS FOR REAL-TIME FEATURES
Supports multiplayer games, live progress tracking, and chat
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Child, GameSession, TherapySession
import asyncio
from datetime import datetime


class GameRoomConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for multiplayer game rooms
    Supports real-time competitive and collaborative games
    """
    
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'game_{self.room_code}'
        self.player_id = None
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify room of new connection
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_joined',
                'player_id': 'unknown',
                'message': 'A player has joined the room'
            }
        )
    
    async def disconnect(self, close_code):
        # Leave room group
        if self.player_id:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_left',
                    'player_id': self.player_id,
                    'message': f'Player {self.player_id} left'
                }
            )
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            handlers = {
                'join': self.handle_join,
                'answer': self.handle_answer,
                'ready': self.handle_ready,
                'start_game': self.handle_start_game,
                'chat': self.handle_chat,
                'progress': self.handle_progress,
                'power_up': self.handle_power_up,
                'emoji': self.handle_emoji,
                'ping': self.handle_ping
            }
            
            handler = handlers.get(message_type, self.handle_default)
            await handler(data)
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
    
    async def handle_join(self, data):
        """Player joins the room"""
        self.player_id = data.get('player_id')
        player_name = data.get('player_name', 'Anonymous')
        
        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_joined',
                'player_id': self.player_id,
                'player_name': player_name,
                'timestamp': datetime.now().isoformat()
            }
        )
    
    async def handle_answer(self, data):
        """Player submits an answer"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_answered',
                'player_id': self.player_id,
                'answer': data.get('answer'),
                'question_id': data.get('question_id'),
                'time_taken': data.get('time_taken'),
                'is_correct': data.get('is_correct'),
                'timestamp': datetime.now().isoformat()
            }
        )
    
    async def handle_ready(self, data):
        """Player is ready to start"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_ready',
                'player_id': self.player_id,
                'ready': data.get('ready', True)
            }
        )
    
    async def handle_start_game(self, data):
        """Host starts the game"""
        game_config = data.get('config', {})
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_started',
                'host_id': self.player_id,
                'config': game_config,
                'start_time': datetime.now().isoformat()
            }
        )
    
    async def handle_chat(self, data):
        """Player sends chat message"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'player_id': self.player_id,
                'player_name': data.get('player_name', 'Anonymous'),
                'message': data.get('message'),
                'timestamp': datetime.now().isoformat()
            }
        )
    
    async def handle_progress(self, data):
        """Player progress update"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'progress_update',
                'player_id': self.player_id,
                'score': data.get('score'),
                'questions_answered': data.get('questions_answered'),
                'current_streak': data.get('current_streak'),
                'progress_percent': data.get('progress_percent')
            }
        )
    
    async def handle_power_up(self, data):
        """Player uses power-up"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'power_up_used',
                'player_id': self.player_id,
                'power_up': data.get('power_up'),
                'target_player': data.get('target_player')  # For targeted power-ups
            }
        )
    
    async def handle_emoji(self, data):
        """Player sends emoji reaction"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'emoji_reaction',
                'player_id': self.player_id,
                'emoji': data.get('emoji'),
                'timestamp': datetime.now().isoformat()
            }
        )
    
    async def handle_ping(self, data):
        """Ping/pong for latency check"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': datetime.now().isoformat(),
            'received': data.get('timestamp')
        }))
    
    async def handle_default(self, data):
        """Default message handler"""
        await self.send(text_data=json.dumps({
            'error': f'Unknown message type: {data.get("type")}'
        }))
    
    # ==================== BROADCAST HANDLERS ====================
    
    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'player_id': event.get('player_id'),
            'player_name': event.get('player_name'),
            'timestamp': event.get('timestamp')
        }))
    
    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_left',
            'player_id': event.get('player_id'),
            'message': event.get('message')
        }))
    
    async def player_answered(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_answered',
            'player_id': event.get('player_id'),
            'answer': event.get('answer'),
            'question_id': event.get('question_id'),
            'time_taken': event.get('time_taken'),
            'is_correct': event.get('is_correct')
        }))
    
    async def player_ready(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_ready',
            'player_id': event.get('player_id'),
            'ready': event.get('ready')
        }))
    
    async def game_started(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_started',
            'host_id': event.get('host_id'),
            'config': event.get('config'),
            'start_time': event.get('start_time')
        }))
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'player_id': event.get('player_id'),
            'player_name': event.get('player_name'),
            'message': event.get('message'),
            'timestamp': event.get('timestamp')
        }))
    
    async def progress_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'progress',
            'player_id': event.get('player_id'),
            'score': event.get('score'),
            'questions_answered': event.get('questions_answered'),
            'current_streak': event.get('current_streak'),
            'progress_percent': event.get('progress_percent')
        }))
    
    async def power_up_used(self, event):
        await self.send(text_data=json.dumps({
            'type': 'power_up',
            'player_id': event.get('player_id'),
            'power_up': event.get('power_up'),
            'target_player': event.get('target_player')
        }))
    
    async def emoji_reaction(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emoji',
            'player_id': event.get('player_id'),
            'emoji': event.get('emoji'),
            'timestamp': event.get('timestamp')
        }))


class ProgressTrackingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket for real-time progress tracking
    Used by therapists/parents to monitor child progress live
    """
    
    async def connect(self):
        self.child_id = self.scope['url_route']['kwargs']['child_id']
        self.progress_group = f'progress_{self.child_id}'
        
        # Verify therapist/parent authorization here
        # For now, accept all connections
        
        await self.channel_layer.group_add(
            self.progress_group,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial data
        initial_data = await self.get_child_progress()
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'data': initial_data
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.progress_group,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data.get('type') == 'request_update':
            progress = await self.get_child_progress()
            await self.send(text_data=json.dumps({
                'type': 'progress_update',
                'data': progress
            }))
    
    async def progress_update(self, event):
        """Receive progress update from channel layer"""
        await self.send(text_data=json.dumps({
            'type': 'live_update',
            'data': event.get('data')
        }))
    
    @database_sync_to_async
    def get_child_progress(self):
        """Fetch child progress from database"""
        try:
            child = Child.objects.get(id=self.child_id)
            sessions = TherapySession.objects.filter(child=child).order_by('-start_time')[:10]
            
            return {
                'child_name': child.first_name,
                'total_sessions': TherapySession.objects.filter(child=child).count(),
                'recent_sessions': [
                    {
                        'id': s.id,
                        'date': s.start_time.isoformat(),
                        'status': s.status,
                        'duration': s.duration_minutes if hasattr(s, 'duration_minutes') else None
                    }
                    for s in sessions
                ],
                'current_session': sessions[0].status if sessions else None
            }
        except Child.DoesNotExist:
            return {'error': 'Child not found'}


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket for real-time notifications
    Achievement unlocks, milestone alerts, etc.
    """
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group = f'notifications_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.notification_group,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle subscription changes"""
        data = json.loads(text_data)
        
        if data.get('type') == 'mark_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_read(notification_id)
    
    async def notification_message(self, event):
        """Send notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification_type': event.get('notification_type'),
            'title': event.get('title'),
            'message': event.get('message'),
            'data': event.get('data'),
            'timestamp': event.get('timestamp'),
            'priority': event.get('priority', 'normal')
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read in database"""
        # Implementation would mark notification as read
        pass


class VoiceAgentConsumer(AsyncWebsocketConsumer):
    """
    WebSocket for enhanced voice agent features
    Real-time speech processing and command handling
    """
    
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs'].get('session_id', 'default')
        self.voice_group = f'voice_{self.session_id}'
        
        await self.channel_layer.group_add(
            self.voice_group,
            self.channel_name
        )
        
        await self.accept()
        
        # Send welcome message
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'session_id': self.session_id,
            'capabilities': [
                'speech_recognition',
                'text_to_speech',
                'command_processing',
                'wake_word_detection'
            ]
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.voice_group,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle voice commands and audio data"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'voice_command':
            command = data.get('command')
            confidence = data.get('confidence', 1.0)
            
            # Process command
            response = await self.process_command(command, confidence)
            
            await self.send(text_data=json.dumps({
                'type': 'command_response',
                'original_command': command,
                'confidence': confidence,
                'action': response.get('action'),
                'response_text': response.get('text'),
                'processed': True
            }))
        
        elif message_type == 'transcript':
            # Handle speech-to-text transcript
            transcript = data.get('text')
            is_final = data.get('is_final', False)
            
            await self.send(text_data=json.dumps({
                'type': 'transcript_received',
                'text': transcript,
                'is_final': is_final,
                'timestamp': datetime.now().isoformat()
            }))
    
    async def process_command(self, command, confidence):
        """Process voice command and return action"""
        # Command processing logic
        commands = {
            'start game': {'action': 'start_game', 'text': 'Starting a new game!'},
            'stop': {'action': 'stop_game', 'text': 'Stopping the game.'},
            'help': {'action': 'show_help', 'text': 'Here is how to play...'},
            'repeat': {'action': 'repeat', 'text': 'Let me say that again.'},
            'hint': {'action': 'show_hint', 'text': 'Here is a hint...'},
            'score': {'action': 'show_score', 'text': 'Your current score is...'},
        }
        
        command_lower = command.lower()
        for cmd, response in commands.items():
            if cmd in command_lower:
                return response
        
        return {'action': 'unknown', 'text': 'I did not understand. Can you try again?'}
    
    async def voice_response(self, event):
        """Send voice response to client"""
        await self.send(text_data=json.dumps({
            'type': 'voice_response',
            'text': event.get('text'),
            'audio_url': event.get('audio_url'),
            'emotion': event.get('emotion', 'neutral')
        }))


# Room management utilities
class GameRoomManager:
    """Utility class for managing game rooms"""
    
    rooms = {}
    
    @classmethod
    def create_room(cls, room_code, host_id, game_type, config=None):
        cls.rooms[room_code] = {
            'host_id': host_id,
            'game_type': game_type,
            'config': config or {},
            'players': {},
            'status': 'waiting',
            'created_at': datetime.now().isoformat()
        }
        return cls.rooms[room_code]
    
    @classmethod
    def join_room(cls, room_code, player_id, player_name):
        if room_code in cls.rooms:
            cls.rooms[room_code]['players'][player_id] = {
                'name': player_name,
                'joined_at': datetime.now().isoformat(),
                'ready': False,
                'score': 0
            }
            return True
        return False
    
    @classmethod
    def get_room(cls, room_code):
        return cls.rooms.get(room_code)
    
    @classmethod
    def update_player_score(cls, room_code, player_id, score):
        if room_code in cls.rooms and player_id in cls.rooms[room_code]['players']:
            cls.rooms[room_code]['players'][player_id]['score'] = score
    
    @classmethod
    def close_room(cls, room_code):
        if room_code in cls.rooms:
            del cls.rooms[room_code]
