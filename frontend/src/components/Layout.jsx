import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications, NotificationBell, NotificationsPanel } from "./NotificationsCenter";
import { StickerLayer } from "./StickerLayer";
import { MusicPlayer, MusicPlayerButton } from "./MusicPlayer";
import FloatingVoiceAssistant from "./FloatingVoiceAssistant";
import VoiceSettings from "./VoiceSettings";
import UiIcon from "./ui/UiIcon";
import "./Layout.css";
import "../styles/professional.css";
import "../styles/colorful-theme.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "My Home", icon: "home" },
  { to: "/voice-assistant", label: "🎙️ Dhyan", icon: "microphone" },
  { to: "/therapist", label: "Therapy", icon: "therapist" },
  { to: "/games", label: "Fun Games", icon: "games" },
  { to: "/sticker-pack", label: "Sticker Album", icon: "star" },
  { to: "/profile", label: "My Profile", icon: "profile" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roles = user?.roles || [];
  const displayName = user?.full_name || user?.email || "User";

  return (
    <div className="app-layout" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Colorful Background Orbs */}
      <div className="color-orb orb-1" />
      <div className="color-orb orb-2" />
      <div className="color-orb orb-3" />
      <StickerLayer pageType="layout" sessionCount={0} visible={true} />
      
      <nav className="top-nav child-friendly-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span
              className="brand-icon"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: "linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #f8b500 50%, #20bf6b 75%, #4b7bec 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(255, 107, 157, 0.4)",
                animation: "pulse-glow 2s infinite",
              }}
            >
              <UiIcon name="rainbow" size={26} title="" />
            </span>
            <span 
              className="brand-text"
              style={{
                background: "linear-gradient(90deg, #ff6b9d, #c44569, #f8b500, #20bf6b, #4b7bec)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 800,
                fontSize: "1.5rem",
              }}
            >
              DHYAN
            </span>
            <span className="brand-sub" style={{ color: "#6366f1", fontWeight: 600 }}>
              Fun Learning Place
              <UiIcon name="palette" size={16} title="" style={{ color: "#ff6b9d" }} />
            </span>
          </div>

          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <UiIcon name="close" size={24} title="Close menu" /> : <UiIcon name="menu" size={24} title="Open menu" />}
          </button>

          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-link-icon">
                  <UiIcon name={item.icon} size={20} title="" />
                </span>
                <span className="nav-link-label">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-user">
            <div className="nav-notifications">
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              />
              <NotificationsPanel
                notifications={notifications}
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAll}
              />
            </div>

            {/* Voice Settings Button */}
            <button
              onClick={() => setVoiceSettingsOpen(true)}
              className="nav-voice-settings"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title="Voice Settings"
            >
              <UiIcon name="volume-2" size={20} />
            </button>

            <NavLink to="/profile" className="nav-user-profile">
              <span className="nav-user-icon">
                <UiIcon name="wave" size={20} title="" />
              </span>
              <span className="nav-user-name">{displayName}</span>
            </NavLink>

            {roles.length > 0 && (
              <span className="nav-user-badge">
                <UiIcon name="star" size={16} title="" />
                {roles[0]}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-cute btn-cute-secondary btn-sm nav-logout-btn"
            >
              <UiIcon name="wave" size={16} title="" />
              Bye Bye
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      {/* Floating Voice Assistant - available on every page */}
      <FloatingVoiceAssistant />

      {/* Background Music Player - available on every page */}
      {musicOpen ? (
        <MusicPlayer isOpen={musicOpen} onClose={() => setMusicOpen(false)} />
      ) : (
        <MusicPlayerButton onClick={() => setMusicOpen(true)} />
      )}

      {/* Voice Settings Modal */}
      <VoiceSettings 
        isOpen={voiceSettingsOpen} 
        onClose={() => setVoiceSettingsOpen(false)} 
      />
    </div>
  );
}
