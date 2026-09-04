import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import ModelPicker from '../components/ModelPicker';
import { getModels, sendMessage, getHistory, getConversation } from '../api/client';
import type { ChatMessage, ConversationSummary, ModelOption } from '../types';

const readError = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const ChatPage = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [catalog, history] = await Promise.all([getModels(), getHistory()]);
        setModels(catalog.models);
        setSelectedModel(catalog.defaultModel);
        setConversations(history.conversations);
      } catch (err) {
        setError(readError(err, 'Could not load your workspace. Please refresh.'));
      } finally {
        setBooting(false);
      }
    };
    load();
  }, []);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);
  const activeModel = models.find((model) => model.id === selectedModel);

  const refreshConversations = async (): Promise<ConversationSummary[] | null> => {
    try {
      const history = await getHistory();
      setConversations(history.conversations);
      return history.conversations;
    } catch {
      return null;
    }
  };

  const handleSelect = async (id: string) => {
    setSidebarOpen(false);
    if (id === activeId) return;
    setActiveId(id);
    activeIdRef.current = id;
    setMessages([]);
    setError(null);
    setThreadLoading(true);
    try {
      const thread = await getConversation(id);
      if (activeIdRef.current !== id) return;
      setMessages(thread.messages);
    } catch (err) {
      if (activeIdRef.current !== id) return;
      setError(readError(err, 'Could not open that conversation.'));
    } finally {
      if (activeIdRef.current === id) {
        setThreadLoading(false);
      }
    }
  };

  const handleNewChat = () => {
    setSidebarOpen(false);
    setActiveId(null);
    activeIdRef.current = null;
    setMessages([]);
    setError(null);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || pending) return;

    const target = activeId;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, optimistic]);
    setDraft('');
    setError(null);
    setPending(true);
    setPendingId(target);

    try {
      const result = await sendMessage(text, target ?? undefined, selectedModel || undefined);
      if (activeIdRef.current === target) {
        const answer: ChatMessage = {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          model: selectedModel || undefined,
          createdAt: new Date().toISOString()
        };
        setMessages((current) => [...current, answer]);
        setActiveId(result.conversationId);
        activeIdRef.current = result.conversationId;
      }
      await refreshConversations();
    } catch (err) {
      const list = await refreshConversations();
      if (activeIdRef.current === target) {
        setError(readError(err, 'The message could not be sent. Please try again.'));
        if (!target && list && list.length > 0) {
          setActiveId(list[0].id);
          activeIdRef.current = list[0].id;
        }
      }
    } finally {
      setPending(false);
      setPendingId(null);
    }
  };

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="shrink-0 p-4">
        <button type="button" onClick={handleNewChat} className="btn w-full">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5.5v13M5.5 12h13" />
          </svg>
          New chat
        </button>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-2">
        <p className="eyebrow">Conversations</p>
        {conversations.length > 0 && <span className="tag">{conversations.length}</span>}
      </div>
      <nav aria-label="Conversation history" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          loading={booting}
          onSelect={handleSelect}
        />
      </nav>
      <div className="shrink-0 border-t border-line p-4">
        <ModelPicker models={models} value={selectedModel} onChange={setSelectedModel} disabled={pending} />
      </div>
    </div>
  );

  return (
    <Layout sidebar={sidebar} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3.5 lg:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-rose" />
          <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-ink">
            {activeConversation ? activeConversation.title : 'New conversation'}
          </h1>
          <span className="tag hidden shrink-0 sm:inline-flex">
            {messages.length > 0
              ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
              : 'Assistant ready'}
          </span>
        </div>
        {activeModel && (
          <span className="inline-flex min-w-0 max-w-[40%] shrink items-center rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-medium text-ink-soft">
            <span className="truncate">{activeModel.label}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="shrink-0 bg-canvas px-4 pt-4 lg:px-6">
          <div
            role="alert"
            className="mx-auto flex w-full max-w-3xl animate-rise items-start justify-between gap-3 rounded-xl bg-blush px-4 py-3"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <span aria-hidden="true" className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
              <span className="text-sm leading-relaxed text-rose-ink">{error}</span>
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-ink transition duration-150 hover:bg-blush-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-blush active:scale-[0.985]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        pending={pending && pendingId === activeId}
        loading={threadLoading}
        onSuggestion={setDraft}
      />
      <Composer value={draft} onChange={setDraft} onSend={handleSend} pending={pending} />
    </Layout>
  );
};

export default ChatPage;
