"""
Voice Agent Launcher
Run this script to start the voice agent server
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from voice_service import app

if __name__ == '__main__':
    print("=" * 50)
    print("🎙️ Dhyan Voice Agent Starting...")
    print("=" * 50)
    print("\nFeatures:")
    print("  ✓ Voice recognition with Google Speech API")
    print("  ✓ Speaker verification (optional)")
    print("  ✓ Music playback from YouTube")
    print("  ✓ AI chat with cute voice effects")
    print("  ✓ Thinking sounds while processing")
    print("\nAccess the interface at: http://localhost:5000")
    print("=" * 50)
    
    # Check for API key
    if not os.getenv("GROQ_API_KEY"):
        print("\n⚠️  Warning: GROQ_API_KEY not set!")
        print("   Set it in Backend/.env file\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
