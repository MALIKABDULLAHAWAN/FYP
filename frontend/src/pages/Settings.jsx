import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [settings, setSettings] = useState({
    language: "en",
    notifications: {
      email: true,
      push: true,
      achievements: true,
      sessionReminders: true,
      weeklyReports: true,
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      soundEffects: true,
    },
    privacy: {
      shareProgress: false,
      allowAnalytics: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dhyan_settings");
    if (saved) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }
  }, []);

  function saveSettings() {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("dhyan_settings", JSON.stringify(settings));
      toast.success("Settings saved!");
      setSaving(false);
    }, 400);
  }

  function updateSetting(section, key, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const sections = [
    { id: "notifications", icon: "bell", label: "Notifications" },
    { id: "accessibility", icon: "accessibility", label: "Accessibility" },
    { id: "privacy", icon: "lock", label: "Privacy" },
    { id: "account", icon: "profile", label: "Account" },
  ];

  return (
    <div className="container" style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          Customize your DHYAN experience
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
        {/* Sidebar */}
        <div className="panel" style={{ padding: 12 }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeSection === s.id ? 700 : 500,
                  background: activeSection === s.id ? "var(--primary-bg)" : "transparent",
                  color: activeSection === s.id ? "var(--primary-light)" : "var(--text-secondary)",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.15s",
                }}
              >
                <UiIcon name={s.icon} size={17} title="" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="panel" style={{ padding: "24px 28px" }}>
          {/* ── Notifications ── */}
          {activeSection === "notifications" && (
            <Section title="Notifications" icon="bell">
              {[
                { key: "email", icon: "mail", label: "Email Notifications", desc: "Receive updates via email" },
                { key: "push", icon: "bell", label: "Push Notifications", desc: "Browser notifications" },
                { key: "achievements", icon: "trophy", label: "Achievement Alerts", desc: "Notify when achievements are unlocked" },
                { key: "sessionReminders", icon: "timer", label: "Session Reminders", desc: "Remind about upcoming sessions" },
                { key: "weeklyReports", icon: "chart", label: "Weekly Reports", desc: "Weekly progress summary" },
              ].map((item) => (
                <SettingRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  desc={item.desc}
                >
                  <Toggle
                    checked={settings.notifications[item.key]}
                    onChange={(v) => updateSetting("notifications", item.key, v)}
                  />
                </SettingRow>
              ))}
            </Section>
          )}

          {/* ── Accessibility ── */}
          {activeSection === "accessibility" && (
            <Section title="Accessibility" icon="accessibility">
              {[
                { key: "highContrast", icon: "palette", label: "High Contrast", desc: "Increase contrast for better visibility" },
                { key: "largeText", icon: "search", label: "Large Text", desc: "Increase text size throughout the app" },
                { key: "reduceMotion", icon: "refresh", label: "Reduce Motion", desc: "Minimize animations" },
                { key: "soundEffects", icon: "volume", label: "Sound Effects", desc: "Play sounds for interactions" },
              ].map((item) => (
                <SettingRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  desc={item.desc}
                >
                  <Toggle
                    checked={settings.accessibility[item.key]}
                    onChange={(v) => updateSetting("accessibility", item.key, v)}
                  />
                </SettingRow>
              ))}
            </Section>
          )}

          {/* ── Privacy ── */}
          {activeSection === "privacy" && (
            <Section title="Privacy" icon="lock">
              {[
                { key: "shareProgress", icon: "upload", label: "Share Progress", desc: "Allow sharing progress with therapists" },
                { key: "allowAnalytics", icon: "chart", label: "Usage Analytics", desc: "Help improve DHYAN with anonymous data" },
              ].map((item) => (
                <SettingRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  desc={item.desc}
                >
                  <Toggle
                    checked={settings.privacy[item.key]}
                    onChange={(v) => updateSetting("privacy", item.key, v)}
                  />
                </SettingRow>
              ))}
            </Section>
          )}

          {/* ── Account ── */}
          {activeSection === "account" && (
            <Section title="Account" icon="profile">
              {/* Info card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: "var(--card)",
                  borderRadius: "var(--radius)",
                  marginBottom: 20,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary), #818cf8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>
                    {user?.full_name || "User"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.email}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    Role: {user?.roles?.join(", ") || "User"}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "var(--card)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4, fontSize: 14 }}>
                  Sign Out
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
                  You will be returned to the login screen.
                </div>
                {!showLogoutConfirm ? (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 14, padding: "9px 20px", color: "var(--error)", borderColor: "var(--error)" }}
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    Log Out
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Are you sure?</span>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 14, padding: "8px 18px" }}
                      onClick={handleLogout}
                    >
                      Yes, log out
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 14, padding: "8px 18px" }}
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Save bar — not shown on account tab */}
          {activeSection !== "account" && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: "10px 28px", fontSize: 14 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small helpers ── */

function Section({ title, icon, children }) {
  return (
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          marginTop: 0,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <UiIcon name={icon} size={20} title="" />
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, desc, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: "var(--radius)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <UiIcon name={icon} size={20} title="" style={{ color: "var(--text-secondary)" }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        border: "none",
        background: checked ? "var(--primary)" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: checked ? 25 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
