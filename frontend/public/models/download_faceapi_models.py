# Download face-api.js model weights for browser use
# Place this script in your FYP/frontend/public/models directory and run it with Python 3
import urllib.request

base_url = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/"
files = [
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_landmark_68_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1",
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
]

for file in files:
    print(f"Downloading {file}...")
    urllib.request.urlretrieve(base_url + file, file)
print("All model files downloaded.")
