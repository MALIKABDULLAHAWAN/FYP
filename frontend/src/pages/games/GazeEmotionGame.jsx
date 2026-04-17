import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import UiIcon from "../../components/ui/UiIcon";
import "../../styles/professional.css";

const LEVELS = [
  { name: "Easy", targetRadius: 40, time: 30, smileThreshold: 0.7 },
  { name: "Medium", targetRadius: 30, time: 30, smileThreshold: 0.8 },
  { name: "Hard", targetRadius: 20, time: 30, smileThreshold: 0.9 },
];

export default function GazeEmotionGame() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [smileCount, setSmileCount] = useState(0);
  const [target, setTarget] = useState({ x: 320, y: 240 });
  const [gameTime, setGameTime] = useState(LEVELS[0].time);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!loading && videoRef.current) {
      videoRef.current.onplay = () => runDetection();
    }
    // eslint-disable-next-line
  }, [loading]);

  function randomTarget() {
    const margin = 60;
    return {
      x: Math.floor(Math.random() * (640 - margin * 2)) + margin,
      y: Math.floor(Math.random() * (480 - margin * 2)) + margin,
    };
  }

  async function runDetection() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: 640, height: 480 };
    faceapi.matchDimensions(canvas, displaySize);
    let start = Date.now();
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
      // Draw target
      ctx.beginPath();
      ctx.arc(target.x, target.y, LEVELS[level].targetRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,255,0,0.3)";
      ctx.fill();
      // Gaze/Smile logic
      if (detections.length > 0) {
        const face = detections[0];
        const eyes = face.landmarks.getLeftEye().concat(face.landmarks.getRightEye());
        const eyeCenter = eyes.reduce((acc, pt) => [acc[0] + pt.x, acc[1] + pt.y], [0, 0]).map((v) => v / eyes.length);
        // Draw eye center
        ctx.beginPath();
        ctx.arc(eyeCenter[0], eyeCenter[1], 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#00f";
        ctx.fill();
        // Check gaze hit
        if (
          Math.abs(eyeCenter[0] - target.x) < LEVELS[level].targetRadius &&
          Math.abs(eyeCenter[1] - target.y) < LEVELS[level].targetRadius
        ) {
          setScore((s) => s + 1);
          setTarget(randomTarget());
        }
        // Smile detection
        if (face.expressions.happy > LEVELS[level].smileThreshold) {
          setSmileCount((c) => c + 1);
        }
      }
      // Timer
      let elapsed = Math.floor((Date.now() - start) / 1000);
      setGameTime(LEVELS[level].time - elapsed);
      if (elapsed >= LEVELS[level].time) {
        running = false;
        setGameOver(true);
        return;
      }
      requestAnimationFrame(detectFrame);
    }
    detectFrame();
  }

  function nextLevel() {
    setLevel((l) => l + 1);
    setScore(0);
    setSmileCount(0);
    setGameTime(LEVELS[level + 1]?.time || 30);
    setGameOver(false);
    setTarget(randomTarget());
    runDetection();
  }

  function restart() {
    setLevel(0);
    setScore(0);
    setSmileCount(0);
    setGameTime(LEVELS[0].time);
    setGameOver(false);
    setTarget(randomTarget());
    runDetection();
  }

  return (
    <div className="game-cute-panel" style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontFamily: "var(--font-fun)", fontWeight: 800, fontSize: 32, marginBottom: 12 }}>
        <UiIcon name="eye" size={32} /> Gaze & Emotion Game
      </h2>
      <div style={{ marginBottom: 16, color: "var(--color-text-secondary)" }}>
        Move your eyes to the target and smile! Level up as you score more points.
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <video ref={videoRef} width={640} height={480} autoPlay muted style={{ borderRadius: 16, border: "2px solid #eee", marginBottom: 8 }} />
        <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} />
      </div>
      <div style={{ margin: "16px 0", fontSize: 18 }}>
        <b>Level:</b> {LEVELS[level].name} | <b>Score:</b> {score} | <b>Smiles:</b> {smileCount} | <b>Time Left:</b> {gameTime}s
      </div>
      {gameOver && (
        <div style={{ margin: "20px 0", textAlign: "center" }}>
          <h3>Game Over!</h3>
          <div>Score: {score}</div>
          <div>Smiles: {smileCount}</div>
          {level < LEVELS.length - 1 ? (
            <button className="btn btn-cute btn-cute-primary" onClick={nextLevel}>
              Next Level
            </button>
          ) : (
            <button className="btn btn-cute btn-cute-primary" onClick={restart}>
              Restart
            </button>
          )}
        </div>
      )}
    </div>
  );
}
