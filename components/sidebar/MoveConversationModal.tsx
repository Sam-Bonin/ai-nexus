'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@/types/chat';

interface MoveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (projectId: string | null) => void;
  projects: Project[];
  currentProjectId: string | null;
  conversationTitle: string;
}

export default function MoveConversationModal({
  isOpen,
  onClose,
  onMove,
  projects,
  currentProjectId,
  conversationTitle,
}: MoveConversationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMove = (projectId: string | null) => {
    onMove(projectId);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-pure-black/50 dark:bg-pure-black/70 backdrop-blur-sm z-[120] animate-in fade-in duration-200"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[130] p-4"
        onClick={(e) => {
          // Only close if clicking the container itself, not its children
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
          <h2 className="text-lg font-semibold text-pure-black dark:text-pure-white mb-2">
            Move Conversation
          </h2>
          <p className="text-sm text-neutral-gray dark:text-neutral-gray mb-4 truncate">
            &quot;{conversationTitle}&quot;
          </p>

          <div className="space-y-1 max-h-96 overflow-y-auto mb-4">
            {/* Miscellaneous option */}
            <button
              onClick={() => handleMove(null)}
              className={`w-full text-left px-4 py-3 rounded-claude-sm transition-colors border-l-4 flex items-center justify-between ${
                currentProjectId === null
                  ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm border-neutral-gray'
                  : 'hover:bg-pure-black/5 dark:hover:bg-pure-white/5 border-neutral-gray'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-pure-black dark:text-pure-white">
                  Miscellaneous
                </div>
                <div className="text-xs text-neutral-gray dark:text-neutral-gray mt-0.5">
                  Uncategorized conversations
                </div>
              </div>
              {currentProjectId === null && (
                <svg className="w-5 h-5 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Project options */}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleMove(project.id)}
                className={`w-full text-left px-4 py-3 rounded-claude-sm transition-colors border-l-4 flex items-center justify-between ${
                  currentProjectId === project.id
                    ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm'
                    : 'hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                }`}
                style={{ borderLeftColor: project.color }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-pure-black dark:text-pure-white truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-neutral-gray dark:text-neutral-gray mt-0.5 truncate">
                    {project.description}
                  </div>
                </div>
                {currentProjectId === project.id && (
                  <svg className="w-5 h-5 text-theme-primary flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}

            {/* Empty state */}
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-gray dark:text-neutral-gray">
                  No projects yet. Only Miscellaneous is available.
                </p>
              </div>
            )}
          </div>

          {/* Cancel button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-pure-black/5 dark:hover:bg-pure-white/5 text-gray-700 dark:text-gray-300 rounded-claude-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}