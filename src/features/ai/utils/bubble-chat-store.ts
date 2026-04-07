import { create } from 'zustand';

export interface BubbleChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BubbleChatState {
  isOpen: boolean;
  messages: BubbleChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
  isSaving: boolean;
  isLoaded: boolean;

  toggle: () => void;
  open: () => void;
  close: () => void;
  addUserMessage: (content: string) => void;
  startStreaming: () => void;
  appendToStream: (text: string) => void;
  finishStreaming: () => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setSessionId: (id: string | null) => void;
  setMessages: (messages: BubbleChatMessage[]) => void;
  setIsSaving: (saving: boolean) => void;
  setIsLoaded: (loaded: boolean) => void;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(): string {
  return new Date().toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const useBubbleChatStore = create<BubbleChatState>((set) => ({
  isOpen: false,
  messages: [],
  isStreaming: false,
  error: null,
  sessionId: null,
  isSaving: false,
  isLoaded: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  addUserMessage: (content: string) =>
    set((s) => ({
      messages: [...s.messages, { id: makeId(), role: 'user', content, timestamp: formatTime() }],
      error: null
    })),

  startStreaming: () =>
    set((s) => ({
      isStreaming: true,
      messages: [
        ...s.messages,
        { id: makeId(), role: 'assistant', content: '', timestamp: formatTime() }
      ]
    })),

  appendToStream: (text: string) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + text };
      }
      return { messages: msgs };
    }),

  finishStreaming: () => set({ isStreaming: false }),

  setError: (error: string | null) => set({ error, isStreaming: false }),

  clearMessages: () => set({ messages: [], error: null, sessionId: null }),

  setSessionId: (id: string | null) => set({ sessionId: id }),

  setMessages: (messages: BubbleChatMessage[]) => set({ messages }),

  setIsSaving: (saving: boolean) => set({ isSaving: saving }),

  setIsLoaded: (loaded: boolean) => set({ isLoaded: loaded })
}));
