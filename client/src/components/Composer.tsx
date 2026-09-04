import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  pending: boolean;
}

const Composer = ({ value, onChange, onSend, pending }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = '0px';
    element.style.height = `${Math.min(element.scrollHeight, 176)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSend();
  };

  const blocked = pending || value.trim().length === 0;

  return (
    <div className="shrink-0 border-t border-line bg-canvas px-4 pb-5 pt-4 lg:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-paper p-2 shadow-soft transition duration-150 focus-within:border-rose focus-within:shadow-focus">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={pending}
            placeholder="Describe your issue…"
            aria-label="Message the support assistant"
            className="max-h-44 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-6 text-ink placeholder:text-muted focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={blocked}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-deep text-paper shadow-soft transition duration-150 hover:bg-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-blush-deep disabled:text-muted disabled:shadow-none"
          >
            {pending ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-4 w-4" fill="currentColor">
                <rect x="7" y="7" width="10" height="10" rx="2.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5.5" />
                <path d="M5.5 12L12 5.5 18.5 12" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] text-muted">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default Composer;
