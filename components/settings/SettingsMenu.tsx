'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PersonalizationSettings } from './PersonalizationSettings';
import { AccountSettings } from './AccountSettings';
import { APISettings } from './APISettings';
import { PrivacySettings } from './PrivacySettings';
import { AboutSettings } from './AboutSettings';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsScreen = 'personalization' | 'account' | 'api' | 'privacy' | 'about';

interface SettingsNavItem {
  id: SettingsScreen;
  label: string;
  icon: React.ReactNode;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const [activeScreen, setActiveScreen] = useState<SettingsScreen>('personalization');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const navItems: SettingsNavItem[] = [
    {
      id: 'personalization',
      label: 'Personalization',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'api',
      label: 'API',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-pure-black/50 dark:bg-pure-black/70 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[210] p-4 pointer-events-none">
        <div className="bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 w-full max-w-4xl h-[600px] flex overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">

          {/* Left Navigation */}
          <div className="w-64 border-r border-pure-black/10 dark:border-pure-white/10 p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-pure-black dark:text-pure-white">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-claude-sm transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-claude-sm transition-all ${
                    activeScreen === item.id
                      ? 'bg-theme-primary/10 text-theme-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeScreen === 'personalization' && (
              <div>
                <h3 className="text-xl font-semibold text-pure-black dark:text-pure-white mb-6">
                  Personalization
                </h3>
                <PersonalizationSettings />
              </div>
            )}

            {activeScreen === 'account' && (
              <div>
                <h3 className="text-xl font-semibold text-pure-black dark:text-pure-white mb-6">
                  Account
                </h3>
                <AccountSettings />
              </div>
            )}

            {activeScreen === 'api' && (
              <div>
                <h3 className="text-xl font-semibold text-pure-black dark:text-pure-white mb-6">
                  API
                </h3>
                <APISettings />
              </div>
            )}

            {activeScreen === 'privacy' && (
              <div>
                <h3 className="text-xl font-semibold text-pure-black dark:text-pure-white mb-6">
                  Privacy & Security
                </h3>
                <PrivacySettings />
              </div>
            )}

            {activeScreen === 'about' && (
              <div>
                <h3 className="text-xl font-semibold text-pure-black dark:text-pure-white mb-6">
                  About
                </h3>
                <AboutSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
