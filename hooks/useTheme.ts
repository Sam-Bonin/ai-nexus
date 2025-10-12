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
    resolvedBrightness,
    setThemeSettings,
    setBrightness,
    setPalette,
    // Legacy support for components still using 'theme'
    theme: themeSettings.brightness,
    setTheme: setBrightness,
    resolvedTheme: resolvedBrightness,
  };
}
