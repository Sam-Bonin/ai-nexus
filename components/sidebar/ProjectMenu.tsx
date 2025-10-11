'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@/types/chat';

interface ProjectMenuProps {
  project: Project;
  isOpen: boolean;
  position: { top: number; right: number } | null;
  onClose: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

export function ProjectMenu({
  project,
  isOpen,
  position,
  onClose,
  onEditProject,
  onDeleteProject,
}: ProjectMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !position || !mounted) return null;

  // Calculate dropdown height (approximate: 2 items * 40px height + padding)
  const dropdownHeight = 100;
  const viewportHeight = window.innerHeight;

  // Check if dropdown would extend beyond viewport bottom
  const wouldExtendBeyondBottom = position.top + dropdownHeight > viewportHeight;

  // If it would extend beyond, position it above the button instead
  const adjustedTop = wouldExtendBeyondBottom
    ? Math.max(10, position.top - dropdownHeight - 8) // 8px gap from button
    : position.top;

  const menuContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200]"
        onClick={onClose}
      />

      {/* Dropdown menu with fixed positioning */}
      <div
        className="fixed w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black dark:border-pure-white py-1 z-[210] max-h-[80vh] overflow-y-auto"
        style={{
          top: `${adjustedTop}px`,
          right: `${position.right}px`,
        }}
      >
        {onEditProject && (
          <button
            onClick={() => {
              onEditProject(project);
              onClose();
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
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-vibrant-coral dark:text-vibrant-coral hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
          >
            Delete Project
          </button>
        )}
      </div>
    </>
  );

  return createPortal(menuContent, document.body);
}
