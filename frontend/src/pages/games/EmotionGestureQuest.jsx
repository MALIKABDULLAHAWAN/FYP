import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import "../../styles/professional.css";

/* ─────────────────────────────────────────────────────────────
   GAME CONFIG
──────────────────────────────────────────────────────────────*/
const EMOTION_TASKS = [
  { type: "emotion", value: "happy",     emoji: "😊", label: "HAPPY",    hint: "Smile big!" },
  { type: "emotion", value: "sad",       emoji: "😢", label: "SAD",      hint: "Make a sad face" },
  { type: "emotion", value: "angry",     emoji: "😠", label: "ANGRY",    hint: "Furrow your brows!" },
  { type: "emotion", value: "surprised", emoji: "😲", label: "SURPRISED",hint: "Open your eyes wide!" },
  { type: "emotion", value: "neutral",   emoji: "😐", label: "NEUTRAL",  hint: "Relax your face" },
];

const GESTURE_TASKS = [
  { type: "gesture", value: "thumbs_up",   emoji: "👍", label: "THUMBS UP",   hint: "Point thumb up!" },
  { type: "gesture", value: "thumbs_down", emoji: "👎", label: "THUMBS DOWN", hint: "Point thumb down!" },
  { type: "gesture", value: "open_hand",   emoji: "✋", label: "OPEN HAND",   hint: "Spread all fingers!" },
  { type: "gesture", value: "fist",        emoji: "✊", label: "FIST",         hint: "Close your hand!" },
  { type: "gesture", value: "peace",       emoji: "✌️", label: "PEACE SIGN",  hint: "Two fingers up!" },
];

const ALL_TASKS = [...EMOTION_TASKS, ...GESTURE_TASKS];

const LEVELS = [
  { name: "Easy",   time: 45, emotionThreshold: 0.55, label: "🌟 Easy" },
  { name: "Medium", time: 35, emotionThreshold: 0.65, label: "⚡ Medium" },
  { name: "Hard",   time: 25, emotionThreshold: 0.75, label: "🔥 Hard" },
];

const DETECT_INTERVAL_MS = 200; // run face-api every 200ms max (5 fps), not on every rAF

/* ─────────────────────────────────────────────────────────────
   GESTURE CLASSIFIER  (MediaPipe Hands via CDN)
   Falls back gracefully if CDN fails or hands not visible.
──────────────────────────────────────────────────────────────*/
let handsInstance = null;
let handsReady = false;
let latestHandLandmarks = null; // updated by MediaPipe callback

async function initMediaPipeHands(videoEl) {
  return new Promise((resolve) => {
    if (handsReady) { resolve(true); return; }

    // Check if MediaPipe is already loaded
    const tryInit = () => {
      if (!window.Hands) { resolve(false); return; }
      try {
        handsInstance = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        handsInstance.onResults((results) => {
          latestHandLandmarks =
            results.multiHandLandmarks && results.multiHandLandmarks.length > 0
              ? results.multiHandLandmarks[0]
              : null;
        });
        handsInstance.initialize().then(() => {
          handsReady = true;
          resolve(true);
        }).catch(() => resolve(false));
      } catch { resolve(false); }
    };

    // Load MediaPipe Hands script dynamically
    if (window.Hands) { tryInit(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script.crossOrigin = "anonymous";
    script.onload = tryInit;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/* Classify gesture from MediaPipe 21-landmark hand */
function classifyGesture(lm) {
  if (!lm || lm.length < 21) return null;

  // Landmark indices: 0=wrist, 4=thumb tip, 8=index tip, 12=middle tip, 16=ring tip, 20=pinky tip
  // Base of each finger: 2=thumb, 5=index, 9=middle, 13=ring, 17=pinky
  const tip   = [4, 8, 12, 16, 20];
  const base  = [2, 5, 9, 13, 17];
  const pip   = [3, 6, 10, 14, 18]; // proximal interphalangeal

  // Is finger extended? (tip higher than pip — lower y in image = higher)
  const extended = tip.map((t, i) =>
    i === 0
      ? Math.abs(lm[t].x - lm[base[i]].x) > 0.06  // thumb: check horizontal
      : lm[t].y < lm[pip[i]].y - 0.02
  );

  const [thumbExt, indexExt, middleExt, ringExt, pinkyExt] = extended;
  const extCount = extended.filter(Boolean).length;

  // Open hand: all 5 fingers extended
  if (extCount >= 4) return "open_hand";

  // Fist: all fingers curled
  if (extCount === 0) return "fist";

  // Peace sign: index + middle extended, ring + pinky curled
  if (indexExt && middleExt && !ringExt && !pinkyExt) return "peace";

  // Thumbs up: thumb extended, others curled
  if (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    // Thumb tip above wrist = thumbs up
    return lm[4].y < lm[0].y ? "thumbs_up" : "thumbs_down";
  }

  // Point finger (index only)
  if (!thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) return "peace"; // close enough

  return null;
}

/* ─────────────────────────────────────────────────────────────
   STAR BURST COMPONENT
──────────────────────────────────────────────────────────────*/
function StarBurst({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ fontSize: 96, animation: "starPop 0.7s ease-out forwards" }}>⭐</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS BAR
──────────────────────────────────────────────────────────────*/
function ProgressBar({ value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{
      background: "rgba(255,255,255,0.15)", borderRadius: 99,
      height: 12, overflow: "hidden", flex: 1,
    }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: color || "linear-gradient(90deg,#a78bfa,#60a5fa)",
        borderRadius: 99,
        transition: "width 0.3s ease",
        boxShadow: "0 0 8px rgba(167,139,250,0.6)",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────*/
export default function EmotionGestureQuest() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const runningRef = useRef(false);
  const lastDetectRef = useRef(0);   // throttle timestamp

  // All game state as refs (read inside rAF loop)
  const levelRef   = useRef(0);
  const scoreRef   = useRef(0);
  const taskRef    = useRef(null);
  const startRef   = useRef(null);
  const coolRef    = useRef(0);      // frames before accepting next answer
  const mpReadyRef = useRef(false);

  // React state (UI only)
  const [level,      setLevel]      = useState(0);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(LEVELS[0].time);
  const [task,       setTask]       = useState(null);
  const [feedback,   setFeedback]   = useState(null); // { text, ok }
  const [gameOver,   setGameOver]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [loadMsg,    setLoadMsg]    = useState("Loading face detection…");
  const [camError,   setCamError]   = useState(null);
  const [starBurst,  setStarBurst]  = useState(false);
  const [mpStatus,   setMpStatus]   = useState("loading"); // loading|ready|failed
  const [history,    setHistory]    = useState([]);

  /* ── pick a task, never same twice in a row ── */
  function pickTask(excludeValue) {
    const pool = ALL_TASKS.filter(t => t.value !== excludeValue);
    const t = pool[Math.floor(Math.random() * pool.length)];
    taskRef.current = t;
    setTask(t);
  }

  /* ── Init: load models + camera + MediaPipe ── */
  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        setLoadMsg("Loading face AI models…");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        if (cancelled) return;

        setLoadMsg("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) videoRef.current.srcObject = stream;

        setLoading(false);

        setLoadMsg("Loading gesture AI…");
        const mpOk = await initMediaPipeHands(videoRef.current);
        mpReadyRef.current = mpOk;
        setMpStatus(mpOk ? "ready" : "failed");
      } catch (err) {
        if (!cancelled) setCamError(err.message || "Setup failed");
      }
    }
    setup();
    return () => {
      cancelled = true;
      stopLoop();
      latestHandLandmarks = null;
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

  /* ── Start loop when video plays ── */
  useEffect(() => {
    if (loading) return;
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => {
      pickTask(null);
      startGame(levelRef.current);
    };
    vid.addEventListener("play", onPlay);
    return () => vid.removeEventListener("play", onPlay);
  }, [loading]);

  /* ── Game control ── */
  function startGame(lv) {
    levelRef.current  = lv;
    scoreRef.current  = 0;
    coolRef.current   = 0;
    startRef.current  = Date.now();
    setLevel(lv);
    setScore(0);
    setTimeLeft(LEVELS[lv].time);
    setGameOver(false);
    setFeedback(null);
    setHistory([]);
    startLoop();
  }

  function stopLoop() {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function startLoop() {
    stopLoop();
    runningRef.current = true;
    scheduleFrame();
  }

  function scheduleFrame() {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(mainLoop);
  }

  /* ── Main rAF loop ── */
  async function mainLoop(ts) {
    if (!runningRef.current) return;

    const lv = LEVELS[levelRef.current];
    const elapsed = (Date.now() - startRef.current) / 1000;
    const remaining = Math.max(0, lv.time - elapsed);
    setTimeLeft(Math.ceil(remaining));

    if (remaining <= 0) {
      runningRef.current = false;
      setGameOver(true);
      clearCanvas();
      return;
    }

    // Throttle detection to every DETECT_INTERVAL_MS
    if (ts - lastDetectRef.current >= DETECT_INTERVAL_MS) {
      lastDetectRef.current = ts;
      await runDetect(lv);
    }

    scheduleFrame();
  }

  /* ── Face + Gesture detection ── */
  async function runDetect(lv) {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.readyState < 2) return;

    const W = video.videoWidth  || 640;
    const H = video.videoHeight || 480;
    faceapi.matchDimensions(canvas, { width: W, height: H });

    let detections = [];
    try {
      detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceExpressions();
    } catch (_) {}
    const resized = faceapi.resizeResults(detections, { width: W, height: H });

    // Run MediaPipe hands (async, non-blocking — it calls onResults callback)
    if (handsReady && handsInstance) {
      try { await handsInstance.send({ image: video }); } catch (_) {}
    }

    // Draw
    drawScene(canvas, resized, W, H);

    // Check answer (with cooldown)
    if (coolRef.current > 0) { coolRef.current--; return; }
    const currentTask = taskRef.current;
    if (!currentTask) return;

    let matched = false;

    if (currentTask.type === "emotion" && resized.length > 0) {
      const expr = resized[0].expressions;
      const val  = expr[currentTask.value] || 0;
      if (val >= lv.emotionThreshold) matched = true;
    }

    if (currentTask.type === "gesture") {
      const gesture = classifyGesture(latestHandLandmarks);
      if (gesture === currentTask.value) matched = true;
    }

    if (matched) {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      setFeedback({ text: `✅ ${currentTask.label} detected! +1`, ok: true });
      setHistory(h => [...h.slice(-7), { ...currentTask, time: new Date().toLocaleTimeString() }]);
      setStarBurst(true);
      setTimeout(() => setStarBurst(false), 700);
      setTimeout(() => setFeedback(null), 1500);

      const prev = currentTask.value;
      pickTask(prev);
      coolRef.current = 15; // ~3 seconds cooldown at 5fps
    }
  }

  /* ── Canvas drawing ── */
  function drawScene(canvas, resized, W, H) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    // Draw hand landmarks if available
    if (latestHandLandmarks) {
      ctx.save();
      latestHandLandmarks.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * W, pt.y * H, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(96,165,250,0.9)";
        ctx.fill();
      });
      // Connect fingers
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [9,10],[10,11],[11,12],
        [13,14],[14,15],[15,16],
        [17,18],[18,19],[19,20],
        [0,17],[5,9],[9,13],[13,17],
      ];
      ctx.strokeStyle = "rgba(167,139,250,0.7)";
      ctx.lineWidth = 2;
      connections.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(latestHandLandmarks[a].x * W, latestHandLandmarks[a].y * H);
        ctx.lineTo(latestHandLandmarks[b].x * W, latestHandLandmarks[b].y * H);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ── Restart / Next level ── */
  const restart   = useCallback(() => { pickTask(null); startGame(0); }, []);
  const nextLevel = useCallback(() => {
    const lv = Math.min(levelRef.current + 1, LEVELS.length - 1);
    pickTask(null);
    startGame(lv);
  }, []);

  /* ─────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────*/
  const lv = LEVELS[level];

  if (camError) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48 }}>📷</div>
          <h3 style={{ color: "#f87171", margin: "12px 0 8px" }}>Camera Error</h3>
          <p style={{ color: "#94a3b8" }}>{camError}</p>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Allow camera access in your browser and ensure <code>/models</code> is served.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <StarBurst show={starBurst} />

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🎭 Emotion &amp; Gesture Quest</h2>
        <p style={styles.subtitle}>Show the right emotion or hand gesture to score points!</p>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>LEVEL</span>
          <span style={styles.statValue}>{lv.label}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>SCORE</span>
          <span style={{ ...styles.statValue, color: "#a78bfa" }}>{score} ⭐</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>TIME</span>
          <span style={{
            ...styles.statValue,
            color: timeLeft <= 10 ? "#f87171" : "#34d399",
          }}>{timeLeft}s</span>
        </div>
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Time Remaining</span>
          <ProgressBar value={timeLeft} max={lv.time} color={timeLeft <= 10 ? "linear-gradient(90deg,#f87171,#fbbf24)" : undefined} />
        </div>
      </div>

      {/* Main task card */}
      {!loading && task && !gameOver && (
        <div style={{
          ...styles.taskCard,
          borderColor: task.type === "emotion" ? "#a78bfa" : "#60a5fa",
          boxShadow: `0 0 30px ${task.type === "emotion" ? "rgba(167,139,250,0.25)" : "rgba(96,165,250,0.25)"}`,
        }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}>{task.emoji}</div>
          <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#64748b", marginBottom: 4 }}>
            {task.type === "emotion" ? "📸 Show this emotion" : "✋ Show this gesture"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9" }}>{task.label}</div>
          <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 6 }}>{task.hint}</div>
          {mpStatus === "failed" && task.type === "gesture" && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 8, padding: "6px 12px" }}>
              ⚠️ Gesture AI offline — only emotion tasks will score
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={styles.loadingBox}>
          <div style={{ fontSize: 48, animation: "spin 1s linear infinite" }}>⚙️</div>
          <div style={{ color: "#94a3b8", marginTop: 12 }}>{loadMsg}</div>
        </div>
      )}

      {/* Video + Canvas */}
      <div style={styles.videoWrap}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={styles.video}
        />
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />
        {/* Feedback toast */}
        {feedback && (
          <div style={{
            ...styles.feedbackToast,
            background: feedback.ok ? "rgba(52,211,153,0.95)" : "rgba(248,113,113,0.95)",
          }}>
            {feedback.text}
          </div>
        )}
        {/* Gesture status badge */}
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          background: "rgba(0,0,0,0.6)", borderRadius: 99,
          padding: "4px 12px", fontSize: 11, color: "#94a3b8",
        }}>
          {mpStatus === "ready" ? "✋ Gesture AI: ON" : mpStatus === "failed" ? "🙈 Gesture AI: OFF" : "⏳ Gesture AI loading…"}
        </div>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div style={styles.gameOverCard}>
          <div style={{ fontSize: 64 }}>
            {score >= 10 ? "🏆" : score >= 5 ? "🥳" : "👏"}
          </div>
          <h3 style={{ fontSize: 28, margin: "12px 0 4px", color: "#f1f5f9" }}>
            {level < LEVELS.length - 1 ? "Level Complete!" : "Amazing Job!"}
          </h3>
          <p style={{ color: "#94a3b8", marginBottom: 4 }}>
            Final Score: <b style={{ color: "#a78bfa" }}>{score} points</b>
          </p>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            You completed {history.length} challenge{history.length !== 1 ? "s" : ""}!
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {level < LEVELS.length - 1 && (
              <button style={styles.btnPrimary} onClick={nextLevel}>
                Next Level →
              </button>
            )}
            <button style={styles.btnSecondary} onClick={restart}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* History + Instructions side by side */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Recent history */}
        <div style={{ ...styles.infoCard, flex: 1, minWidth: 220 }}>
          <h4 style={styles.infoTitle}>🏅 Recent Answers</h4>
          {history.length === 0
            ? <p style={{ color: "#64748b", fontSize: 13 }}>No answers yet — start playing!</p>
            : history.slice(-6).reverse().map((item, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <span style={{ flex: 1, color: "#cbd5e1", fontSize: 14 }}>{item.label}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{item.time}</span>
              </div>
            ))
          }
        </div>

        {/* How to play */}
        <div style={{ ...styles.infoCard, flex: 1, minWidth: 220 }}>
          <h4 style={styles.infoTitle}>📖 How to Play</h4>
          <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#94a3b8", fontSize: 14, lineHeight: 2 }}>
            <li>A task appears — <b>emotion</b> or <b>gesture</b></li>
            <li>Make that face or hand shape at the camera</li>
            <li>Hold it until it's detected ✅</li>
            <li>Score as many points as you can before time runs out!</li>
            <li>Complete levels to unlock harder challenges 🔥</li>
          </ul>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>GESTURES SUPPORTED:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GESTURE_TASKS.map(g => (
                <span key={g.value} style={{ fontSize: 22 }} title={g.label}>{g.emoji}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, marginBottom: 6 }}>EMOTIONS SUPPORTED:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EMOTION_TASKS.map(e => (
                <span key={e.value} style={{ fontSize: 22 }} title={e.label}>{e.emoji}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES
──────────────────────────────────────────────────────────────*/
const styles = {
  wrapper: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "24px 16px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    fontFamily: "var(--font-main, 'Inter', sans-serif)",
  },
  header: {
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
  },
  subtitle: {
    color: "#64748b",
    margin: "4px 0 0",
    fontSize: 15,
  },
  statsRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: "14px 20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 64,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#f1f5f9",
  },
  taskCard: {
    textAlign: "center",
    padding: "24px 32px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.05)",
    border: "2px solid",
    transition: "all 0.3s ease",
    animation: "fadeIn 0.4s ease",
  },
  loadingBox: {
    textAlign: "center",
    padding: "40px 24px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20,
  },
  videoWrap: {
    position: "relative",
    display: "inline-block",
    lineHeight: 0,
    borderRadius: 20,
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    aspectRatio: "4/3",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transform: "scaleX(-1)", // mirror so it feels natural
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    transform: "scaleX(-1)",
  },
  feedbackToast: {
    position: "absolute",
    bottom: 48,
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: 99,
    padding: "10px 28px",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    whiteSpace: "nowrap",
    animation: "fadeIn 0.2s ease",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  gameOverCard: {
    textAlign: "center",
    padding: "32px 24px",
    borderRadius: 20,
    background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.1))",
    border: "1px solid rgba(167,139,250,0.3)",
    boxShadow: "0 8px 40px rgba(167,139,250,0.2)",
  },
  btnPrimary: {
    padding: "12px 28px",
    borderRadius: 99,
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(167,139,250,0.4)",
    transition: "transform 0.15s",
  },
  btnSecondary: {
    padding: "12px 28px",
    borderRadius: 99,
    background: "rgba(255,255,255,0.08)",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    transition: "transform 0.15s",
  },
  infoCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: "16px 20px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  infoTitle: {
    margin: "0 0 12px",
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  errorBox: {
    textAlign: "center",
    padding: 48,
    background: "rgba(248,113,113,0.08)",
    borderRadius: 20,
    border: "1px solid rgba(248,113,113,0.2)",
  },
};

/* ── Global keyframes injected once ── */
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes starPop {
    0%   { transform: scale(0.2) rotate(-20deg); opacity: 1; }
    60%  { transform: scale(1.3) rotate(10deg);  opacity: 1; }
    100% { transform: scale(1.8) rotate(0deg);   opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.getElementById("egq-styles")) {
  styleTag.id = "egq-styles";
  document.head.appendChild(styleTag);
}
