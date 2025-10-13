# Electron Directory

This directory contains the Electron wrapper code that transforms AI Nexus into a native macOS desktop application.

## What's Here

**Main Process Files:**
- `main.ts` - Main Electron process, window management, and app lifecycle
- `preload.ts` - Preload script (minimal, for future extensions)
- `tsconfig.json` - TypeScript configuration for Electron (targets Node.js, not browser)

**Utilities (`utils/`):**
- `nextServer.ts` - Next.js server lifecycle management (spawn, poll, kill)
- `menu.ts` - macOS menu bar (minimal: app name + Quit only)
- `appIcon.ts` - Icon path resolution (dev vs production)

## Development Workflow

**Compile TypeScript:**
```bash
npx tsc -p electron/tsconfig.json
```

This compiles all `.ts` files to `.js` in the same directory. The compiled `.js` files are ignored by git but included in the build.

**Run Electron in Dev Mode:**
```bash
# Terminal 1: Start Next.js dev server
yarn dev

# Terminal 2: Compile and run Electron
yarn electron
```

The Electron window will connect to your running dev server on port 3000.

## Key Implementation Details

### Server Management (`nextServer.ts`)

**Production Mode:**
- Spawns Next.js standalone server as child process
- Sets environment variables: `PORT=3000`, `ENV_FILE_PATH`, `NODE_ENV=production`
- **Critical:** Uses `http://127.0.0.1:3000` (IPv4) not `localhost` to avoid IPv6 connection issues
- Polls server every 500ms with 60s timeout
- Kills orphaned processes on startup to prevent port conflicts

**Development Mode:**
- Assumes `yarn dev` is already running
- Just polls `http://localhost:3000` with 10s timeout
- No server spawning needed

### Window Management (`main.ts`)

- **Loading Screen:** Inline HTML with yellow→coral gradient, shown while server starts
- **Window Style:** `titleBarStyle: 'hiddenInset'` for native macOS chrome
- **DevTools:** Hidden, accessible via Cmd+Option+I
- **Quit Handling:** 100ms buffer in `before-quit` to ensure localStorage flushes

### Logging

All operations are logged to:
```
~/Library/Application Support/AI Nexus/debug.log
```

The log captures:
- System environment and paths
- Port availability checks
- Path verification and directory contents
- Server spawn details and PID
- Server stdout/stderr in real-time
- Poll attempts with timing
- Errors and warnings

**Check logs when debugging:**
```bash
cat ~/Library/Application\ Support/AI\ Nexus/debug.log
```

## Common Tasks

**Add new utility module:**
1. Create `utils/myModule.ts`
2. Export functions from the module
3. Import and use in `main.ts`
4. Compile: `npx tsc -p electron/tsconfig.json`

**Modify server startup logic:**
Edit `utils/nextServer.ts`, particularly the `startNextServer()` function.

**Change window configuration:**
Edit `main.ts`, look for `new BrowserWindow()` configuration.

**Update app menu:**
Edit `utils/menu.ts`, modify the menu template array.

## Build Process

When running `yarn build:electron`:
1. Next.js builds in standalone mode
2. Static assets copied to standalone bundle
3. **This directory compiles:** `npx tsc -p electron/tsconfig.json`
4. electron-builder packages everything into `.app`

The compiled `.js` files are included in the final app bundle.

## Important Notes

- **Port 3000 is fixed** - not configurable, shows error if occupied
- **IPv4 is enforced** in production to avoid macOS IPv6 resolution issues
- **TypeScript target is Node.js** (ES2020, CommonJS) not browser
- **No React/JSX** - this is pure Node.js Electron code
- **Minimal dependencies** - uses built-in Node.js and Electron APIs

## Architecture

```
┌─────────────────────────────────────┐
│   Electron Main Process (main.ts)  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Next.js Server (spawned)   │  │
│   │  - Port 3000 (fixed)        │  │
│   │  - Standalone mode          │  │
│   └─────────────────────────────┘  │
│              ↓ HTTP                 │
│   ┌─────────────────────────────┐  │
│   │  BrowserWindow              │  │
│   │  - Loads localhost:3000     │  │
│   │  - localStorage persists    │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Troubleshooting

**"Cannot find module" errors:**
- Run `npx tsc -p electron/tsconfig.json` to compile TypeScript

**"Port 3000 in use" errors:**
- Check for orphaned processes: `lsof -ti:3000`
- Kill them: `kill -9 $(lsof -ti:3000)`
- Or let the app handle it (auto-cleanup on startup)

**Server not starting:**
- Check debug log for detailed error info
- Verify standalone build exists: `ls .next/standalone/server.js`
- Try manual start: `cd .next/standalone && node server.js`

**App fails after moving to /Applications:**
- Known issue with path resolution
- Run from `dist/mac/` directory instead

## More Information

- **Full documentation:** `../docs/features/electron/`
- **Implementation plan:** `../docs/features/electron/implementation-plan.md`
- **Completion summary:** `../docs/features/electron/job-done.md`
- **Context & decisions:** `../docs/features/electron/context.md`
