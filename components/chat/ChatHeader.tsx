'use client';

import { useState } from 'react';
import { ModelId } from '@/types/chat';
import { ModelSelector } from './ModelSelector';
import { ThemeModal } from '@/components/settings/ThemeModal';

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
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <>
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
          onClick={() => setShowThemeModal(true)}
          className="p-2 text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
          aria-label="Theme settings"
          title="Customize theme"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-sm transition-colors font-medium text-sm hidden sm:block shadow-claude-sm"
        >
          New Chat
        </button>
      </div>
    </header>

      <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
    </>
  );
}
