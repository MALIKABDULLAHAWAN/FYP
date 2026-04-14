import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications, NotificationBell, NotificationsPanel } from "./NotificationsCenter";
import { StickerLayer } from "./StickerLayer";
import UiIcon from "./ui/UiIcon";
import "./Layout.css";
import "../styles/professional.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "My Home", icon: "home" },
  { to: "/therapist", label: "Therapy", icon: "therapist" },
  { to: "/games", label: "Fun Games", icon: "games" },
  { to: "/speech-therapy", label: "Talking Time", icon: "speech" },
  { to: "/profile", label: "My Profile", icon: "profile" },
  { to: "/settings", label: "Settings", icon: "settings" },
  { to: "/help", label: "Help", icon: "help" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roles = user?.roles || [];
  const displayName = user?.full_name || user?.email || "User";

  return (
    <div className="app-layout">
      <StickerLayer pageType="layout" sessionCount={0} visible={true} />
      
      <nav className="top-nav child-friendly-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span
              className="brand-icon"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--cute-primary), var(--cute-success))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
              }}
            >
              <UiIcon name="rainbow" size={24} title="" />
            </span>
            <span className="brand-text">DHYAN</span>
            <span className="brand-sub">
              Fun Learning Place
              <UiIcon name="palette" size={16} title="" />
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
    </div>
  );
}
