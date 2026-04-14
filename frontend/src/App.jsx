import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import "./styles/app.css";

import { AuthProvider } from "./hooks/useAuth";
import { ChildProvider } from "./hooks/useChild";
import { ToastProvider } from "./hooks/useToast";
import { DesignSystemProvider } from "./theme/DesignSystemProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Lazy load all pages for optimal bundle splitting
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TherapistConsole = lazy(() => import("./pages/TherapistConsole"));
const GamesHub = lazy(() => import("./pages/GamesHub"));
const GameRouter = lazy(() => import("./pages/GameRouter"));
const JaGame = lazy(() => import("./pages/JaGame"));
const MatchingGame = lazy(() => import("./pages/games/MatchingGame"));
const MemoryMatchGame = lazy(() => import("./pages/games/MemoryMatchGame"));
const ObjectDiscovery = lazy(() => import("./pages/games/ObjectDiscovery"));
const ProblemSolving = lazy(() => import("./pages/games/ProblemSolving"));
const SpeechTherapy = lazy(() => import("./pages/games/SpeechTherapy"));
const SceneDescriptionGame = lazy(() => import("./pages/games/SceneDescriptionGame"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{ 
      width: '50px', 
      height: '50px', 
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #6366f1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>Loading...</p>
  </div>
);

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <ChildProvider>
        <Layout>{children}</Layout>
      </ChildProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  // Simple performance tracking
  useEffect(() => {
    if (window.performance && window.performance.mark) {
      window.performance.mark('app-initialization-complete');
    }
  }, []);

  return (
    <BrowserRouter>
      <DesignSystemProvider>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected routes with layout */}
                <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/therapist" element={<ProtectedLayout><TherapistConsole /></ProtectedLayout>} />
                <Route path="/games" element={<ProtectedLayout><GamesHub /></ProtectedLayout>} />
                <Route path="/games/classic" element={<ProtectedLayout><GameRouter /></ProtectedLayout>} />
                <Route path="/games/ja" element={<ProtectedLayout><JaGame /></ProtectedLayout>} />
                <Route path="/games/matching" element={<ProtectedLayout><MatchingGame /></ProtectedLayout>} />
                <Route path="/games/memory-match" element={<ProtectedLayout><MemoryMatchGame /></ProtectedLayout>} />
                <Route path="/games/object-discovery" element={<ProtectedLayout><ObjectDiscovery /></ProtectedLayout>} />
                <Route path="/games/problem-solving" element={<ProtectedLayout><ProblemSolving /></ProtectedLayout>} />
                <Route path="/games/scene-description" element={<ProtectedLayout><SceneDescriptionGame /></ProtectedLayout>} />
                <Route path="/speech-therapy" element={<ProtectedLayout><SpeechTherapy /></ProtectedLayout>} />
                <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
                <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
                <Route path="/help" element={<ProtectedLayout><Help /></ProtectedLayout>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </DesignSystemProvider>
    </BrowserRouter>
  );
}