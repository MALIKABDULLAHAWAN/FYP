import os
import sys
from pathlib import Path

# Setup paths
BASE_DIR = Path("C:/Users/alido/Downloads/FYP/FYP")
sys.path.append(str(BASE_DIR / "Backend"))

# Mock Django settings if needed
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from therapy.ai_services.unified_ai_service import get_ai_service

def test_unified_service():
    print("Initializing Unified AI Service...")
    service = get_ai_service()
    
    if not service.is_available():
        print("CRITICAL: AI Service not available! (Check GROQ_API_KEY)")
        return

    print("Sending test message...")
    try:
        response = service.generate_response(
            message="Hi there!",
            agent_key="buddy",
            use_cache=False
        )
        print(f"SUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"FAILURE during response generation: {e}")

if __name__ == "__main__":
    test_unified_service()
