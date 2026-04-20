/**
 * SceneDescriptionGame – Describe Images with LLM Evaluation
 * Child sees a scenario image and provides a text description.
 * Backend uses Groq LLM to evaluate the response.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../hooks/useChild";
import { useToast } from "../../hooks/useToast";
import { startGameSession, nextGameTrial } from "../../api/games";
import { apiFetch } from "../../api/client";
import GameConclusionFlow from "../../components/GameConclusionFlow";
import UiIcon from "../../components/ui/UiIcon";
import DifficultyIndicator from "../../components/DifficultyIndicator";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "").replace(/\/api$/, "");

export default function SceneDescriptionGame() {
  const navigate = useNavigate();
  const { selectedChild } = useChild();
  const toast = useToast();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [trial, setTrial] = useState(null);
  const [trialNum, setTrialNum] = useState(0);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Game state
  const [imageUrl, setImageUrl] = useState(null);
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scenarioId, setScenarioId] = useState(null);
  const [childResponse, setChildResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState(1);

  // ── TTS ──
  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || !text) return;
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/[^\w\s!?.,']/g, ""));
        u.rate = 0.85;
        u.pitch = 1.1;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch {}
    },
    [voiceEnabled]
  );

  // ── Load trial data ──
  const loadTrial = (trialData) => {
    setTrial(trialData);
    // Prefix backend-relative image URLs with API base
    const rawUrl = trialData.image_url || "";
    setImageUrl(rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`) : null);
    setScenarioTitle(trialData.title || "");
    setPrompt(trialData.prompt || "Describe what you see.");
    setAiHint(trialData.ai_hint || "");
    setScenarioId(trialData.scenario_id || null);
    setChildResponse("");
    setEvaluation(null);
    setTrialNum((n) => n + 1);
    setTimeout(() => speak(trialData.prompt), 300);
  };

  // ── Start game session ──
  const startGame = useCallback(async () => {
    if (!selectedChild) {
      toast.error("Please select a child first");
      navigate("/games");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await startGameSession("scene_description", selectedChild, 20, { difficulty_level: difficulty });
      const sid = res.session?.session_id;
      setSessionId(sid);
      setStatus(res.session?.status);
      if (res.first_trial && !res.first_trial.detail) {
        loadTrial(res.first_trial);
      } else if (res.summary) {
        setSummary(res.summary);
        setStatus("completed");
      }
    } catch (err) {
      toast.error("Failed to start game session");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, navigate, toast]);

  // ── Submit response ──
  const handleSubmit = async () => {
    if (!childResponse.trim()) {
      toast.error("Please describe what you see in the image");
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch(
        `/api/v1/therapy/games/scene_description/trial/${trial.id}/submit/`,
        {
          method: "POST",
          body: {
            scenario_id: scenarioId,
            child_response: childResponse,
            clicked: childResponse,
            response_time_ms: 5000,
          },
        }
      );
      setTotalScore(prev => prev + (result.clarity_score || 0));
      setAttemptCount(prev => prev + 1);
      setEvaluation(result);
      if (result.feedback) setTimeout(() => speak(result.feedback), 500);
      toast.success(result.success ? "Great job!" : "Keep trying!");
    } catch (err) {
      toast.error(err.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Load next trial ──
  const handleNext = async () => {
    if (!sessionId) return;
    try {
      const next = await nextGameTrial("scene_description", sessionId);
      if (next.detail && next.detail.includes("No more planned trials")) {
        setSummary(next.summary || {});
        setStatus("completed");
        if (sessionId) endSession(sessionId).catch(() => {});
        return;
      }
      loadTrial(next);
    } catch (err) {
      toast.error("Failed to load next scenario");
    }
  };

  const handleExit = () => {
    if (sessionId && status !== "completed") {
      endSession(sessionId).catch(() => {});
    }
    navigate("/games");
  };

  /* ────────────────────── RENDER ────────────────────── */

  // No child
  if (!selectedChild) {
    return (
      <div className="container">
        <div className="header">
          <div><div className="h1">Scene Description</div><div className="sub">No child selected</div></div>
        </div>
        <div className="panel" style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Select a child from the Games page first.</p>
          <button className="btn btn-primary" onClick={() => navigate("/games")}>Go to Games</button>
        </div>
      </div>
    );
  }

  // Not started
  if (!sessionId) {
    return (
      <div className="container">
        <div className="header">
          <div>
            <div className="h1">Scene Description</div>
            <div className="sub">Describe what you see in images — AI evaluates your response</div>
          </div>
          <button className="btn" onClick={() => navigate("/games")}>Back</button>
        </div>
        <div className="panel" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <UiIcon name="picture" size={56} title="" />
          </div>
          <h2 style={{ color: "var(--text)", marginBottom: 8 }}>Scene Description Game</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
            You will be shown scenario images. Describe what you see as completely as you can.
            An AI will evaluate your description and give you feedback.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <DifficultyIndicator 
              difficulty={difficulty} 
              interactive={true} 
              onDifficultyChange={setDifficulty} 
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={startGame} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, marginRight: 8 }} /> Starting...</> : "Start Game"}
          </button>
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>
    );
  }

  // Completed
  if (status === "completed") {
    return (
      <div className="container">
        <GameConclusionFlow
          gameName="Scene Description"
          score={summary?.correct || 0}
          total={summary?.total_trials || 20}
          duration={summary?.total_duration || 0}
          level={difficulty}
          skills={["Language", "Categorization", "Observation"]}
          onAction={handleExit}
          actionLabel="Return Home"
        />
      </div>
    );
  }

  // ── In-progress ──
  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <div className="h1">Scene Description</div>
          <div className="sub">
            Trial {trialNum} / 20{scenarioTitle ? ` — ${scenarioTitle}` : ""}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className={`btn ${voiceEnabled ? "btn-primary" : ""}`} onClick={() => setVoiceEnabled(!voiceEnabled)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <UiIcon name={voiceEnabled ? "volume" : "volume-off"} size={20} title="" />
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </button>
          <button className="btn" onClick={handleExit}>Exit</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* ── Image Panel ── */}
      <div className="panel" style={{ textAlign: "center", padding: 24, marginBottom: 16 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={scenarioTitle || "Scenario"}
            style={{
              maxWidth: "100%",
              maxHeight: 380,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: 280,
            background: "var(--card)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
          }}>
            Loading image...
          </div>
        )}

        {/* Prompt */}
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: "var(--text)" }}>
          {prompt}
        </div>

        {/* Hint */}
        {aiHint && (
          <div style={{ fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <UiIcon name="bulb" size={18} title="" />
            {aiHint}
          </div>
        )}
      </div>

      {/* ── Response Input ── */}
      {!evaluation && (
        <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "var(--text)" }}>
            Your Description:
          </label>
          <textarea
            value={childResponse}
            onChange={(e) => setChildResponse(e.target.value)}
            placeholder="Type what you see in the image..."
            rows={5}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 15,
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            disabled={submitting}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !childResponse.trim()}
            className="btn btn-primary"
            style={{ marginTop: 14, width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            {submitting ? (
              <><span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} /> Evaluating with AI...</>
            ) : (
              "Submit Description"
            )}
          </button>
        </div>
      )}

      {/* ── Evaluation Feedback ── */}
      {evaluation && (
        <div className="panel" style={{ padding: 24, marginBottom: 16, borderColor: evaluation.success ? "var(--success)" : "var(--warning)" }}>
          {/* Title */}
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: evaluation.success ? "var(--success)" : "var(--warning)" }}>
            {evaluation.success ? "Excellent!" : "Good Try!"}
          </div>

          {/* Score Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div className="panel" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Overall Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{evaluation.llm_score ?? "–"}<span style={{ fontSize: 14, color: "var(--muted)" }}>/100</span></div>
            </div>
            <div className="panel" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Clarity</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--success)" }}>{evaluation.clarity_score ?? "–"}<span style={{ fontSize: 14, color: "var(--muted)" }}>/10</span></div>
            </div>
            <div className="panel" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Completeness</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#818cf8" }}>{evaluation.completeness_score ?? "–"}<span style={{ fontSize: 14, color: "var(--muted)" }}>/10</span></div>
            </div>
          </div>

          {/* Feedback text */}
          <div style={{ background: "var(--card)", padding: 16, borderRadius: "var(--radius)", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>Feedback</div>
            <div style={{ lineHeight: 1.7, color: "var(--text-secondary)" }}>{evaluation.feedback}</div>
          </div>

          {/* Key Elements */}
          {evaluation.key_elements_found?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Elements you mentioned:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {evaluation.key_elements_found.map((elem, i) => (
                  <span key={i} className="badge" style={{ background: "var(--primary-bg)", color: "var(--primary-light)" }}>
                    {elem}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {evaluation.strengths && (
            <div style={{ background: "var(--success-bg)", padding: 14, borderRadius: "var(--radius)", marginBottom: 12, color: "var(--success)" }}>
              <strong>Strengths:</strong> {evaluation.strengths}
            </div>
          )}

          {/* Improvement */}
          {evaluation.areas_for_improvement && (
            <div style={{ background: "var(--warning-bg)", padding: 14, borderRadius: "var(--radius)", marginBottom: 12, color: "var(--warning)" }}>
              <strong>Next time:</strong> {evaluation.areas_for_improvement}
            </div>
          )}

          <GameConclusionFlow
            gameName="Scene Description"
            score={totalScore}
            total={attemptCount * 10} // Scores are out of 10
            duration={60 - timeLeft}
            level={1}
            skills={["Visual Perception", "Speech", "Observation"]}
            onAction={isSession ? onComplete : () => setPhase("initial")}
            actionLabel={isSession ? "Continue Journey" : "Play Again"}
          />
        </div>
      )}
    </div>
  );
}
