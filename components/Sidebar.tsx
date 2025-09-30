'use client';

import { useState } from 'react';
import { Conversation } from '@/types/chat';
import { exportConversationAsMarkdown, exportConversationAsJSON, downloadFile } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRenameStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleExport = (conversation: Conversation, format: 'markdown' | 'json') => {
    const content = format === 'markdown'
      ? exportConversationAsMarkdown(conversation)
      : exportConversationAsJSON(conversation);

    const extension = format === 'markdown' ? 'md' : 'json';
    const filename = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    downloadFile(content, filename, format === 'markdown' ? 'text/markdown' : 'application/json');
    setMenuOpenId(null);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`h-full bg-pure-white dark:bg-dark-gray border-r border-pure-black/10 dark:border-pure-white/10 transition-all duration-300 ${
          isOpen ? 'w-72' : 'w-0'
        } flex flex-col shadow-claude-md font-sans overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-pure-black/10 dark:border-pure-white/10">
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-electric-yellow via-vibrant-coral to-crail">
              AI Nexus
            </h1>
            <p className="text-xs text-neutral-gray dark:text-cloudy-400 mt-1 font-medium">Universal AI Interface</p>
          </div>
          <button
            onClick={onNewChat}
            className="w-full px-4 py-2 bg-electric-yellow hover:bg-electric-yellow-600 text-pure-black rounded-claude-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-claude-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* Search input */}
          {conversations.length > 0 && (
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full px-3 py-2 pl-9 bg-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm text-sm text-pure-black dark:text-pure-white placeholder:text-cloudy-500 dark:placeholder:text-cloudy-400 focus:outline-none focus:ring-2 focus:ring-crail/50 focus:border-crail dark:focus:ring-electric-yellow/50 dark:focus:border-electric-yellow"
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

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.length === 0 && searchQuery ? (
            <p className="text-center text-cloudy-600 dark:text-cloudy-200 text-sm mt-8">
              No conversations found
            </p>
          ) : filteredConversations.length === 0 ? (
            <p className="text-center text-cloudy-600 dark:text-cloudy-200 text-sm mt-8">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative rounded-claude-sm transition-colors ${
                    conversation.id === activeConversationId
                      ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm border border-crail/20 dark:border-pure-white/20'
                      : 'hover:bg-white/50 dark:hover:bg-pure-white/5'
                  }`}
                >
                  {editingId === conversation.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameSubmit(conversation.id);
                      }}
                      className="p-2"
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(conversation.id)}
                        autoFocus
                        className="w-full px-2 py-1 text-sm bg-white dark:bg-dark-bg border border-crail rounded-claude-sm focus:outline-none focus:ring-2 focus:ring-crail/50 font-sans"
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className="w-full text-left p-3 pr-10 block"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title}
                        </div>
                        <div className="text-xs text-neutral-gray dark:text-neutral-gray mt-1">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </div>
                      </button>

                      {/* Menu button */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                          }}
                          className="p-1 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {menuOpenId === conversation.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 z-20">
                              <button
                                onClick={() => handleRenameStart(conversation)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleExport(conversation, 'markdown')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                              >
                                Export as Markdown
                              </button>
                              <button
                                onClick={() => handleExport(conversation, 'json')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                              >
                                Export as JSON
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteConversation(conversation.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-electric-yellow dark:text-electric-yellow hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}