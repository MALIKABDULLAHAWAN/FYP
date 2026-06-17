// Ambient Effects Component - Floating Particles & Confetti
// Adds beautiful background animations for smooth, polished feel

import { useState, useEffect, useCallback } from 'react';

// Ambient Floating Particles Background
export const AmbientParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb', '#84fab0', '#8fd3f4', '#fa709a', '#fee140', '#FFB6C1', '#FFD93D'];
    const initialParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 15,
      drift: (Math.random() - 0.5) * 100
    }));
    setParticles(initialParticles);
  }, []);

  return (
    <div className="ambient-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="ambient-particle"
          style={{
            left: `${p.x}%`,
            bottom: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            opacity: 0.3 + Math.random() * 0.3
          }}
        />
      ))}
    </div>
  );
};

// Confetti Explosion Component
export const ConfettiExplosion = ({ trigger, onComplete }) => {
  const [pieces, setPieces] = useState([]);

  const explode = useCallback(() => {
    const colors = ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb', '#84fab0', '#8fd3f4', '#fa709a', '#fee140', '#FFD700', '#FF69B4'];
    const newPieces = Array.from({ length: 50 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 50;
      const velocity = 200 + Math.random() * 300;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 200;
      const rot = Math.random() * 720;

      return {
        id: Date.now() + i,
        x: 50,
        y: 50,
        tx,
        ty,
        rot,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      };
    });

    setPieces(newPieces);

    setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, 2000);
  }, [onComplete]);

  useEffect(() => {
    if (trigger) {
      explode();
    }
  }, [trigger, explode]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '0',
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`
          }}
        />
      ))}
    </div>
  );
};

// Smooth Loading Skeleton
export const SmoothSkeleton = ({ width = '100%', height = '20px', circle = false }) => (
  <div
    className="shimmer"
    style={{
      width,
      height,
      borderRadius: circle ? '50%' : '8px',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%'
    }}
  />
);

// Glass Card Component
export const GlassCard = ({ children, className = '', style = {} }) => (
  <div
    className={`glass card-smooth ${className}`}
    style={{
      padding: '20px',
      borderRadius: '20px',
      ...style
    }}
  >
    {children}
  </div>
);

// Smooth Button with Ripple Effect
export const SmoothButton = ({ children, onClick, className = '', style = {}, disabled = false }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      className={`btn-smooth ${className}`}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none'
          }}
        />
      ))}
      {children}
      <style>{`
        @keyframes ripple {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

// 3D Sticker Display
export const Sticker3D = ({ children, emoji, size = 100, animate = true }) => (
  <div className="sticker-3d" style={{ display: 'inline-block', fontSize: size }}>
    <div className={`sticker ${animate ? 'sticker-spring' : ''}`}>
      {emoji || children}
    </div>
  </div>
);

// Spring Animated Container
export const SpringContainer = ({ children, delay = 0 }) => (
  <div
    style={{
      animation: `springIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`
    }}
  >
    {children}
  </div>
);

// Parallax Background Layer
export const ParallaxBackground = ({ children, speed = 0.5 }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      style={{
        transform: `translateY(${offset}px)`,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
};

// Smooth Counter Animation
export const SmoothCounter = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

// Floating Emoji Animation for celebrations
export const FloatingEmoji = ({ emoji, x, y, delay = 0 }) => {
  return (
    <div
      className="floating-emoji-animation"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        fontSize: '40px',
        pointerEvents: 'none',
        zIndex: 9999,
        animation: `floatUpAndFade 2s ease-out ${delay}s forwards`,
      }}
    >
      {emoji}
    </div>
  );
};

// Magical Sparkles Component
export const MagicalSparkles = ({ children, active = true }) => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (!active) return;
    
    const interval = setInterval(() => {
      const newSparkle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 1 + Math.random() * 2,
      };
      setSparkles(prev => [...prev.slice(-10), newSparkle]);
    }, 300);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {sparkles.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: 'radial-gradient(circle, #fff, #ffd700)',
            borderRadius: '50%',
            pointerEvents: 'none',
            animation: `sparkle ${s.duration}s ease-out forwards`,
            boxShadow: '0 0 10px #ffd700',
          }}
        />
      ))}
      {children}
    </div>
  );
};

// Success Burst Animation
export const SuccessBurst = ({ trigger, onComplete }) => {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#ff9a9e', '#a18cd1'];
      const newBursts = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 30) + Math.random() * 20,
        distance: 80 + Math.random() * 60,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 8,
        duration: 0.8 + Math.random() * 0.4,
        emoji: ['⭐', '✨', '🎉', '🌟', '💫', '🎊'][i % 6],
      }));
      setBursts(newBursts);
      
      setTimeout(() => {
        setBursts([]);
        onComplete?.();
      }, 1500);
    }
  }, [trigger, onComplete]);

  if (!bursts.length) return null;

  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 9999 }}>
      {bursts.map(b => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            fontSize: b.size,
            color: b.color,
            animation: `burstOut ${b.duration}s ease-out forwards`,
            '--angle': `${b.angle}deg`,
            '--distance': `${b.distance}px`,
          }}
        >
          {b.emoji}
        </div>
      ))}
    </div>
  );
};

// Floating Orbs Background
export const FloatingOrbs = ({ count = 5 }) => {
  const [orbs, setOrbs] = useState([]);

  useEffect(() => {
    const colors = ['#ff9a9e40', '#a18cd140', '#84fab040', '#fa709a40', '#fee14040'];
    const newOrbs = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 100 + Math.random() * 200,
      color: colors[i % colors.length],
      duration: 20 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
    setOrbs(newOrbs);
  }, [count]);

  return (
    <div className="floating-orbs-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
      {orbs.map(orb => (
        <div
          key={orb.id}
          style={{
            position: 'absolute',
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: `floatOrb ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

// Bouncing Stars
export const BouncingStars = ({ active = true }) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    if (!active) return;
    
    const newStars = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      delay: i * 0.5,
      duration: 2 + Math.random(),
    }));
    setStars(newStars);
  }, [active]);

  return (
    <div style={{ position: 'absolute', top: -20, right: -20, pointerEvents: 'none' }}>
      {stars.map(star => (
        <div
          key={star.id}
          style={{
            fontSize: '24px',
            animation: `bounceStar ${star.duration}s ease-in-out ${star.delay}s infinite`,
            display: 'inline-block',
            margin: '0 2px',
          }}
        >
          ⭐
        </div>
      ))}
    </div>
  );
};

// Pulsing Heart for favorites/achievements
export const PulsingHeart = ({ active = false }) => {
  if (!active) return null;
  
  return (
    <div
      style={{
        fontSize: '32px',
        animation: 'heartPulse 1.5s ease-in-out infinite',
        display: 'inline-block',
      }}
    >
      💖
    </div>
  );
};

// Enhanced exports
export default {
  AmbientParticles,
  ConfettiExplosion,
  SmoothSkeleton,
  GlassCard,
  SmoothButton,
  Sticker3D,
  SpringContainer,
  ParallaxBackground,
  SmoothCounter,
  FloatingEmoji,
  MagicalSparkles,
  SuccessBurst,
  FloatingOrbs,
  BouncingStars,
  PulsingHeart
};
