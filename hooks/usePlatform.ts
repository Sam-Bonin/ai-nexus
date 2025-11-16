/**
 * React Hook for Platform Detection
 *
 * Provides reactive platform detection for React components.
 * Automatically updates if platform context changes (though unlikely).
 *
 * @example
 * function MyComponent() {
 *   const { isElectron, isWeb, platform } = usePlatform();
 *
 *   if (!isElectron) {
 *     return null; // Don't render on web
 *   }
 *
 *   return <ElectronOnlyFeature />;
 * }
 */

'use client';

import { useEffect, useState } from 'react';
import { isElectron as checkIsElectron, isWeb as checkIsWeb, getPlatform } from '@/lib/platform';

export interface PlatformInfo {
  /** True if running in Electron */
  isElectron: boolean;

  /** True if running in web browser */
  isWeb: boolean;

  /** Platform type as string */
  platform: 'electron' | 'web';

  /** True if platform detection is complete (always true after mount) */
  isReady: boolean;
}

/**
 * Hook to detect current platform (Electron vs Web)
 *
 * Returns platform information that can be used for conditional rendering
 * or logic. Platform is detected once on mount and cached.
 *
 * @returns Platform information object
 */
export function usePlatform(): PlatformInfo {
  // Initialize with synchronous check to avoid hydration mismatch
  const initialIsElectron = typeof window !== 'undefined' ? checkIsElectron() : false;

  const [isReady, setIsReady] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isElectron: initialIsElectron,
    isWeb: !initialIsElectron,
    platform: initialIsElectron ? 'electron' : 'web',
    isReady: false
  });

  useEffect(() => {
    // Detect platform on mount
    const isElectronEnv = checkIsElectron();
    const isWebEnv = checkIsWeb();
    const platform = getPlatform();

    setPlatformInfo({
      isElectron: isElectronEnv,
      isWeb: isWebEnv,
      platform,
      isReady: true
    });

    setIsReady(true);
  }, []); // Only run once on mount

  return platformInfo;
}

/**
 * Hook variant that only returns boolean
 *
 * Simpler API when you only need to know if you're in Electron
 *
 * @example
 * function UpdateBanner() {
 *   const isElectron = useIsElectron();
 *
 *   if (!isElectron) return null;
 *
 *   return <ElectronUpdateBanner />;
 * }
 */
export function useIsElectron(): boolean {
  const { isElectron } = usePlatform();
  return isElectron;
}

/**
 * Hook variant that only returns web boolean
 *
 * @example
 * function WebOnlyFeature() {
 *   const isWeb = useIsWeb();
 *
 *   if (!isWeb) return null;
 *
 *   return <SomeWebFeature />;
 * }
 */
export function useIsWeb(): boolean {
  const { isWeb } = usePlatform();
  return isWeb;
}
