const runtimeEnv =
  (typeof globalThis !== "undefined" && globalThis.__VITE_ENV__) ||
  (typeof window !== "undefined" && window.__VITE_ENV__) ||
  {};

function readEnv(...keys) {
  for (const key of keys) {
    const value = runtimeEnv[key] ?? import.meta.env?.[key];
    if (value) return String(value);
  }
  return "";
}

function normalizeBackendOrigin(rawValue, fallback = "http://127.0.0.1:8000") {
  const raw = String(rawValue || fallback).trim().replace(/\/+$/, "");

  // Accept both origin-only values and legacy values that include /api or /api/v1.
  return raw.replace(/\/api(?:\/v\d+)?$/i, "");
}

function normalizeWebSocketOrigin(rawValue, fallback = "") {
  const raw = String(rawValue || fallback).trim().replace(/\/+$/, "");

  // Accept origin-only values and legacy values that included a ws path.
  return raw.replace(/\/ws(?:\/.*)?$/i, "");
}

export const API_ORIGIN = normalizeBackendOrigin(
  readEnv("VITE_API_BASE_URL", "VITE_API_URL", "VITE_API_BASE", "VITE_API_ORIGIN")
);

export function getApiOrigin() {
  return API_ORIGIN;
}

export function buildApiUrl(path = "") {
  if (!path) return API_ORIGIN;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getWebSocketOrigin() {
  const protocol = API_ORIGIN.startsWith("https://") ? "wss://" : "ws://";
  const host = API_ORIGIN.replace(/^https?:\/\//i, "");
  return `${protocol}${host}`;
}

export function buildWebSocketUrl(path = "") {
  const base = getWebSocketOrigin();
  if (!path) return base;
  if (path.startsWith("ws://") || path.startsWith("wss://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
