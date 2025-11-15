# Electron Directory

This directory contains the Electron wrapper code that transforms AI Nexus into a native macOS desktop application.

## What's Here

**Main Process Files:**
- `main.ts` - Main Electron process, window management, and app lifecycle
- `preload.ts` - Preload script (minimal, for future extensions)
- `tsconfig.json` - TypeScript configuration for Electron (targets Node.js, not browser)

**Utilities (`utils/`):**
- `nextServer.ts` - Next.js server lifecycle management (spawn, health check, kill)
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
- Spawns Next.js standalone server as child process on **port 54321**
- Sets environment variables: `PORT=54321`, `ENV_FILE_PATH`, `NODE_ENV=production`
- **Critical:** Uses `http://127.0.0.1:54321` (IPv4) not `localhost` to avoid IPv6 connection issues
- Verifies server identity via health check (`/api/health` endpoint must return `{app: 'ai-nexus'}`)
- Polls server every 500ms with 60s timeout
- Detects and handles port conflicts (shows error if port occupied by non-AI Nexus app)

**Development Mode:**
- Assumes `yarn dev` is already running on **port 3000**
- Connects to `http://localhost:3000` with 10s timeout
- Verifies server via health check endpoint
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
1. Next.js builds in standalone mode (creates `.next/standalone/` with minimal `node_modules`)
2. Static assets and public files copied to standalone bundle
3. **This directory compiles:** `npx tsc -p electron/tsconfig.json`
4. electron-builder packages everything into `.app`:
   - **Electron code** → `app.asar` (compressed, 32KB)
   - **Next.js standalone** → `Resources/standalone/` (includes `node_modules`, ~22MB)

**Packaging Strategy:**
- Uses **ASAR** for Electron code (performance + standard practice)
- Uses **extraResources** for Next.js standalone (outside ASAR for Node.js compatibility)
- Standalone `node_modules` includes minimal runtime dependencies (next, react, @swc)
- Total app size: ~500-700MB (includes Electron runtime)

## Important Notes

- **Dual port configuration:**
  - Development: Port 3000 (matches `yarn dev`)
  - Production: Port 54321 (safe, unlikely to conflict)
- **IPv4 is enforced** in production (`127.0.0.1`) to avoid macOS IPv6 resolution issues
- **Health check verification:** Server must respond with `{app: 'ai-nexus'}` to confirm identity
- **Path resolution:** Uses `process.resourcesPath` (official Electron API) to locate standalone server
- **TypeScript target is Node.js** (ES2020, CommonJS) not browser
- **No React/JSX** - this is pure Node.js Electron code
- **Minimal dependencies** - uses built-in Node.js and Electron APIs

## Architecture

```
┌──────────────────────────────────────────────┐
│   Electron Main Process (main.ts)           │
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │  Next.js Server (standalone)         │  │
│   │  - Dev: Port 3000 (connects)         │  │
│   │  - Prod: Port 54321 (spawns)         │  │
│   │  - Resources/standalone/server.js    │  │
│   │  - Health check: /api/health         │  │
│   └──────────────────────────────────────┘  │
│              ↓ HTTP (127.0.0.1)              │
│   ┌──────────────────────────────────────┐  │
│   │  BrowserWindow                        │  │
│   │  - Dev: http://localhost:3000        │  │
│   │  - Prod: http://127.0.0.1:54321      │  │
│   │  - localStorage in userData          │  │
│   └──────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

Resources/
├── app.asar (Electron code, 32KB)
└── standalone/ (Next.js server + deps, ~22MB)
    ├── server.js
    ├── node_modules/
    ├── .next/
    └── public/
```

## Troubleshooting

**"Cannot find module" errors:**
- Run `npx tsc -p electron/tsconfig.json` to compile TypeScript
- Ensure all dependencies are installed: `yarn install`

**Port conflict errors:**
- **Development (port 3000):** Check for orphaned processes with `lsof -ti:3000`, kill with `kill -9 $(lsof -ti:3000)`
- **Production (port 54321):** App will show error dialog if port occupied by non-AI Nexus app
- Health check verification prevents connecting to wrong servers

**Server not starting:**
- Check debug log for detailed error info: `cat ~/Library/Application\ Support/AI\ Nexus/debug.log`
- Verify standalone build exists: `ls .next/standalone/server.js`
- Verify node_modules in standalone: `ls .next/standalone/node_modules/next`
- Try manual start: `cd .next/standalone && PORT=54321 node server.js`

**App works from dist/ but not /Applications:**
- This issue has been FIXED with proper ASAR + extraResources packaging
- If you still see this, rebuild the app: `yarn build:electron`
- Ensure you're using the latest electron-builder configuration

**Health check fails:**
- Verify `/api/health` endpoint exists and returns `{app: 'ai-nexus', status: 'ok'}`
- Check server is actually AI Nexus (not a different app on the same port)
- Review debug log for connection attempts and responses

## Common Use Cases

### Running the App in Development
```bash
# Terminal 1: Start Next.js dev server (port 3000)
yarn dev

# Terminal 2: Launch Electron (connects to port 3000)
yarn electron
```
**Features:** Hot reload, DevTools (Cmd+Option+I), fast iteration

### Building for Production
```bash
# Build standalone app
yarn build:electron

# Output: dist/mac/AI Nexus.app (~500-700MB)
```

### Installing to Applications Folder
```bash
# Copy to Applications
cp -R "dist/mac/AI Nexus.app" /Applications/

# Launch from Applications
open "/Applications/AI Nexus.app"
```
**Result:** App works identically from Applications or dist folder

### Verifying Health Check
```bash
# Development server (port 3000)
curl http://localhost:3000/api/health

# Production server (port 54321)
curl http://127.0.0.1:54321/api/health

# Expected response:
# {"status":"ok","app":"ai-nexus","version":"1.0.0","timestamp":"..."}
```

### Debugging Production Issues
```bash
# View debug log
cat ~/Library/Application\ Support/AI\ Nexus/debug.log

# Check if port is available
lsof -ti:54321

# Test standalone server manually
cd .next/standalone
PORT=54321 node server.js
```

### Cleaning Up Orphaned Processes
```bash
# Find processes on port 54321 (production)
lsof -ti:54321

# Kill them
kill -9 $(lsof -ti:54321)

# Or for development port 3000
kill -9 $(lsof -ti:3000)
```

## More Information

- **Full documentation:** `../docs/features/electron/`
- **Implementation plan:** `../docs/features/electron/implementation-plan.md`
- **Completion summary:** `../docs/features/electron/job-done.md`
- **Context & decisions:** `../docs/features/electron/context.md`
