import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../api/auth";
import { useToast } from "../hooks/useToast";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isDirty =
    fullName !== (user?.full_name || "") || phone !== (user?.phone || "");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const roles = user?.roles || [];
  const roleLabel =
    roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") ||
    "User";
  const initial = (user?.full_name || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="container" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          My Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
          Manage your account details
        </p>
      </div>

      {/* Avatar + identity card */}
      <div
        className="panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "24px 28px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {user?.full_name || "No name set"}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
            {user?.email}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{
                background: "var(--primary-bg)",
                color: "var(--primary-light)",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {roleLabel}
            </span>
            <span
              className="badge"
              style={{
                background: user?.is_active ? "var(--success-bg)" : "var(--error-bg)",
                color: user?.is_active ? "var(--success)" : "var(--error)",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {user?.is_active ? "Active" : "Inactive"}
            </span>
            {user?.phone && (
              <span
                className="badge"
                style={{
                  background: "var(--card)",
                  color: "var(--text-secondary)",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                }}
              >
                {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="panel" style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 20, marginTop: 0 }}>
          Edit Details
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email
              </label>
              <input
                className="form-input"
                value={user?.email || ""}
                disabled
                style={{ opacity: 0.55, cursor: "not-allowed", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                className="form-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Phone Number
              </label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={!isDirty || saving}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "10px 24px", fontSize: 14 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Logout section */}
      <div className="panel" style={{ padding: "20px 28px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6, marginTop: 0 }}>
          Sign Out
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, marginTop: 0 }}>
          You will be returned to the login screen.
        </p>

        {!showLogoutConfirm ? (
          <button
            className="btn btn-outline"
            style={{ padding: "10px 24px", fontSize: 14, color: "var(--error)", borderColor: "var(--error)" }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <UiIcon name="logout" size={16} title="" />
            &nbsp;Log Out
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Are you sure?</span>
            <button
              className="btn btn-danger"
              style={{ padding: "8px 20px", fontSize: 14 }}
              onClick={handleLogout}
            >
              Yes, log out
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: "8px 20px", fontSize: 14 }}
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
