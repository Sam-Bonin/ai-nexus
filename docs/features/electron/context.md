# Electron Conversion Context

## Project Goal

Convert the AI Nexus Next.js web application into a native macOS desktop application using Electron. The goal is to create a standalone .app file that feels like a professional Mac application (similar to Slack, VS Code, or Spotify) rather than a web app running in a browser.

## Why Electron?

The user wants:
- A dedicated app window with its own Dock icon (can Cmd+Tab to it)
- Double-click to launch (no terminal or `yarn dev` commands)
- A "real" Mac application experience isolated from browser tabs
- The app to live in the Applications folder
- Proper lifecycle management (Cmd+Q shuts down cleanly)

This is for **personal use only** - no code signing, notarization, or distribution requirements.

---

## Architecture Decision: Next.js Standalone + Electron

### Why This Approach?

After analyzing the codebase, we chose **Next.js standalone mode** with Electron wrapping it.

**Key Rationale:**
- The app requires Next.js server (uses API routes, cannot be statically exported)
- Minimal changes to existing codebase (zero changes to React components)
- localStorage works natively in Electron's BrowserWindow
- File handling (base64) works identically
- Hot reload in dev mode (run Next.js separately, point Electron to it)
- Clean separation between Electron wrapper and web app logic
- Easy to maintain web version later (same codebase)

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  Next.js Server (standalone)      │  │
│  │  - Spawned as child process       │  │
│  │  - Port: 3000 (fixed)             │  │
│  │  - Serves API routes + frontend   │  │
│  └───────────────────────────────────┘  │
│              ↓ HTTP                      │
│  ┌───────────────────────────────────┐  │
│  │  BrowserWindow                     │  │
│  │  - Loads http://localhost:3000    │  │
│  │  - localStorage persists in       │  │
│  │    userData directory             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Alternative Approaches Considered:**
- Static export + Electron IPC: Rejected because app needs API routes
- Webpack bundling: Rejected as too complex, breaks Next.js features
- Different port handling: Rejected in favor of fixed port 3000 for simplicity

---

## User Requirements & Preferences

### Development Workflow
**Choice:** Two-terminal approach
- Terminal 1: `yarn dev` (Next.js dev server)
- Terminal 2: `yarn electron` (Electron window)

**Why:** User prefers having control over each process for easier debugging.

### Production Workflow
**Critical Requirement:** Everything must start automatically when double-clicking the .app icon.
- No terminal
- No manual steps
- Just click and the app opens
- Must feel like a native Mac app

### Native macOS Features

**Implement:**
- ✅ Menu bar with ONLY app name + Quit option (no File, Edit, View menus)
- ✅ Window close (red X or Cmd+W) → app fully quits
- ✅ Ensure localStorage/data is properly saved before quitting (no data loss)

**Skip:**
- ❌ System tray icon
- ❌ Global keyboard shortcuts
- ❌ Notifications
- ❌ Multiple windows
- ❌ Dock badge

### App Icon & Launch
- Use existing logo from `public/logo-light.png` (yellow→coral gradient)
- Window appears immediately on launch (standard behavior)
- App icon will be converted to .icns format (manual one-time process)

### Port Handling
- **Always use port 3000** (fixed, not dynamic)
- If port 3000 is taken, show error message
- Do NOT auto-find alternative ports

### API Key Storage
- Keep `.env.local` approach (minimal code changes)
- Production: Store in userData directory instead of app bundle
- Settings UI must continue to work in Electron (no changes needed)

### Performance & Size
- ~500-700MB app size: Acceptable
- 2-4 second startup time: Acceptable

### DevTools
- Production: Hidden keyboard shortcut (Cmd+Option+I)
- Not shown in any menu

---

## Critical Implementation Details

### 1. Loading Screen
**Implementation:** Inline HTML loaded as data URL (no separate file)

**Design:**
- Black background (#000000)
- Centered yellow→coral gradient square (matches logo)
- Animated spinner inside square
- "AI Nexus" text below in white

**Mechanism:**
- Window loads data URL with HTML first
- Polls localhost:3000 every 500ms
- When server responds (any HTTP status), load `http://localhost:3000`

### 2. Server Readiness Polling
**Specifications:**
- **Interval:** 500ms (every half second)
- **Timeout:** 60 seconds
- **Ready detection:** ANY HTTP response (even 404 means server is running)
- **Timeout error:** Native macOS dialog → app quits

### 3. Port 3000 Conflict Handling
**Production:**
- Native macOS `dialog.showErrorBox()` with message
- App quits immediately after user clicks OK

**Development:**
- Terminal error message only (no visual alert)
- User must fix and re-run

### 4. API Key Persistence Fix
**Problem:** In production, `process.cwd()/.env.local` is inside read-only app bundle

**Solution:** One-line change to `ApiKeyManager`:
```typescript
this.envFilePath = process.env.ENV_FILE_PATH || path.join(process.cwd(), '.env.local');
```

**Electron sets:** `process.env.ENV_FILE_PATH = app.getPath('userData') + '/.env.local'`

**Result:**
- Dev: Uses project root `.env.local`
- Production: Uses `~/Library/Application Support/AI Nexus/.env.local`
- Settings UI works unchanged in both modes

### 5. localStorage Data Safety
**Approach:** Chromium's localStorage flushes synchronously, but add 100ms buffer for safety

**Implementation:**
- `before-quit` handler prevents immediate quit
- Execute JavaScript in renderer to sync localStorage
- 100ms timeout buffer before actual quit
- No data loss even on force-quit

### 6. App Icon Generation
**Process:** Manual one-time conversion (committed to repo)

**Steps:**
1. Use `sips` to generate all required resolutions (16x16 to 1024x1024)
2. Use `iconutil` to create .icns file
3. Commit `resources/icon.icns` to repo

**Why Manual:** Better quality control, only done once

### 7. Build Target
**Configuration:** `"target": "dir"` (not dmg/zip)

**Output:** `dist/mac/AI Nexus.app` (raw .app bundle)

**Usage:** Drag to Applications folder manually

---

## What Changes (and What Doesn't)

### Zero Changes Needed:
- ✅ All React components
- ✅ All API routes
- ✅ Storage logic (localStorage)
- ✅ File handling (base64)
- ✅ Theme system
- ✅ Settings UI

### New Files (all in `electron/` directory):
- `electron/main.ts` - Main process
- `electron/preload.ts` - Preload script (minimal)
- `electron/tsconfig.json` - Electron TypeScript config
- `electron/utils/nextServer.ts` - Server lifecycle management
- `electron/utils/menu.ts` - macOS menu
- `electron/utils/appIcon.ts` - Icon path resolution

### Modified Files:
- `package.json` - Add Electron deps + scripts
- `next.config.js` - Enable standalone output mode
- `lib/apiKeyManager.ts` - Add ENV_FILE_PATH support (1 line)
- `.gitignore` - Ignore Electron build artifacts
- `tsconfig.json` - Exclude electron/ directory

### New Dependencies:
- `electron` (^28.0.0)
- `electron-builder` (^24.9.1)

---

## Data Storage Locations

### Development Mode:
```
/Users/[user]/Projects/ai-nexus/
├── .env.local                    # API key (project root)
└── [browser localStorage]        # Conversations, projects, themes
```

### Production Mode:
```
~/Library/Application Support/AI Nexus/
├── .env.local                    # API key (userData)
└── Partitions/[...]/Local Storage/  # Conversations, projects, themes
```

---

## Development Workflow (Day-to-Day)

**Starting Development:**
1. Open two terminals
2. Terminal 1: `yarn dev` (starts Next.js on port 3000)
3. Terminal 2: `yarn electron` (opens Electron window)
4. Make code changes → hot reload works automatically
5. Access DevTools: Cmd+Option+I

**If Port 3000 is Occupied:**
- Terminal 2 shows error
- Free port 3000 or stop conflicting process
- Re-run both commands

---

## Production Build Process

**Building the App:**
```bash
yarn build:electron
```

**What Happens:**
1. `next build` creates standalone bundle
2. TypeScript compiles Electron code
3. `electron-builder` creates .app with "dir" target

**Output:**
```
dist/
└── mac/
    └── AI Nexus.app    # Ready to use
```

**Installation:**
- Drag `AI Nexus.app` to Applications folder
- Double-click to launch (no terminal needed)

**Startup Sequence:**
1. Electron starts
2. Shows loading screen
3. Spawns Next.js server (node .next/standalone/server.js)
4. Polls localhost:3000 until ready
5. Loads app (replaces loading screen)

---

## Future Considerations

This implementation is designed to:
- Keep Electron code isolated in `electron/` directory
- Not break the existing Next.js web architecture
- Allow easy web deployment later (same codebase)
- Support future migration from localStorage to SQLite (no tight coupling)

The architecture is **intentionally not over-engineered** - it's a clean wrapper around the existing app.

---

## Key Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| Fixed port 3000 | Can't run multiple instances | Simpler implementation, not needed for personal use |
| Two-terminal dev | More manual setup | Better debugging control, cleaner separation |
| Manual icon conversion | One-time manual step | Better quality, only done once |
| .env.local approach | Less secure than Keychain | Minimal code changes, acceptable for personal use |
| Next.js standalone | Larger app size | Full Next.js features preserved, acceptable at 500-700MB |
| 60s startup timeout | Long wait on failure | Generous buffer for slow machines |

---

## Expected Performance

- **App Size:** ~500-700MB (Electron runtime + Next.js + node_modules)
- **Startup Time:** 2-4 seconds (includes Next.js server startup)
- **Memory Usage:** ~200-300MB (typical for Electron apps)
- **Port:** 3000 (required, shows error if occupied)

All metrics acceptable for personal use desktop application.
