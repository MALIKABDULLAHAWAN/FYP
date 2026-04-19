import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../api/auth";
import { useToast } from "../hooks/useToast";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  // Track if form is dirty
  const isDirty = fullName !== (user?.full_name || "") || phone !== (user?.phone || "");

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const roles = user?.roles || [];
  const roleLabel = roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") || "User";
  const initial = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-with-icon">
          <UiIcon name="profile" size={32} title="" />
          <h1 className="page-title">My Profile</h1>
        </div>
        <p className="page-subtitle">Manage your account details</p>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <div className="card profile-info-card">
          <div className="profile-avatar">{initial}</div>

          <h2 className="profile-name">{user?.full_name || "No name set"}</h2>
          <p className="profile-email">{user?.email}</p>
          <span className="role-badge">
            <UiIcon name="star" size={16} title="" />
            {roleLabel}
          </span>

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-label">Phone</div>
              <div className="profile-stat-value">{user?.phone || "—"}</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-label">Status</div>
              <div className={`profile-stat-value ${user?.is_active ? 'active' : 'inactive'}`}>
                {user?.is_active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card profile-edit-card">
          <h3 className="card-title">
            <UiIcon name="edit" size={20} title="" />
            Edit Profile
          </h3>

          <form onSubmit={handleSaveProfile} className="form-stack">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={user?.email || ""}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={!isDirty || saving}
              className="btn btn-primary btn-lg w-full"
            >
              {saving ? "Saving..." : (
                <>
                  <UiIcon name="save" size={20} title="" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
