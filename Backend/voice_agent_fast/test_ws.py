import asyncio
import websockets
import json

async def test_dhyan():
    uri = "ws://localhost:8001/ws/voice"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            # 1. Listen for initial status
            init_msg = await websocket.recv()
            print(f"Server: {init_msg}")
            
            # 2. Send a command
            command = {"type": "text_command", "text": "Hi Dhyan!", "child_id": 1}
            print(f"Sending: {command}")
            await websocket.send(json.dumps(command))
            
            # 3. Listen for responses
            while True:
                try:
                    resp = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(resp)
                    print(f"Dhyan ({data['type']}): {data.get('text', data.get('message', ''))}")
                    
                    if data['type'] == 'response_end':
                        print("Test SUCCESS!")
                        break
                except asyncio.TimeoutError:
                    print("Test FAILED: Timeout waiting for response")
                    break
    except Exception as e:
        print(f"Connection FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_dhyan())
