import { Conversation } from '@/types/chat';

const CONVERSATIONS_KEY = 'claude-conversations';
const ACTIVE_CONVERSATION_KEY = 'claude-active-conversation';
const THEME_KEY = 'claude-theme';

export const storage = {
  // Conversations
  getConversations: (): Conversation[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveConversations: (conversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  },

  getConversation: (id: string): Conversation | null => {
    const conversations = storage.getConversations();
    return conversations.find(c => c.id === id) || null;
  },

  saveConversation: (conversation: Conversation) => {
    const conversations = storage.getConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);

    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    storage.saveConversations(conversations);
  },

  deleteConversation: (id: string) => {
    const conversations = storage.getConversations().filter(c => c.id !== id);
    storage.saveConversations(conversations);
  },

  // Active conversation
  getActiveConversationId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  },

  setActiveConversationId: (id: string | null) => {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
  },

  // Theme
  getTheme: (): 'light' | 'dark' | 'system' => {
    if (typeof window === 'undefined') return 'system';
    const theme = localStorage.getItem(THEME_KEY);
    return (theme as 'light' | 'dark' | 'system') || 'system';
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_KEY, theme);
  },
};