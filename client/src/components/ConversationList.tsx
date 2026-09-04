import type { ConversationSummary } from '../types';

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}

const formatRelative = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

const ConversationList = ({ conversations, activeId, loading, onSelect }: Props) => {
  if (loading) {
    return (
      <ul className="space-y-1.5" aria-busy="true" aria-label="Loading conversations">
        {[0, 1, 2].map((row) => (
          <li key={row} className="rounded-xl px-3 py-2.5">
            <span className="skeleton block h-3 w-3/4" />
            <span className="skeleton mt-2 block h-2.5 w-1/3" />
          </li>
        ))}
      </ul>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl bg-canvas px-4 py-9 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rose-ink">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12.5a6.5 6.5 0 01-6.5 6.5H8l-4 3v-3.9A6.5 6.5 0 018 5.5h5.5A6.5 6.5 0 0120 12z" />
          </svg>
        </span>
        <p className="text-sm font-semibold text-ink">No conversations yet</p>
        <p className="mx-auto mt-1.5 max-w-[15rem] text-xs leading-relaxed text-muted">
          Your threads appear here the moment you send a first message.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              aria-current={active ? 'true' : undefined}
              className={`block w-full rounded-xl px-3 py-2.5 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.985] ${
                active ? 'bg-blush text-ink' : 'text-ink-soft hover:bg-canvas hover:text-ink'
              }`}
            >
              <span className={`block truncate text-sm leading-snug ${active ? 'font-medium text-ink' : ''}`}>
                {conversation.title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                {formatRelative(conversation.updatedAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ConversationList;
