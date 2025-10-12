'use client';

import { useEffect, useState } from 'react';
import { BrightnessMode, ColorPalette } from '@/types/chat';
import { COLOR_PALETTES } from '@/lib/colorPalettes';

interface ThemePreviewProps {
  brightness: BrightnessMode;
  palette: ColorPalette;
}

export function ThemePreview({ brightness, palette }: ThemePreviewProps) {
  const [effectiveBrightness, setEffectiveBrightness] = useState<'light' | 'dark'>('light');

  // Resolve system brightness
  useEffect(() => {
    if (brightness === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveBrightness(isDark ? 'dark' : 'light');

      // Listen for system changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setEffectiveBrightness(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setEffectiveBrightness(brightness);
    }
  }, [brightness]);

  // Get color tokens for current palette
  const colors = COLOR_PALETTES[palette];
  const isDark = effectiveBrightness === 'dark';

  // Replicate gradient calculation from useTheme.ts
  const rgbToRgba = (rgb: string, alpha: number): string => {
    return `rgba(${rgb.replace(/ /g, ', ')}, ${alpha})`;
  };

  const baseOpacityRadial = isDark ? 0.04 : 0.08;
  const baseOpacityLinear = isDark ? 0.03 : 0.06;

  const adaptiveOpacityRadial = baseOpacityRadial * colors.luminosityFactor;
  const adaptiveOpacityLinear = baseOpacityLinear * colors.luminosityFactor;

  const gradientPrimaryRadial = rgbToRgba(colors.primary, adaptiveOpacityRadial);
  const gradientSecondaryRadial = rgbToRgba(colors.secondary, adaptiveOpacityRadial);
  const gradientPrimaryLinear = rgbToRgba(colors.primary, adaptiveOpacityLinear);
  const gradientSecondaryLinear = rgbToRgba(colors.secondary, adaptiveOpacityLinear);

  const baseBackground = isDark ? '#1a1a1a' : '#ffffff';

  const gradientBackground = `
    radial-gradient(circle at 20% 20%, ${gradientPrimaryRadial} 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, ${gradientSecondaryRadial} 0%, transparent 50%),
    linear-gradient(135deg, ${gradientPrimaryLinear} 0%, transparent 40%, ${gradientSecondaryLinear} 100%),
    ${baseBackground}
  `;

  const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
  const textColorMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const subtleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const messageBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <div className="w-full">
      <div
        className="w-full h-[320px] rounded-lg overflow-hidden border shadow-md transition-all duration-300"
        style={{
          borderColor: borderColor,
          background: baseBackground
        }}
      >
        <div className="flex h-full">
          {/* Miniature Sidebar */}
          <div
            className="w-[64px] border-r flex flex-col p-2 gap-2 transition-all duration-300"
            style={{
              background: gradientBackground,
              borderColor: borderColor
            }}
          >
            {/* New Chat Button */}
            <div
              className="w-full h-7 rounded-md flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: subtleBg,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Active Chat Item */}
            <div
              className="w-full h-9 rounded-lg border-2 transition-all duration-300"
              style={{
                borderColor: `rgb(${colors.primary})`,
                backgroundColor: rgbToRgba(colors.primary, 0.1)
              }}
            />

            {/* Inactive Chat Items */}
            <div
              className="w-full h-9 rounded-lg transition-all duration-300"
              style={{ backgroundColor: subtleBg }}
            />
            <div
              className="w-full h-9 rounded-lg transition-all duration-300"
              style={{ backgroundColor: subtleBg }}
            />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings Icon */}
            <div
              className="w-full h-7 rounded-md flex items-center justify-center transition-all duration-300"
              style={{ backgroundColor: subtleBg }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
            </div>
          </div>

          {/* Miniature Chat Area */}
          <div
            className="flex-1 flex flex-col p-5 gap-3 transition-all duration-300"
            style={{ background: gradientBackground }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div
                className="text-xs font-semibold transition-all duration-300"
                style={{ color: textColor }}
              >
                Claude 3.7 Sonnet
              </div>
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: subtleBg }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Assistant message */}
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-3 py-2.5 max-w-[220px] transition-all duration-300"
                style={{
                  backgroundColor: subtleBg,
                  color: textColor
                }}
              >
                <div className="text-[10px] leading-relaxed">
                  Hello! I'm Claude. How can I help you today?
                </div>
              </div>
            </div>

            {/* User message */}
            <div className="flex justify-end">
              <div
                className="rounded-2xl px-3 py-2.5 max-w-[220px] transition-all duration-300"
                style={{
                  backgroundColor: messageBg,
                  color: textColor
                }}
              >
                <div className="text-[10px] leading-relaxed">
                  Show me how this theme looks!
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Input area */}
            <div className="flex gap-2 items-center">
              <div
                className="flex-1 rounded-full px-4 py-2.5 border transition-all duration-300"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: borderColor
                }}
              >
                <div
                  className="text-[10px] transition-all duration-300"
                  style={{ color: textColorMuted }}
                >
                  Type a message...
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `rgb(${colors.primaryBg})`,
                  color: `rgb(${colors.primaryText})`
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
