import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";
import "../styles/landing-page.css";

const FEATURES = [
  { icon: "puzzle", title: "AI-Powered Games", description: "Adaptive therapy games that adjust difficulty in real-time based on each child's progress." },
  { icon: "speech", title: "Speech Therapy", description: "Record, analyze, and score speech sessions with AI-driven feedback." },
  { icon: "chart", title: "Progress Tracking", description: "Visual dashboards with charts, accuracy trends, and detailed breakdowns." },
  { icon: "therapist", title: "Therapist Console", description: "Manage patients, review session histories, and generate reports." },
  { icon: "target", title: "Adaptive Difficulty", description: "Prompts, timing, and complexity adjust to each child's abilities." },
  { icon: "lock", title: "Secure & Private", description: "Role-based access and encrypted data keep information protected." },
];

const GAMES = [
  { icon: "shape-square", name: "Shape Matching", category: "Visual" },
  { icon: "cards", name: "Memory Match", category: "Cognitive" },
  { icon: "search", name: "Object Discovery", category: "Visual" },
  { icon: "puzzle", name: "Problem Solving", category: "Logic" },
  { icon: "speech", name: "Speech Therapy", category: "Communication" },
  { icon: "eye", name: "Joint Attention", category: "Social" },
];

const STATS = [
  { value: "10K+", label: "Sessions Completed" },
  { value: "95%", label: "Accuracy Rate" },
  { value: "50+", label: "Therapists" },
  { value: "500+", label: "Children Helped" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <div className="container header-content">
          <a href="/" className="brand">
            <div className="brand-logo">
              <UiIcon name="heart" size={20} />
            </div>
            <span>DHYAN</span>
          </a>
          <nav className="nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#games" className="nav-link">Games</a>
            <a href="#about" className="nav-link">About</a>
            <button
              className="btn btn-primary"
              onClick={() => navigate(user ? "/dashboard" : "/login")}
            >
              {user ? "Dashboard" : "Get Started"}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                AI-Powered Autism
                <span className="hero-highlight">Therapy Platform</span>
              </h1>
              <p className="hero-description">
                Empowering children through intelligent, adaptive therapy games.
                Personalized learning experiences that evolve with each child's progress.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/login")}
                >
                  Start Free Trial
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => navigate("/help")}
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card">
                <div className="hero-icon">
                  <UiIcon name="brain" size={48} />
                </div>
                <div className="hero-stats">
                  {STATS.map((stat, i) => (
                    <div key={i} className="hero-stat">
                      <div className="hero-stat-value">{stat.value}</div>
                      <div className="hero-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose DHYAN?</h2>
            <p className="section-description">
              Comprehensive therapy tools designed with care for children, parents, and therapists.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card card-interactive feature-card">
                <div className="feature-icon">
                  <UiIcon name={feature.icon} size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className="section games-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Therapy Games</h2>
            <p className="section-description">
              Engaging, adaptive games that make therapy enjoyable and effective.
            </p>
          </div>
          <div className="games-grid">
            {GAMES.map((game) => (
              <div key={game.name} className="card card-interactive game-card">
                <div className="game-icon">
                  <UiIcon name={game.icon} size={32} />
                </div>
                <div className="game-info">
                  <h3 className="game-title">{game.name}</h3>
                  <span className="badge badge-blue">{game.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of therapists and parents using DHYAN to support children's development.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(user ? "/dashboard" : "/signup")}
            >
              {user ? "Go to Dashboard" : "Create Free Account"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="brand-logo">
                <UiIcon name="heart" size={18} />
              </div>
              <span className="footer-brand-name">DHYAN</span>
              <p className="footer-brand-tagline">AI-Powered Autism Therapy</p>
            </div>
            <div className="footer-links">
              <a href="/help" className="footer-link">Help Center</a>
              <a href="/privacy" className="footer-link">Privacy Policy</a>
              <a href="/terms" className="footer-link">Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} DHYAN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

