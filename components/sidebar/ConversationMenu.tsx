'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Conversation } from '@/types/chat';
import { exportConversationAsMarkdown, exportConversationAsJSON, downloadFile } from '@/lib/utils';

interface ConversationMenuProps {
  conversation: Conversation;
  isOpen: boolean;
  position: { top: number; right: number } | null;
  onClose: () => void;
  onRename: (conversation: Conversation) => void;
  onMove?: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
}

export function ConversationMenu({
  conversation,
  isOpen,
  position,
  onClose,
  onRename,
  onMove,
  onDelete,
}: ConversationMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !position || !mounted) return null;

  const handleExport = (format: 'markdown' | 'json') => {
    const content = format === 'markdown'
      ? exportConversationAsMarkdown(conversation)
      : exportConversationAsJSON(conversation);

    const extension = format === 'markdown' ? 'md' : 'json';
    const filename = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    downloadFile(content, filename, format === 'markdown' ? 'text/markdown' : 'application/json');
    onClose();
  };

  // Calculate dropdown height (approximate: 4 items * 40px height + padding)
  const dropdownHeight = onMove ? 200 : 160;
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
        className="fixed inset-0 z-[100]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Dropdown menu with fixed positioning */}
      <div
        className="fixed w-48 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black dark:border-pure-white py-1 z-[110] max-h-[80vh] overflow-y-auto"
        style={{
          top: `${adjustedTop}px`,
          right: `${position.right}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onRename(conversation);
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
        >
          Rename
        </button>
        <button
          onClick={() => handleExport('markdown')}
          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
        >
          Export as Markdown
        </button>
        <button
          onClick={() => handleExport('json')}
          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
        >
          Export as JSON
        </button>
        {onMove && (
          <button
            onClick={() => {
              onMove(conversation);
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
          >
            Move to project...
          </button>
        )}
        <button
          onClick={() => {
            onDelete(conversation.id);
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-electric-yellow dark:text-electric-yellow hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
        >
          Delete
        </button>
      </div>
    </>
  );

  return createPortal(menuContent, document.body);
}