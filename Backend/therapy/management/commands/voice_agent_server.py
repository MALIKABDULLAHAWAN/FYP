"""
Management command to run the voice agent server
Integrates standalone voice agent with Django
"""

import os
import sys
import subprocess
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Run the voice agent server (Flask app)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--port',
            type=int,
            default=5000,
            help='Port to run voice agent on (default: 5000)'
        )
        parser.add_argument(
            '--host',
            type=str,
            default='0.0.0.0',
            help='Host to bind to (default: 0.0.0.0)'
        )
        parser.add_argument(
            '--no-ssl',
            action='store_true',
            help='Run without SSL (for development)'
        )
        parser.add_argument(
            '--init-only',
            action='store_true',
            help='Initialize directories and exit'
        )

    def handle(self, *args, **options):
        port = options['port']
        host = options['host']
        no_ssl = options['no_ssl']
        init_only = options['init_only']

        # Find voice agent directory
        backend_dir = Path(settings.BASE_DIR)
        voice_agent_dir = backend_dir / 'voice_agent'
        app_file = voice_agent_dir / 'app.py'

        if not app_file.exists():
            raise CommandError(
                f'Voice agent not found at {app_file}\n'
                'Please ensure voice_agent/app.py exists.'
            )

        # Check for GROQ_API_KEY
        groq_key = os.getenv('GROQ_API_KEY', '')
        if not groq_key or groq_key == 'your_groq_api_key_here':
            self.stdout.write(
                self.style.WARNING(
                    'Warning: GROQ_API_KEY not configured. '
                    'Voice agent will run in fallback mode.'
                )
            )

        # Initialize directories
        self._init_directories(voice_agent_dir)

        if init_only:
            self.stdout.write(self.style.SUCCESS('Directories initialized'))
            return

        # Run voice agent
        self.stdout.write(
            self.style.NOTICE(f'Starting voice agent on {host}:{port}...')
        )

        env = os.environ.copy()
        env['PYTHONPATH'] = str(backend_dir)

        cmd = [
            sys.executable,
            str(app_file)
        ]

        # Override host/port via environment
        env['VOICE_HOST'] = host
        env['VOICE_PORT'] = str(port)
        if no_ssl:
            env['VOICE_NO_SSL'] = '1'

        try:
            subprocess.run(cmd, cwd=str(voice_agent_dir), env=env)
        except KeyboardInterrupt:
            self.stdout.write(self.style.NOTICE('Voice agent stopped'))
        except Exception as e:
            raise CommandError(f'Failed to start voice agent: {e}')

    def _init_directories(self, voice_agent_dir):
        """Create necessary directories for voice agent"""
        dirs = [
            voice_agent_dir / 'music',
            voice_agent_dir / 'temp',
            voice_agent_dir / 'audio_cache',
            voice_agent_dir / 'enrolled_references',
        ]

        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)
            self.stdout.write(f'  Created: {d}')
