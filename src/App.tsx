
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { OAuthCallback } from './pages/OAuthCallback';
import { useAuthStore } from './store/authStore';

import { Toaster } from 'sonner';

function App() {
  const { token } = useAuthStore();

  return (
    <>
      <Toaster position="bottom-right" richColors closeButton theme="dark" expand={false} />
      <AppShell>
        <Routes>
          <Route path="/" element={token ? <Dashboard /> : <Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
