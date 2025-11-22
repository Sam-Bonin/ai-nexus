# Native macOS Features - Specification

## Overview
This document specifies enhancements to transform AI Nexus into a fully native-feeling macOS desktop application. All features follow the **shared codebase philosophy**: Electron layer handles only OS integration; all business logic remains platform-agnostic in the shared Next.js codebase.

**Branch:** `feature/electron-native-enhancements`
**Priority:** High - These are table-stakes features for desktop apps
**Complexity:** Medium - Mostly Electron APIs, minimal React changes

---

## Architecture Principles

### 1. Shared Codebase First
- **All features must work in both web and Electron** (where applicable)
- Use `lib/platform.ts` utilities for platform detection
- React components use `usePlatform()` hook for conditional behavior
- NO separate components for Electron vs web - use conditional rendering

### 2. Electron Layer Responsibility
The Electron layer (`electron/` directory) handles ONLY:
- OS window management (size, position, state)
- Native system integrations (menus, notifications, dock)
- IPC bridges for React to access native APIs
- File system dialogs

The Electron layer NEVER handles:
- Chat logic
- Message state
- Conversation management
- UI rendering (beyond window chrome)

### 3. Communication Pattern
```
React Component → IPC (via preload.ts) → Main Process → Native API
                ← IPC Response       ←
```

---

## Feature 1: Window State Persistence ⭐️ PRIORITY

### Current State
- Window always opens at 1400x900
- Default position (centered by OS)
- No memory of previous size/position

### Proposed Enhancement
**Persist window state across sessions:**
- Window dimensions (width, height)
- Window position (x, y)
- Maximized state (boolean)
- Full screen state (boolean)

### Technical Implementation

#### File: `electron/utils/windowState.ts` (NEW)
```typescript
interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export class WindowStateManager {
  private configPath: string;
  private defaultState: WindowState = {
    width: 1400,
    height: 900,
    isMaximized: false,
    isFullScreen: false
  };

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'window-state.json');
  }

  load(): WindowState {
    // Read from configPath, merge with defaults
  }

  save(window: BrowserWindow): void {
    // Save current bounds + state to JSON file
  }

  apply(window: BrowserWindow): void {
    // Apply saved state to window
  }
}
```

#### Modified: `electron/main.ts`
- Import `WindowStateManager`
- Load state before creating window
- Apply bounds to `BrowserWindow` constructor
- Save state on `resize`, `move`, `maximize`, `unmaximize`, `enter-full-screen`, `leave-full-screen`
- Debounce saves (300ms) to avoid excessive disk writes

#### Storage Location
`~/Library/Application Support/ai-nexus/window-state.json`

### User Impact
- Window remembers size and position between sessions
- Natural desktop app behavior
- No more resizing every time

### Testing Strategy
1. Resize window, quit, relaunch → size persists
2. Move window, quit, relaunch → position persists
3. Maximize window, quit, relaunch → opens maximized
4. Enter full screen, quit, relaunch → opens full screen
5. Delete window-state.json → falls back to defaults

---

## Feature 2: Comprehensive Keyboard Shortcuts ⭐️ PRIORITY

### Current State
- `Cmd+Q` - Quit (works)
- `Cmd+Option+I` - DevTools (works)

### Proposed Shortcuts

#### Application Level
- `Cmd+Q` - Quit (existing, keep as-is)
- `Cmd+,` - Open Settings (macOS standard)
- `Cmd+W` - Close Window (currently quits; should hide on macOS)
- `Cmd+H` - Hide Window (macOS standard)
- `Cmd+M` - Minimize Window (macOS standard)

#### Conversation Actions
- `Cmd+N` - New Conversation
- `Cmd+Shift+N` - New Project
- `Cmd+F` - Search Conversations (focus search input)
- `Cmd+[` - Previous Conversation
- `Cmd+]` - Next Conversation
- `Cmd+1-9` - Jump to conversation 1-9 in sidebar
- `Cmd+Backspace` - Delete Current Conversation (with confirmation)

#### View Actions
- `Cmd+B` - Toggle Sidebar
- `Cmd+Shift+F` - Toggle Full Screen
- `Cmd+=` - Zoom In (increase UI scale)
- `Cmd+-` - Zoom Out (decrease UI scale)
- `Cmd+0` - Reset Zoom

#### Export Actions
- `Cmd+E` - Export Current Conversation (opens export modal)
- `Cmd+Shift+E` - Quick Export to Markdown

### Technical Implementation

#### Modified: `electron/utils/menu.ts`
Expand application menu to include ALL shortcuts (even if they trigger React actions via IPC):

```typescript
const template = [
  {
    label: app.name,
    submenu: [
      { label: 'About AI Nexus', role: 'about' },
      { type: 'separator' },
      { label: 'Settings...', accelerator: 'Cmd+,', click: () => sendIPC('open-settings') },
      { type: 'separator' },
      { label: 'Hide AI Nexus', role: 'hide' },
      { label: 'Hide Others', role: 'hideOthers' },
      { label: 'Show All', role: 'unhide' },
      { type: 'separator' },
      { label: 'Quit AI Nexus', accelerator: 'Cmd+Q', role: 'quit' }
    ]
  },
  {
    label: 'File',
    submenu: [
      { label: 'New Conversation', accelerator: 'Cmd+N', click: () => sendIPC('new-conversation') },
      { label: 'New Project', accelerator: 'Cmd+Shift+N', click: () => sendIPC('new-project') },
      { type: 'separator' },
      { label: 'Export Conversation...', accelerator: 'Cmd+E', click: () => sendIPC('export-conversation') },
      { label: 'Export to Markdown', accelerator: 'Cmd+Shift+E', click: () => sendIPC('quick-export') },
      { type: 'separator' },
      { label: 'Close Window', accelerator: 'Cmd+W', role: 'close' }
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
      { role: 'selectAll' },
      { type: 'separator' },
      { label: 'Find Conversations...', accelerator: 'Cmd+F', click: () => sendIPC('focus-search') }
    ]
  },
  {
    label: 'View',
    submenu: [
      { label: 'Toggle Sidebar', accelerator: 'Cmd+B', click: () => sendIPC('toggle-sidebar') },
      { type: 'separator' },
      { label: 'Zoom In', accelerator: 'Cmd+=', click: () => sendIPC('zoom-in') },
      { label: 'Zoom Out', accelerator: 'Cmd+-', click: () => sendIPC('zoom-out') },
      { label: 'Actual Size', accelerator: 'Cmd+0', click: () => sendIPC('zoom-reset') },
      { type: 'separator' },
      { label: 'Toggle Full Screen', accelerator: 'Cmd+Shift+F', role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Conversation',
    submenu: [
      { label: 'Previous Conversation', accelerator: 'Cmd+[', click: () => sendIPC('prev-conversation') },
      { label: 'Next Conversation', accelerator: 'Cmd+]', click: () => sendIPC('next-conversation') },
      { type: 'separator' },
      ...Array.from({ length: 9 }, (_, i) => ({
        label: `Jump to Conversation ${i + 1}`,
        accelerator: `Cmd+${i + 1}`,
        click: () => sendIPC('jump-conversation', i)
      })),
      { type: 'separator' },
      { label: 'Delete Conversation', accelerator: 'Cmd+Backspace', click: () => sendIPC('delete-conversation') }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      { label: 'AI Nexus Help', click: () => shell.openExternal('https://github.com/Sam-Bonin/ai-nexus') },
      { label: 'Report Issue', click: () => shell.openExternal('https://github.com/Sam-Bonin/ai-nexus/issues') },
      { type: 'separator' },
      { label: 'Check for Updates', click: () => sendIPC('check-updates') }
    ]
  }
];
```

#### Modified: `electron/preload.ts`
Add IPC listeners for shortcuts:

```typescript
contextBridge.exposeInMainWorld('electron', {
  // Existing APIs...

  // Shortcut handlers
  onNewConversation: (callback) => ipcRenderer.on('new-conversation', callback),
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onToggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
  onFocusSearch: (callback) => ipcRenderer.on('focus-search', callback),
  onPrevConversation: (callback) => ipcRenderer.on('prev-conversation', callback),
  onNextConversation: (callback) => ipcRenderer.on('next-conversation', callback),
  onJumpConversation: (callback) => ipcRenderer.on('jump-conversation', callback),
  onDeleteConversation: (callback) => ipcRenderer.on('delete-conversation', callback),
  onExportConversation: (callback) => ipcRenderer.on('export-conversation', callback),
  onQuickExport: (callback) => ipcRenderer.on('quick-export', callback),
  onZoomIn: (callback) => ipcRenderer.on('zoom-in', callback),
  onZoomOut: (callback) => ipcRenderer.on('zoom-out', callback),
  onZoomReset: (callback) => ipcRenderer.on('zoom-reset', callback),
  onCheckUpdates: (callback) => ipcRenderer.on('check-updates', callback),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
```

#### New: `hooks/useElectronShortcuts.ts`
React hook that registers IPC listeners and triggers React actions:

```typescript
export function useElectronShortcuts() {
  const { isElectron } = usePlatform();
  const router = useRouter();
  // ... other hooks for state management

  useEffect(() => {
    if (!isElectron || !window.electron) return;

    // Register handlers
    window.electron.onNewConversation(() => {
      // Call existing React action
      createNewConversation();
    });

    window.electron.onToggleSidebar(() => {
      // Toggle sidebar state
      setSidebarOpen(prev => !prev);
    });

    // ... other handlers

    return () => {
      // Cleanup all listeners
      window.electron.removeAllListeners('new-conversation');
      // ...
    };
  }, [isElectron]);
}
```

#### Modified: `app/page.tsx`
Call `useElectronShortcuts()` hook in main page component.

### User Impact
- Full keyboard-driven workflow
- Matches user expectations from macOS apps
- Power users can avoid mouse entirely

### Testing Strategy
See `testing.md` for comprehensive keyboard shortcut test matrix.

---

## Feature 3: Proper Menu Bar ⭐️ PRIORITY

### Current State
- App menu (Quit only)
- Edit menu (copy/paste)

### Enhancement
See Feature 2 above - fully specified menu structure with 7 top-level menus:
1. AI Nexus (app menu)
2. File (new, export, close)
3. Edit (text editing + search)
4. View (sidebar, zoom, full screen)
5. Conversation (navigation, deletion)
6. Window (minimize, zoom, bring to front)
7. Help (docs, issues, updates)

**Key Design Decision:** Menu items are the SOURCE of truth for shortcuts. React components respond to IPC events triggered by menu clicks, ensuring consistency.

---

## Feature 4: Native System Notifications

### Current State
No notifications whatsoever.

### Proposed Enhancement

#### Notification Types

**1. Response Complete (Background Only)**
- **Trigger:** Streaming response completes while window is in background/minimized
- **Title:** "AI Nexus"
- **Body:** "Claude has finished responding"
- **Action:** Click → bring window to front and focus conversation
- **Sound:** Default system sound

**2. Error Notifications**
- **Trigger:** API errors, rate limits, network failures
- **Title:** "AI Nexus Error"
- **Body:** Error message (e.g., "Rate limit exceeded")
- **Action:** Click → bring window to front and open Settings (if API key issue)

**3. Update Available**
- **Trigger:** New version detected via GitHub API
- **Title:** "AI Nexus Update Available"
- **Body:** "Version X.X.X is available for download"
- **Action:** Click → open download page in browser

#### Dock Badge
- **Badge Count:** Number of ongoing streaming responses
- **Use Case:** User can glance at dock to see if responses are processing
- **Clear When:** All responses complete

### Technical Implementation

#### File: `electron/utils/notifications.ts` (NEW)
```typescript
import { Notification, app } from 'electron';

export class NotificationManager {
  private enabled: boolean = true;

  showResponseComplete(conversationTitle: string) {
    if (!this.shouldShow()) return;

    const notification = new Notification({
      title: 'AI Nexus',
      body: `Claude has finished responding`,
      subtitle: conversationTitle,
      sound: 'default'
    });

    notification.on('click', () => {
      // Bring window to front
      BrowserWindow.getAllWindows()[0]?.show();
    });

    notification.show();
  }

  showError(message: string, action?: string) {
    // Similar pattern
  }

  showUpdateAvailable(version: string, downloadUrl: string) {
    // Similar pattern
  }

  private shouldShow(): boolean {
    // Only show if window is not focused
    const window = BrowserWindow.getAllWindows()[0];
    return !window?.isFocused();
  }
}
```

#### Dock Badge Management
```typescript
// In main.ts
let activeStreamCount = 0;

ipcMain.on('stream-start', () => {
  activeStreamCount++;
  app.setBadgeCount(activeStreamCount);
});

ipcMain.on('stream-end', () => {
  activeStreamCount = Math.max(0, activeStreamCount - 1);
  app.setBadgeCount(activeStreamCount);
});
```

#### Modified: `components/chat/ChatShell.tsx`
```typescript
// When streaming starts
useEffect(() => {
  if (isElectron && isStreaming) {
    window.electron?.send('stream-start');
  }
}, [isStreaming]);

// When streaming ends
useEffect(() => {
  if (isElectron && !isStreaming && previouslyWasStreaming) {
    window.electron?.send('stream-end');

    // If window not focused, show notification
    if (!document.hasFocus()) {
      window.electron?.showNotification({
        type: 'response-complete',
        conversationTitle: activeConversation?.title || 'Conversation'
      });
    }
  }
}, [isStreaming]);
```

### User Impact
- Stay informed when app is backgrounded
- Visual feedback in dock for ongoing work
- Don't miss important errors

### Privacy Considerations
- NO message content in notifications (only "Claude has finished")
- User should be able to disable notifications in Settings
- Respect macOS "Do Not Disturb" mode (automatic)

---

## Feature 5: Window Management Features

### Current State
- Single window
- Basic minimize/maximize work (OS default)
- No full screen support
- Cmd+W quits app

### Proposed Enhancements

#### 5.1 Full Screen Support
**Implementation:** Already works via Electron - just add menu item (see Feature 2).

**Behavior:**
- `Cmd+Shift+F` or View → Toggle Full Screen
- macOS green button (top-left window control) enters full screen
- ESC exits full screen
- Full screen state persists via window state manager

#### 5.2 Close Window Behavior (Cmd+W)
**Current:** Quits app
**Proposed:** Hide window (macOS standard behavior)

**Implementation:**
```typescript
// In main.ts
mainWindow.on('close', (event) => {
  if (process.platform === 'darwin' && !isQuitting) {
    event.preventDefault();
    mainWindow.hide();
  }
});

// Click dock icon to show again
app.on('activate', () => {
  mainWindow.show();
});
```

**Trade-off:** This is **optional** - many users expect Cmd+W to quit single-window apps. Consider making this a Settings toggle.

#### 5.3 Zoom Button Behavior
**Current:** OS default (toggles between window sizes)
**Proposed:** Keep default (no change needed)

#### 5.4 macOS Native Tabs
**Proposed:** **NOT RECOMMENDED for v1**

**Reason:** Native tabs are complex and don't map well to conversation model. Better UX is improving sidebar navigation.

**Future:** Consider for v2 if users request it.

### User Impact
- Full screen mode for distraction-free usage
- Expected macOS window behaviors

---

## Feature 6: Dock Integration

### Current State
- Basic dock icon (shows app logo)
- No right-click menu

### Proposed Enhancements

#### 6.1 Dock Menu (Right-Click)
```typescript
// In main.ts
const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New Conversation',
    click: () => sendToRenderer('new-conversation')
  },
  {
    label: 'Open Recent',
    submenu: [
      // Top 5 recent conversations dynamically populated
      { label: 'Conversation Title 1', click: () => openConversation(id1) },
      { label: 'Conversation Title 2', click: () => openConversation(id2) },
      // ...
      { type: 'separator' },
      { label: 'Clear Recent', click: () => clearRecent() }
    ]
  },
  {
    type: 'separator'
  },
  {
    label: 'Check for Updates',
    click: () => checkForUpdates()
  }
]);

app.dock.setMenu(dockMenu);
```

**Dynamic Updates:**
- Recent conversations list updates when new conversation starts
- Requires IPC from renderer to main process with conversation titles

#### 6.2 Progress Indicator
**Use Case:** Show progress during long operations (e.g., exporting many conversations)

```typescript
// During export operation
app.dock.setBadge('Exporting...');

// Or use progress bar
mainWindow.setProgressBar(0.75); // 75% complete

// When done
app.dock.setBadge('');
mainWindow.setProgressBar(-1); // Hide progress
```

**Note:** Badge count for streaming responses covered in Feature 4.

#### 6.3 Bounce Animation
**Use Case:** Get attention when notification fires (optional)

```typescript
// When showing notification
app.dock.bounce('informational'); // Single bounce
// or
app.dock.bounce('critical'); // Bounce until user clicks
```

### User Impact
- Quick actions from dock
- Easy access to recent work
- Visual feedback for operations

---

## Feature 7: Quit Confirmation ⭐️ PRIORITY

### Current State
- Cmd+Q immediately quits
- No warning if conversation in progress

### Proposed Enhancement

**Show confirmation dialog IF:**
- Streaming response is in progress, OR
- User has typed message (unsent), OR
- Conversation has unsaved changes (future: when we add drafts)

**Implementation:**
```typescript
// In main.ts
app.on('before-quit', (event) => {
  if (!isQuitting && shouldConfirmQuit) {
    event.preventDefault();

    const choice = dialog.showMessageBoxSync(mainWindow!, {
      type: 'question',
      buttons: ['Cancel', 'Quit'],
      defaultId: 0, // Cancel is default
      cancelId: 0,
      title: 'Quit AI Nexus?',
      message: 'A conversation is in progress.',
      detail: 'Are you sure you want to quit? Your message will be lost.'
    });

    if (choice === 1) { // Quit
      isQuitting = true;
      app.quit();
    }
  }
});
```

**State Detection:**
Renderer process must signal to main process when quit confirmation is needed:

```typescript
// In ChatShell.tsx
useEffect(() => {
  if (isElectron) {
    window.electron?.setQuitConfirmation(isStreaming || hasUnsentMessage);
  }
}, [isStreaming, hasUnsentMessage]);
```

### User Impact
- No accidental data loss
- Peace of mind when quitting

---

## Feature 8: Native File Dialogs

### Current State
- File upload uses HTML `<input type="file">` (web-style)
- Export downloads file (web-style)

### Proposed Enhancement

#### 8.1 File Upload (Attachments)
Replace HTML file input with native file picker:

```typescript
// In preload.ts
contextBridge.exposeInMainWorld('electron', {
  // ...
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options)
});

// In main.ts
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select files to attach',
    buttonLabel: 'Attach',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
      { name: 'PDFs', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    ...options
  });

  return result; // { canceled: boolean, filePaths: string[] }
});
```

**React Integration:**
```typescript
// In ChatComposer.tsx
const handleAttachClick = async () => {
  if (isElectron && window.electron?.showOpenDialog) {
    const result = await window.electron.showOpenDialog({});

    if (!result.canceled) {
      // Read files and convert to base64
      const files = await Promise.all(
        result.filePaths.map(path => window.electron.readFile(path))
      );
      setAttachedFiles(files);
    }
  } else {
    // Fall back to HTML file input (web)
    fileInputRef.current?.click();
  }
};
```

#### 8.2 Export Save Dialog
Replace download with native save dialog:

```typescript
// In main.ts
ipcMain.handle('show-save-dialog', async (event, options, content) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export Conversation',
    buttonLabel: 'Export',
    defaultPath: options.defaultPath || 'conversation.md',
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Text', extensions: ['txt'] }
    ],
    ...options
  });

  if (!result.canceled && result.filePath) {
    // Write file to chosen location
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }

  return { success: false };
});
```

**React Integration:**
```typescript
// In export modal
const handleExport = async (format: 'markdown' | 'json') => {
  const content = generateExport(conversation, format);

  if (isElectron && window.electron?.showSaveDialog) {
    const result = await window.electron.showSaveDialog({
      defaultPath: `${conversation.title}.${format === 'markdown' ? 'md' : 'json'}`
    }, content);

    if (result.success) {
      showToast('Exported successfully!');
    }
  } else {
    // Fall back to web download
    downloadFile(content, `${conversation.title}.${format === 'markdown' ? 'md' : 'json'}`);
  }
};
```

### User Impact
- Native macOS file pickers (familiar UI)
- Choose exact save location (not forced to Downloads)
- Better integration with Finder

---

## Feature 9: Multiple Window Support

### Current State
Single window only.

### Proposed Enhancement
**NOT RECOMMENDED for v1**

**Reasons:**
1. Complexity: Managing state across windows is non-trivial
2. localStorage conflicts: Multiple windows → race conditions
3. Unclear UX: Which window has which conversation?
4. Limited value: Sidebar navigation is sufficient

**Alternative:** Improve sidebar with keyboard navigation and search (already proposed in Feature 2).

**Future:** Revisit for v2 if users strongly request it. Consider separate "Conversation Inspector" window (like dev tools).

---

## Implementation Plan

### Phase 1: Core Enhancements (v1.1)
1. **Window State Persistence** (Feature 1) - 4 hours
2. **Keyboard Shortcuts** (Feature 2) - 8 hours
3. **Proper Menu Bar** (Feature 2) - Included above
4. **Quit Confirmation** (Feature 7) - 2 hours

**Total Estimate:** ~14 hours / ~2 days

### Phase 2: Nice-to-Haves (v1.2)
5. **Native File Dialogs** (Feature 8) - 4 hours
6. **System Notifications** (Feature 4) - 4 hours
7. **Dock Integration** (Feature 6) - 3 hours
8. **Window Management** (Feature 5) - 2 hours

**Total Estimate:** ~13 hours / ~2 days

### Phase 3: Future Consideration
- Multiple windows (Feature 9) - Deferred
- macOS native tabs - Deferred

---

## Success Criteria

### Must Have (v1.1)
- ✅ Window remembers size/position between launches
- ✅ All keyboard shortcuts work and match macOS conventions
- ✅ Menu bar is complete with File/Edit/View/Window/Help
- ✅ Quit confirmation prevents accidental data loss
- ✅ Zero changes to shared Next.js components (except adding hooks)

### Nice to Have (v1.2)
- ✅ Native file pickers for attach and export
- ✅ Notifications for background responses
- ✅ Dock menu with recent conversations
- ✅ Full screen mode support

### Quality Gates
- ✅ All features work in BOTH dev and production builds
- ✅ Web version unaffected (features gracefully degrade)
- ✅ No regressions in existing functionality
- ✅ TypeScript compiles with no errors
- ✅ ESLint passes

---

## Testing Strategy
See separate `testing.md` file for comprehensive test plan.

---

## Open Questions

1. **Cmd+W Behavior:** Should it hide or quit? (Recommendation: Make it a Settings toggle)
2. **Notification Frequency:** Should we rate-limit notifications? (Recommendation: Max 1 per 5 seconds)
3. **Dock Badge:** Show count of active streams or total unread? (Recommendation: Active streams only)
4. **Zoom Levels:** What increments? (Recommendation: 80%, 90%, 100%, 110%, 125%, 150%, 175%, 200%)
5. **Recent Conversations:** How many in dock menu? (Recommendation: Top 5, sorted by updatedAt)

---

## Related Documents
- `implementation-plan.md` - Original Electron conversion
- `testing.md` - Comprehensive test plan for new features
- `CLAUDE.md` - Shared codebase philosophy
