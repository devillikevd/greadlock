import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Junctions } from './pages/Junctions';
import { JunctionDetail } from './pages/JunctionDetail';
import { AIChat } from './pages/AIChat';
import { SignalSimulator } from './pages/SignalSimulator';
import { EmergencyCorridor } from './pages/EmergencyCorridor';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { PublicPortal } from './pages/PublicPortal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAppStore();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isLoggedIn, fetchData } = useAppStore();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/public" element={<PublicPortal />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/junctions" element={<Junctions />} />
          <Route path="/junction/:id" element={<JunctionDetail />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/simulator" element={<SignalSimulator />} />
          <Route path="/emergency" element={<EmergencyCorridor />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
