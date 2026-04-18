import { useMemo, useState } from "react";
import UiIcon from "./UiIcon";

const DOT = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  purple: "#a855f7",
  white: "#f8fafc",
};

const EXT = ["png", "jpg", "jpeg", "webp"];

function PicToken({ id, size }) {
  const candidates = useMemo(() => EXT.map((e) => `/ja/${id}.${e}`), [id]);
  const [i, setI] = useState(0);
  if (i >= candidates.length) {
    return <UiIcon name="picture" size={size} title={id} />;
  }
  return (
    <img
      src={candidates[i]}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: "contain", borderRadius: 8 }}
      onError={() => setI((x) => x + 1)}
    />
  );
}

function Arrow({ dir, size }) {
  const d =
    dir === "up"
      ? "M12 19V5M5 12l7-7 7 7"
      : dir === "right"
        ? "M5 12h14M12 5l7 7-7 7"
        : dir === "down"
          ? "M12 5v14M19 12l-7 7-7-7"
          : "M19 12H5M12 19l-7-7 7-7";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#475569" }}>
      <path d={d} />
    </svg>
  );
}

function MoonPhase({ phase, size }) {
  const fills = ["#1e293b", "#334155", "#64748b", "#94a3b8"];
  const idx = Math.min(3, Math.max(0, parseInt(phase, 10) - 1));
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={fills[idx]} />
    </svg>
  );
}

function Face({ kind, size }) {
  const stroke = "#475569";
  if (kind === "happy")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="10" r="1" fill={stroke} stroke="none" />
        <circle cx="15" cy="10" r="1" fill={stroke} stroke="none" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      </svg>
    );
  if (kind === "sad")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="10" r="1" fill={stroke} stroke="none" />
        <circle cx="15" cy="10" r="1" fill={stroke} stroke="none" />
        <path d="M8 16s1.5-2 4-2 4 2 4 2" />
      </svg>
    );
  if (kind === "angry")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 9l2-1M16 9l-2-1" />
        <path d="M8 16h8" />
      </svg>
    );
  if (kind === "scared")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
        <path d="M8 15h8" />
      </svg>
    );
  if (kind === "sleep")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 10h2M14 10h2" />
        <path d="M9 15h6" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ShapeStar({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1">
      <polygon points="12 2 15 10 22 10 16 14 18 22 12 17 6 22 8 14 2 10 9 10" />
    </svg>
  );
}

function ShapeHeart({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ec4899" stroke="#db2777" strokeWidth="1">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/**
 * Renders one pattern cell from backend token (no emoji).
 */
export default function PatternToken({ token, size = 40 }) {
  if (!token || token === "question") {
    return <UiIcon name="question" size={size} title="Next in pattern" />;
  }
  if (token.startsWith("dot-")) {
    const color = token.slice(4);
    const fill = DOT[color] || "#64748b";
    const stroke = color === "white" ? "#94a3b8" : "none";
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block" }}>
        <circle cx="12" cy="12" r="10" fill={fill} stroke={stroke} strokeWidth={stroke === "none" ? 0 : 1.5} />
      </svg>
    );
  }
  if (token.startsWith("num-")) {
    const n = token.slice(4);
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block" }}>
        <circle cx="12" cy="12" r="10" fill="#64748b" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="system-ui,sans-serif">
          {n}
        </text>
      </svg>
    );
  }
  if (token.startsWith("arrow-")) {
    return <Arrow dir={token.slice(6)} size={size} />;
  }
  if (token.startsWith("moon-")) {
    return <MoonPhase phase={token.slice(5)} size={size} />;
  }
  if (token.startsWith("face-")) {
    return <Face kind={token.slice(5)} size={size} />;
  }
  if (token === "shape-star") return <ShapeStar size={size} />;
  if (token === "shape-heart") return <ShapeHeart size={size} />;
  if (token.startsWith("pic-")) {
    return <PicToken id={token.slice(4)} size={size} />;
  }
  return (
    <span style={{ fontSize: size * 0.45, fontWeight: 600, color: "var(--text)" }}>{token}</span>
  );
}
