import { create } from "zustand";

export type Theme = "light" | "dark";
export type ChatFont = "default" | "sans" | "system" | "dyslexic";
export type ChatMode = "ask" | "plan" | "code";

interface Conversation {
  id: string;
  title: string;
  model: string;
  starred: boolean;
  shared: boolean;
  share_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  chatFont: ChatFont;
  setChatFont: (font: ChatFont) => void;

  extendedThinking: boolean;
  setExtendedThinking: (on: boolean) => void;

  webSearch: boolean;
  setWebSearch: (on: boolean) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;

  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  /** When set, ChatArea applies this to the input (e.g. skill-creator flow) then clears. */
  pendingChatPrefill: string | null;
  setPendingChatPrefill: (value: string | null) => void;

  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  ideOpen: boolean;
  setIdeOpen: (open: boolean) => void;

  ideRefreshTick: number;
  bumpIdeRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((s) => ({ conversations: [conversation, ...s.conversations] })),
  updateConversation: (id, data) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId:
        s.activeConversationId === id ? null : s.activeConversationId,
    })),

  theme: "dark",
  setTheme: (theme) => set({ theme }),

  chatFont: "default",
  setChatFont: (font) => set({ chatFont: font }),

  extendedThinking: false,
  setExtendedThinking: (on) => set({ extendedThinking: on }),

  webSearch: false,
  setWebSearch: (on) => set({ webSearch: on }),

  selectedModel: "haiku-4-5",
  setSelectedModel: (model) => set({ selectedModel: model }),

  chatMode: "code",
  setChatMode: (mode) => set({ chatMode: mode }),

  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  pendingChatPrefill: null,
  setPendingChatPrefill: (value) => set({ pendingChatPrefill: value }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  ideOpen: false,
  setIdeOpen: (open) => set({ ideOpen: open }),

  ideRefreshTick: 0,
  bumpIdeRefresh: () => set((s) => ({ ideRefreshTick: s.ideRefreshTick + 1 })),
}));
