'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation, Project } from '@/types/chat';
import ConversationDropdown from './ConversationDropdown';

interface ProjectSectionProps {
  project: Project;
  conversations: Conversation[];
  activeConversationId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onMoveConversation?: (conversation: Conversation) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

export default function ProjectSection({
  project,
  conversations,
  activeConversationId,
  isExpanded,
  onToggle,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onMoveConversation,
  onEditProject,
  onDeleteProject,
}: ProjectSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (conversation: Conversation, buttonElement: HTMLButtonElement) => {
    if (menuOpenId === conversation.id) {
      setMenuOpenId(null);
      setMenuPosition(null);
      setActiveConversation(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setMenuOpenId(conversation.id);
      setActiveConversation(conversation);
    }
  };

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

  // Sort conversations by updatedAt (newest first)
  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="mb-1">
      {/* Project Header */}
      <div className="relative group">
        <button
          onClick={onToggle}
          className={`w-full text-left px-3 py-2 pr-10 rounded-claude-sm transition-colors cursor-pointer border-l-4 flex items-center justify-between ${
            isExpanded
              ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm'
              : 'hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
          }`}
          style={{ borderLeftColor: project.color }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold text-pure-black dark:text-pure-white tracking-tight truncate">
              {project.name}
            </span>
            <span
              className="px-2 py-0.5 rounded-full bg-electric-yellow/10 dark:bg-electric-yellow/20 text-xs font-medium text-pure-black dark:text-pure-white flex-shrink-0"
            >
              {conversations.length}
            </span>
          </div>
        </button>

        {/* Project menu button */}
        {(onEditProject || onDeleteProject) && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProjectMenuOpen(!projectMenuOpen);
              }}
              className="p-1 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* Project dropdown menu */}
            {projectMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[200]"
                  onClick={() => setProjectMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black dark:border-pure-white py-1 z-[210]">
                  {onEditProject && (
                    <button
                      onClick={() => {
                        onEditProject(project);
                        setProjectMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                    >
                      Edit Project
                    </button>
                  )}
                  {onDeleteProject && (
                    <button
                      onClick={() => {
                        onDeleteProject(project);
                        setProjectMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-vibrant-coral dark:text-vibrant-coral hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                    >
                      Delete Project
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${contentRef.current?.scrollHeight || 1000}px` : '0',
        }}
      >
        <div className="space-y-1 pt-1">
          {sortedConversations.length === 0 ? (
            <div className="pl-6 py-2 text-xs text-neutral-gray dark:text-neutral-gray italic">
              No conversations yet
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative rounded-claude-sm transition-colors ml-6 ${
                  conversation.id === activeConversationId
                    ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm border border-electric-yellow/20'
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
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-dark-bg border border-electric-yellow rounded-claude-sm focus:outline-none focus:ring-2 focus:ring-electric-yellow/50"
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
                          handleMenuClick(conversation, e.currentTarget);
                        }}
                        className="p-1 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fixed positioned dropdown */}
      {activeConversation && (
        <ConversationDropdown
          conversation={activeConversation}
          isOpen={!!menuOpenId}
          position={menuPosition}
          onClose={() => {
            setMenuOpenId(null);
            setMenuPosition(null);
            setActiveConversation(null);
          }}
          onRename={handleRenameStart}
          onMove={onMoveConversation}
          onDelete={onDeleteConversation}
        />
      )}
    </div>
  );
}