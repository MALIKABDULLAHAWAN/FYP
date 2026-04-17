import Confetti from "./Confetti";
import ProgressRing from "./ProgressRing";
import { useState, useEffect, useMemo } from "react";
import UiIcon from "./ui/UiIcon";
import { AnimalStickers, FruitStickers, ObjectStickers, ShapeStickers, VehicleStickers } from "./Stickers";

export default function SummaryPanel({ data, lastTrialText }) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Randomly pick a reward sticker category and key if the performance is good
  const rewardSticker = useMemo(() => {
    const categories = {
      animals: AnimalStickers,
      fruits: FruitStickers,
      objects: ObjectStickers,
      shapes: ShapeStickers,
      vehicles: VehicleStickers,
    };
    
    const catKeys = Object.keys(categories);
    const randomCat = catKeys[Math.floor(Math.random() * catKeys.length)];
    const stickerMap = categories[randomCat];
    const stickerKeys = Object.keys(stickerMap);
    const randomKey = stickerKeys[Math.floor(Math.random() * stickerKeys.length)];
    
    return {
      category: randomCat,
      key: randomKey,
      svg: stickerMap[randomKey]
    };
  }, []);


  const accNumRaw =
    typeof data?.accuracy === "string"
      ? parseFloat(data.accuracy)
      : typeof data?.accuracy === "number"
      ? data.accuracy
      : 0;
  const accNum = isNaN(accNumRaw) ? 0 : accNumRaw;
  const accPct = accNum > 1 ? accNum : Math.round(accNum * 100);
  const isGood = accPct >= 70;

  useEffect(() => {
    if (data && isGood) {
      setShowConfetti(true);
      
      // Save earned sticker to collection
      try {
        const savedStickersStr = localStorage.getItem("dhyan_earned_stickers") || "[]";
        const savedStickers = JSON.parse(savedStickersStr);
        
        // Check if we already have it
        const alreadyEarned = savedStickers.some(s => s.category === rewardSticker.category && s.key === rewardSticker.key);
        
        if (!alreadyEarned && rewardSticker) {
          savedStickers.push({
            category: rewardSticker.category,
            key: rewardSticker.key,
            earnedAt: new Date().toISOString()
          });
          localStorage.setItem("dhyan_earned_stickers", JSON.stringify(savedStickers));
        }
      } catch (e) {
        console.error("Failed to save sticker", e);
      }
    }
  }, [data, isGood, rewardSticker]);


  if (!data) return null;

  const heading =
    accPct >= 90
      ? "Outstanding!"
      : accPct >= 70
      ? "Great Job!"
      : accPct >= 50
      ? "Good Effort!"
      : "Keep Practicing!";
  const detailRows = [
    ["Total Trials", data.total_trials ?? "—"],
    ["Correct", data.correct ?? "—"],
    ["Avg Response Time", data.avg_response_time_ms ? `${data.avg_response_time_ms}ms` : "—"],
    ["Level", data.current_level ?? "—"],
  ];

  return (
    <div className="celebration-panel" style={{ marginTop: 16, animation: "feedbackIn .5s var(--ease-out)" }}>
      {showConfetti && <Confetti duration={4000} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{heading}</div>
          {data.suggestion && (
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4, maxWidth: 300 }}>
              {data.suggestion}
            </div>
          )}
        </div>
        
        {isGood && (
          <div
            title={`You unlocked 1x ${rewardSticker.key}!`}
            style={{ 
              display: "flex", flexDirection: "column", alignItems: "center"
            }}
          >
            <div 
              className="reward-badge"
              style={{ 
                width: 80, height: 80, 
                background: "rgba(255,255,255,0.1)", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                animation: "bounce 2s infinite"
              }}
            >
              {rewardSticker.svg}
            </div>
            <div style={{ fontSize: 11, color: "var(--primary-dark)", marginTop: 8, fontWeight: 700 }}>
              Saved to Album!
            </div>
          </div>
        )}
      </div>

      {/* Accuracy Ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <ProgressRing
          value={accPct}
          size={100}
          strokeWidth={9}
          color={accPct >= 80 ? "#10b981" : accPct >= 50 ? "#f59e0b" : "#ef4444"}
        />
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 12 }}>
        {detailRows.map(([k, v]) => (
          <div className="stat-card" key={k} style={{ padding: "10px 8px" }}>
            <div className="stat-value" style={{ fontSize: 18 }}>{v}</div>
            <div className="stat-label">{k}</div>
          </div>
        ))}
      </div>

      {lastTrialText && (
        <div className="badge" style={{ marginTop: 8, textAlign: "center" }}>
          <span>Last Trial:</span>{" "}
          <b style={{ color: "rgba(255,255,255,0.9)" }}>{lastTrialText}</b>
        </div>
      )}
    </div>
  );
}
