'use client';

import Image from 'next/image';

interface SidebarHeaderProps {
  onNewChat: () => void;
  onCreateProject: () => void;
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function SidebarHeader({
  onNewChat,
  onCreateProject,
  showSearch,
  searchQuery,
  onSearchChange,
}: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-pure-black/10 dark:border-pure-white/10">
      <div className="mb-4">
        <Image
          src="/logo-light.png"
          alt="AI Nexus"
          width={208}
          height={50}
          className="w-52 h-auto block dark:hidden"
        />
        <Image
          src="/logo-dark.png"
          alt="AI Nexus"
          width={208}
          height={50}
          className="w-52 h-auto hidden dark:block"
        />
        <p className="text-xs text-neutral-gray dark:text-cloudy-400 mt-2 font-medium">Universal AI Interface</p>
      </div>

      <div className="space-y-2">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-claude-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
        <button
          onClick={onCreateProject}
          className="w-full px-4 py-2 bg-pure-black/5 dark:bg-pure-white/5 hover:bg-pure-black/10 dark:hover:bg-pure-white/10 text-pure-black dark:text-pure-white rounded-claude-sm transition-colors font-medium shadow-claude-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          New Project
        </button>
      </div>

      {showSearch && (
        <div className="mt-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations..."
              className="w-full px-3 py-2 pl-9 bg-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm text-sm text-pure-black dark:text-pure-white placeholder:text-cloudy-500 dark:placeholder:text-cloudy-400 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cloudy-500 dark:text-cloudy-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
