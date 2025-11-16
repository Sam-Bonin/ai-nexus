/**
 * Update Modal Component
 *
 * Displays modal when new version is available (Electron only).
 * Automatically checks for updates on mount and shows modal if newer version exists.
 *
 * This is the ONE Electron-only UI component. It returns null on web.
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Sparkles } from 'lucide-react';
import { useIsElectron } from '@/hooks/usePlatform';
import type { UpdateInfo } from '@/types/electron';

export function UpdateBanner() {
  const isElectron = useIsElectron();
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect 1: Check for updates on mount
  useEffect(() => {
    // IMPORTANT: Only run in Electron environment
    // Web app updates via deployment, not DMG downloads
    if (!isElectron) {
      setChecking(false);
      return; // Component returns null on web
    }

    // Check for updates on mount (window.electron is guaranteed to exist here)
    if (window.electron) {
      window.electron
        .checkForUpdates()
        .then((info) => {
          setUpdate(info);
          setChecking(false);
        })
        .catch((error) => {
          console.error('Failed to check for updates:', error);
          setChecking(false);
        });
    }
  }, [isElectron]);

  // Effect 2: Check if user previously dismissed this version
  useEffect(() => {
    if (update) {
      const wasDismissed = localStorage.getItem(`update-dismissed-${update.version}`);
      if (wasDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, [update]);

  // Handler functions (defined before early return)
  const handleDownload = () => {
    if (window.electron && update) {
      window.electron.openUrl(update.downloadUrl);
    }
  };

  const handleClose = () => {
    // Just close the modal without persisting dismissal
    // User will see it again on next launch
    setDismissed(true);
  };

  const handleLater = () => {
    // Persist dismissal to localStorage (per version)
    // User won't see this version's modal again
    if (update) {
      localStorage.setItem(`update-dismissed-${update.version}`, 'true');
    }
    setDismissed(true);
  };

  // Don't show if:
  // - Not in Electron (this component is Electron-only)
  // - Not mounted
  // - Still checking
  // - No update available
  // - User dismissed
  if (!isElectron || !mounted || checking || !update || dismissed) {
    return null;
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-pure-black/50 dark:bg-pure-black/70 backdrop-blur-sm z-[120] animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[130] p-4"
        onClick={(e) => {
          // Only close if clicking the container itself
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-claude-md bg-gradient-to-br from-theme-primary to-theme-secondary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pure-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-pure-black dark:text-pure-white">
                  Update Available
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Version {update.version} is ready to download
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-claude-sm transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Release info */}
          <div className="mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              A new version of AI Nexus is available. Click the button below to download the latest update from GitHub.
            </p>
            {update.releaseNotes && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-claude-md border border-pure-black/5 dark:border-pure-white/5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  What&apos;s New
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {update.releaseNotes.split('\n')[0]}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-md transition-colors font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Update
            </button>
            <button
              onClick={handleLater}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-claude-md transition-colors font-medium"
            >
              Don&apos;t Remind Me
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
