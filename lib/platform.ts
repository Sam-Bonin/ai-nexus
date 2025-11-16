/**
 * Platform Detection Utilities
 *
 * Centralized system for detecting if app is running in Electron or web browser.
 * This is the ONLY acceptable platform-specific detection in the codebase.
 *
 * Usage:
 * - Components: Use `usePlatform()` hook
 * - Utilities: Use `isElectron()` function
 * - Type guards: Use `hasElectronAPI()` for TypeScript safety
 */

/**
 * Check if app is running in Electron environment
 *
 * This is a synchronous check that can be used anywhere.
 * Works in both browser and Node.js contexts.
 *
 * @returns true if running in Electron, false otherwise
 */
export function isElectron(): boolean {
  // Check if window exists (we're in browser context)
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Electron-specific window properties
  // Method 1: Check for electron API (from preload.ts)
  if ((window as any).electron) {
    return true;
  }

  // Method 2: Check for process.type (Electron-specific)
  if ((window as any).process?.type === 'renderer') {
    return true;
  }

  // Method 3: Check for user agent (fallback)
  if (navigator.userAgent.toLowerCase().includes('electron')) {
    return true;
  }

  return false;
}

/**
 * Check if app is running in web browser
 *
 * Inverse of isElectron() for clearer intent
 *
 * @returns true if running in web browser, false otherwise
 */
export function isWeb(): boolean {
  return !isElectron();
}

/**
 * Type guard to check if Electron API is available
 *
 * Use this when you need to access window.electron
 * to get TypeScript safety.
 *
 * @returns true if window.electron exists with proper typing
 */
export function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electron;
}

/**
 * Get the current platform as a string
 *
 * Useful for logging, analytics, or conditional rendering
 *
 * @returns 'electron' or 'web'
 */
export function getPlatform(): 'electron' | 'web' {
  return isElectron() ? 'electron' : 'web';
}

/**
 * Platform-specific configuration
 *
 * Use this to get different values based on platform
 * without scattering conditionals everywhere.
 *
 * @example
 * const port = platformConfig({ electron: 54321, web: 3000 });
 * const updateCheckInterval = platformConfig({
 *   electron: 60000,  // Check every minute
 *   web: null         // Don't check on web
 * });
 */
export function platformConfig<T>(config: { electron: T; web: T }): T {
  return isElectron() ? config.electron : config.web;
}
