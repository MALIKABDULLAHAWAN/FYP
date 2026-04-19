import React, { useState, useEffect, useRef } from 'react';
import './CalmDown.css';

/**
 * CalmDown - A guided breathing component with visual and audio cues.
 * Helps children transition from high-engagement games to a calm state for reporting.
 */
export default function CalmDown({ onComplete }) {
  const [phase, setPhase] = useState("inhale"); // inhale, hold, exhale
  const [timer, setTimer] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const totalCycles = 3;

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (cycleCount === 0) {
      speak("You did so much great work! Let's take a tiny break to feel calm and happy. Just follow the glowing circle.");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Transition phase
          if (phase === "inhale") {
            setPhase("hold");
            return 3;
          } else if (phase === "hold") {
            setPhase("exhale");
            return 4;
          } else {
            // Exhale finished
            if (cycleCount + 1 >= totalCycles) {
              clearInterval(interval);
              onComplete();
              return 0;
            }
            setCycleCount(c => c + 1);
            setPhase("inhale");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, cycleCount, onComplete]);

  return (
    <div className="calm-down-overlay">
      <div className="calm-down-content">
        <h2 className="calm-title">Relaxation Time ✨</h2>
        
        <div className={`breathing-circle ${phase}`}>
          <div className="circle-inner">
            <span className="phase-text">
              {phase === "inhale" && "Breathe In 🌬️"}
              {phase === "hold" && "Hold ⏸️"}
              {phase === "exhale" && "Breathe Out 💨"}
            </span>
            <span className="timer-text">{timer}</span>
          </div>
        </div>

        <div className="progress-dots">
          {[...Array(totalCycles)].map((_, i) => (
            <div key={i} className={`dot ${i <= cycleCount ? 'active' : ''}`} />
          ))}
        </div>

        <p className="calm-hint">
          {phase === "inhale" && "Feel the air fill your tummy like a balloon..."}
          {phase === "hold" && "Keep that quiet feeling inside..."}
          {phase === "exhale" && "Let all the air out slowly..."}
        </p>
      </div>
    </div>
  );
}
