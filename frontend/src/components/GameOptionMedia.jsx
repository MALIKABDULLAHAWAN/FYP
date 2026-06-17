import { useEffect, useState } from "react";
import PatternToken from "./ui/PatternToken";
import { CONTENT_LIBRARY } from "../data/contentLibrary";
import { Sticker3D, SpringContainer } from "./AmbientEffects";
import { buildApiUrl } from "../api/base";

/**
 * Helper to get a sticker component for a given label/id
 */
function getStickerForOption(opt) {
  if (!opt) return null;
  const key = (opt.label || opt.id || "").toLowerCase();
  
  // Search through content library categories
  for (const category of Object.values(CONTENT_LIBRARY)) {
    if (category[key]?.sticker) {
      return category[key].sticker;
    }
  }
  return null;
}

export function resolveGameImageUrl(opt) {
  if (!opt || typeof opt !== "object") return null;
  const raw = opt.image_url || opt.image || opt.metadata?.fallback_image_url;
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return buildApiUrl(path);
}

/**
 * Renders a game answer choice: photo when URL is available, else pattern token or text.
 */
export default function GameOptionMedia({ opt, usePatternTokens, imageSize = 88 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = resolveGameImageUrl(opt);
  const label = opt.label || opt.id || "";
  const StickerIcon = getStickerForOption(opt);

  useEffect(() => {
    setImgFailed(false);
  }, [opt?.id, url]);

  // Priority 1: Pattern Tokens (if explicitly requested)
  if (usePatternTokens && !url) {
    return <PatternToken token={String(opt.label)} size={44} />;
  }

  // Priority 2: SVG Stickers (for consistency)
  if (StickerIcon && !imgFailed) {
    return (
      <SpringContainer delay={Math.random() * 0.2}>
        <div className="option-media-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
          <Sticker3D animate={true}>
            <div className="sticker-container" style={{ width: imageSize, height: imageSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {typeof StickerIcon === 'function' ? <StickerIcon /> : StickerIcon}
            </div>
          </Sticker3D>
          <span style={{ fontSize: 15, fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>{label}</span>
        </div>
      </SpringContainer>
    );
  }

  // Priority 3: Photo URLs
  if (url && !imgFailed) {
    return (
      <SpringContainer delay={Math.random() * 0.2}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <Sticker3D animate={true}>
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
          </Sticker3D>
          <span style={{ fontSize: 15, fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>{label}</span>
        </div>
      </SpringContainer>
    );
  }

  return (
    <span style={{ fontSize: 22, fontWeight: 700, textAlign: "center", display: "block", padding: "4px 0" }}>
      {label}
    </span>
  );
}
