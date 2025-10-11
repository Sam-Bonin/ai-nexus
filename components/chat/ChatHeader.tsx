'use client';

import { ModelId, Theme } from '@/types/chat';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onNewChat: () => void;
}

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  theme,
  onToggleTheme,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-pure-white/95 dark:bg-dark-gray/95 backdrop-blur border-b border-pure-black/10 dark:border-pure-white/10 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow p-2 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <ModelSelector selectedModel={selectedModel} onSelect={onSelectModel} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-2 text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-electric-yellow hover:bg-vibrant-coral text-pure-black rounded-claude-sm transition-colors font-medium text-sm hidden sm:block shadow-claude-sm"
        >
          New Chat
        </button>
      </div>
    </header>
  );
}
