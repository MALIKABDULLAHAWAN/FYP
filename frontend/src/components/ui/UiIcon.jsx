import { useEffect, useState } from "react";

/**
 * UI icons as SVG images (no emoji). Files live in /public/ui-icons/{name}.svg
 */
export default function UiIcon({ name, size = 24, className = "", title }) {
  const runtimeEnv =
    (typeof globalThis !== "undefined" && globalThis.__VITE_ENV__) ||
    (typeof window !== "undefined" && window.__VITE_ENV__) ||
    {};
  const base = (runtimeEnv.BASE_URL || import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  const [src, setSrc] = useState(`${base}ui-icons/${name}.svg`);
  useEffect(() => {
    setSrc(`${base}ui-icons/${name}.svg`);
  }, [base, name]);
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className}
      alt={title || ""}
      decoding="async"
      loading="lazy"
      onError={() => setSrc(`${base}ui-icons/question.svg`)}
      {...(title ? { title } : { "aria-hidden": true })}
    />
  );
}
