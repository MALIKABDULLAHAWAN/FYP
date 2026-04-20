import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import "./styles/app.css";

import { AuthProvider } from "./hooks/useAuth";
import { ChildProvider } from "./hooks/useChild";
import { ToastProvider } from "./hooks/useToast";
import { DesignSystemProvider } from "./theme/DesignSystemProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import MagicalLoader from "./components/MagicalLoader";

// Import EmojiReplacer system
import { initializeEmojiReplacer } from "./services/EmojiReplacer/index.js";

// Import Performance Optimization system
import { initializePerformanceOptimization, preloadCriticalResources } from "./services/index.js";

// Static Imports for core pages (Faster first paint)
import Login from "./pages/login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";

// Lazy Loaded Games & Activity Pages (Code Splitting)
const TherapistConsole = lazy(() => import("./pages/TherapistConsole"));
const GameRouter = lazy(() => import("./pages/GameRouter"));
const JaGame = lazy(() => import("./pages/JaGame"));
const MatchingGame = lazy(() => import("./pages/games/MatchingGame"));
const MemoryMatchGame = lazy(() => import("./pages/games/MemoryMatchGame"));
const ObjectDiscovery = lazy(() => import("./pages/games/ObjectDiscovery"));
const ProblemSolving = lazy(() => import("./pages/games/ProblemSolving"));
const SceneDescriptionGame = lazy(() => import("./pages/games/SceneDescriptionGame"));
const EmotionGestureQuest = lazy(() => import("./pages/games/EmotionGestureQuest"));
const GazeEmotionGame = lazy(() => import("./pages/games/GazeEmotionGame"));
const StoryAdventure = lazy(() => import("./pages/games/StoryAdventure"));
const BubblePopGame = lazy(() => import("./pages/games/BubblePopGame"));
const ColorMatchGame = lazy(() => import("./pages/games/ColorMatchGame"));
const ShapeSortGame = lazy(() => import("./pages/games/ShapeSortGame"));
const EmotionFaceGame = lazy(() => import("./pages/games/EmotionFaceGame"));
const AnimalSoundGame = lazy(() => import("./pages/games/AnimalSoundGame"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const StickerPack = lazy(() => import("./pages/StickerPack"));

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
  // Initialize Systems
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeEmojiReplacer({ enableHealthMonitoring: true });
        initializePerformanceOptimization();
        await preloadCriticalResources();
      } catch (error) {
        console.error('System init error:', error);
      }
    };
    initializeApp();
  }, []);

  return (
    <BrowserRouter>
      <DesignSystemProvider>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<MagicalLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected routes with layout */}
                <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/voice-assistant" element={<ProtectedLayout><VoiceAssistant /></ProtectedLayout>} />
                <Route path="/therapist" element={<ProtectedLayout><TherapistConsole /></ProtectedLayout>} />
                <Route path="/games" element={<ProtectedLayout><GameRouter /></ProtectedLayout>} />
                <Route path="/games/ja" element={<ProtectedLayout><JaGame /></ProtectedLayout>} />
                <Route path="/games/matching" element={<ProtectedLayout><MatchingGame /></ProtectedLayout>} />
                <Route path="/games/memory-match" element={<ProtectedLayout><MemoryMatchGame /></ProtectedLayout>} />
                <Route path="/games/object-discovery" element={<ProtectedLayout><ObjectDiscovery /></ProtectedLayout>} />
                <Route path="/games/problem-solving" element={<ProtectedLayout><ProblemSolving /></ProtectedLayout>} />
                <Route path="/games/scene-description" element={<ProtectedLayout><SceneDescriptionGame /></ProtectedLayout>} />
                <Route path="/games/emotion-gesture-quest" element={<ProtectedLayout><EmotionGestureQuest /></ProtectedLayout>} />
                <Route path="/games/gaze-emotion" element={<ProtectedLayout><GazeEmotionGame /></ProtectedLayout>} />
                <Route path="/games/story-adventure" element={<ProtectedLayout><StoryAdventure /></ProtectedLayout>} />
                <Route path="/games/bubble-pop" element={<ProtectedLayout><BubblePopGame /></ProtectedLayout>} />
                <Route path="/games/color-match" element={<ProtectedLayout><ColorMatchGame /></ProtectedLayout>} />
                <Route path="/games/shape-sort" element={<ProtectedLayout><ShapeSortGame /></ProtectedLayout>} />
                <Route path="/games/emotion-face" element={<ProtectedLayout><EmotionFaceGame /></ProtectedLayout>} />
                <Route path="/games/animal-sounds" element={<ProtectedLayout><AnimalSoundGame /></ProtectedLayout>} />
                <Route path="/sticker-pack" element={<ProtectedLayout><StickerPack /></ProtectedLayout>} />
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