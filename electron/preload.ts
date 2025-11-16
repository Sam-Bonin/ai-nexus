/**
 * Electron Preload Script
 *
 * This script runs before the renderer process loads.
 * It has access to both Node.js APIs and the DOM.
 *
 * Exposes safe APIs to the renderer process via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose Electron APIs to renderer process
 *
 * These APIs are available via window.electron in React components.
 * Only safe, controlled APIs are exposed to maintain security.
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Check for application updates
   *
   * Queries GitHub Releases API for newer versions.
   * Returns update info if available, null otherwise.
   *
   * @returns Promise resolving to UpdateInfo or null
   */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  /**
   * Open URL in external browser
   *
   * Opens the specified URL in the user's default browser.
   * Used for opening GitHub releases page.
   *
   * @param url - URL to open
   */
  openUrl: (url: string) => ipcRenderer.send('open-url', url)
});

console.log('Preload script loaded - Electron APIs exposed');
