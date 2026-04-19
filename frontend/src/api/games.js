import { apiFetch } from "./client";

const BASE = "/api/v1/therapy";

// ── Dashboard Stats ──
export function getDashboardStats() {
  return apiFetch(`${BASE}/dashboard/stats`);
}

// ── Session History ──
export function getSessionHistory({ child_id, status, game_type, limit } = {}) {
  const params = new URLSearchParams();
  if (child_id) params.set("child_id", child_id);
  if (status) params.set("status", status);
  if (game_type) params.set("game_type", game_type);
  if (limit) params.set("limit", limit);
  const qs = params.toString();
  return apiFetch(`${BASE}/sessions/history${qs ? "?" + qs : ""}`);
}

// ── Child Progress ──
export function getChildProgress(childId) {
  return apiFetch(`${BASE}/children/${childId}/progress`);
}

export function getChildInsights(childId) {
  return apiFetch(`${BASE}/children/${childId}/insights`);
}

// ── Generic Game API (works for matching, object_discovery, problem_solving) ──
export function startGameSession(gameCode, childId, trialCount = 10, opts = {}) {
  return apiFetch(`${BASE}/games/${gameCode}/start/`, {
    method: "POST",
    body: {
      child_id: childId,
      trials_planned: trialCount,
      time_limit_ms: opts.time_limit_ms || 10000,
      supervision_mode: opts.supervision_mode || "therapist",
      session_title: opts.session_title || null,
      difficulty_level: opts.difficulty_level || 1,
    },
  });
}

export function nextGameTrial(gameCode, sessionId) {
  return apiFetch(`${BASE}/games/${gameCode}/${sessionId}/next/`, {
    method: "POST",
    body: {},
  });
}

export function submitGameTrial(gameCode, trialId, clicked, responseTimeMs, timedOut = false) {
  return apiFetch(`${BASE}/games/${gameCode}/trial/${trialId}/submit/`, {
    method: "POST",
    body: { clicked, response_time_ms: responseTimeMs, timed_out: timedOut },
  });
}

export function getGameSummary(gameCode, sessionId) {
  return apiFetch(`${BASE}/games/${gameCode}/${sessionId}/summary/`);
}

// ── End / Abandon Session ──
export function endSession(sessionId) {
  return apiFetch(`${BASE}/sessions/${sessionId}/end`, {
    method: "POST",
    body: {},
  });
}
export function getRandomGameImages(gameType, count = 8, difficulty = null) {
  const params = new URLSearchParams();
  params.set("game_type", gameType);
  params.set("count", count);
  if (difficulty) params.set("difficulty", difficulty);
  return apiFetch(`${BASE}/images/random?${params.toString()}`);
}
