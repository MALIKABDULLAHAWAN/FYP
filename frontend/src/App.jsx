import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./styles/app.css";

import { AuthProvider } from "./hooks/useAuth";
import { ChildProvider } from "./hooks/useChild";
import { ToastProvider } from "./hooks/useToast";
import { DesignSystemProvider } from "./theme/DesignSystemProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Import EmojiReplacer system
import { initializeEmojiReplacer } from "./services/EmojiReplacer/index.js";

// Import Performance Optimization system
import { initializePerformanceOptimization, preloadCriticalResources } from "./services/index.js";

import Login from "./pages/login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import TherapistConsole from "./pages/TherapistConsole";
import GameRouter from "./pages/GameRouter";
import JaGame from "./pages/JaGame";
import MatchingGame from "./pages/games/MatchingGame";
import MemoryMatchGame from "./pages/games/MemoryMatchGame";
import ObjectDiscovery from "./pages/games/ObjectDiscovery";
import ProblemSolving from "./pages/games/ProblemSolving";
import SpeechTherapy from "./pages/games/SpeechTherapy";
import SceneDescriptionGame from "./pages/games/SceneDescriptionGame";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import Settings from "./pages/Settings";
import Help from "./pages/Help";

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
  // Initialize EmojiReplacer system on app startup
  useEffect(() => {
    const initializeEmojiSystem = async () => {
      try {
        console.log('Initializing EmojiReplacer system...');
        const result = await initializeEmojiReplacer({
          enableHealthMonitoring: true
        });
        
        if (result.success) {
          console.log('EmojiReplacer system initialized successfully');
        } else {
          console.warn('EmojiReplacer system initialized with warnings:', result.message);
        }
      } catch (error) {
        console.error('Failed to initialize EmojiReplacer system:', error);
        // Continue with app initialization even if EmojiReplacer fails
      }
    };

    const initializePerformanceSystem = async () => {
      try {
        console.log('Initializing Performance Optimization system...');
        
        // Initialize performance services
        const services = initializePerformanceOptimization();
        
        // Preload critical resources
        await preloadCriticalResources();
        
        console.log('Performance Optimization system initialized successfully');
        
        // Log initial performance metrics
        if (window.performance && window.performance.mark) {
          window.performance.mark('app-initialization-complete');
        }
        
      } catch (error) {
        console.error('Failed to initialize Performance Optimization system:', error);
        // Continue with app initialization even if performance optimization fails
      }
    };

    // Initialize both systems
    const initializeSystems = async () => {
      await Promise.all([
        initializeEmojiSystem(),
        initializePerformanceSystem()
      ]);
    };

    initializeSystems();
  }, []);

  return (
    <BrowserRouter>
      <DesignSystemProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes with layout */}
            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/therapist" element={<ProtectedLayout><TherapistConsole /></ProtectedLayout>} />
            <Route path="/games" element={<ProtectedLayout><GameRouter /></ProtectedLayout>} />
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
          </ToastProvider>
        </AuthProvider>
      </DesignSystemProvider>
    </BrowserRouter>
  );
}