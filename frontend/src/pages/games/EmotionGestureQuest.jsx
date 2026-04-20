import React, { useRef, useEffect, useState, useCallback } from "react";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import * as faceapi from "face-api.js";
import { useChild } from "../../hooks/useChild";
import { startGameSession, submitGameTrial, nextGameTrial, endSession } from "../../api/games";
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
  { name: "Easy",   time: 45, emotionThreshold: 0.3, label: "🌟 Easy" },
  { name: "Medium", time: 35, emotionThreshold: 0.45, label: "⚡ Medium" },
  { name: "Hard",   time: 25, emotionThreshold: 0.6, label: "🔥 Hard" },
];

const DETECT_INTERVAL_MS = 200; // run face-api every 200ms max (5 fps), not on every rAF

/* ─────────────────────────────────────────────────────────────
   GESTURE CLASSIFIER  (MediaPipe Hands via CDN)
──────────────────────────────────────────────────────────────*/
let handsInstance = null;
let handsReady = false;
let latestHandLandmarks = null; 

async function initMediaPipeHands(videoEl) {
  return new Promise((resolve) => {
    if (handsReady) { resolve(true); return; }

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
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
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

    if (window.Hands) { tryInit(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script.crossOrigin = "anonymous";
    script.onload = tryInit;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function classifyGesture(lm) {
  if (!lm || lm.length < 21) return null;

  const tip   = [4, 8, 12, 16, 20];
  const base  = [2, 5, 9, 13, 17];
  const pip   = [3, 6, 10, 14, 18]; 

  const extended = tip.map((t, i) =>
    i === 0
      ? Math.abs(lm[t].x - lm[base[i]].x) > 0.04  // Thumb: more lax
      : lm[t].y < lm[pip[i]].y - 0.01             // Fingers: more lax
  );

  const [thumbExt, indexExt, middleExt, ringExt, pinkyExt] = extended;
  const extCount = extended.filter(Boolean).length;

  if (extCount >= 4) return "open_hand";
  if (extCount === 0) return "fist";
  if (indexExt && middleExt && !ringExt && !pinkyExt) return "peace";
  if (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return lm[4].y < lm[0].y ? "thumbs_up" : "thumbs_down";
  }
  if (!thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) return "peace"; 

  return null;
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTS
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
export default function EmotionGestureQuest({ isSession = false, onComplete }) {
  const { childProfile } = useChild();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const runningRef = useRef(false);
  const lastDetectRef = useRef(0);

  // Refs for detection loop
  const levelRef   = useRef(0);
  const scoreRef   = useRef(0);
  const taskRef    = useRef(null);
  const startRef   = useRef(null);
  const coolRef    = useRef(0);      
  const mpReadyRef = useRef(false);

  // Session refs
  const sessionIdRef = useRef(null);
  const trialIdRef   = useRef(null);

  // React state (UI only)
  const [level,      setLevel]      = useState(0);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(LEVELS[0].time);
  const [task,       setTask]       = useState(null);
  const [feedback,   setFeedback]   = useState(null); 
  const [gameOver,   setGameOver]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [loadMsg,    setLoadMsg]    = useState("Loading face detection…");
  const [camError,   setCamError]   = useState(null);
  const [starBurst,  setStarBurst]  = useState(false);
  const [mpStatus,   setMpStatus]   = useState("loading"); 
  const [history,    setHistory]    = useState([]);

  function pickTask(excludeValue) {
    const pool = ALL_TASKS.filter(t => t.value !== excludeValue);
    const t = pool[Math.floor(Math.random() * pool.length)];
    taskRef.current = t;
    setTask(t);
  }

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
      if (sessionIdRef.current) endSession(sessionIdRef.current).catch(() => {});
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

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

  async function startGame(lv) {
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

    if (childProfile) {
      try {
        const res = await startGameSession("emotion_gesture_quest", childProfile.id, 20, {
          difficulty_level: lv + 1
        });
        sessionIdRef.current = res.session.session_id;
        trialIdRef.current = res.first_trial?.trial_id;
      } catch (e) {
        console.warn("Could not start session tracking:", e);
      }
    }

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
      if (sessionIdRef.current) endSession(sessionIdRef.current).catch(() => {});
      return;
    }

    if (ts - lastDetectRef.current >= DETECT_INTERVAL_MS) {
      lastDetectRef.current = ts;
      await runDetect(lv);
    }

    scheduleFrame();
  }

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

    if (handsReady && handsInstance) {
      try { await handsInstance.send({ image: video }); } catch (_) {}
    }

    drawScene(canvas, resized, W, H);

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
      const rt = Date.now() - (startRef.current + (scoreRef.current * 2000)); // Estimated trial start
      const taskId = trialIdRef.current;
      const sessId = sessionIdRef.current;

      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      setFeedback({ text: `✅ ${currentTask.label} detected! +1`, ok: true });
      setHistory(h => [...h.slice(-7), { ...currentTask, time: new Date().toLocaleTimeString() }]);
      setStarBurst(true);
      setTimeout(() => setStarBurst(false), 700);
      setTimeout(() => setFeedback(null), 1500);

      // Submit results to backend
      if (sessId && taskId) {
        submitGameTrial("emotion_gesture_quest", taskId, currentTask.value, rt, false, {
          success: true,
          type: currentTask.type,
          value: currentTask.value
        }).then(() => {
          return nextGameTrial("emotion_gesture_quest", sessId);
        }).then(res => {
          trialIdRef.current = res.trial_id;
        }).catch(e => console.warn("Failed to report trial:", e));
      }

      const prev = currentTask.value;
      pickTask(prev);
      coolRef.current = 15; 
    }
  }

  function drawScene(canvas, resized, W, H) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (latestHandLandmarks) {
      ctx.save();
      latestHandLandmarks.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * W, pt.y * H, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(96,165,250,0.9)";
        ctx.fill();
      });
      const connections = [
        [0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8], [9,10],[10,11],[11,12],
        [13,14],[14,15],[15,16], [17,18],[18,19],[19,20], [0,17],[5,9],[9,13],[13,17],
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

  const restart   = useCallback(() => { pickTask(null); startGame(0); }, [childProfile]);

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
      <div style={styles.header}>
        <h2 style={styles.title}>🎭 Emotion &amp; Gesture Quest</h2>
        <p style={styles.subtitle}>Show the right emotion or hand gesture to score points!</p>
        {childProfile && <p style={{ color: "#a78bfa", fontWeight: 600 }}>Playing as: {childProfile.full_name}</p>}
      </div>

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
        </div>
      )}

      {loading && (
        <div style={styles.loadingBox}>
          <div style={{ fontSize: 48, animation: "spin 1s linear infinite" }}>⚙️</div>
          <div style={{ color: "#94a3b8", marginTop: 12 }}>{loadMsg}</div>
        </div>
      )}

      <div style={styles.videoWrap}>
        <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
        <canvas ref={canvasRef} style={styles.canvas} />
        {feedback && (
          <div style={{ ...styles.feedbackToast, background: feedback.ok ? "rgba(52,211,153,0.95)" : "rgba(248,113,113,0.95)" }}>
            {feedback.text}
          </div>
        )}
      </div>

      {gameOver && (
        <GameConclusionFlow
          gameName="Emotion & Gesture Quest"
          score={score}
          total={score + 5}
          duration={LEVELS[level].time}
          skills={["Social-Emotional", "Fine Motor", "Mirroring"]}
          onAction={isSession ? onComplete : restart}
          actionLabel={isSession ? "Continue Journey" : "Play Again"}
        />
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...styles.infoCard, flex: 1, minWidth: 220 }}>
          <h4 style={styles.infoTitle}>🏅 Recent Answers</h4>
          {history.length === 0 ? <p style={{ color: "#64748b", fontSize: 13 }}>No answers yet!</p> : history.slice(-5).reverse().map((item, i) => (
            <div key={i} style={styles.historyItem}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ flex: 1, color: "#cbd5e1" }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...styles.infoCard, flex: 1, minWidth: 220 }}>
          <h4 style={styles.infoTitle}>📖 How to Play</h4>
          <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
            <li>Follow the prompt for emotion or gesture</li>
            <li>Hold it until detected ✅</li>
            <li>Earn points and complete levels!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: 780, margin: "0 auto", padding: "24px 16px 48px", display: "flex", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" },
  header: { textAlign: "center" },
  title: { fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 },
  subtitle: { color: "#64748b", margin: "4px 0 0", fontSize: 15 },
  statsRow: { display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px 20px", border: "1px solid rgba(255,255,255,0.08)" },
  statCard: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 },
  statLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#64748b", textTransform: "uppercase" },
  statValue: { fontSize: 20, fontWeight: 800, color: "#f1f5f9" },
  taskCard: { textAlign: "center", padding: "24px 32px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "2px solid", transition: "all 0.3s ease" },
  loadingBox: { textAlign: "center", padding: "40px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 20 },
  videoWrap: { position: "relative", display: "inline-block", lineHeight: 0, borderRadius: 20, overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", width: "100%", maxWidth: 640, alignSelf: "center", aspectRatio: "4/3" },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", transform: "scaleX(-1)" },
  feedbackToast: { position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", borderRadius: 99, padding: "10px 28px", fontSize: 16, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" },
  gameOverCard: { textAlign: "center", padding: "32px 24px", borderRadius: 20, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)" },
  btnPrimary: { padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#a78bfa,#60a5fa)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" },
  btnSecondary: { padding: "12px 28px", borderRadius: 99, background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" },
  infoCard: { background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px 20px" },
  infoTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#94a3b8" },
  historyItem: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  errorBox: { textAlign: "center", padding: 48, background: "rgba(248,113,113,0.08)", borderRadius: 20, border: "1px solid rgba(248,113,113,0.2)" },
};

const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes starPop { 0% { transform: scale(0.2); opacity: 1; } 60% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
if (!document.getElementById("egq-styles")) {
  styleTag.id = "egq-styles";
  document.head.appendChild(styleTag);
}
