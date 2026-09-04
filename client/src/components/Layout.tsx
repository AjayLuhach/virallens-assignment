import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props extends PropsWithChildren {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

const Layout = ({ sidebar, sidebarOpen, onSidebarOpenChange, children }: Props) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSidebarOpenChange(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sidebarOpen, onSidebarOpenChange]);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    if (sidebarOpen) {
      asideRef.current?.querySelector<HTMLElement>('button, select, a[href]')?.focus();
      return;
    }
    if (asideRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch {
      setLeaving(false);
    }
  };

  const email = user?.email ?? '';
  const initial = email.slice(0, 1).toUpperCase();

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas text-ink antialiased">
      <header className="relative z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper px-4 lg:px-6">
        <a
          href="#main"
          className="sr-only text-sm font-medium text-ink transition duration-150 focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:border focus:border-line-strong focus:bg-paper focus:px-3.5 focus:py-2 focus:shadow-lift focus:outline-none focus:ring-2 focus:ring-rose focus:ring-offset-2 focus:ring-offset-paper"
        >
          Skip to conversation
        </a>
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => onSidebarOpenChange(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close conversations' : 'Open conversations'}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            className="btn-icon h-9 w-9 lg:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /> : <path d="M4 7.5h16M4 12h16M4 16.5h16" />}
            </svg>
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose shadow-soft">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9.5l6 8 6-8" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-ink">ViralLens</p>
            <p className="truncate text-xs leading-tight text-muted">Support</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2.5 rounded-full border border-line bg-paper py-1 pl-1 pr-3.5 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush text-xs font-semibold text-rose-ink">
              {initial}
            </span>
            <span className="max-w-[180px] truncate text-xs text-ink-soft">{email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={leaving}
            className="btn-ghost whitespace-nowrap px-3.5 py-2 text-xs"
          >
            {leaving ? 'Signing out' : 'Log out'}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <div
            aria-hidden="true"
            onClick={() => onSidebarOpenChange(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-20 bg-ink/30 opacity-100 transition-opacity duration-150 lg:hidden"
          />
        )}
        <aside
          id="sidebar"
          ref={asideRef}
          aria-label="Conversations sidebar"
          className={`fixed bottom-0 left-0 top-16 z-30 flex w-[85%] max-w-xs flex-col border-r border-line bg-paper shadow-lift transition-[transform,visibility] duration-200 ease-out lg:static lg:z-auto lg:w-80 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible max-lg:pointer-events-none'
          }`}
        >
          {sidebar}
        </aside>
        <main id="main" tabIndex={-1} className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas focus-visible:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
