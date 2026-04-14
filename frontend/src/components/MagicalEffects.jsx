import { useEffect, useState } from "react";
import UiIcon from "./ui/UiIcon";

export default function MagicalEffects() {
  const [theme, setTheme] = useState("rainbow");

  const switchTheme = () => {
    const themes = ["rainbow", "ocean", "forest", "sunset"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);

    document.body.className = `theme-${nextTheme}`;

    createThemeChangeEffect();
  };

  const createThemeChangeEffect = () => {
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"];

    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      const distance = 100;

      for (let j = 0; j < 3; j++) {
        setTimeout(() => {
          const particle = document.createElement("div");
          particle.style.position = "fixed";
          particle.style.width = "8px";
          particle.style.height = "8px";
          particle.style.borderRadius = "50%";
          particle.style.background = colors[i % colors.length];
          particle.style.left = "50%";
          particle.style.top = "50%";
          particle.style.pointerEvents = "none";
          particle.style.zIndex = "9999";
          particle.style.animation = "themeParticleBurst 1s ease-out forwards";
          particle.style.setProperty("--tx", `${Math.cos(angle) * distance * (j + 1)}px`);
          particle.style.setProperty("--ty", `${Math.sin(angle) * distance * (j + 1)}px`);
          document.body.appendChild(particle);

          setTimeout(() => particle.remove(), 1000);
        }, j * 100);
      }
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === "BUTTON" || e.target.closest(".btn")) {
        const ripple = document.createElement("div");
        ripple.className = "click-ripple";
        ripple.style.left = e.clientX - 50 + "px";
        ripple.style.top = e.clientY - 50 + "px";
        document.body.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <button
        type="button"
        className="theme-switcher"
        onClick={switchTheme}
        title="Switch Theme"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        <UiIcon name="paint" size={22} title="" />
      </button>

      <style jsx>{`
        @keyframes themeParticleBurst {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
