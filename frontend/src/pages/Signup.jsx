import { useState } from "react";
import { signup } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/professional.css";

export default function Signup() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    password2: "",
    role: "parent",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (form.password !== form.password2) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      nav("/login", { state: { msg: "Account created! Please sign in." } });
    } catch (ex) {
      // try to show field-level errors
      const p = ex.payload;
      if (p && typeof p === "object") {
        const msgs = Object.entries(p)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setErr(msgs);
      } else {
        setErr(ex.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="brand-logo">D</div>
            </div>
            <h1 className="auth-title">DHYAN</h1>
            <p className="auth-subtitle">Create your account</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                placeholder="you@example.com"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={set("full_name")}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                className="form-input"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label className="form-label">I am a...</label>
              <select
                className="form-input form-select"
                value={form.role}
                onChange={set("role")}
              >
                <option value="parent">Parent / Guardian</option>
                <option value="therapist">Therapist / Clinician</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                placeholder="Create a strong password"
                type="password"
                required
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                placeholder="Re-enter your password"
                type="password"
                required
                value={form.password2}
                onChange={set("password2")}
                autoComplete="new-password"
              />
            </div>

            {err && <div className="alert alert-error">{err}</div>}

            <button className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (
                <>Creating account...</>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="auth-links">
              <Link to="/login" className="auth-link">Already have an account? Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
