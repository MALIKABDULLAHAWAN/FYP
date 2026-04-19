import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState({
    theme: "auto",
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

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dhyan_settings");
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        setSettings(prev => ({
          ...prev,
          ...savedSettings
        }));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const saveSettings = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("dhyan_settings", JSON.stringify(settings));
      toast.success("Settings saved successfully!");
      setLoading(false);
    }, 500);
  };

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const sections = [
    { id: "general", icon: "settings", title: "General" },
    { id: "notifications", icon: "bell", title: "Notifications" },
    { id: "accessibility", icon: "accessibility", title: "Accessibility" },
    { id: "privacy", icon: "lock", title: "Privacy" },
    { id: "account", icon: "profile", title: "Account" },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-with-icon">
          <UiIcon name="settings" size={32} title="" /> 
          <h1 className="page-title">Settings</h1>
        </div>
        <p className="page-subtitle">Customize your DHYAN experience</p>
      </div>

      <div className="settings-grid">
        {/* Sidebar */}
        <div className="card settings-sidebar">
          <nav className="settings-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`btn btn-lg w-full justify-start ${activeSection === section.id ? 'btn-primary' : 'btn-outline'}`}
              >
                <UiIcon name={section.icon} size={18} title="" />
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="card settings-content">
          {activeSection === "general" && (
            <div>
              <h2 className="card-title">
                <UiIcon name="settings" size={24} title="" /> General Settings
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="form-label">
                    Theme
                  </label>
                  <div className="theme-grid">
                    {["light", "dark", "auto"].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setSettings((p) => ({ ...p, theme }))}
                        className={`btn btn-lg theme-btn ${settings.theme === theme ? 'btn-primary' : 'btn-outline'}`}
                      >
                        <UiIcon 
                          name={theme === "light" ? "sun" : theme === "dark" ? "moon" : "refresh"} 
                          size={20} 
                          title="" 
                        />
                        <span className="theme-label">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings((p) => ({ ...p, language: e.target.value }))}
                    className="form-input"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">Hindi</option>
                    <option value="ur">Urdu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <h2 className="card-title">
                <UiIcon name="bell" size={24} title="" /> Notification Preferences
              </h2>

              <div className="settings-list">
                {[
                  { key: "email", icon: "mail", label: "Email Notifications", desc: "Receive updates via email" },
                  { key: "push", icon: "bell", label: "Push Notifications", desc: "Browser notifications" },
                  { key: "achievements", icon: "trophy", label: "Achievement Alerts", desc: "Notify when achievements unlocked" },
                  { key: "sessionReminders", icon: "timer", label: "Session Reminders", desc: "Remind about upcoming sessions" },
                  { key: "weeklyReports", icon: "chart", label: "Weekly Reports", desc: "Weekly progress summary" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="setting-item"
                  >
                    <div className="setting-item-info">
                      <UiIcon name={item.icon} size={24} title="" />
                      <div>
                        <div className="setting-item-label">{item.label}</div>
                        <div className="setting-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.notifications[item.key]}
                      onChange={(v) => updateSetting("notifications", item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "accessibility" && (
            <div>
              <h2 className="card-title">
                <UiIcon name="accessibility" size={24} title="" /> Accessibility
              </h2>

              <div className="settings-list">
                {[
                  { key: "highContrast", icon: "palette", label: "High Contrast", desc: "Increase contrast for better visibility" },
                  { key: "largeText", icon: "search", label: "Large Text", desc: "Increase text size throughout" },
                  { key: "reduceMotion", icon: "refresh", label: "Reduce Motion", desc: "Minimize animations" },
                  { key: "soundEffects", icon: "volume", label: "Sound Effects", desc: "Play sounds for interactions" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="setting-item"
                  >
                    <div className="setting-item-info">
                      <UiIcon name={item.icon} size={24} title="" />
                      <div>
                        <div className="setting-item-label">{item.label}</div>
                        <div className="setting-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.accessibility[item.key]}
                      onChange={(v) => updateSetting("accessibility", item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div>
              <h2 className="card-title">
                <UiIcon name="lock" size={24} title="" /> Privacy Settings
              </h2>

              <div className="settings-list">
                {[
                  { key: "shareProgress", icon: "upload", label: "Share Progress", desc: "Allow sharing progress with therapists" },
                  { key: "allowAnalytics", icon: "chart", label: "Usage Analytics", desc: "Help improve DHYAN with anonymous data" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="setting-item"
                  >
                    <div className="setting-item-info">
                      <UiIcon name={item.icon} size={24} title="" />
                      <div>
                        <div className="setting-item-label">{item.label}</div>
                        <div className="setting-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.privacy[item.key]}
                      onChange={(v) => updateSetting("privacy", item.key, v)}
                    />
                  </div>
                ))}

                <div className="card card-danger mt-6">
                  <div className="card-title text-danger">
                    <UiIcon name="trash" size={20} title="" /> Data Management
                  </div>
                  <p className="card-text">
                    You can download all your data or delete your account permanently.
                  </p>
                  <div className="button-row">
                    <button className="btn btn-outline">
                      <UiIcon name="download" size={16} title="" />
                      Download My Data
                    </button>
                    <button className="btn btn-danger">
                      <UiIcon name="trash" size={16} title="" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "account" && (
            <div>
              <h2 className="card-title">
                <UiIcon name="profile" size={24} title="" /> Account Information
              </h2>

              <div className="account-section">
                <div className="account-card">
                  <div className="account-avatar">
                    {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="account-info">
                    <div className="account-name">{user?.full_name || "User"}</div>
                    <div className="account-email">{user?.email}</div>
                    <div className="account-status">
                      <span className="status-dot active"></span>
                      Active Account
                    </div>
                  </div>
                </div>

                <div className="account-stats">
                  <div className="stat-card">
                    <div className="stat-label">Role</div>
                    <div className="stat-value">{user?.role || "Child"}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Member Since</div>
                    <div className="stat-value">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg">
                  <UiIcon name="lock-badge" size={18} title="" />
                  Change Password
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="settings-save-bar">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? "Saving..." : (
                <>
                  <UiIcon name="save" size={18} title="" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        border: "none",
        background: checked ? "var(--success)" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: checked ? 27 : 3,
          transition: "left 0.2s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
