'use client';

import { useTheme } from '@/hooks/useTheme';
import { BrightnessMode, ColorPalette } from '@/types/chat';
import { COLOR_PALETTES, PALETTE_METADATA } from '@/lib/colorPalettes';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { themeSettings, setBrightness, setPalette } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-pure-black/50 dark:bg-pure-black/70 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[210] p-4 pointer-events-none">
        <div className="bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 max-w-md w-full p-6 animate-in zoom-in-95 duration-200 pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-pure-black dark:text-pure-white">
              Theme Settings
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

          {/* Brightness Mode Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Brightness Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as BrightnessMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBrightness(mode)}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-claude-md border-2 transition-all ${
                    themeSettings.brightness === mode
                      ? 'border-theme-primary bg-theme-primary/10'
                      : 'border-pure-black/10 dark:border-pure-white/10 hover:border-theme-primary/50'
                  }`}
                >
                  {mode === 'light' && (
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {mode === 'dark' && (
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                  {mode === 'system' && (
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-xs font-medium capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Color Palette
            </label>
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(COLOR_PALETTES) as ColorPalette[]).map((palette) => {
                const isSelected = themeSettings.palette === palette;
                const metadata = PALETTE_METADATA[palette];
                const colors = COLOR_PALETTES[palette];

                return (
                  <button
                    key={palette}
                    onClick={() => setPalette(palette)}
                    className={`aspect-square rounded-claude-md transition-all flex items-center justify-center text-2xl ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-theme-primary scale-110'
                        : 'hover:scale-105 ring-1 ring-pure-black/10 dark:ring-pure-white/10'
                    }`}
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryText,
                    }}
                    title={metadata.name}
                    aria-label={`${metadata.name} palette`}
                  >
                    {isSelected ? '✓' : metadata.icon}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-gray dark:text-neutral-gray mt-2 text-center">
              {PALETTE_METADATA[themeSettings.palette].name}
            </p>
          </div>

          {/* Preview Section */}
          <div className="mb-6 p-4 bg-pure-black/5 dark:bg-pure-white/5 rounded-claude-md">
            <p className="text-xs text-neutral-gray dark:text-neutral-gray mb-3 font-medium">
              Preview
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-sm transition-colors font-medium shadow-claude-sm">
                Primary Button
              </button>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-theme-primary/10 text-theme-primary rounded-claude-sm font-medium text-sm">
                  Active
                </button>
                <button className="flex-1 px-3 py-2 bg-pure-black/5 dark:bg-pure-white/5 hover:bg-pure-black/10 dark:hover:bg-pure-white/10 text-gray-700 dark:text-gray-300 rounded-claude-sm font-medium text-sm transition-colors">
                  Secondary
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-pure-black/5 dark:bg-pure-white/5 hover:bg-pure-black/10 dark:hover:bg-pure-white/10 text-gray-700 dark:text-gray-300 rounded-claude-sm transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
