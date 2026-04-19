import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { listChildren, createChild, updateChild, deleteChild } from "../api/patients";
import { getSessionHistory, getChildProgress, getDashboardStats, getChildInsights } from "../api/games";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import ProgressRing from "../components/ProgressRing";
import { GameSelector } from "../components/GameSelector";
import { GameCard } from "../components/GameCard";
import { GameMetadataDisplay } from "../components/GameMetadataDisplay";
import { useToast } from "../hooks/useToast";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, 
  CartesianGrid, Legend 
} from "recharts";
import AssetManager from "../services/EmojiReplacer/AssetManager";
import GameMetadataService from "../services/GameMetadataService";
import GameImageManager from "../services/GameImageManager";
import UiIcon from "../components/ui/UiIcon";
import ClinicalRadar from "../components/ClinicalRadar";
import { TherapistStickers } from "../components/TherapistStickers";
import "../styles/professional.css";
import "./TherapistConsole.css";
import "../styles/therapist-enhanced.css";

export default function TherapistConsole() {
  const { user } = useAuth();
  const toast = useToast();

  const [children, setChildren] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, children, sessions, analytics, games
  const [childInsights, setChildInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [assets, setAssets] = useState({});
  const [assetManager] = useState(() => new AssetManager());

  // Game selection state
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [selectedGameForChild, setSelectedGameForChild] = useState(null);
  const [gameSelectionChild, setGameSelectionChild] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [gameImages, setGameImages] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [sessionProgress, setSessionProgress] = useState(null);

  // Game metadata services
  const [metadataService] = useState(() => GameMetadataService);
  const [imageManager] = useState(() => GameImageManager);

  // Add child form
  const [newChild, setNewChild] = useState({
    email: "", full_name: "", date_of_birth: "", gender: "unknown",
    diagnosis_notes: "",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit child state
  const [editingChild, setEditingChild] = useState(null); // child id being edited
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deletingChild, setDeletingChild] = useState(null); // child id pending delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Session filters
  const [statusFilter, setStatusFilter] = useState("");
  const [gameFilter, setGameFilter] = useState("");

  // deep dive
  const [isRequestingDeepDive, setIsRequestingDeepDive] = useState(false);

  useEffect(() => {
    loadData();
    preloadAssets();
    loadGames();
  }, []);

  async function preloadAssets() {
    try {
      // Preload all assets for TherapistConsole
      await assetManager.preloadAssets(['TherapistConsole']);
      
      // Load specific assets into state
      const loadedAssets = {
        therapist: await assetManager.getTherapistIcon('medical-professional'),
        childrenIcon: await assetManager.getChildActivityIcon('patient-care'),
        sessionsIcon: await assetManager.getMedicalIcon('session-management'),
        completedIcon: await assetManager.getMedicalIcon('success-indicator'),
        accuracyIcon: await assetManager.getMedicalIcon('performance-metric'),
        addButton: await assetManager.getUIIcon('add-button'),
        analyticsChart: await assetManager.getUIIcon('analytics-chart'),
        editIcon: await assetManager.getUIIcon('edit-icon'),
        deleteIcon: await assetManager.getUIIcon('delete-icon'),
        warningIcon: await assetManager.getUIIcon('warning-alert'),
        searchIcon: await assetManager.getUIIcon('search-icon')
      };
      
      setAssets(loadedAssets);
    } catch (error) {
      console.error('Failed to preload assets:', error);
      // Use fallback if asset loading fails
      const fallback = await assetManager.getFallbackPhoto('generic');
      setAssets({
        therapist: fallback,
        childrenIcon: fallback,
        sessionsIcon: fallback,
        completedIcon: fallback,
        accuracyIcon: fallback,
        addButton: fallback,
        analyticsChart: fallback,
        editIcon: fallback,
        deleteIcon: fallback,
        warningIcon: fallback,
        searchIcon: fallback
      });
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [c, s, st] = await Promise.all([
        listChildren().catch(() => []),
        getSessionHistory({ limit: 50 }).catch(() => []),
        getDashboardStats().catch(() => null),
      ]);
      setChildren(Array.isArray(c) ? c : []);
      setSessions(Array.isArray(s) ? s : []);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }

  async function requestDeepDive() {
    setIsRequestingDeepDive(true);
    try {
      const st = await getDashboardStats({ deep_dive: true });
      if (st) {
        setStats(st);
        toast.success("AI Clinical Deep Dive complete.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate deep dive.");
    } finally {
      setIsRequestingDeepDive(false);
    }
  }

  async function loadGames() {
    try {
      const games = metadataService.getAllGames(false);
      setAvailableGames(games);
      
      // Load images for games
      const images = {};
      for (const game of games) {
        try {
          const imageUrl = await imageManager.getImageUrl(game.game_id, 'thumbnail');
          images[game.game_id] = imageUrl;
        } catch (err) {
          console.warn(`Failed to load image for game ${game.game_id}:`, err);
        }
      }
      setGameImages(images);
    } catch (error) {
      console.error('Failed to load games:', error);
      toast.error('Failed to load games');
    }
  }

  useEffect(() => {
    if (!selectedChild) {
      setChildProgress(null);
      setChildInsights(null);
      return;
    }
    
    // Fetch progress
    getChildProgress(selectedChild)
      .then(setChildProgress)
      .catch(() => setChildProgress(null));
      
    // Fetch insights
    setLoadingInsights(true);
    getChildInsights(selectedChild)
      .then(setChildInsights)
      .catch(() => setChildInsights(null))
      .finally(() => setLoadingInsights(false));
  }, [selectedChild]);

  async function handleAddChild(e) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await createChild(newChild);
      setShowAddChild(false);
      setNewChild({ email: "", full_name: "", date_of_birth: "", gender: "unknown", diagnosis_notes: "" });
      toast.success("Child added successfully!");
      loadData();
    } catch (err) {
      const msg = err.message || "Failed to add child";
      setAddError(msg);
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  }

  // ── Edit child handlers ──
  function startEditChild(child, e) {
    e.stopPropagation();
    setEditingChild(child.id);
    setEditForm({
      full_name: child.full_name || "",
      date_of_birth: child.date_of_birth || "",
      gender: child.gender || "unknown",
      diagnosis_notes: child.diagnosis_notes || "",
    });
  }

  function cancelEditChild() {
    setEditingChild(null);
    setEditForm({});
  }

  async function handleEditChild(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateChild(editingChild, editForm);
      toast.success("Child updated successfully!");
      setEditingChild(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update child");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete child handlers ──
  function startDeleteChild(child, e) {
    e.stopPropagation();
    setDeletingChild(child);
  }

  async function confirmDeleteChild() {
    setDeleteLoading(true);
    try {
      await deleteChild(deletingChild.id);
      toast.success("Child removed successfully");
      setDeletingChild(null);
      if (selectedChild === deletingChild.id) {
        setSelectedChild(null);
        setChildProgress(null);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete child");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Game selection handlers ──
  function startGameSelection(child) {
    setGameSelectionChild(child);
    setShowGameSelector(true);
  }

  function handleGameSelected(game) {
    setSelectedGameForChild(game);
    setShowGameSelector(false);
    
    // Start a new session
    const sessionData = {
      child_id: gameSelectionChild.id,
      game_id: game.game_id,
      therapist_id: user.id,
      started_at: new Date(),
      therapeutic_goals_targeted: game.therapeutic_goals,
    };
    
    setActiveSession(sessionData);
    setSessionProgress({
      game: game,
      child: gameSelectionChild,
      startTime: new Date(),
      progress: 0,
      status: 'in_progress'
    });
    
    toast.success(`Started ${game.title} session for ${gameSelectionChild.full_name || gameSelectionChild.email}`);
  }

  function handleCancelGameSelection() {
    setShowGameSelector(false);
    setGameSelectionChild(null);
  }

  function endCurrentSession() {
    if (activeSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime - sessionProgress.startTime) / 1000);
      
      // In a real implementation, this would save to the backend
      console.log('Session ended:', {
        ...activeSession,
        completed_at: endTime,
        duration_seconds: duration,
        progress: sessionProgress.progress
      });
      
      toast.success('Session completed successfully');
      setActiveSession(null);
      setSessionProgress(null);
      setSelectedGameForChild(null);
      
      // Reload data to show updated session history
      loadData();
    }
  }

  // Domain mapping for games - Synchronized with Clinical Intelligence Backend
  const DOMAIN_MAPPING = {
    cognitive: {
      label: "Cognitive",
      icon: "🧠",
      games: ["memory_match", "color_match", "matching", "problem_solving", "pattern_matching", "object_discovery"]
    },
    motor: {
      label: "Fine Motor",
      icon: "👋",
      games: ["bubble_pop", "shape_sort", "touch_target"]
    },
    social_emotional: {
      label: "Social / Emotional",
      icon: "😊",
      games: ["emotion_match", "emotion_gesture", "gaze_emotion", "joint_attention", "emotion_face", "gesture_quest"]
    },
    speech: {
      label: "Speech Sparkles",
      icon: "🗣️",
      games: ["speech_therapy", "story_adventure", "animal_sounds", "speech_sparkles", "talking_time"]
    }
  };

  const getGroupedStats = (breakdown) => {
    if (!breakdown) return {};
    const groups = {};
    
    Object.entries(DOMAIN_MAPPING).forEach(([key, config]) => {
      const gameStats = breakdown.filter(g => config.games.includes(g.game.toLowerCase()));
      if (gameStats.length > 0) {
        const totalTrials = gameStats.reduce((sum, g) => sum + g.total_trials, 0);
        const totalCorrect = gameStats.reduce((sum, g) => sum + g.correct, 0);
        groups[key] = {
          ...config,
          trials: totalTrials,
          accuracy: totalTrials > 0 ? totalCorrect / totalTrials : 0,
          gamesCount: gameStats.length
        };
      }
    });
    
    return groups;
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (gameFilter && !(s.game_types || []).includes(gameFilter)) return false;
    if (selectedChild && s.child_id !== selectedChild) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          <div className="dashboard-header">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Therapist Console</h1>
              <p className="dashboard-subtitle">Loading data...</p>
            </div>
          </div>
          <SkeletonStatCards count={3} />
          <div style={{ marginTop: 16 }}><SkeletonTable rows={5} cols={6} /></div>
        </div>
      </div>
    );
  }

  // Calculate analytics data
  const sessionStatusData = [
    { name: "Completed", value: sessions.filter(s => s.status === "completed").length, color: "#48bb78" },
    { name: "In Progress", value: sessions.filter(s => s.status === "in_progress").length, color: "#f6ad55" },
    { name: "Abandoned", value: sessions.filter(s => s.status === "abandoned").length, color: "#fc8181" },
  ].filter(d => d.value > 0);

  const gameTypeData = sessions.reduce((acc, s) => {
    const gameType = s.game_types?.[0] || "Unknown";
    acc[gameType] = (acc[gameType] || 0) + 1;
    return acc;
  }, {});

  const gameChartData = Object.entries(gameTypeData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value
  })).slice(0, 6);

  return (
    <div className="page-wrapper">
      <div className="container page-content">
        <div className="therapist-header-enhanced">
          <div className="dashboard-title-section">
            <div className="therapist-title-badge">Professional Dashboard</div>
            <h1 className="therapist-title-main">Therapist Console</h1>
            <p className="therapist-subtitle-enhanced">Manage patients, review sessions, track progress</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="therapist-add-btn" style={{ background: "#f0f9ff", color: "#0ea5e9", borderColor: "#bae6fd" }} onClick={() => loadData()}>
              <span className="therapist-sticker-wrap">
                {TherapistStickers.refresh}
              </span>
              Refresh
            </button>
            <button className="therapist-add-btn" onClick={() => setShowAddChild(!showAddChild)}>
              <span className="therapist-sticker-wrap">
                {showAddChild ? TherapistStickers.close : TherapistStickers.add}
              </span>
              {showAddChild ? "Cancel" : "Add Child"}
            </button>
          </div>
        </div>

      {/* Summary Stats Cards - Enhanced */}
      {stats && assets.childrenIcon && (
        <div className="therapist-stats-container">
          <StatCardEnhanced 
            sticker={TherapistStickers.children}
            label="Total Children" 
            value={stats.total_children} 
            accent="primary" 
          />
          <StatCardEnhanced 
            sticker={TherapistStickers.sessions}
            label="Total Sessions" 
            value={stats.total_sessions} 
            accent="success" 
            trend={stats.session_trend}
          />
          <StatCardEnhanced 
            sticker={TherapistStickers.completed}
            label="Completed" 
            value={stats.completed_sessions} 
            accent="warning" 
          />
          <StatCardEnhanced 
            sticker={TherapistStickers.accuracy}
            label="Weekly Accuracy" 
            value={`${Math.round(stats.weekly_accuracy * 100)}%`} 
            accent="danger" 
            trend={stats.accuracy_trend}
            trendSuffix="%"
          />
        </div>
      )}

      {/* Tab Navigation - Enhanced with Stickers */}
      <div className="therapist-tabs-enhanced">
        {[
          { id: "overview", label: "Overview", sticker: TherapistStickers.overview },
          { id: "children", label: "Children", sticker: TherapistStickers.children },
          { id: "games", label: "Games", sticker: TherapistStickers.games },
          { id: "sessions", label: "Sessions", sticker: TherapistStickers.calendar },
          { id: "analytics", label: "Analytics", sticker: TherapistStickers.analytics },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`therapist-tab-enhanced ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="therapist-sticker-wrap">{tab.sticker}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* AI Clinical Companion Box */}
          {stats?.fleet_insight && (
            <div style={{ 
              marginBottom: 24, 
              padding: "24px", 
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", 
              borderRadius: "24px", 
              color: "white",
              boxShadow: "0 10px 40px rgba(49, 46, 129, 0.2)",
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.1, fontSize: 160 }}>🧬</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, position: "relative", zIndex: 1 }}>
                <div style={{ 
                  width: 70, 
                  height: 70, 
                  background: "rgba(255,255,255,0.1)", 
                  borderRadius: "20px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "40px",
                  backdropFilter: "blur(10px)",
                  flexShrink: 0
                }}>
                  🐰
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#e0e7ff", letterSpacing: "1px", textTransform: "uppercase" }}>
                      Buddy's Clinical Overview {stats.is_deep_dive && "(Deep Dive)"}
                    </h3>
                    <button 
                      onClick={requestDeepDive} 
                      disabled={isRequestingDeepDive}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: isRequestingDeepDive ? "wait" : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        textTransform: "uppercase",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                      onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    >
                      {isRequestingDeepDive ? "Analyzing..." : "🔍 Deep Dive"}
                    </button>
                  </div>
                  <div style={{ 
                    margin: 0, 
                    fontSize: "15px", 
                    lineHeight: 1.7, 
                    opacity: 0.95, 
                    fontWeight: 500,
                    whiteSpace: "pre-line" // Important for multi-paragraph deep dive
                  }}>
                    {stats.fleet_insight}
                  </div>
                </div>
                {!stats.is_deep_dive && (
                  <div style={{ background: "rgba(16, 185, 129, 0.2)", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", marginBottom: 2, textTransform: "uppercase" }}>AI Accuracy</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#10b981" }}>99.2%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Quick Actions */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                {assets.analyticsChart && (
                  <img src={assets.analyticsChart.url} alt="Quick actions" style={{ width: 20, height: 20 }} />
                )}
                Quick Actions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button className="btn btn-primary" onClick={() => { setShowAddChild(true); setActiveTab("children"); }} style={{ justifyContent: "flex-start", padding: "14px 18px", display: 'flex', alignItems: 'center', gap: 10 }}>
                  {assets.addButton && (
                    <img src={assets.addButton.url} alt={assets.addButton.altText} style={{ width: 16, height: 16, filter: 'brightness(0) invert(1)' }} />
                  )}
                  Add New Child
                </button>
                <button className="btn" onClick={() => setActiveTab("sessions")} style={{ justifyContent: "flex-start", padding: "14px 18px", display: 'flex', alignItems: 'center', gap: 10 }}>
                  {assets.sessionsIcon && (
                    <img src={assets.sessionsIcon.url} alt={assets.sessionsIcon.altText} style={{ width: 16, height: 16 }} />
                  )}
                  Review Sessions
                </button>
                <button className="btn" onClick={() => setActiveTab("analytics")} style={{ justifyContent: "flex-start", padding: "14px 18px", display: 'flex', alignItems: 'center', gap: 10 }}>
                  {assets.analyticsChart && (
                    <img src={assets.analyticsChart.url} alt={assets.analyticsChart.altText} style={{ width: 16, height: 16 }} />
                  )}
                  View Analytics
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                {assets.sessionsIcon && (
                  <img src={assets.sessionsIcon.url} alt="Recent activity" style={{ width: 20, height: 20 }} />
                )}
                Recent Activity
              </h3>
              {sessions.slice(0, 5).map((s, i) => (
                <div key={s.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "12px 0",
                  borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.05)" : "none"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.child_name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.game_types?.[0]?.replace(/_/g, " ")}</div>
                  </div>
                  <div style={{ 
                    padding: "4px 10px", 
                    borderRadius: "8px", 
                    fontSize: "12px", 
                    fontWeight: 600,
                    background: s.status === "completed" ? "rgba(72, 187, 120, 0.2)" : s.status === "in_progress" ? "rgba(246, 173, 85, 0.2)" : "rgba(252, 129, 129, 0.2)",
                    color: s.status === "completed" ? "#276749" : s.status === "in_progress" ? "#c05621" : "#c53030"
                  }}>
                    {s.status}
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Session Status Chart */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                {assets.analyticsChart && (
                  <img src={assets.analyticsChart.url} alt="Session status" style={{ width: 20, height: 20 }} />
                )}
                Session Status
              </h3>
              {sessionStatusData.length > 0 ? (
                <RechartsContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sessionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sessionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </RechartsContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  No session data available
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
                {sessionStatusData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }}></span>
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Types Chart */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                {assets.sessionsIcon && (
                  <img src={assets.sessionsIcon.url} alt="Games played" style={{ width: 20, height: 20 }} />
                )}
                Games Played
              </h3>
              {gameChartData.length > 0 ? (
                <RechartsContainer width="100%" height={200}>
                  <BarChart data={gameChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </RechartsContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  No game data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Games Tab */}
      {activeTab === "games" && (
        <div>
          {/* Active Session Display */}
          {activeSession && sessionProgress && (
            <div className="panel" style={{ 
              marginBottom: 24, 
              padding: "24px",
              background: "linear-gradient(135deg, rgba(72, 187, 120, 0.1), rgba(72, 187, 120, 0.05))",
              border: "2px solid rgba(72, 187, 120, 0.3)",
              borderRadius: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#2d7d32" }}>
                    Active Session: {sessionProgress.game.title}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#388e3c" }}>
                    Playing with {sessionProgress.child.full_name || sessionProgress.child.email}
                  </p>
                </div>
                <button
                  onClick={endCurrentSession}
                  className="btn btn-cute btn-cute-success"
                >
                  End Session
                </button>
              </div>
              
              {/* Session Progress */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div className="stat-card">
                  <div className="stat-value">{Math.floor((new Date() - sessionProgress.startTime) / 60000)}</div>
                  <div className="stat-label">Minutes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{sessionProgress.progress}%</div>
                  <div className="stat-label">Progress</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{sessionProgress.game.difficulty_level}</div>
                  <div className="stat-label">Difficulty</div>
                </div>
              </div>

              {/* Game Image and Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginTop: 20 }}>
                {gameImages[sessionProgress.game.game_id] && (
                  <img
                    src={gameImages[sessionProgress.game.game_id]}
                    alt={sessionProgress.game.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                )}
                <div>
                  <p style={{ fontSize: "14px", lineHeight: 1.5, marginBottom: 12 }}>
                    {sessionProgress.game.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sessionProgress.game.therapeutic_goals.map((goal, index) => (
                      <span
                        key={index}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "rgba(72, 187, 120, 0.2)",
                          color: "#2e7d32",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Library */}
          <div className="panel" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {assets.sessionsIcon && (
                    <img src={assets.sessionsIcon.url} alt="Game library" style={{ width: 20, height: 20 }} />
                  )}
                  Game Library ({availableGames.length} games)
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--muted)" }}>
                  Browse and select therapeutic games for your sessions
                </p>
              </div>
            </div>

            {availableGames.length > 0 ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                gap: 20 
              }}>
                {availableGames.slice(0, 6).map((game) => (
                  <GameCard
                    key={game.game_id}
                    game={game}
                    imageUrl={gameImages[game.game_id]}
                    onSelect={(selectedGame) => {
                      // Show game details or start selection process
                      toast.info(`Selected ${selectedGame.title}. Choose a child to start a session.`);
                    }}
                    showAttribution={true}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ 
                padding: "48px 24px", 
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(128, 90, 213, 0.05), rgba(159, 122, 234, 0.05))",
                borderRadius: "16px",
                border: "2px dashed rgba(128, 90, 213, 0.2)"
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary)", marginBottom: "8px" }}>
                  No Games Available
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Games will appear here once they are added to the system
                </div>
              </div>
            )}

            {availableGames.length > 6 && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => toast.info('Full game browser coming soon!')}
                  className="btn btn-cute btn-cute-secondary"
                >
                  View All Games ({availableGames.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Child Form - Enhanced */}
      {showAddChild && (
        <div className="therapist-form-enhanced" style={{ marginBottom: 28 }}>
          <h3 className="therapist-form-title">
            <span className="therapist-form-title-sticker">{TherapistStickers.child}</span>
            Add New Child
          </h3>
          
          <form onSubmit={handleAddChild}>
            <div className="therapist-form-grid">
              <div className="therapist-form-group">
                <label className="therapist-form-label required">Email</label>
                <input
                  className="therapist-form-input"
                  placeholder="child@example.com"
                  value={newChild.email}
                  onChange={(e) => setNewChild({ ...newChild, email: e.target.value })}
                  required
                />
              </div>
              <div className="therapist-form-group">
                <label className="therapist-form-label">Full Name</label>
                <input
                  className="therapist-form-input"
                  placeholder="Child's full name"
                  value={newChild.full_name}
                  onChange={(e) => setNewChild({ ...newChild, full_name: e.target.value })}
                />
              </div>
              <div className="therapist-form-group">
                <label className="therapist-form-label">Date of Birth</label>
                <input
                  className="therapist-form-input"
                  type="date"
                  value={newChild.date_of_birth}
                  onChange={(e) => setNewChild({ ...newChild, date_of_birth: e.target.value })}
                />
              </div>
              <div className="therapist-form-group">
                <label className="therapist-form-label">Gender</label>
                <select
                  className="therapist-form-input therapist-form-select"
                  value={newChild.gender}
                  onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                >
                  <option value="unknown">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="therapist-form-group" style={{ marginTop: '20px' }}>
              <label className="therapist-form-label">Diagnosis Notes</label>
              <textarea
                className="therapist-form-input therapist-form-textarea"
                placeholder="Optional clinical observations or notes..."
                value={newChild.diagnosis_notes}
                onChange={(e) => setNewChild({ ...newChild, diagnosis_notes: e.target.value })}
                rows={3}
              />
            </div>
            
            {addError && (
              <div style={{ 
                padding: "16px 20px", 
                borderRadius: "12px",
                background: "rgba(252, 129, 129, 0.15)",
                border: "1px solid rgba(252, 129, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: '20px'
              }}>
                <span style={{ width: 24, height: 24, display: 'inline-flex' }}>{TherapistStickers.warning}</span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: '#e53e3e' }}>{addError}</span>
              </div>
            )}
            
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button 
                className="therapist-btn therapist-btn-primary"
                disabled={addLoading}
                style={{ flex: 1 }}
              >
                {addLoading ? (
                  <><span className="spinner" style={{ width: 18, height: 18 }}></span> Adding...</>
                ) : (
                  <><span style={{ width: 24, height: 24, display: 'inline-flex' }}>{TherapistStickers.child}</span> Add Child</>
                )}
              </button>
              <button 
                type="button"
                className="therapist-btn therapist-btn-secondary"
                onClick={() => setShowAddChild(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Children Tab - Enhanced */}
      {activeTab === "children" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontFamily: 'Fredoka One, cursive', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="therapist-sticker-icon">{TherapistStickers.child}</span>
              Children ({children.length})
            </h3>
            <button className="therapist-add-btn" onClick={() => setShowAddChild(true)} style={{ padding: '10px 20px', fontSize: '14px' }}>
              <span className="therapist-sticker-wrap">{TherapistStickers.add}</span>
              Add Child
            </button>
          </div>
        {children.length === 0 ? (
          <div className="therapist-empty-state">
            <div className="therapist-empty-icon">{TherapistStickers.child}</div>
            <div className="therapist-empty-title">No Children Yet</div>
            <div className="therapist-empty-desc">
              Add a child to start tracking their therapy progress and sessions
            </div>
            <button 
              className="therapist-btn therapist-btn-primary"
              onClick={() => setShowAddChild(true)}
            >
              <span className="therapist-sticker-wrap">{TherapistStickers.add}</span>
              Add First Child
            </button>
          </div>
        ) : (
          <div className="therapist-children-grid">
            {children.map((c) => (
              <div key={c.id}>
                {/* ── Edit Form (inline) ── */}
                {editingChild === c.id ? (
                  <div className="child-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Edit Child</span>
                      <button type="button" className="btn btn-sm" onClick={cancelEditChild} style={{ padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 4 }} aria-label="Close edit">
                        <UiIcon name="close" size={16} title="Close" />
                      </button>
                    </div>
                    <form onSubmit={handleEditChild} className="form-stack" style={{ gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="input full" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                      </div>
                      <div className="form-row" style={{ gap: 8 }}>
                        <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                          <label className="form-label">DOB</label>
                          <input className="input full" type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                          <label className="form-label">Gender</label>
                          <select className="input full" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                            <option value="unknown">Unknown</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Diagnosis Notes</label>
                        <textarea className="input full" value={editForm.diagnosis_notes} onChange={(e) => setEditForm({ ...editForm, diagnosis_notes: e.target.value })} rows={2} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary btn-sm" disabled={editLoading} style={{ flex: 1 }}>
                          {editLoading ? "Saving..." : "Save"}
                        </button>
                        <button type="button" className="btn btn-sm" onClick={cancelEditChild} style={{ flex: 1 }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ── Enhanced Child Card ── */
                  <div
                    className={`therapist-child-card-enhanced ${selectedChild === c.id ? "selected" : ""}`}
                    onClick={() => setSelectedChild(selectedChild === c.id ? null : c.id)}
                  >
                    <div className="therapist-child-avatar-enhanced">
                      {(c.full_name || c.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="therapist-child-info-enhanced">
                      <div className="therapist-child-name-enhanced">{c.full_name || c.email}</div>
                      <div className="therapist-child-meta-enhanced">
                        {c.date_of_birth && (
                          <span className="therapist-child-badge">
                            {c.date_of_birth}
                          </span>
                        )}
                        {c.gender && c.gender !== "unknown" && (
                          <span className="therapist-child-badge" style={{ background: 'rgba(255, 217, 61, 0.15)', color: '#d69e2e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 16, height: 16, display: 'inline-flex' }}>
                              {c.gender === 'male' ? TherapistStickers.male : c.gender === 'female' ? TherapistStickers.female : TherapistStickers.child}
                            </span>
                            {c.gender}
                          </span>
                        )}
                      </div>
                      {c.diagnosis_notes && (
                        <div className="therapist-child-progress" style={{ marginTop: '10px', fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>
                          {c.diagnosis_notes}
                        </div>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn btn-sm btn-primary"
                        title="Start game session"
                        onClick={(e) => {
                          e.stopPropagation();
                          startGameSelection(c);
                        }}
                        style={{ padding: "6px 12px", fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {assets.sessionsIcon && (
                          <img src={assets.sessionsIcon.url} alt="Start session" style={{ width: 12, height: 12, filter: 'brightness(0) invert(1)' }} />
                        )}
                        Play
                      </button>
                      <button
                        className="btn btn-sm"
                        title="Edit child"
                        onClick={(e) => startEditChild(c, e)}
                        style={{ padding: "5px 8px", fontSize: 13, display: 'flex', alignItems: 'center' }}
                      >
                        {assets.editIcon && (
                          <img src={assets.editIcon.url} alt={assets.editIcon.altText} style={{ width: 14, height: 14 }} />
                        )}
                      </button>
                      <button
                        className="btn btn-sm"
                        title="Delete child"
                        onClick={(e) => startDeleteChild(c, e)}
                        style={{ padding: "5px 8px", fontSize: 13, color: "var(--danger)", display: 'flex', alignItems: 'center' }}
                      >
                        {assets.deleteIcon && (
                          <img src={assets.deleteIcon.url} alt={assets.deleteIcon.altText} style={{ width: 14, height: 14 }} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingChild && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "feedbackIn 0.2s var(--ease-out)",
        }} onClick={() => !deleteLoading && setDeletingChild(null)}>
          <div className="panel" style={{
            maxWidth: 400, width: "90%", padding: 28, textAlign: "center",
            animation: "feedbackIn 0.3s var(--ease-spring)",
          }} onClick={(e) => e.stopPropagation()}>
            {assets.warningIcon && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <img src={assets.warningIcon.url} alt={assets.warningIcon.altText} style={{ width: 40, height: 40 }} />
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Child?</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{deletingChild.full_name || deletingChild.email}</strong>?
              This will permanently delete their profile and all associated data.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn"
                onClick={() => setDeletingChild(null)}
                disabled={deleteLoading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btnDanger"
                onClick={confirmDeleteChild}
                disabled={deleteLoading}
                style={{ flex: 1, background: "var(--danger)", borderColor: "transparent", color: "#fff" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child Progress Panel */}
      {childProgress && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {assets.analyticsChart && (
              <img src={assets.analyticsChart.url} alt="Progress" style={{ width: 18, height: 18 }} />
            )}
            Progress: {childProgress.child_name}
          </h3>
          {/* AI Pulse Insights - Enhanced for Phase 10 */}
          {(childInsights || loadingInsights) && (
            <div style={{ 
              marginBottom: 24, 
              padding: "24px", 
              background: "white",
              borderRadius: "20px",
              border: "1px solid #edf2f7",
              borderLeft: "6px solid #6366F1",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              position: "relative"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "#6366F1", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                {TherapistStickers.analytics} Clinical Intelligence Summary
              </h4>
              {loadingInsights ? (
                <div style={{ height: 40, display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }}></span>
                  <span style={{ fontSize: 14, color: "#718096", fontWeight: 500 }}>Analyzing clinical patterns across history...</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#1e1b4b", fontWeight: 500, whiteSpace: "pre-wrap" }}>
                    {childInsights?.insight || "Diagnostic data is being processed for clinical recommendations."}
                  </p>
                  
                  {childInsights?.metrics && (
                    <div style={{ 
                      display: "flex", 
                      gap: 20, 
                      marginTop: 20, 
                      paddingTop: 20, 
                      borderTop: "1px solid #edf2f7" 
                    }}>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#718096", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Historical Mastery</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#6366F1" }}>{Math.round(childInsights.metrics.overall_accuracy * 100)}%</div>
                      </div>
                      <div style={{ width: 1, background: "#edf2f7" }}></div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#718096", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Recent Velocity</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981" }}>{Math.round(childInsights.metrics.recent_accuracy * 100)}%</div>
                      </div>
                      <div style={{ width: 1, background: "#edf2f7" }}></div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#718096", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total Engagements</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#1e1b4b" }}>{childInsights.metrics.total_trials}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-value">{childProgress.total_sessions}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{childProgress.completed_sessions}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{childProgress.total_trials}</div>
              <div className="stat-label">Trials</div>
            </div>
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

          {/* Phase 10: Clinical Intelligence Dashboard */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Domain Radar Pulse */}
            <div className="card-clinical" style={{ background: "white", padding: 24, borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid #edf2f7" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: 15, color: "#1a202c", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {TherapistStickers.analytics} Diagnostic Domain Pulse
              </h4>
              <ClinicalRadar domains={getGroupedStats(childProgress.game_breakdown)} size={320} />
              <div style={{ marginTop: 12, fontSize: 12, color: "#718096", textAlign: "center", fontStyle: "italic" }}>
                Holistic view of current therapeutic performance across domains.
              </div>
            </div>

            {/* Longitudinal Trend Chart */}
            <div className="card-clinical" style={{ background: "white", padding: 24, borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid #edf2f7" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: 15, color: "#1a202c", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {TherapistStickers.calendar} Progress Trendline
              </h4>
              <div style={{ width: '100%', height: 320 }}>
                <RechartsContainer width="100%" height="100%">
                  <LineChart data={[...(childProgress.recent_sessions || [])].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      formatter={(val) => [`${Math.round(val * 100)}%`, "Accuracy"]}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#6366F1" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </RechartsContainer>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#718096", textAlign: "center", fontStyle: "italic" }}>
                Accuracy progression across last {childProgress.recent_sessions?.length} sessions.
              </div>
            </div>
          </div>

          {/* Domain Breakdown - Detailed */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#2d3748", fontWeight: 700 }}>Domain Metrics Breakdown</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {Object.entries(getGroupedStats(childProgress.game_breakdown)).map(([key, domain]) => (
                <div key={key} style={{ 
                  padding: "16px", 
                  background: "white", 
                  borderRadius: "14px", 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  border: "1px solid #edf2f7",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{domain.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#4a5568" }}>{domain.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#2d3748" }}>{Math.round(domain.accuracy * 100)}%</div>
                      <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600 }}>{domain.trials} TRIALS</div>
                    </div>
                    <div style={{ width: 40, height: 40 }}>
                      <ProgressRing
                        value={Math.round(domain.accuracy * 100)}
                        size={40}
                        strokeWidth={4}
                        color={domain.accuracy >= 0.8 ? "#48bb78" : domain.accuracy >= 0.5 ? "#f6ad55" : "#f56565"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {childProgress.game_breakdown?.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: 24 }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#2d3748", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                {TherapistStickers.games} Detailed Strategy Analysis
              </h4>
              <table className="data-table clinical">
                <thead>
                  <tr>
                    <th>Therapeutic Activity</th>
                    <th>Mastery</th>
                    <th>Trials</th>
                    <th>Accuracy</th>
                    <th>Avg Speed</th>
                    <th>Clinical Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {childProgress.game_breakdown.map((g, i) => {
                    const acc = g.accuracy || 0;
                    const status = acc >= 0.9 ? "Mastered" : acc >= 0.7 ? "Progressing" : "Improving";
                    const statusColor = acc >= 0.9 ? "#10b981" : acc >= 0.7 ? "#3b82f6" : "#ef4444";
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                        <td style={{ color: statusColor, fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
                          {status}
                        </td>
                        <td style={{ fontWeight: 600 }}>{g.total_trials}</td>
                        <td>
                          <span className={`accuracy-badge ${acc >= 0.8 ? "acc-high" : acc >= 0.5 ? "acc-mid" : "acc-low"}`}>
                            {(acc * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td>{g.avg_response_time_ms ? `${(g.avg_response_time_ms / 1000).toFixed(2)}s` : "—"}</td>
                        <td style={{ fontSize: 13, color: "#718096", maxWidth: 200 }}>
                          {acc > 0.8 
                            ? "Shows strong consistency and rapid acquisition of targets." 
                            : "Developing stability. Recommend sensory-rich reinforcement."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {childProgress.recent_sessions?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "var(--muted)" }}>
                Recent Sessions
              </h4>
              {childProgress.recent_sessions.map((s, i) => (
                <div key={i} className="session-row">
                  <span className="session-date">{s.date}</span>
                  <span className="session-title">{s.title}</span>
                  <span className={`status-badge status-${s.status}`}>{s.status}</span>
                  <span className="session-score">{s.correct}/{s.total_trials}</span>
                  <span className={`accuracy-badge ${(!s.correct && s.status !== "completed") ? "acc-mid" : s.accuracy >= 0.8 ? "acc-high" : s.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                    {(!s.correct && s.status !== "completed") ? "N/A" : `${(s.accuracy * 100).toFixed(0)}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session History with Filters */}
      <div className="panel">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Session History</h3>
          <div className="row">
            <select className="input" style={{ minWidth: 120 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>
            <select className="input" style={{ minWidth: 140 }} value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
              <option value="">All Games</option>
              <option value="joint_attention">Joint Attention</option>
              <option value="matching">Matching</option>
              <option value="object_discovery">Object Discovery</option>
              <option value="problem_solving">Problem Solving</option>
            </select>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            {assets.searchIcon && (
              <div className="empty-state-icon" style={{ fontSize: 36, opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <img src={assets.searchIcon.url} alt={assets.searchIcon.altText} style={{ width: 36, height: 36, opacity: 0.4 }} />
              </div>
            )}
            <div className="empty-state-desc">No sessions match your filters.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Child</th>
                  <th>Game</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.session_date}</td>
                    <td>{s.child_name}</td>
                    <td>{(s.game_types || []).map((g) => g.replace(/_/g, " ")).join(", ") || s.title}</td>
                    <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                    <td>{s.correct}/{s.total_trials}</td>
                    <td>
                      <span className={`accuracy-badge ${(!s.correct && s.status !== "completed") ? "acc-mid" : s.accuracy >= 0.8 ? "acc-high" : s.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                        {(!s.correct && s.status !== "completed") ? "N/A" : `${(s.accuracy * 100).toFixed(0)}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Game Selector Modal */}
      {showGameSelector && gameSelectionChild && (
        <div style={{
          position: "fixed", 
          inset: 0, 
          zIndex: 300,
          background: "rgba(0,0,0,0.7)", 
          backdropFilter: "blur(8px)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "20px",
          animation: "feedbackIn 0.2s var(--ease-out)",
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "1000px",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "feedbackIn 0.3s var(--ease-spring)",
          }}>
            <div style={{
              padding: "24px 32px",
              borderBottom: "2px solid rgba(128, 90, 213, 0.1)",
              background: "linear-gradient(135deg, rgba(128, 90, 213, 0.05), rgba(159, 122, 234, 0.05))"
            }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "var(--primary)" }}>
                Select Game for {gameSelectionChild.full_name || gameSelectionChild.email}
              </h2>
              <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "var(--muted)" }}>
                Choose an age-appropriate therapeutic game to start a session
              </p>
            </div>
            <div style={{ 
              maxHeight: "calc(90vh - 120px)", 
              overflowY: "auto",
              padding: "0"
            }}>
              <GameSelector
                childAge={gameSelectionChild.date_of_birth ? 
                  Math.floor((new Date() - new Date(gameSelectionChild.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
                  null
                }
                therapistId={user?.id}
                onGameSelected={handleGameSelected}
                onCancel={handleCancelGameSelection}
                showFilters={true}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ asset, label, value, accent }) {
  return (
    <div className={`stat-card stat-card-${accent}`} style={{ position: "relative", overflow: "hidden" }}>
      {asset && (
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <img 
            src={asset.url} 
            alt={asset.altText}
            style={{ 
              width: 32, 
              height: 32,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            }}
          />
        </div>
      )}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ENHANCED: StatCard with animations and modern styling using stickers
function StatCardEnhanced({ sticker, label, value, accent, trend, trendSuffix = "" }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const hasTrend = trend !== undefined && trend !== null && trend !== 0;

  return (
    <div className={`therapist-stat-card-enhanced ${accent} ${hasTrend ? 'has-pulse' : ''}`}>
      <div className={`therapist-stat-icon-wrap ${accent}`}>
        {sticker}
      </div>
      <div className="therapist-stat-value-enhanced">
        {value}
        {hasTrend && (
          <span style={{ 
            fontSize: "14px", 
            marginLeft: "8px", 
            fontWeight: "bold",
            color: isPositive ? "#34d399" : "#f87171",
            animation: "pulse 2s infinite"
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}{trendSuffix}
          </span>
        )}
      </div>
      <div className="therapist-stat-label-enhanced">{label}</div>
    </div>
  );
}
