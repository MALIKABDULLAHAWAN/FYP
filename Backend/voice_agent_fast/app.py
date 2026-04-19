import os
import json
import asyncio
import uuid
import base64
import time
import logging
import sys
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import groq
import edge_tts
from typing import List, Dict, Any
from contextlib import asynccontextmanager

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='dhyan_core.log',
    filemode='a'
)
logger = logging.getLogger("dhyan_voice")

# Django Interop
os.environ["DJANGO_ALLOW_ASYNC_QUERY"] = "true"

# Paths
BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "Backend"))
sys.path.append(str(Path(__file__).resolve().parent))

# Load .env
load_dotenv(BASE_DIR / ".env")

from task_agent import task_agent
from music_service import music_service

orchestrator = None

class HighSpeedOrchestrator:
    AGENTS = {
        "buddy": {"name": "Dhyan Budd", "system": "You are Dhyan, a playful AI companion for kids (5-12). Bubbly, cute, energetic! 1-3 sentences. ✨"},
        "story_weaver": {"name": "Story Spinner", "system": "You are Story Spinner. Create short magical interactive tales for kids. 🌙"},
        "translator": {"name": "Dhyan Translate", "system": "Translate between English and Urdu naturally and fun! 🌎"},
        "task_master": {"name": "Dhyan Helper", "system": "Helpful AI explaining progress and features. Encouraging!"}
    }

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key: 
            logger.error("GROQ_API_KEY missing from environment")
            raise ValueError("GROQ_API_KEY missing")
        
        try:
            # Explicitly initialize with no-proxy client if environment causes issues
            import httpx
            http_client = httpx.Client(proxies=None)
            self.client = groq.Groq(api_key=api_key, http_client=http_client)
            logger.info("Groq Client initialized with explicit httpx client (no proxies)")
        except Exception as e:
            logger.warning(f"Failed explicit client init, falling back: {e}")
            self.client = groq.Groq(api_key=api_key)
            
        self.model = os.getenv("AI_MODEL_DEFAULT", "llama-3.3-70b-versatile")

    async def get_response(self, text: str, history: List[Dict], child_id: int = None):
        if not self.client:
            return {"text": "I'm still waking up! Can you wait a second? ✨", "agent": "buddy", "nav_command": None}
            
        logger.info(f"Orchestrating response for: {text}")
        try:
            intent = await self._detect_intent(text)
        except Exception as e:
            logger.error(f"Intent detection failed: {e}")
            intent = "buddy"
            
        agent_config = self.AGENTS.get(intent, self.AGENTS['buddy'])
        
        extra_context = ""
        nav_command = None

        if intent == "task" and child_id:
            try:
                summary = await asyncio.wait_for(task_agent.get_child_summary(child_id), timeout=3.0)
                if summary: extra_context = f"\n[Data]: {json.dumps(summary)}"
            except Exception as e:
                logger.warning(f"Task summary fetch failed: {e}")

        elif intent == "navigation":
            try:
                nav_command = await self._map_navigation(text)
            except Exception as e:
                logger.warning(f"Nav mapping failed: {e}")

        messages = [{"role": "system", "content": agent_config['system']}]
        messages.append({"role": "user", "content": text + extra_context})

        try:
            completion = await asyncio.to_thread(
                self.client.chat.completions.create, 
                messages=messages, 
                model=self.model, 
                temperature=0.7
            )
            return {"text": completion.choices[0].message.content, "agent": intent, "nav_command": nav_command}
        except Exception as e:
            logger.error(f"Groq API Error: {e}")
            return {"text": "I lost my train of thought! Can you say that again? ✨", "agent": "buddy", "nav_command": None}

    async def _detect_intent(self, text):
        try:
            prompt = f"Categorize: 'buddy', 'story', 'translation', 'task', or 'navigation'. Text: '{text}'. Respond ONLY with the word."
            resp = await asyncio.to_thread(self.client.chat.completions.create, messages=[{"role": "user", "content": prompt}], model=self.model, max_tokens=10)
            return resp.choices[0].message.content.lower().strip().replace(".", "")
        except Exception as e: 
            logger.error(f"Intent detection API call failed: {e}")
            return "buddy"

    async def _map_navigation(self, text):
        try:
            prompt = f"Map user request '{text}' to route: /dashboard, /games, /profile, /settings. Respond only with the route or 'none'."
            resp = await asyncio.to_thread(self.client.chat.completions.create, messages=[{"role": "user", "content": prompt}], model=self.model, max_tokens=20)
            res = resp.choices[0].message.content.strip()
            return res if "/" in res else None
        except Exception as e:
            logger.error(f"Nav mapping API call failed: {e}")
            return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestrator
    print("STARTING DHYAN VOICE SERVICE...")
    try:
        orchestrator = HighSpeedOrchestrator()
        print("DHYAN READY: Orchestrator initialized successfully! ⚡")
    except Exception as e:
        print(f"DHYAN FATAL ERROR: Failed to start orchestrator: {e}")
        logger.critical(f"FATAL STARTUP ERROR: {e}")
    yield
    print("SHUTTING DOWN DHYAN VOICE SERVICE...")

app = FastAPI(title="Dhyan High-Speed", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("NEW CONNECTION: WebSocket accepted.")
    
    await websocket.send_json({"type": "status", "message": "Dhyan is online! ✨"})

    try:
        while True:
            # use receive_json for reliability
            payload = await websocket.receive_json()
            print(f"MESSAGE RECEIVED: {payload}")
            
            if payload.get("type") == "text_command":
                text = payload.get("text")
                child_id = payload.get("child_id")
                
                await websocket.send_json({"type": "status", "message": "Thinking... 🤔"})
                
                if not orchestrator:
                    await websocket.send_json({"type": "error", "message": "Assistant not ready. Reconnecting..."})
                    continue

                ai_resp = await orchestrator.get_response(text, [], child_id)
                print(f"AI RESPONSE: {ai_resp['text'][:50]}...")
                
                await websocket.send_json({
                    "type": "response_start",
                    "text": ai_resp["text"],
                    "agent": ai_resp["agent"],
                    "nav_command": ai_resp["nav_command"]
                })
                
                # Handling Music vs TTS
                if any(w in text.lower() for w in ["sing", "play", "music"]):
                    music_path = await asyncio.to_thread(music_service.get_song, text)
                    if music_path and os.path.exists(music_path):
                        with open(music_path, "rb") as f:
                            while chunk := f.read(64000):
                                await websocket.send_json({"type": "music_chunk", "data": base64.b64encode(chunk).decode("utf-8")})
                else:
                    await websocket.send_json({"type": "status", "message": "Speaking... 🗣️"})
                    is_urdu = any("\u0600" <= c <= "\u06FF" for c in ai_resp["text"])
                    voice = "ur-PK-AsadNeural" if is_urdu else "en-US-AnaNeural"
                    try:
                        communicate = edge_tts.Communicate(ai_resp["text"], voice)
                        async for chunk in communicate.stream():
                            if chunk["type"] == "audio":
                                await websocket.send_json({"type": "audio_chunk", "data": base64.b64encode(chunk["data"]).decode("utf-8")})
                    except Exception: pass

                await websocket.send_json({"type": "response_end"})

    except WebSocketDisconnect:
        print("DISCONNECTED: Session closed.")
    except Exception as e:
        print(f"SOCKET ERROR: {e}")
        try: await websocket.send_json({"type": "error", "message": "Oops! Something went wrong."})
        except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
