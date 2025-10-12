'use client';

import { ModelId } from '@/types/chat';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  onNewChat: () => void;
}

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-pure-white/95 dark:bg-dark-gray/95 backdrop-blur border-b border-pure-black/10 dark:border-pure-white/10 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary p-2 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
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
          onClick={onNewChat}
          className="px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-sm transition-colors font-medium text-sm hidden sm:block shadow-claude-sm"
        >
          New Chat
        </button>
      </div>
    </header>
  );
}
