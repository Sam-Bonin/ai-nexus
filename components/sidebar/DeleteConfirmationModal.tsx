'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
}: DeleteConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirm = () => {
    onConfirm();
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
          <h2 className="text-lg font-semibold text-pure-black dark:text-pure-white mb-3">
            {title}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-pure-black/5 dark:hover:bg-pure-white/5 text-gray-700 dark:text-gray-300 rounded-claude-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-vibrant-coral hover:bg-vibrant-coral/80 text-pure-white rounded-claude-sm font-medium shadow-claude-sm transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}