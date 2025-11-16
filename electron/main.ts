import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { startNextServer, stopNextServer } from './utils/nextServer';
import { createApplicationMenu, registerGlobalShortcuts, unregisterGlobalShortcuts } from './utils/menu';
import { getAppIconPath } from './utils/appIcon';
import { checkForUpdates } from './utils/updateChecker';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

/**
 * Create the loading screen HTML as a data URL
 */
function getLoadingScreenHTML(): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #000000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .logo-container {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #FFD50F 0%, #FD765B 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32px;
            position: relative;
          }
          .spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .app-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 300;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="logo-container">
          <div class="spinner"></div>
        </div>
        <div class="app-name">AI Nexus</div>
      </body>
    </html>
  `)}`;
}

/**
 * Setup IPC handlers for renderer communication
 *
 * Handles requests from the renderer process (React components)
 * via the contextBridge exposed in preload.ts
 */
function setupIpcHandlers(): void {
  /**
   * Handle update check request
   *
   * Checks GitHub Releases API for newer versions.
   * Returns UpdateInfo if available, null otherwise.
   */
  ipcMain.handle('check-for-updates', async () => {
    try {
      return await checkForUpdates();
    } catch (error) {
      console.error('Update check failed:', error);
      return null;
    }
  });

  /**
   * Handle open URL request
   *
   * Opens specified URL in user's default browser.
   * Used for opening GitHub releases page.
   */
  ipcMain.on('open-url', (event, url: string) => {
    shell.openExternal(url);
  });
}

/**
 * Create the main application window
 */
async function createWindow(): Promise<void> {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false
  });

  // Load the loading screen first
  await mainWindow.loadURL(getLoadingScreenHTML());
  mainWindow.show();

  // Start Next.js server and wait for it to be ready
  try {
    const serverUrl = await startNextServer();

    // Server is ready - load the app
    await mainWindow.loadURL(serverUrl);
  } catch (error) {
    console.error('Failed to start server:', error);
    // Error handling is done in startNextServer()
    return;
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // When window is closed, quit the app
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

/**
 * App lifecycle: ready
 */
app.whenReady().then(async () => {
  // Set app name
  app.name = 'AI Nexus';

  // Create application menu
  createApplicationMenu();

  // Register global shortcuts (DevTools: Cmd+Option+I)
  registerGlobalShortcuts();

  // Setup IPC handlers for renderer communication
  setupIpcHandlers();

  // Create main window
  await createWindow();

  // macOS: recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * App lifecycle: all windows closed
 */
app.on('window-all-closed', () => {
  // Always quit when all windows are closed (even on macOS)
  app.quit();
});

/**
 * App lifecycle: before quit
 * Add 100ms buffer to ensure localStorage is flushed
 */
app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;

    // Stop Next.js server
    stopNextServer();

    // Add 100ms buffer for localStorage safety
    setTimeout(() => {
      app.quit();
    }, 100);
  }
});

/**
 * App lifecycle: will quit
 */
app.on('will-quit', () => {
  // Unregister global shortcuts
  unregisterGlobalShortcuts();

  // Stop Next.js server
  stopNextServer();
});
