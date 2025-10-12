'use client';

import { useTheme } from '@/hooks/useTheme';
import { BrightnessMode, ColorPalette } from '@/types/chat';
import { COLOR_PALETTES, PALETTE_METADATA } from '@/lib/colorPalettes';
import { ThemePreview } from './ThemePreview';

export function PersonalizationSettings() {
  const { themeSettings, setBrightness, setPalette } = useTheme();

  return (
    <div>
      {/* Brightness Mode Section */}
      <div className="mb-8">
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
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Color Palette
        </label>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(COLOR_PALETTES) as ColorPalette[]).map((palette) => {
            const isSelected = themeSettings.palette === palette;
            const metadata = PALETTE_METADATA[palette];
            const colors = COLOR_PALETTES[palette];

            return (
              <button
                key={palette}
                onClick={() => setPalette(palette)}
                className={`w-8 h-8 rounded-full transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-pure-black dark:ring-pure-white ring-offset-white dark:ring-offset-dark-gray scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: `rgb(${colors.primary})` }}
                title={metadata.name}
                aria-label={`${metadata.name} palette`}
              />
            );
          })}
        </div>
      </div>

      {/* Live Preview Section */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Live Preview
        </label>
        <ThemePreview
          brightness={themeSettings.brightness}
          palette={themeSettings.palette}
        />
      </div>
    </div>
  );
}
