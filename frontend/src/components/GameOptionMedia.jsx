import { useEffect, useState } from "react";
import PatternToken from "./ui/PatternToken";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");

export function resolveGameImageUrl(opt) {
  if (!opt || typeof opt !== "object") return null;
  const raw = opt.image_url || opt.image || opt.metadata?.fallback_image_url;
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_BASE}${path}`;
}

/**
 * Renders a game answer choice: photo when URL is available, else pattern token or text.
 */
export default function GameOptionMedia({ opt, usePatternTokens, imageSize = 88 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = resolveGameImageUrl(opt);
  const label = opt.label || opt.id || "";

  useEffect(() => {
    setImgFailed(false);
  }, [opt?.id, url]);

  if (usePatternTokens && !url) {
    return <PatternToken token={String(opt.label)} size={44} />;
  }

  if (url && !imgFailed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          width: "100%",
        }}
      >
        <img
          src={url}
          alt={label}
          style={{
            width: imageSize,
            height: imageSize,
            objectFit: "cover",
            borderRadius: 14,
            background: "var(--surface-2, #f1f5f9)",
          }}
          onError={() => setImgFailed(true)}
        />
        <span style={{ fontSize: 15, fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>{label}</span>
      </div>
    );
  }

  return (
    <span style={{ fontSize: 22, fontWeight: 700, textAlign: "center", display: "block", padding: "4px 0" }}>
      {label}
    </span>
  );
}
