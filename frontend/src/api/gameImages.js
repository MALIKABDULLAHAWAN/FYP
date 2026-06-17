import { apiFetch } from "./client";

const BASE = "/api/v1/therapy";

/**
 * List game images with optional filtering
 * @param {Object} filters - { game_type, category, difficulty, tags }
 */
export function listGameImages(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return apiFetch(`${BASE}/images${query ? `?${query}` : ""}`, { method: "GET" });
}

/**
 * Get a single game image by ID
 * @param {number} id
 */
export function getGameImage(id) {
  return apiFetch(`${BASE}/images/${id}`, { method: "GET" });
}

/**
 * Get random game images for a game session
 * @param {string} gameType - memory_match|object_discovery|problem_solving
 * @param {Object} options - { count, difficulty }
 */
export function getRandomGameImages(gameType, options = {}) {
  const params = new URLSearchParams({ game_type: gameType });
  if (options.count) params.append("count", options.count);
  if (options.difficulty) params.append("difficulty", options.difficulty);
  return apiFetch(`${BASE}/images/random?${params.toString()}`, { method: "GET" });
}

/**
 * Get all game image categories
 */
export function getGameCategories() {
  return apiFetch(`${BASE}/images/categories`, { method: "GET" });
}

/**
 * Get image dataset statistics
 */
export function getImageStats() {
  return apiFetch(`${BASE}/images/stats`, { method: "GET" });
}

/**
 * List scenario images for Scene Description game
 * @param {Object} filters - { level, count }
 */
export function listScenarioImages(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return apiFetch(`${BASE}/scenarios${query ? `?${query}` : ""}`, { method: "GET" });
}

/**
 * Get a single scenario by ID
 * @param {number} id
 */
export function getScenario(id) {
  return apiFetch(`${BASE}/scenarios/${id}`, { method: "GET" });
}
