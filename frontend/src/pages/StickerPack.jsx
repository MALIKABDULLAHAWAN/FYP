import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UiIcon from "../components/ui/UiIcon";
import { 
  AnimalStickers, FruitStickers, ShapeStickers, 
  VehicleStickers, ObjectStickers, PatternStickers 
} from "../components/Stickers";
import { Sticker3D } from "../components/AmbientEffects";

import "./Dashboard.css"; // Reuse card and panel styles

export default function StickerPack() {
  const navigate = useNavigate();
  const [earnedStickers, setEarnedStickers] = useState([]);
  const [activeTab, setActiveTab] = useState("animals");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dhyan_earned_stickers") || "[]");
      setEarnedStickers(saved);
    } catch (e) {
      console.error("Failed to load stickers", e);
    }
  }, []);

  const RewardStickers = {
    star_gold: <Sticker3D emoji="⭐" size={80} />,
    trophy: <Sticker3D emoji="🏆" size={80} />,
    unicorn: <Sticker3D emoji="🦄" size={80} />,
    rocket: <Sticker3D emoji="🚀" size={80} />,
    dino: <Sticker3D emoji="🦖" size={80} />,
    heart: <Sticker3D emoji="💖" size={80} />,
    lion: <Sticker3D emoji="🦁" size={80} />,
    cat: <Sticker3D emoji="🐱" size={80} />,
    dog: <Sticker3D emoji="🐶" size={80} />,
    rabbit: <Sticker3D emoji="🐰" size={80} />,
    bird: <Sticker3D emoji="🐦" size={80} />,
    fish: <Sticker3D emoji="🐠" size={80} />,
    bee: <Sticker3D emoji="🐝" size={80} />,
    apple: <Sticker3D emoji="🍎" size={80} />,
    banana: <Sticker3D emoji="🍌" size={80} />,
    strawberry: <Sticker3D emoji="🍓" size={80} />,
    car: <Sticker3D emoji="🚗" size={80} />,
    boat: <Sticker3D emoji="⛵" size={80} />,
    airplane: <Sticker3D emoji="✈️" size={80} />,
    book: <Sticker3D emoji="📚" size={80} />,
    balloon: <Sticker3D emoji="🎈" size={80} />,
    ice_cream: <Sticker3D emoji="🍦" size={80} />,
    pizza: <Sticker3D emoji="🍕" size={80} />,
    gift: <Sticker3D emoji="🎁" size={80} />,
  };

  const CATEGORIES = [
    { id: "animals", label: "Animals", icon: "dog", data: AnimalStickers },
    { id: "fruits", label: "Fruits", icon: "palette", data: FruitStickers },
    { id: "shapes", label: "Shapes", icon: "star", data: ShapeStickers },
    { id: "vehicles", label: "Vehicles", icon: "rocket", data: VehicleStickers },
    { id: "objects", label: "Objects", icon: "book", data: ObjectStickers },
    { id: "rewards", label: "Rewards", icon: "award", data: RewardStickers },
  ];


  const currentCategory = CATEGORIES.find(c => c.id === activeTab);

  const isEarned = (category, key) => {
    return earnedStickers.some(s => s.category === category && s.key === key);
  };

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <div className="header" style={{ marginBottom: "40px" }}>
        <div>
          <div className="h1" style={{ fontSize: "3rem", marginBottom: "8px" }}>My Sticker Album</div>
          <div className="sub" style={{ fontSize: "1.2rem" }}>
            You have collected {earnedStickers.length} magical stickers!
          </div>
        </div>
        <button className="btn btn-cute btn-cute-secondary" onClick={() => navigate("/dashboard")}>
          <UiIcon name="home" size={20} title="" /> Back home
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "32px", 
        overflowX: "auto", 
        paddingBottom: "8px",
        scrollBehavior: "smooth"
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`btn ${activeTab === cat.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              borderRadius: "50px", 
              padding: "12px 24px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              minWidth: "max-content",
              boxShadow: activeTab === cat.id ? "0 4px 15px rgba(99, 102, 241, 0.3)" : "none"
            }}
          >
            <UiIcon name={cat.icon} size={20} title="" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="panel" style={{ 
        padding: "40px", 
        background: "rgba(255,255,255,0.7)", 
        backdropFilter: "blur(10px)",
        borderRadius: "40px"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
          gap: "24px" 
        }}>
          {Object.keys(currentCategory.data).map(key => {
            const earned = isEarned(activeTab, key);
            return (
              <div 
                key={key}
                style={{
                  aspectRatio: "1",
                  background: earned ? "white" : "rgba(0,0,0,0.05)",
                  borderRadius: "24px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  transform: earned ? "scale(1)" : "scale(0.95)",
                  boxShadow: earned ? "0 8px 20px rgba(0,0,0,0.08)" : "none",
                  border: earned ? `2px solid var(--primary-light)` : "2px dashed #ddd",
                  filter: earned ? "none" : "grayscale(1) opacity(0.5)"
                }}
              >
                <div style={{ width: "100%", height: "100%", opacity: earned ? 1 : 0.3 }}>
                  {currentCategory.data[key]}
                </div>
                
                {!earned && (
                  <div style={{ 
                    position: "absolute", 
                    bottom: "-10px", 
                    background: "#eee", 
                    padding: "4px 12px", 
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#999"
                  }}>
                    Locked
                  </div>
                )}
                
                {earned && (
                  <div style={{ 
                    position: "absolute", 
                    top: "-8px", 
                    right: "-8px", 
                    background: "var(--primary)", 
                    color: "white",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                  }}>
                    ✨
                  </div>
                )}
                
                <span style={{ 
                  marginTop: "12px", 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  color: earned ? "#333" : "#bbb",
                  textTransform: "capitalize"
                }}>
                  {key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collection Stats */}
      <div style={{ marginTop: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Tip: Play games at Level 3 or higher with 70% accuracy to earn more stickers!</p>
      </div>
    </div>
  );
}
