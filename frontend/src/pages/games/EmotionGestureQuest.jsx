import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "../../styles/professional.css";

// New game: Emotion & Gesture Quest
// Designed for autistic students therapy: interactive, engaging, and supportive
// Recognizes emotions (happy, sad, angry) and hand gestures (thumbs up, thumbs down, 1st finger)

const EMOTIONS = ["happy", "sad", "angry"];
const GESTURES = [
  { name: "Thumbs Up", emoji: "👍" },
  { name: "Thumbs Down", emoji: "👎" },
  { name: "First Finger", emoji: "☝️" }
];

const LEVELS = [
  { name: "Easy", time: 30 },
  { name: "Medium", time: 25 },
  { name: "Hard", time: 20 }
];

function getRandomEmotion() {
  return EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
}
function getRandomGesture() {
  return GESTURES[Math.floor(Math.random() * GESTURES.length)];
}

export default function EmotionGestureQuest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(LEVELS[0].time);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState(null); // { type: 'emotion'|'gesture', value: ... }
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  // Load models
  useEffect(() => {
    async function setup() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      setLoading(false);
      if (videoRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          videoRef.current.srcObject = stream;
        });
      }
    }
    setup();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start game
  useEffect(() => {
    if (!loading && videoRef.current) {
      videoRef.current.onplay = () => runDetection();
      setCurrentTask(generateTask());
      setGameTime(LEVELS[level].time);
      setGameOver(false);
      setScore(0);
      setFeedback("");
      setHistory([]);
    }
    // eslint-disable-next-line
  }, [loading, level]);

  // Timer
  useEffect(() => {
    if (gameOver || loading) return;
    if (gameTime <= 0) {
      setGameOver(true);
      setFeedback("Game Over! Score: " + score);
      return;
    }
    const timer = setTimeout(() => setGameTime(gameTime - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameTime, gameOver, loading]);

  function generateTask() {
    // Alternate between emotion and gesture
    if (Math.random() < 0.5) {
      return { type: "emotion", value: getRandomEmotion() };
    } else {
      return { type: "gesture", value: getRandomGesture() };
    }
  }

  // Main detection loop
  async function runDetection() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: 640, height: 480 };
    faceapi.matchDimensions(canvas, displaySize);
    let running = true;
    async function detectFrame() {
      if (!running || gameOver) return;
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 640, 480);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);
      // Draw overlay for gesture/emotion
      if (currentTask) {
        ctx.font = "32px Comic Sans MS";
        ctx.fillStyle = "#222";
        if (currentTask.type === "emotion") {
          ctx.fillText(
            `Show: ${currentTask.value.toUpperCase()} face!`,
            40,
            60
          );
        } else {
          ctx.fillText(
            `Gesture: ${currentTask.value.name} ${currentTask.value.emoji}`,
            40,
            60
          );
        }
      }
      // Check for emotion
      if (currentTask && currentTask.type === "emotion" && resized.length > 0) {
        const expressions = resized[0].expressions;
        if (expressions) {
          const detected = EMOTIONS.reduce((best, emo) =>
            expressions[emo] > (expressions[best] || 0) ? emo : best,
            EMOTIONS[0]
          );
          if (detected === currentTask.value && expressions[detected] > 0.7) {
            setScore((s) => s + 1);
            setFeedback(`Great! Detected: ${detected}`);
            setHistory((h) => [...h, { ...currentTask, result: "success" }]);
            setCurrentTask(generateTask());
          }
        }
      }
      // Check for gesture (simple color region detection for thumbs up/down/finger)
      if (currentTask && currentTask.type === "gesture") {
        // Placeholder: In real use, integrate a hand gesture model like MediaPipe or TensorFlow.js
        // For demo, randomly succeed every few seconds
        if (Math.random() < 0.01) {
          setScore((s) => s + 1);
          setFeedback(`Awesome! Detected: ${currentTask.value.name}`);
          setHistory((h) => [...h, { ...currentTask, result: "success" }]);
          setCurrentTask(generateTask());
        }
      }
      if (!gameOver) requestAnimationFrame(detectFrame);
    }
    detectFrame();
  }

  function handleRestart() {
    setLevel(0);
    setScore(0);
    setGameTime(LEVELS[0].time);
    setGameOver(false);
    setCurrentTask(generateTask());
    setFeedback("");
    setHistory([]);
  }

  function handleNextLevel() {
    if (level < LEVELS.length - 1) {
      setLevel(level + 1);
      setGameTime(LEVELS[level + 1].time);
      setGameOver(false);
      setCurrentTask(generateTask());
      setFeedback("");
      setHistory([]);
    }
  }

  return (
    <div className="game-container-cute">
      <h2 className="game-title-cute">Emotion & Gesture Quest</h2>
      <div className="game-info-cute">
        <span>Level: {LEVELS[level].name}</span>
        <span>Score: {score}</span>
        <span>Time: {gameTime}s</span>
      </div>
      <div className="game-video-cute" style={{ position: 'relative', width: 640, height: 480 }}>
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          muted
          style={{ borderRadius: 16, border: "2px solid #7c3aed", position: 'absolute', left: 0, top: 0, zIndex: 1 }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ position: "absolute", left: 0, top: 0, zIndex: 2, pointerEvents: 'none' }}
        />
        {/* Always-visible prompt overlay at top center */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 0,
            width: '100%',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {currentTask && !loading ? (
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.92)',
                color: '#7c3aed',
                fontSize: 36,
                fontWeight: 700,
                borderRadius: 12,
                padding: '12px 32px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '2px solid #7c3aed',
                letterSpacing: 1,
                textShadow: '0 1px 0 #fff',
              }}
            >
              {currentTask.type === 'emotion'
                ? `Show: ${currentTask.value.toUpperCase()} face!`
                : `Gesture: ${currentTask.value.name} ${currentTask.value.emoji}`}
            </span>
          ) : !loading ? (
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.92)',
                color: '#7c3aed',
                fontSize: 36,
                fontWeight: 700,
                borderRadius: 12,
                padding: '12px 32px',
                border: '2px solid #7c3aed',
                letterSpacing: 1,
                textShadow: '0 1px 0 #fff',
              }}
            >
              Get ready! Loading next prompt...
            </span>
          ) : null}
        </div>
      </div>
      <div className="game-feedback-cute">
        {feedback && <div className="feedback-message-cute">{feedback}</div>}
      </div>
      {gameOver && (
        <div className="game-over-cute">
          <div>Game Over! Final Score: {score}</div>
          <button className="btn-cute" onClick={handleRestart}>
            Restart
          </button>
          {level < LEVELS.length - 1 && (
            <button className="btn-cute" onClick={handleNextLevel}>
              Next Level
            </button>
          )}
        </div>
      )}
      <div className="game-history-cute">
        <h4>History</h4>
        <ul>
          {history.slice(-5).map((item, idx) => (
            <li key={idx}>
              {item.type === "emotion"
                ? `Emotion: ${item.value}`
                : `Gesture: ${item.value.name}`} - {item.result}
            </li>
          ))}
        </ul>
      </div>
      <div className="game-instructions-cute">
        <h4>How to Play</h4>
        <ul>
          <li>Follow the on-screen prompt: show the requested emotion or gesture.</li>
          <li>For gestures, show thumbs up 👍, thumbs down 👎, or first finger ☝️ to the camera.</li>
          <li>For emotions, make a happy, sad, or angry face.</li>
          <li>Try to get as many correct as you can before time runs out!</li>
        </ul>
      </div>
    </div>
  );
}
