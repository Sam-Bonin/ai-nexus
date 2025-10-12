'use client';

import { useEffect, useState } from 'react';
import { Conversation } from '@/types/chat';
import { ConversationMenu } from './ConversationMenu';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMove?: (conversation: Conversation) => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onMove,
}: ConversationListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(conversation.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditingTitle(conversation.title);
    }
  }, [conversation.title, isEditing]);

  const handleRenameSubmit = () => {
    if (editingTitle.trim()) {
      onRename(conversation.id, editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleMenuToggle = (button: HTMLButtonElement) => {
    if (menuOpen) {
      setMenuOpen(false);
      setMenuPosition(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setMenuOpen(true);
  };

  return (
    <div
      className={`group flex items-center justify-between px-3 py-2 rounded-claude-sm cursor-pointer transition-colors ${
        isActive
          ? 'bg-theme-primary/10 text-theme-primary'
          : 'hover:bg-pure-black/5 dark:hover:bg-pure-white/5 text-pure-black dark:text-pure-white'
      }`}
      onClick={() => {
        if (!isEditing) {
          onSelect(conversation.id);
        }
      }}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleRenameSubmit();
              }
              if (event.key === 'Escape') {
                setIsEditing(false);
                setEditingTitle(conversation.title);
              }
            }}
            className="w-full bg-transparent border-b border-theme-primary focus:outline-none text-sm font-medium"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium truncate">{conversation.title}</p>
        )}
        {!isEditing && conversation.description && (
          <p className="text-xs text-neutral-gray dark:text-neutral-gray truncate">{conversation.description}</p>
        )}
      </div>

      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
        <button
          onClick={(event) => {
            event.stopPropagation();
            handleMenuToggle(event.currentTarget);
          }}
          className="p-1 rounded-claude-sm hover:bg-pure-black/10 dark:hover:bg-pure-white/10 text-neutral-gray dark:text-neutral-gray"
          aria-label="Conversation options"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      <ConversationMenu
        conversation={conversation}
        isOpen={menuOpen}
        position={menuPosition}
        onClose={() => setMenuOpen(false)}
        onRename={(conv) => {
          setIsEditing(true);
          setMenuOpen(false);
          setEditingTitle(conv.title);
        }}
        onMove={onMove}
        onDelete={onDelete}
      />
    </div>
  );
}
