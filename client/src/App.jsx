import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GameStoreProvider } from './hooks/useGameStore';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import GamePage from './pages/GamePage';
import { useGame } from './hooks/useGame';

/**
 * Inner component that needs access to useGame (which needs router context).
 */
function AppRoutes() {
  // Initialize the game hook so socket listeners are always active.
  useGame();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room" element={<RoomPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameStoreProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#06b6d4', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
            },
          }}
        />
        <AppRoutes />
      </GameStoreProvider>
    </BrowserRouter>
  );
}
