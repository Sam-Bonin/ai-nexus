'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { ThemeSettings, BrightnessMode, ColorPalette } from '@/types/chat';
import { COLOR_PALETTES } from '@/lib/colorPalettes';

export function useTheme() {
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(() => {
    if (typeof window !== 'undefined') {
      return storage.getThemeSettings();
    }
    return { brightness: 'system', palette: 'yellow' };
  });

  const [resolvedBrightness, setResolvedBrightness] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    // Apply brightness class
    root.classList.remove('light', 'dark');
    let effectiveBrightness: 'light' | 'dark' = 'light';

    if (themeSettings.brightness === 'system') {
      effectiveBrightness = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effectiveBrightness = themeSettings.brightness;
    }

    root.classList.add(effectiveBrightness);
    setResolvedBrightness(effectiveBrightness);

    // Apply color palette as data attribute
    root.setAttribute('data-palette', themeSettings.palette);

    // Inject CSS variables for current palette
    const colors = COLOR_PALETTES[themeSettings.palette];

    // Helper to convert camelCase to kebab-case
    const camelToKebab = (str: string) =>
      str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${camelToKebab(key)}`, value);
    });

    // Inject gradient-specific CSS variables with luminosity-adaptive opacity
    const rgbToRgba = (rgb: string, alpha: number): string => {
      return `rgba(${rgb.replace(/ /g, ', ')}, ${alpha})`;
    };

    const baseOpacityRadial = effectiveBrightness === 'dark' ? 0.04 : 0.08;
    const baseOpacityLinear = effectiveBrightness === 'dark' ? 0.03 : 0.06;

    const adaptiveOpacityRadial = baseOpacityRadial * colors.luminosityFactor;
    const adaptiveOpacityLinear = baseOpacityLinear * colors.luminosityFactor;

    root.style.setProperty('--gradient-primary-radial', rgbToRgba(colors.primary, adaptiveOpacityRadial));
    root.style.setProperty('--gradient-secondary-radial', rgbToRgba(colors.secondary, adaptiveOpacityRadial));
    root.style.setProperty('--gradient-primary-linear', rgbToRgba(colors.primary, adaptiveOpacityLinear));
    root.style.setProperty('--gradient-secondary-linear', rgbToRgba(colors.secondary, adaptiveOpacityLinear));

    // Set base background color based on brightness
    const baseBackgroundColor = effectiveBrightness === 'dark' ? '#1a1a1a' : '#ffffff';
    root.style.setProperty('--gradient-base-bg', baseBackgroundColor);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeSettings.brightness === 'system') {
        const newBrightness = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newBrightness);
        setResolvedBrightness(newBrightness);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeSettings]);

  const setThemeSettings = (settings: ThemeSettings) => {
    setThemeSettingsState(settings);
    storage.setThemeSettings(settings);
  };

  const setBrightness = (brightness: BrightnessMode) => {
    setThemeSettings({ ...themeSettings, brightness });
  };

  const setPalette = (palette: ColorPalette) => {
    setThemeSettings({ ...themeSettings, palette });
  };

  return {
    themeSettings,
    setBrightness,
    setPalette,
  };
}
