/**
 * TypeScript definitions for Electron APIs exposed to renderer
 *
 * These types match the APIs exposed via contextBridge in electron/preload.ts
 * and provide type safety when using window.electron in React components.
 */

/**
 * Information about an available update
 */
export interface UpdateInfo {
  /** New version number (e.g., "1.1.0") */
  version: string;

  /** URL to GitHub releases page for download */
  downloadUrl: string;

  /** Release notes in markdown format */
  releaseNotes: string;

  /** ISO date string when release was published */
  publishedAt: string;
}

/**
 * Electron API exposed to renderer process
 *
 * Available via window.electron in Electron environment only.
 * Returns undefined in web browser.
 */
export interface ElectronAPI {
  /**
   * Check for application updates
   *
   * Queries GitHub Releases API for newer versions.
   * Returns update info if available, null otherwise.
   *
   * @returns Promise resolving to UpdateInfo or null
   */
  checkForUpdates: () => Promise<UpdateInfo | null>;

  /**
   * Open URL in external browser
   *
   * Opens the specified URL in the user's default browser.
   * Used for opening GitHub releases page.
   *
   * @param url - URL to open
   */
  openUrl: (url: string) => void;
}

/**
 * Extend Window interface to include Electron API
 *
 * This allows TypeScript to recognize window.electron
 * without errors.
 */
declare global {
  interface Window {
    /**
     * Electron API (only available in Electron environment)
     *
     * Use platform detection to check if available:
     * ```ts
     * import { useIsElectron } from '@/hooks/usePlatform';
     *
     * const isElectron = useIsElectron();
     * if (isElectron && window.electron) {
     *   await window.electron.checkForUpdates();
     * }
     * ```
     */
    electron?: ElectronAPI;
  }
}

export {};
