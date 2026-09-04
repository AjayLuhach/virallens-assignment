import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4">
        <div role="status" className="card flex animate-rise flex-col items-center gap-4 px-10 py-9 shadow-lift">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose shadow-soft">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-6 w-6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9.5l6 8 6-8" />
            </svg>
          </span>
          <p className="text-base font-semibold text-ink">Restoring your session</p>
          <span className="flex items-center gap-1.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={user ? <ChatPage /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
    </Routes>
  );
};

export default App;
