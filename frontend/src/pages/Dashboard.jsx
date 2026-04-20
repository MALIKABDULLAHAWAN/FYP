import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import { getDashboardStats, getSessionHistory, getChildProgress } from "../api/games";
import { listChildren } from "../api/patients";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import UiIcon from "../components/ui/UiIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer, AreaChart, Area } from "recharts";
import ProgressRing from "../components/ProgressRing";
import { AnimalStickers, FruitStickers, ShapeStickers, VehicleStickers, ObjectStickers, NumberStickers, PatternStickers } from "../components/Stickers";
import {
  AmbientParticles,
  ConfettiExplosion,
  SmoothButton,
  Sticker3D,
  SpringContainer,
  FloatingEmoji,
  MagicalSparkles,
  SuccessBurst,
  FloatingOrbs,
  BouncingStars,
  PulsingHeart
} from "../components/AmbientEffects";
import { MusicPlayer, MusicPlayerButton } from "../components/MusicPlayer";
import AIAgentPanel, { AIAgentButton } from "../components/AIAgentPanel";
import { CONTENT_LIBRARY } from '../data/contentLibrary';
import missionService from '../services/MissionService';
import AchievementDisplay from '../components/AchievementDisplay';
import audioFeedback from '../services/AudioFeedback';
import "../styles/professional.css";
import "../styles/ai-agents.css";
import "../styles/game-enhancements.css";
import "./Dashboard.css";

const StatCard = memo(({ iconName, label, value, accent, subtitle }) => {
  return (
    <div 
      className={`stat-card ${accent ? `stat-card-${accent}` : ""}`} 
      style={{ position: "relative", overflow: "hidden" }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {iconName && (
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }} aria-hidden="true">
          <UiIcon name={iconName} size={28} title="" />
        </div>
      )}
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
});

const AchievementBadge = memo(({ iconName, title, description, unlocked }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 12px",
        borderRadius: "12px",
        background: unlocked ? "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,185,0,0.1))" : "rgba(0,0,0,0.03)",
        border: unlocked ? "2px solid #ffd700" : "2px solid transparent",
        transition: "all 0.3s ease",
        opacity: unlocked ? 1 : 0.6,
        transform: unlocked ? "scale(1)" : "scale(0.95)"
      }}
      role="img"
      aria-label={`Achievement: ${title} - ${unlocked ? 'Unlocked' : 'Locked'}`}
    >
      <div style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "center",
        filter: unlocked ? "none" : "grayscale(100%)",
        opacity: unlocked ? 1 : 0.7,
        transition: "all 0.3s ease"
      }} aria-hidden="true">
        {unlocked ? (
          <UiIcon name={iconName} size={32} title="" />
        ) : (
          <UiIcon name="lock" size={32} title="" />
        )}
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: unlocked ? "#b8860b" : "var(--muted)",
        textAlign: "center",
        marginBottom: 4
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 10,
        color: "var(--muted)",
        textAlign: "center",
        lineHeight: 1.3
      }}>
        {description}
      </div>
      {unlocked && (
        <div style={{
          position: "absolute",
          top: 4,
          right: 4,
        }} aria-hidden="true">
          <UiIcon name="sparkles" size={14} title="" />
        </div>
      )}
    </div>
  );
});


// Dashboard component remains below
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [children, setChildren] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssistantPrompt, setShowAssistantPrompt] = useState(true);
  const [myStickers, setMyStickers] = useState([]);
  const [celebrateMission, setCelebrateMission] = useState(false);

  useEffect(() => {
    // Load stickers from local collection
    const saved = JSON.parse(localStorage.getItem('my_stickers') || '[]');
    setMyStickers(saved);
  }, []);

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      listChildren().catch(() => []),
      getSessionHistory({ limit: 10 }).catch(() => []),
    ]).then(([s, c, h]) => {
      setStats(s);
      setChildren(Array.isArray(c) ? c : (c?.results || []));
      // Handle both array and object responses for sessions
      const sessionList = Array.isArray(h) ? h : (h?.results || []);
      setSessions(sessionList);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) {
      // If no child selected (e.g. general dashboard), 
      // we already fetched general sessions in the mount useEffect.
      setChildProgress(null);
      return;
    }
    
    // Fetch progress and history for the specific child
    setLoading(true);
    Promise.all([
      getChildProgress(selectedChild).catch(() => null),
      getSessionHistory({ child_id: selectedChild, limit: 10 }).catch(() => [])
    ]).then(([progress, history]) => {
      setChildProgress(progress);
      setSessions(history);
      setLoading(false);
    });
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          <div className="dashboard-header">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Loading your data...</p>
            </div>
          </div>
          <SkeletonStatCards count={4} />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
  }

  const chartData = childProgress?.game_breakdown?.map((g) => ({
    name: g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    accuracy: Math.round(g.accuracy * 100),
    sessions: g.sessions,
    trials: g.total_trials,
  })) || [];

  // Compute mission summary for the daily missions section
  const missions = missionService.getMissions();
  const missionSummary = {
    totalCount: missions.length,
    completedCount: missions.filter(m => m.completed).length,
    allDone: missions.length > 0 && missions.every(m => m.completed)
  };

  const trendData = [...sessions].reverse().map((s, i) => ({
    idx: i + 1,
    accuracy: Math.round(s.accuracy * 100),
    trials: s.total_trials,
  }));

  const weeklyAcc = stats ? Math.round(stats.weekly_accuracy * 100) : 0;

  // Random encouraging messages
  const encouragingMessages = [
    "You're doing amazing! 🌟",
    "Keep up the great work! 💪",
    "Every step counts! 🎯",
    "You're a superstar! ⭐",
    "Learning is fun with you! 🎨"
  ];

  const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <div className="page-wrapper">
      {/* Cute Animated Background Elements */}
      <div className="cute-overlay" />
      <div className="dot-pattern" />
      <div className="wave-bottom" />
      
      {/* Floating Decorations */}
      <div className="floating-decoration cloud1">☁️</div>
      <div className="floating-decoration cloud2">☁️</div>
      <div className="floating-decoration star1">⭐</div>
      <div className="floating-decoration star2">✨</div>
      <div className="floating-decoration heart1">💕</div>
      <div className="floating-decoration heart2">💖</div>
      
      <AmbientParticles />
      
      <div className="container page-content dashboard-container">
        <div className="hero-journey-card" style={{ 
          marginBottom: 32,
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          borderRadius: "40px",
          padding: "40px",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "40px",
          boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{ fontSize: "40px", fontWeight: 900, marginBottom: "16px", letterSpacing: "-1px" }}>
              Ready for your journey, {user?.full_name?.split(' ')[0]}?
            </h1>
            <p style={{ fontSize: "20px", opacity: 0.9, marginBottom: "32px", maxWidth: "500px", lineHeight: 1.6 }}>
              Jump into your fun activity adventure! We'll play games, earn stars, and your buddy will guide you every step of the way.
            </p>
            <button 
              onClick={() => navigate("/games")}
              style={{
                background: "white",
                color: "#6366F1",
                border: "none",
                padding: "20px 48px",
                borderRadius: "24px",
                fontSize: "22px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Explore Game Library! 🎮
            </button>
          </div>
          <div style={{ 
            fontSize: "180px", 
            position: "absolute", 
            right: "-20px", 
            bottom: "-40px", 
            opacity: 0.2,
            zIndex: 1
          }}>
            🐰
          </div>
        </div>

        {/* --- Phase 8: My Sticker Book --- */}
        {myStickers.length > 0 && (
          <div style={{
            marginBottom: 40,
            background: "white",
            padding: "32px",
            borderRadius: "40px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
            border: "2px solid rgba(99, 102, 241, 0.1)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: "16px", background: "#EEF2FF", 
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 
                }}>📚</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1e293b", letterSpacing: "-0.5px" }}>My Sticker Book</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>Your amazing rewards for all your hard work!</p>
                </div>
              </div>
              <div style={{ 
                padding: "8px 20px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", 
                borderRadius: "20px", color: "white", fontSize: 13, fontWeight: 800,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
              }}>
                {myStickers.length} Rewards Collected
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              gap: 20, 
              overflowX: "auto", 
              padding: "20px 10px 30px",
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }} className="no-scrollbar sticker-book-container">
              {myStickers.map((sticker, idx) => {
                const isRare = idx % 5 === 0; // Simulate rare stickers for the shimmer
                return (
                  <div key={idx} className={`sticker-page-card ${isRare ? 'shimmer-rare' : ''}`} style={{
                    minWidth: 160,
                    height: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative"
                  }}>
                    {isRare && (
                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span className="sticker-tag">RARE</span>
                      </div>
                    )}
                    <Sticker3D emoji={sticker.emoji} size={80} />
                    <div style={{ 
                      marginTop: 16, 
                      fontSize: 13, 
                      fontWeight: 800, 
                      color: "#1e293b",
                      textAlign: "center",
                      padding: "0 10px"
                    }}>
                      {sticker.name}
                    </div>
                    <div style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      fontSize: 12,
                      opacity: 0.5
                    }}>✨</div>
                  </div>
                );
              })}
              
              <div style={{
                minWidth: 140,
                height: 180,
                background: "rgba(241, 245, 249, 0.5)",
                borderRadius: "28px",
                border: "2px dashed #cbd5e1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                textAlign: "center",
                padding: 20
              }}>
                <span style={{ fontSize: 24, marginBottom: 8 }}>💎</span>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Play more to fill your book!</p>
              </div>
            </div>
          </div>
        )}

      {stats && (
        <div className="stats-grid">
          <StatCard
            iconName="child"
            label="My Kids"
            value={stats.total_children}
            accent="primary"
            subtitle="Children registered"
          />
          <StatCard
            iconName="games"
            label="Games Played"
            value={stats.total_sessions}
            accent="success"
            subtitle="Total sessions"
          />
          <StatCard
            iconName="trophy"
            label="Completed"
            value={stats.completed_sessions}
            accent="warning"
            subtitle="Finished sessions"
          />
          <StatCard
            iconName="star"
            label="This Week"
            value={stats.recent_trials_7d}
            accent="danger"
            subtitle="Recent trials"
          />
        </div>
      )}

      <div className="panel" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <UiIcon name="trophy" size={22} title="" />
            Achievements & Stickers
          </h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              {Math.min(stats?.total_sessions || 0, 5)} of 5 unlocked
            </span>
            <button
               className="btn btn-cute btn-cute-lavender btn-sm"
               onClick={() => navigate("/sticker-pack")}
               style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px" }}
            >
               <UiIcon name="speech" size={48} />
              Speech Sparkles
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <AchievementBadge
            iconName="games"
            title="First Game"
            description="Play your first game"
            unlocked={(stats?.total_sessions || 0) >= 1}
          />
          <AchievementBadge
            iconName="star"
            title="High Scorer"
            description="Get 80% accuracy"
            unlocked={weeklyAcc >= 80}
          />
          <AchievementBadge
            iconName="calendar"
            title="Weekly Warrior"
            description="5 sessions in a week"
            unlocked={(stats?.recent_sessions_7d || 0) >= 5}
          />
          <AchievementBadge
            iconName="child"
            title="Helper"
            description="Register a child"
            unlocked={(stats?.total_children || 0) >= 1}
          />
          <AchievementBadge
            iconName="trophy"
            title="Expert"
            description="Complete 1 Adventure"
            unlocked={(stats?.total_sessions || 0) >= 10}
          />
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <UiIcon
                name={weeklyAcc >= 80 ? "star" : weeklyAcc >= 50 ? "thumbs-up" : "dumbbell"}
                size={48}
                title=""
              />
            </div>
            <ProgressRing
              value={weeklyAcc}
              size={120}
              strokeWidth={10}
              color={weeklyAcc >= 80 ? "#48bb78" : weeklyAcc >= 50 ? "#f6ad55" : "#fc8181"}
            />
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15 }}>Weekly Accuracy</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{stats.recent_sessions_7d} sessions this week</div>
            <div style={{ marginTop: 8, padding: "4px 12px", background: weeklyAcc >= 80 ? "rgba(72, 187, 120, 0.2)" : "rgba(246, 173, 85, 0.2)", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: weeklyAcc >= 80 ? "#276749" : "#c05621" }}>
              {weeklyAcc >= 80 ? "Excellent!" : weeklyAcc >= 50 ? "Good progress!" : "Keep trying!"}
            </div>
          </div>

          {trendData.length > 1 ? (
            <div className="chart-container">
              <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UiIcon name="play" size={18} />
                Start Speech Adventure
              </div>
              <RechartsContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ display: "none" }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#6366f1" fill="url(#accGrad)" strokeWidth={2} />
                </AreaChart>
              </RechartsContainer>
            </div>
          ) : (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state" style={{ padding: 16 }}>
                <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
                  <UiIcon name="chart" size={36} title="" />
                </div>
                <div className="empty-state-desc">Play more sessions to see trends</div>
              </div>
            </div>
          )}
        </div>
      )}

      {children.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Child Progress</h3>
          <div className="row" style={{ marginBottom: 12 }}>
            <select
              className="input"
              value={selectedChild || ""}
              onChange={(e) => setSelectedChild(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select a child...</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>

          {childProgress && (
            <div>
              {/* MISSION PROGRESS COMPONENT */}
              <div className="panel" style={{ 
                marginBottom: 24, 
                background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
                border: "1px solid #e2e8f0",
                position: "relative",
                overflow: "hidden"
              }}>
                <SuccessBurst trigger={celebrateMission} onComplete={() => setCelebrateMission(false)} />
                <div style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  height: "4px", 
                  width: "100%", 
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)" 
                }} />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
                    🚀 Daily Missions
                  </h3>
                  <span style={{ fontSize: 12, fontWeight: 700, color: missionSummary.allDone ? "#10b981" : "#6366f1" }}>
                    {missionSummary.allDone ? '🏆 ALL MISSIONS DONE!' : `${missionSummary.completedCount}/${missionSummary.totalCount} Done`}
                  </span>
                </div>

                {missionSummary.allDone && (
                  <div style={{ 
                    marginBottom: 16, 
                    padding: "10px 16px", 
                    background: "linear-gradient(90deg, #fef3c7 0%, #fffbeb 100%)", 
                    borderRadius: 12,
                    border: "1px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    animation: "pulse 2s infinite"
                  }}>
                    <span style={{ fontSize: 24 }}>✨</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>
                      You earned the Golden Synthesis! Visit your sticker book to see your prize!
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {missionService.getMissions().map((m, i) => (
                    <div key={i} style={{ opacity: m.completed ? 0.6 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{m.text.replace('{target}', m.target)}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: m.completed ? "#10b981" : "#6366f1" }}>
                          {m.completed ? 'COMPLETED! ✨' : `${m.current}/${m.target}`}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(m.current / m.target) * 100}%` }}
                          style={{ height: "100%", background: m.completed ? "#10b981" : "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <StatCard label="Sessions" value={childProgress.total_sessions} />
                <StatCard label="Completed" value={childProgress.completed_sessions} />
                <StatCard label="Total Trials" value={childProgress.total_trials} />
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <ProgressRing
                    value={Math.round(childProgress.overall_accuracy * 100)}
                    size={64}
                    strokeWidth={6}
                    color={childProgress.overall_accuracy >= 0.8 ? "#10b981" : childProgress.overall_accuracy >= 0.5 ? "#f59e0b" : "#ef4444"}
                  />
                  <div className="stat-label" style={{ marginTop: 6 }}>Accuracy</div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="chart-container">
                  <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UiIcon name="games" size={20} title="" />
                    Game Breakdown
                  </div>
                  <RechartsContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                        formatter={(v, name) => [name === "accuracy" ? `${v}%` : v, name === "accuracy" ? "Accuracy" : "Sessions"]}
                      />
                      <Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </RechartsContainer>
                </div>
              )}

              {childProgress.game_breakdown?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Game</th>
                          <th>Sessions</th>
                          <th>Trials</th>
                          <th>Correct</th>
                          <th>Accuracy</th>
                          <th>Avg RT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childProgress.game_breakdown.map((g, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                            <td>{g.sessions}</td>
                            <td>{g.total_trials}</td>
                            <td>{g.correct}</td>
                            <td>
                              <span className={`accuracy-badge ${g.accuracy >= 0.8 ? "acc-high" : g.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                                {(g.accuracy * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td>{g.avg_response_time_ms ? `${g.avg_response_time_ms}ms` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 ? (
        <div className="panel" style={{ marginTop: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderRadius: 24, border: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 20, color: "#1e293b", fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>🧭</span> My Activity Adventure
            </h3>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", padding: "6px 14px", borderRadius: 20 }}>
              {sessions.length} Sessions Total
            </span>
          </div>
          
          <div className="table-wrapper" style={{ borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden", background: "white" }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "18px" }}>Date</th>
                  <th>Child</th>
                  <th>Domain</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Pulse</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const getFocusIcon = () => {
                    const gn = ((s.game_types || [])[0] || s.title || "").toLowerCase();
                    if (gn.includes("emotion")) return "😊";
                    if (gn.includes("color") || gn.includes("memory") || gn.includes("matching") || gn.includes("sorting") || gn.includes("shape")) return "🧠";
                    if (gn.includes("bubble")) return "👋";
                    if (gn.includes("sound") || gn.includes("speech") || gn.includes("story")) return "🗣️";
                    if (gn.includes("attention") || gn.includes("ja") || gn.includes("joint") || gn.includes("object")) return "👀";
                    return "🎮";
                  };
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: "18px", color: "#64748b", fontSize: "12px", fontWeight: 600 }}>{s.session_date}</td>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{s.child_name}</td>
                      <td style={{ fontSize: "22px" }}>{getFocusIcon()}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#475569", textTransform: "capitalize" }}>
                          {s.title || (s.game_types || []).map(g => g.replace(/_/g, " ")).join(", ")}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${s.status}`} style={{ textTransform: "uppercase", fontSize: "10px", letterSpacing: "1px", fontWeight: 800, borderRadius: 6, padding: "4px 8px" }}>
                          {s.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: "#1e293b" }}>{s.correct}/{s.total_trials}</td>
                      <td style={{ width: 60 }}>
                        <div style={{ position: "relative", width: 44, height: 44 }}>
                          <ProgressRing
                            value={Math.round(s.accuracy * 100)}
                            size={44}
                            strokeWidth={4}
                            color={s.accuracy >= 0.8 ? "#10b981" : s.accuracy >= 0.5 ? "#f59e0b" : "#ef4444"}
                          />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#475569" }}>
                            {Math.round(s.accuracy * 100)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="empty-state" style={{ padding: "60px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🎮</div>
            <div className="empty-state-title" style={{ fontSize: 22, fontWeight: 800 }}>No Adventures Yet</div>
            <div className="empty-state-desc" style={{ marginBottom: 24 }}>Start playing some games to see your progress here!</div>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/games")} style={{ padding: "16px 40px", borderRadius: 20, fontSize: 18, fontWeight: 700 }}>
              Go to Games! 🎮
            </button>
          </div>
        </div>
      )}

      {showAssistantPrompt && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          background: "white",
          padding: "20px",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          zIndex: 100,
          maxWidth: "280px",
          animation: "float 3s ease-in-out infinite",
          border: "2px solid #6366F1"
        }}>
          <button 
            onClick={() => setShowAssistantPrompt(false)}
            style={{ position: "absolute", top: 10, right: 10, border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}
          >
            ✕
          </button>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ fontSize: "40px" }}>🐰</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1F2937" }}>Need a hand?</p>
              <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#6B7280" }}>I can guide you through your fun games!</p>
              <button 
                onClick={() => {
                  setShowAssistantPrompt(false);
                  navigate("/voice-assistant");
                }}
                style={{
                  background: "#6366F1",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Enable Assistant
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Agent Panel */}
      <AIAgentPanel initialAgent="gameHelper" />
    </div>
    </div>
  );
}
