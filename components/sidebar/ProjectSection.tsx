'use client';

import { useState } from 'react';
import { Conversation, Project } from '@/types/chat';
import { ConversationListItem } from './ConversationListItem';

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

export function ProjectSection({
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
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="mb-1">
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
            <span className="px-2 py-0.5 rounded-full bg-electric-yellow/10 dark:bg-electric-yellow/20 text-xs font-medium text-pure-black dark:text-pure-white flex-shrink-0">
              {conversations.length}
            </span>
          </div>
        </button>

        {(onEditProject || onDeleteProject) && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setProjectMenuOpen(prev => !prev);
              }}
              className="p-1 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {projectMenuOpen && (
              <>
                <div className="fixed inset-0 z-[200]" onClick={() => setProjectMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black dark:border-pure-white py-1 z-[210] max-h-[80vh] overflow-y-auto">
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

      {isExpanded && (
        <div className="mt-1 pl-3 space-y-1">
          {sortedConversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-neutral-gray dark:text-neutral-gray">No conversations yet.</p>
          ) : (
            sortedConversations.map(conversation => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                onSelect={onSelectConversation}
                onRename={onRenameConversation}
                onDelete={onDeleteConversation}
                onMove={onMoveConversation}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
