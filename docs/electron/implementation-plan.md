# Electron Conversion Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for converting AI Nexus into an Electron desktop application for macOS.

---

## Phase 1: Project Setup

### 1.1 Install Dependencies
- [✅] Add `electron` (^28.0.0) to dependencies
- [✅] Add `electron-builder` (^24.9.1) to devDependencies
- [✅] Run `yarn install`

### 1.2 Update Configuration Files

**package.json:**
- [✅] Add Electron scripts: `electron`, `electron:dev`, `build:next`, `build:electron`, `package`
- [✅] Set `main` field to `"electron/main.js"` (compiled output)
- [✅] Ensure dependencies are correct

**next.config.js:**
- [✅] Add `output: 'standalone'` to nextConfig
- [✅] This enables Next.js standalone build mode (critical for production)

**tsconfig.json:**
- [✅] Add `"electron"` to exclude array
- [✅] Prevents main TypeScript compiler from processing Electron code

**.gitignore:**
- [✅] Add `dist/` (Electron build output)
- [✅] Add `electron/**/*.js` (compiled Electron TypeScript)
- [✅] Add `electron/**/*.js.map` (source maps)

---

## Phase 2: Create Electron Directory Structure

### 2.1 Create Directory and Base Files
- [✅] Create `electron/` directory at project root
- [✅] Create `electron/utils/` subdirectory

### 2.2 Electron TypeScript Configuration
- [✅] Create `electron/tsconfig.json`
- [✅] Configure to target Node.js (not browser)
- [✅] Set `outDir` to same directory (electron/)
- [✅] Include only Electron files

---

## Phase 3: Implement Core Electron Files [✅]

### 3.1 Main Process (electron/main.ts)
**Key Responsibilities:**
- Create BrowserWindow with proper configuration
- Implement loading screen (inline HTML with data URL)
- Handle window lifecycle (close → quit)
- Set up app menu (app name + Quit only)
- Configure hidden DevTools (Cmd+Option+I)
- Manage Next.js server spawning (production) or connection (dev)
- Handle graceful shutdown with localStorage safety

**Critical Notes:**
- Use `titleBarStyle: 'hiddenInset'` for native macOS window chrome
- Implement 100ms quit buffer in `before-quit` handler for localStorage safety
- Loading screen uses yellow→coral gradient matching logo
- Port 3000 must be fixed (show error if occupied)

### 3.2 Next.js Server Management (electron/utils/nextServer.ts)
**Key Responsibilities:**
- Spawn Next.js server in production mode
- Set PORT=3000 environment variable
- Set ENV_FILE_PATH to userData directory (for API key)
- Poll localhost:3000 until ready (500ms interval, 60s timeout)
- Handle server errors and display native dialogs
- Kill server process on app quit

**Critical Notes:**
- Use `spawn` with correct path to `.next/standalone/server.js`
- Ready detection: ANY HTTP response (not just 200)
- Must kill child process on quit to avoid orphaned processes
- Development mode: just return URL, don't spawn (assumes `yarn dev` running)

### 3.3 macOS Menu (electron/utils/menu.ts)
**Responsibilities:**
- Build minimal menu: app name submenu with Quit option only
- Use `Menu.setApplicationMenu()` to apply

**Critical Note:**
- NO File, Edit, View menus - only app name + Quit

### 3.4 App Icon Helper (electron/utils/appIcon.ts)
**Responsibility:**
- Resolve path to icon.icns in development vs production
- Use `app.isPackaged` to determine mode

### 3.5 Preload Script (electron/preload.ts)
**Note:** Minimal/optional for this implementation
- May add contextBridge APIs later if needed
- For now, just empty boilerplate

---

## Phase 4: Fix API Key Persistence

### 4.1 Modify ApiKeyManager (lib/apiKeyManager.ts)
- [✅] Change line 15 in constructor
- [✅] Replace: `this.envFilePath = path.join(process.cwd(), '.env.local');`
- [✅] With: `this.envFilePath = process.env.ENV_FILE_PATH || path.join(process.cwd(), '.env.local');`

**Critical Note:**
- This ONE line change makes API key storage work in both dev and production
- Electron main process sets ENV_FILE_PATH when spawning Next.js
- Settings UI requires NO changes

---

## Phase 5: Create App Icon

### 5.1 Icon Generation Script
- [✅] Create `scripts/build-icon.sh`
- [✅] Script uses `sips` to generate all resolutions (16x16 to 1024x1024)
- [✅] Script uses `iconutil` to create .icns file
- [✅] Make script executable: `chmod +x scripts/build-icon.sh`

### 5.2 Generate Icon
- [✅] Run `./scripts/build-icon.sh`
- [✅] Verify `resources/icon.icns` is created
- [✅] Commit icon.icns to repo (one-time step)

**Critical Note:**
- Source: `public/logo-light.png` (yellow→coral gradient logo)
- Output: `resources/icon.icns` (macOS multi-resolution icon)
- This is a manual one-time step before first build

---

## Phase 6: Configure electron-builder

### 6.1 Create electron-builder.json
- [✅] Set `appId: "com.ainexus.app"`
- [✅] Set `productName: "AI Nexus"`
- [✅] Configure `directories.output: "dist"`
- [✅] Set `mac.target: "dir"` (outputs raw .app, not DMG)
- [✅] Set `mac.icon: "resources/icon.icns"`
- [✅] Configure `files` array to include:
  - electron/**/*
  - .next/standalone/**/*
  - .next/static/**/*
  - public/**/*
  - package.json

**Critical Note:**
- `target: "dir"` outputs `dist/mac/AI Nexus.app` - no DMG or installer
- Must include standalone bundle and static files

---

## Phase 7: Development Testing

### 7.1 Test Development Workflow
- [✅] Terminal 1: Run `yarn dev`
- [✅] Wait for Next.js to start on port 3000
- [✅] Terminal 2: Run `yarn electron`
- [✅] Verify: Window opens and loads app
- [✅] Test: Hot reload (change a component, verify updates)
- [✅] Test: Cmd+Option+I opens DevTools
- [✅] Test: Settings → save API key → verify writes to `.env.local` in project root
- [✅] Test: All app features work (chat, file upload, projects, themes)

### 7.2 Test Window Management
- [✅] Test: Cmd+Q quits app cleanly
- [✅] Test: Red X button closes window and quits app
- [✅] Test: Menu → Quit works
- [✅] Verify: No orphaned processes after quit

### 7.3 Test Error Scenarios (Development)
- [✅] Stop `yarn dev`
- [✅] Run `yarn electron`
- [✅] Verify: Terminal shows error message (dev server not running)
      Next.js dev server not detected. Please run "yarn dev" in another terminal.
Failed to start server: Error: Server did not respond within 5000ms
    at waitForServer (/Users/sambonin/Documents/Projects/ai-nexus-monoliths/ai-nexus/electron/utils/nextServer.js:100:11)
    at async startNextServer (/Users/sambonin/Documents/Projects/ai-nexus-monoliths/ai-nexus/electron/utils/nextServer.js:23:13)
    at async createWindow (/Users/sambonin/Documents/Projects/ai-nexus-monoliths/ai-nexus/electron/main.js:100:27)
    at async /Users/sambonin/Documents/Projects/ai-nexus-monoliths/ai-nexus/electron/main.js:139:5
✨  Done in 8.14s.
- [✅] Test: Occupy port 3000 (run another server)
- [✅] Run `yarn electron`
- [✅] Verify: Terminal shows port conflict error
'Port 3000 is occupied'

---

## Phase 8: Production Build & Testing

### 8.1 Build Production App
- [✅] Run `yarn build:electron`
- [✅] Wait for build to complete (may take 2-5 minutes)
- [✅] Verify: `dist/mac/AI Nexus.app` exists

### 8.2 Test Production Launch
- [✅] Double-click `AI Nexus.app`
- [✅] Verify: Loading screen appears (black bg, gradient square, spinner)
- [✅] Verify: Loading screen transitions to app (2-4 seconds)
- [✅] Verify: App loads and functions normally

### 8.3 Test Production Features
- [✅] Test: All chat features (send messages, streaming, thinking mode)
- [✅] Test: File uploads (images and PDFs)
- [✅] Test: Projects (create, move conversations, delete)
- [✅] Test: Theme switching (brightness and palette)
- [✅] Test: Settings → save API key
- [✅] Verify: API key saved to `~/Library/Application Support/claude-ai-clone/.env.local`
- [✅] Test: Quit and reopen → API key persists
- [✅] Test: Quit and reopen → conversations persist
- [✅] Test: Cmd+Option+I opens DevTools

### 8.4 Test Production Error Scenarios
- [✅] Occupy port 3000 (run `python -m http.server 3000`)
- [✅] Launch `AI Nexus.app`
- [✅] Verify: Native macOS error dialog appears
- [✅] Verify: App quits after clicking OK
- [✅] Kill port 3000 occupier
- [✅] Re-launch app → should work


### 8.5 Test Data Persistence
- [✅] Create new conversation, send messages
- [✅] Quit app (Cmd+Q)
- [✅] Reopen app
- [✅] Verify: Conversation and messages persist
- [✅] Test: Close window with red X
- [✅] Reopen app
- [✅] Verify: No data loss

---

## Phase 9: Final Installation

### 9.1 Install to Applications Folder
- [✅] Drag `dist/mac/AI Nexus.app` to `/Applications/`
- [✅] Launch from Applications folder
- [✅] Verify: App appears in Dock
- [✅] Verify: Cmd+Tab shows app icon and name
- [✅] Test: All features work from Applications folder

### 9.2 Verify Icon Display
- [✅] Check Dock icon (should show gradient logo)
- [✅] Check Cmd+Tab icon
- [✅] Check Applications folder icon
- [✅] Check Finder icon

---

## Important Notes for Implementation

### Critical: localStorage Safety
The `before-quit` handler MUST include a 100ms buffer:
```typescript
app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    setTimeout(() => app.quit(), 100); // Critical buffer
  }
});
```

### Critical: Server Spawn Path
When spawning Next.js server, use:
```typescript
const serverPath = path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
```

### Critical: ENV_FILE_PATH
Set BEFORE spawning Next.js:
```typescript
process.env.ENV_FILE_PATH = path.join(app.getPath('userData'), '.env.local');
```

### Critical: Loading Screen Transition
Only load app URL AFTER successful poll:
```typescript
await waitForServer('http://localhost:3000', 60000);
mainWindow.loadURL('http://localhost:3000'); // After, not before
```

### Critical: Port Error Handling
Always show native dialog in production, terminal message in dev:
```typescript
if (app.isPackaged) {
  dialog.showErrorBox('Port Conflict', '...');
  app.quit();
} else {
  console.error('Dev server not running...');
  app.quit();
}
```

---

## Success Criteria

✅ Development mode: Two-terminal workflow works with hot reload
✅ Production mode: Double-click .app launches without terminal
✅ Loading screen: Shows while server starts, smooth transition
✅ Port handling: Fixed 3000, shows error if occupied
✅ API key: Settings UI works, persists in userData (production)
✅ Data safety: No data loss on quit (conversations, API key)
✅ Window behavior: Close button quits app
✅ Menu: Only app name + Quit (nothing else)
✅ DevTools: Cmd+Option+I works (hidden)
✅ Icon: Gradient logo displays correctly
✅ Performance: 2-4 second startup, 500-700MB size

---

## Rollback Plan

If implementation fails or breaks existing functionality:
1. Delete `electron/` directory
2. Remove Electron dependencies from package.json
3. Revert `next.config.js` (remove standalone output)
4. Revert `lib/apiKeyManager.ts` (remove ENV_FILE_PATH line)
5. Run `yarn install` to clean up

App will function normally as web-only Next.js application.

---

## Post-Implementation Tasks

- [ ] Update README.md with Electron development instructions
- [ ] Document build process for future reference
- [ ] Test on clean macOS installation (if possible)
- [ ] Create backup of working .app build
- [ ] Update .gitignore to exclude built .app files if needed

---

## Files Created (Summary)

**New Files:**
- electron/main.ts
- electron/preload.ts
- electron/tsconfig.json
- electron/utils/nextServer.ts
- electron/utils/menu.ts
- electron/utils/appIcon.ts
- scripts/build-icon.sh
- electron-builder.json
- resources/icon.icns (generated)

**Modified Files:**
- package.json
- next.config.js
- lib/apiKeyManager.ts (1 line)
- tsconfig.json
- .gitignore

**Total:** 9 new files, 5 modified files, 0 changes to React components/UI
