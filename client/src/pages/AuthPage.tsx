import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const highlights = [
  'Every conversation is saved to your account and only yours',
  'Choose the model that answers, from fast to deep reasoning',
  'Plain answers about orders, billing and account changes'
];

const AuthPage = () => {
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const isLogin = mode === 'login';
  const actionLabel = isLogin ? 'Sign in' : 'Create account';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are both required.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPending(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'signup' : 'login');
    setError(null);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-12 text-ink antialiased">
      <div className="w-full max-w-md">
        <section className="card animate-rise p-7 shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose shadow-soft">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-6 w-6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9.5l6 8 6-8" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-ink">ViralLens</p>
              <p className="truncate text-xs leading-tight text-muted">Support</p>
            </div>
          </div>

          <div className="relative mt-7 grid grid-cols-2 rounded-xl bg-canvas p-1">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-paper shadow-soft transition-transform duration-150 ease-out ${
                isLogin ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (!isLogin) switchMode();
              }}
              aria-pressed={isLogin}
              className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                isLogin ? 'text-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLogin) switchMode();
              }}
              aria-pressed={!isLogin}
              className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                isLogin ? 'text-ink-soft hover:text-ink' : 'text-ink'
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mt-7">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {isLogin
                ? 'Sign in to pick up your conversations where you left them.'
                : 'Set up an account and start a conversation in under a minute.'}
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                placeholder="you@company.com"
                onChange={(event) => setEmail(event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="Your password"
                onChange={(event) => setPassword(event.target.value)}
                className="input"
              />
            </div>

            {error && (
              <p role="alert" className="flex animate-rise items-start gap-2.5 rounded-xl bg-blush px-4 py-3 text-sm leading-relaxed text-rose-ink">
                <span aria-hidden="true" className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                <span>{error}</span>
              </p>
            )}

            <button type="submit" disabled={pending} className="btn w-full py-3">
              {pending ? (isLogin ? 'Signing in' : 'Creating account') : actionLabel}
            </button>
          </form>
        </section>

        <ul className="mt-6 space-y-2.5 px-2">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="mt-px h-4 w-4 shrink-0 text-rose" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AuthPage;
