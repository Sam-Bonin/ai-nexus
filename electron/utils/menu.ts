import { app, Menu, globalShortcut, BrowserWindow } from 'electron';

/**
 * Create and set the application menu
 * Includes minimal app menu and essential Edit menu for copy/paste functionality
 */
export function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        {
          label: `Quit ${app.name}`,
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Register global keyboard shortcuts
 * Cmd+Option+I to toggle DevTools
 */
export function registerGlobalShortcuts(): void {
  // Register DevTools shortcut: Cmd+Option+I
  const registered = globalShortcut.register('CommandOrControl+Alt+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });

  if (!registered) {
    console.error('Failed to register global shortcut: CommandOrControl+Alt+I');
  }
}

/**
 * Unregister all global shortcuts
 * Should be called when app is quitting
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
