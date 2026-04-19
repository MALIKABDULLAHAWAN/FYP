import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import UiIcon from "../../components/ui/UiIcon";
import "../../styles/professional.css";

const LEVELS = [
  { name: "Easy",   targetRadius: 50, time: 30, smileThreshold: 0.6 },
  { name: "Medium", targetRadius: 35, time: 30, smileThreshold: 0.75 },
  { name: "Hard",   targetRadius: 22, time: 30, smileThreshold: 0.88 },
];

const W = 640;
const H = 480;

function randomTarget(radius) {
  const margin = radius + 10;
  return {
    x: Math.floor(Math.random() * (W - margin * 2)) + margin,
    y: Math.floor(Math.random() * (H - margin * 2)) + margin,
  };
}

export default function GazeEmotionGame() {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);   // requestAnimationFrame id
  const runningRef = useRef(false);  // controls the detection loop

  // Game state as refs so the rAF loop always sees current values
  const levelRef      = useRef(0);
  const scoreRef      = useRef(0);
  const smileRef      = useRef(0);
  const targetRef     = useRef(randomTarget(LEVELS[0].targetRadius));
  const startTimeRef  = useRef(null);
  const smileCoolRef  = useRef(0);   // frame cooldown to avoid counting one smile multiple times

  // React state only for UI re-renders
  const [level,     setLevel]     = useState(0);
  const [score,     setScore]     = useState(0);
  const [smileCount,setSmileCount]= useState(0);
  const [gameTime,  setGameTime]  = useState(LEVELS[0].time);
  const [gameOver,  setGameOver]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [camError,  setCamError]  = useState(null);

  /* ─── Load models & start camera ─── */
  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        if (cancelled) return;
        setLoading(false);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!cancelled) setCamError(err.message || "Camera or model load failed");
      }
    }
    setup();
    return () => {
      cancelled = true;
      stopLoop();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  /* ─── Start loop when video plays ─── */
  useEffect(() => {
    if (loading) return;
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => startLoop();
    vid.addEventListener("play", onPlay);
    return () => vid.removeEventListener("play", onPlay);
  }, [loading]);

  /* ─── Detection loop (never re-created; uses refs) ─── */
  function stopLoop() {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function startLoop() {
    stopLoop();
    runningRef.current = true;
    startTimeRef.current = Date.now();
    scheduleFrame();
  }

  function scheduleFrame() {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(detectFrame);
  }

  async function detectFrame() {
    if (!runningRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      scheduleFrame();
      return;
    }

    const lvl = LEVELS[levelRef.current];

    // ── Timer ──
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const remaining = lvl.time - elapsed;
    setGameTime(Math.max(0, remaining));

    if (elapsed >= lvl.time) {
      runningRef.current = false;
      setGameOver(true);
      return;
    }

    // ── Face detection ──
    let detections = [];
    try {
      detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
    } catch (_) { /* skip bad frame */ }

    const displaySize = { width: W, height: H };
    faceapi.matchDimensions(canvas, displaySize);
    const resized = faceapi.resizeResults(detections, displaySize);

    // ── Draw ──
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // Target circle
    const tgt = targetRef.current;
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 250);
    ctx.beginPath();
    ctx.arc(tgt.x, tgt.y, lvl.targetRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(50,220,100,${0.25 * pulse + 0.1})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(50,220,100,${pulse})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw face detections
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (detections.length > 0) {
      const face = detections[0];
      const eyes = face.landmarks.getLeftEye().concat(face.landmarks.getRightEye());
      const n = eyes.length;
      const eyeCenter = eyes.reduce(
        (acc, pt) => ({ x: acc.x + pt.x / n, y: acc.y + pt.y / n }),
        { x: 0, y: 0 }
      );

      // Draw eye centre dot
      ctx.beginPath();
      ctx.arc(eyeCenter.x, eyeCenter.y, 9, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,100,255,0.85)";
      ctx.fill();

      // ── Gaze hit ──
      const dx = eyeCenter.x - tgt.x;
      const dy = eyeCenter.y - tgt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < lvl.targetRadius) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        targetRef.current = randomTarget(lvl.targetRadius);
      }

      // ── Smile detection (with cooldown to debounce) ──
      if (smileCoolRef.current > 0) {
        smileCoolRef.current -= 1;
      } else if (face.expressions.happy > lvl.smileThreshold) {
        smileRef.current += 1;
        setSmileCount(smileRef.current);
        smileCoolRef.current = 20; // ~20 frames cooldown
      }
    }

    scheduleFrame();
  }

  /* ─── Next level / Restart ─── */
  const advance = useCallback((newLevel) => {
    const lv = Math.min(newLevel, LEVELS.length - 1);
    levelRef.current  = lv;
    scoreRef.current  = 0;
    smileRef.current  = 0;
    smileCoolRef.current = 0;
    targetRef.current = randomTarget(LEVELS[lv].targetRadius);

    setLevel(lv);
    setScore(0);
    setSmileCount(0);
    setGameTime(LEVELS[lv].time);
    setGameOver(false);

    startLoop();
  }, []);

  const nextLevel = () => advance(levelRef.current + 1);
  const restart   = () => advance(0);

  /* ─── UI ─── */
  if (camError) {
    return (
      <div className="game-cute-panel" style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
        <h2 style={{ fontFamily: "var(--font-fun)", fontWeight: 800, fontSize: 28, marginBottom: 12 }}>
          <UiIcon name="eye" size={28} /> Gaze &amp; Emotion Game
        </h2>
        <div style={{ color: "var(--color-danger, #e55)", fontWeight: 600, marginTop: 24 }}>
          ⚠️ Camera / model error: {camError}
        </div>
        <div style={{ color: "var(--color-text-secondary)", marginTop: 8 }}>
          Make sure your browser has camera permission and the <code>/models</code> folder is served.
        </div>
      </div>
    );
  }

  return (
    <div className="game-cute-panel" style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontFamily: "var(--font-fun)", fontWeight: 800, fontSize: 32, marginBottom: 8 }}>
        <UiIcon name="eye" size={32} /> Gaze &amp; Emotion Game
      </h2>
      <div style={{ marginBottom: 16, color: "var(--color-text-secondary)" }}>
        Look at the pulsing green target with your eyes — and smile to earn bonus points!
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
          ⏳ Loading face-detection models…
        </div>
      )}

      {/* Video + canvas overlay */}
      <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
        <video
          ref={videoRef}
          width={W}
          height={H}
          autoPlay
          muted
          playsInline
          style={{
            borderRadius: 16,
            border: "2px solid rgba(255,255,255,0.15)",
            display: "block",
            opacity: loading ? 0.3 : 1,
            transition: "opacity 0.3s",
          }}
        />
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            borderRadius: 16,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Stats bar */}
      <div style={{
        margin: "16px 0",
        fontSize: 18,
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <span>🏅 <b>Level:</b> {LEVELS[level].name}</span>
        <span>⭐ <b>Score:</b> {score}</span>
        <span>😊 <b>Smiles:</b> {smileCount}</span>
        <span>⏱ <b>Time:</b> {gameTime}s</span>
      </div>

      {/* Tip */}
      {!gameOver && !loading && (
        <div style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          marginBottom: 8,
        }}>
          Tip: Move your <b>entire head</b> so your eye-centre lands on the green circle.
        </div>
      )}

      {/* Game Over panel */}
      {gameOver && (
        <div style={{
          margin: "20px auto",
          textAlign: "center",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "24px 32px",
        }}>
          <h3 style={{ fontSize: 26, marginBottom: 8 }}>
            {level < LEVELS.length - 1 ? "🎉 Level Complete!" : "🏆 You finished all levels!"}
          </h3>
          <div style={{ fontSize: 18, marginBottom: 4 }}>Score: <b>{score}</b></div>
          <div style={{ fontSize: 18, marginBottom: 20 }}>Smiles: <b>{smileCount}</b></div>
          {level < LEVELS.length - 1 ? (
            <button className="btn btn-cute btn-cute-primary" onClick={nextLevel}>
              Next Level →
            </button>
          ) : (
            <button className="btn btn-cute btn-cute-primary" onClick={restart}>
              Play Again
            </button>
          )}
          <button
            className="btn btn-cute"
            onClick={restart}
            style={{ marginLeft: 12 }}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
