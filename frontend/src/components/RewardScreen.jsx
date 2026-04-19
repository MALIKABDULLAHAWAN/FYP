import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

/**
 * RewardScreen - A super cute celebration screen for therapy progress
 * Shows stars, hearts, and high-energy feedback.
 */
export default function RewardScreen({ stars = 3, message = "Amazing Job!", onNext }) {
  const [claps, setClaps] = useState(0);

  useEffect(() => {
    // High-energy confetti burst
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF9A9E', '#FAD0C4', '#FFDEE9']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#A1C4FD', '#C2E9FB', '#D4FC79']
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const handleClap = () => {
    setClaps(prev => prev + 1);
    confetti({
      particleCount: 15,
      scalar: 2,
      angle: 90,
      spread: 45,
      origin: { y: 0.6 },
      shapes: ['circle'],
      colors: ['#FF8C9E', '#FFF']
    });
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #FFF5F7 0%, #F0F5FF 100%)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Fredoka', 'Nunito', sans-serif"
    }}>
      <style>{`
        @keyframes float-heart {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(20deg); opacity: 0; }
        }
        @keyframes card-bounce {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .cute-star {
          animation: card-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .heart-float {
          position: absolute;
          font-size: 24px;
          animation: float-heart 1.5s ease-out forwards;
          pointer-events: none;
        }
        .reward-card-cute {
          background: white;
          padding: 50px;
          border-radius: 50px;
          box-shadow: 0 40px 80px rgba(255, 182, 193, 0.25);
          text-align: center;
          width: 90%;
          max-width: 450px;
          border: 8px solid #FFF;
          position: relative;
          z-index: 10;
        }
        .next-btn-cute {
          background: linear-gradient(135deg, #FF9A9E, #FF6B6B);
          color: white;
          border: none;
          border-radius: 30px;
          padding: 20px 40px;
          font-size: 24px;
          font-weight: 900;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 15px 35px rgba(255, 154, 158, 0.4);
          transition: all 0.3s;
        }
        .next-btn-cute:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 20px 45px rgba(255, 154, 158, 0.5);
        }
      `}</style>

      <div className="reward-card-cute">
        <div style={{ fontSize: "90px", marginBottom: "20px", display: "inline-block", animation: "bounce 2s infinite" }}>🎈</div>
        
        <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#FF5A78", margin: "0 0 15px", letterSpacing: "-1px" }}>
          {message}
        </h1>
        <p style={{ color: "#718096", fontSize: "20px", fontWeight: 700, marginBottom: "30px" }}>
          You did it! You're so brave! ✨
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px" }}>
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="cute-star"
              style={{ 
                fontSize: "60px", 
                filter: i < stars ? "drop-shadow(0 0 10px #FFD93D)" : "grayscale(1)",
                animationDelay: `${i * 0.2}s`
              }}
            >
              ⭐
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "40px", position: "relative" }}>
          <button 
            onClick={handleClap}
            style={{
              fontSize: "70px",
              background: "#FFF5F7",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              border: "5px solid #FFE4E8",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >
            👏
          </button>
          
          <div style={{ marginTop: "15px", color: "#FFACB7", fontWeight: 800, fontSize: "18px" }}>
            {claps === 0 ? "Give yourself a high five!" : `${claps} Big Claps! ✨`}
          </div>
        </div>

        <button 
          onClick={onNext}
          className="next-btn-cute"
        >
          I'm Ready! 🚀
        </button>
      </div>

      {/* Decorative background icons */}
      <div style={{ position: "fixed", top: "10%", left: "5%", fontSize: "40px", opacity: 0.3 }}>🍭</div>
      <div style={{ position: "fixed", bottom: "15%", left: "12%", fontSize: "32px", opacity: 0.3 }}>🎨</div>
      <div style={{ position: "fixed", top: "15%", right: "8%", fontSize: "44px", opacity: 0.3 }}>🍄</div>
      <div style={{ position: "fixed", bottom: "10%", right: "15%", fontSize: "38px", opacity: 0.3 }}>🧸</div>
    </div>
  );
}
