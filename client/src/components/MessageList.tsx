import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  pending: boolean;
  loading: boolean;
  onSuggestion: (text: string) => void;
}

const starters = [
  'What does watch time actually measure?',
  'Why might my reach suddenly drop?',
  'How do I read my engagement rate?'
];

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const agentMark = (
  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose shadow-soft">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-4 w-4" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9.5l6 8 6-8" />
    </svg>
  </span>
);

const MessageList = ({ messages, pending, loading, onSuggestion }: Props) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [messages, pending, loading]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-canvas px-4 py-8 lg:px-6">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
        {loading && (
          <div className="space-y-6" aria-busy="true" aria-label="Loading conversation">
            {[0, 1, 2].map((row) => (
              <div key={row} className={row % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}>
                <span className={`skeleton h-16 ${row % 2 === 0 ? 'w-3/4' : 'w-1/2 rounded-2xl'}`} />
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && !pending && (
          <div className="flex flex-1 animate-rise flex-col items-center justify-center py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose shadow-lift">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-7 w-7" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9.5l6 8 6-8" />
              </svg>
            </span>
            <h2 className="mt-6 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              How can we help today?
            </h2>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ink-soft">
              Ask about an order, your billing, or anything on your account. Every thread is saved so you can pick it
              up later.
            </p>
            <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => onSuggestion(starter)}
                  className="btn-ghost justify-start rounded-2xl px-4 py-3 text-left text-sm font-normal leading-snug shadow-soft sm:last:col-span-2"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="flex flex-col gap-7" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => {
              const mine = message.role === 'user';
              return (
                <div key={message.id} className={`flex w-full animate-rise gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && agentMark}
                  <div
                    className={`flex min-w-0 flex-col gap-1.5 ${
                      mine ? 'max-w-[85%] items-end sm:max-w-[75%]' : 'flex-1 items-start pt-1'
                    }`}
                  >
                    <div
                      className={
                        mine
                          ? 'rounded-2xl bg-blush px-4 py-3 text-sm leading-relaxed text-ink'
                          : 'text-[15px] leading-relaxed text-ink'
                      }
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className={`flex flex-wrap items-center gap-2 text-[11px] text-muted ${mine ? 'pr-1' : ''}`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {!mine && message.model && (
                        <>
                          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-line-strong" />
                          <span className="truncate">{message.model}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pending && (
          <div role="status" aria-live="polite" className="mt-7 flex animate-rise justify-start gap-3">
            {agentMark}
            <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-paper px-4 py-3 shadow-soft">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="sr-only">Agent is typing a reply</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
};

export default MessageList;
