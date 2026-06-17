import { useEffect, useState } from "react";
import { login } from "../api/auth";
import { getToken } from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/professional.css";

export default function Login() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // stable redirect (no side effects in render)
  useEffect(() => {
    if (user || getToken()) nav("/dashboard");
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      await refreshUser();          // populate auth context before navigating
      nav("/dashboard");
    } catch (ex) {
      setErr(ex.message || "Login failed");
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
            <p className="auth-subtitle">AI-Powered Autism Therapy Platform</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {err && <div className="alert alert-error">{err}</div>}

            <button 
              className="btn btn-primary btn-lg w-full" 
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="auth-links">
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
              <span className="auth-divider">|</span>
              <Link to="/signup" className="auth-link">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
