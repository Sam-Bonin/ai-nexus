# Auto-Update Implementation Plan

## Overview

This document outlines the implementation plan for **Option 1: Semi-Automatic Update** system for AI Nexus. This approach works with unsigned Electron apps and provides a balance between user convenience and implementation simplicity.

### ⚠️ Important: Electron-Only Feature Exception

**This is the ONE acceptable Electron-only feature in AI Nexus.**

**Why it's Electron-only:**
- Web app updates automatically via deployment (`git pull` or redeploy)
- Electron app requires manual DMG download and reinstall
- This feature only makes sense for desktop users

**Philosophy Alignment:**
- ✅ Minimal Electron code (~100 lines in `electron/utils/updateChecker.ts`)
- ✅ Component intelligently doesn't render on web (checks `window.electron`)
- ✅ Follows shared codebase principle (doesn't duplicate web logic)
- ✅ Acceptable exception because web and Electron have fundamentally different update mechanisms

**This is NOT a violation of Rule #4** - we're not creating parallel implementations. The update checker exists solely because Electron has a unique distribution model that web doesn't have.

## What We're Building

A semi-automatic update notification system that:
1. Checks GitHub Releases API on app startup
2. Compares current version with latest release
3. Shows an in-app banner when updates are available
4. Opens browser to GitHub Releases for manual download
5. Works seamlessly with unsigned builds (no Gatekeeper complications)
6. **Only runs in Electron environment** (returns null on web)

## User Experience Flow

```
User opens AI Nexus
       ↓
App checks GitHub API (background)
       ↓
New version found?
       ↓ YES
Shows update banner at top of window
       ↓
User clicks "Download Update"
       ↓
Browser opens to GitHub Releases page
       ↓
User downloads DMG
       ↓
User installs (same as initial install)
```

### Visual Example

```
┌─────────────────────────────────────────────────────────┐
│  🎉 New version available: v1.1.0                  [×]  │
│                                                         │
│  What's new:                                            │
│  • Bug fixes and performance improvements               │
│  • New keyboard shortcuts                               │
│                                                         │
│  [Later]  [Download Update]                             │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 0: Platform Detection System ✅

**Goal:** Create centralized platform detection to avoid scattered conditional logic

**Files to Create:**
- `lib/platform.ts` - Core platform detection utilities
- `hooks/usePlatform.ts` - React hooks for components

**Why This Matters:**
- ✅ **DRY Principle**: One place for platform detection logic
- ✅ **Type Safety**: Proper TypeScript guards
- ✅ **Maintainability**: Change detection logic once, works everywhere
- ✅ **Clean Code**: No scattered `window.electron` checks

**API Overview:**

```typescript
// lib/platform.ts - Utility functions (use anywhere)
import { isElectron, isWeb, platformConfig } from '@/lib/platform';

if (isElectron()) {
  // Electron-specific logic
}

const port = platformConfig({ electron: 54321, web: 3000 });

// hooks/usePlatform.ts - React hooks (use in components)
import { useIsElectron, usePlatform } from '@/hooks/usePlatform';

function MyComponent() {
  const isElectron = useIsElectron();

  if (!isElectron) return null;

  return <ElectronFeature />;
}
```

**Implementation Details:**

The platform detection uses multiple methods for reliability:
1. Check for `window.electron` API (from preload.ts)
2. Check for `window.process.type === 'renderer'` (Electron-specific)
3. Check user agent string (fallback)

This ensures detection works even if preload script fails or is modified.

---

### Phase 1: Backend - Update Checker Utility ✅

**Goal:** Create utility to check GitHub API for new releases

**Files to Create:**
- `electron/utils/updateChecker.ts`

**Tasks:**
1. Create `UpdateInfo` TypeScript interface
2. Implement `checkForUpdates()` function
3. Parse GitHub Releases API response
4. Compare versions (semantic versioning)
5. Return update info or null

**Key Features:**
- Uses GitHub REST API (no auth required for public repos)
- Compares semantic versions (e.g., 1.1.0 > 1.0.0)
- Extracts release notes from GitHub response
- Handles network errors gracefully
- Lightweight (no external dependencies)

**Why This Lives in Electron:**
- Needs access to `app.getVersion()` (Electron API)
- Node.js `https` module (not available in browser)
- Could be moved to API route, but adds unnecessary complexity for a simple feature
- Keeps update logic co-located with other Electron utilities

**Implementation Details:**

```typescript
// electron/utils/updateChecker.ts

import https from 'https';
import { app } from 'electron';

export interface UpdateInfo {
  version: string;           // e.g., "1.1.0"
  downloadUrl: string;       // GitHub releases page URL
  releaseNotes: string;      // Markdown from release body
  publishedAt: string;       // ISO date string
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  const currentVersion = app.getVersion(); // from package.json

  // Fetch latest release from GitHub API
  const release = await fetchLatestRelease();
  const latestVersion = release.tag_name.replace('v', '');

  // Compare versions
  if (isNewer(latestVersion, currentVersion)) {
    return {
      version: latestVersion,
      downloadUrl: release.html_url,
      releaseNotes: release.body,
      publishedAt: release.published_at
    };
  }

  return null; // No update available
}

function isNewer(latest: string, current: string): boolean {
  // Split "1.1.0" into [1, 1, 0]
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  // Compare each part (major, minor, patch)
  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return true;
    if (latestParts[i] < currentParts[i]) return false;
  }

  return false; // Versions are equal
}

function fetchLatestRelease(): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/Sam-Bonin/ai-nexus/releases/latest',
      headers: {
        'User-Agent': 'AI-Nexus',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}
```

**Error Handling:**
- Network failures → silent fail, don't block app startup
- Invalid JSON → log error, return null
- GitHub API rate limit → gracefully handle (60 requests/hour unauthenticated)

---

### Phase 2: IPC Bridge - Expose to Renderer ✅

**Goal:** Allow React components to call update checker from Electron

**Files to Modify:**
- `electron/preload.ts` - Add IPC bridge
- `electron/main.ts` - Add IPC handlers

**Tasks:**
1. Expose `checkForUpdates()` via contextBridge
2. Expose `openUrl()` for opening browser
3. Add IPC handlers in main process
4. Type definitions for window.electron

**Implementation Details:**

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  // Check for updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Open URL in browser
  openUrl: (url: string) => ipcRenderer.send('open-url', url)
});
```

```typescript
// electron/main.ts
import { ipcMain, shell } from 'electron';
import { checkForUpdates } from './utils/updateChecker';

// Handle update check request
ipcMain.handle('check-for-updates', async () => {
  try {
    return await checkForUpdates();
  } catch (error) {
    console.error('Update check failed:', error);
    return null;
  }
});

// Handle open URL request
ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url);
});
```

**Type Definitions:**

```typescript
// types/electron.d.ts (create this file)
interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

interface ElectronAPI {
  checkForUpdates: () => Promise<UpdateInfo | null>;
  openUrl: (url: string) => void;
}

interface Window {
  electron?: ElectronAPI;
}
```

---

### Phase 3: Frontend - Update Banner Component ✅

**Goal:** Create React component to display update notifications

**Files to Create:**
- `components/UpdateBanner.tsx`

**Files to Modify:**
- `app/layout.tsx` - Add UpdateBanner to layout

**Tasks:**
1. Create UpdateBanner component
2. Check for updates on mount
3. Display banner when update available
4. Handle "Download" and "Dismiss" actions
5. Style with existing theme system

**Implementation Details:**

```typescript
// components/UpdateBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useIsElectron } from '@/hooks/usePlatform';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export function UpdateBanner() {
  const isElectron = useIsElectron();
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // IMPORTANT: Only run in Electron environment
    // Web app updates via deployment, not DMG downloads
    if (!isElectron) {
      setChecking(false);
      return; // Component returns null on web
    }

    // Check for updates on mount (window.electron is guaranteed to exist here)
    if (window.electron) {
      window.electron.checkForUpdates()
        .then((info) => {
          setUpdate(info);
          setChecking(false);
        })
        .catch((error) => {
          console.error('Failed to check for updates:', error);
          setChecking(false);
        });
    }
  }, [isElectron]);

  // Don't show if:
  // - Not in Electron (this component is Electron-only)
  // - Still checking
  // - No update available
  // - User dismissed
  if (!isElectron || checking || !update || dismissed) {
    return null;
  }

  const handleDownload = () => {
    if (window.electron) {
      window.electron.openUrl(update.downloadUrl);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Optionally: save to localStorage to persist dismissal
    localStorage.setItem(`update-dismissed-${update.version}`, 'true');
  };

  return (
    <div className="bg-theme-primary text-theme-primary-text px-6 py-4 flex items-center justify-between border-b border-pure-black/10 dark:border-pure-white/10">
      {/* Left side: Update info */}
      <div className="flex items-center gap-4">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="font-medium text-lg">
            New version available: v{update.version}
          </p>
          <p className="text-sm opacity-90 mt-1">
            Click Download to get the latest update
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-pure-white/20 hover:bg-pure-white/30 rounded-claude-md transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Download Update
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-pure-white/10 rounded-claude-sm transition-colors"
          aria-label="Dismiss update notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

**Styling Considerations:**
- Uses existing theme system (`theme-primary`, etc.)
- Matches design language (rounded-claude-md, transitions)
- Responsive layout
- Accessible (ARIA labels, keyboard navigation)

---

### Phase 4: Integration - Add to Layout ✅

**Goal:** Display update banner at top of application

**Files to Modify:**
- `app/layout.tsx`

**Tasks:**
1. Import UpdateBanner component
2. Add to layout (above main content)
3. Ensure it only shows in Electron environment
4. Test in both web and Electron modes

**Implementation Details:**

```typescript
// app/layout.tsx
import { UpdateBanner } from '@/components/UpdateBanner';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Update banner (only shows in Electron when update available) */}
        <UpdateBanner />

        {/* Main app content */}
        {children}
      </body>
    </html>
  );
}
```

**Placement Strategy:**
- Above all content (first thing user sees)
- Full width banner
- Doesn't push content down (fixed height)
- Can be dismissed without affecting layout

---

### Phase 5: Testing ✅

**Goal:** Verify update system works correctly

#### 5.1 Development Testing

**Test Update Check:**
```bash
# Terminal 1: Start dev server
yarn dev

# Terminal 2: Run Electron
yarn electron

# Expected: App checks for updates on launch
# If v1.1.0 exists on GitHub and you're on v1.0.0, banner shows
```

**Test Version Comparison:**
1. Temporarily change version in `package.json` to `0.9.0`
2. Rebuild and launch
3. Should show update banner (v1.0.0 > v0.9.0)

**Test Network Failure:**
1. Disconnect from internet
2. Launch app
3. Should launch normally (silent failure, no banner)

**Test Dismiss:**
1. Click X button
2. Banner should disappear
3. Reload page → banner should stay dismissed (localStorage)

**Test Download Button:**
1. Click "Download Update"
2. Browser should open to GitHub Releases page
3. Should be able to download DMG

#### 5.2 Production Testing

**Build Production App:**
```bash
# Update version to 1.0.0 in package.json
yarn build:electron
```

**Test Production Update Flow:**
1. Launch `dist/mac/AI Nexus.app`
2. Wait 2-3 seconds for update check
3. If update available, banner appears
4. Click "Download Update" → browser opens
5. Download DMG from GitHub
6. Install new version (drag to Applications)

**Test Edge Cases:**
- GitHub API down → app launches normally
- Invalid JSON response → app launches normally
- Same version (1.0.0 === 1.0.0) → no banner
- Newer version already installed (1.1.0 > 1.0.0 release) → no banner

---

## File Changes Summary

### New Files
```
lib/platform.ts                    # Platform detection utilities
hooks/usePlatform.ts               # Platform detection hooks
electron/utils/updateChecker.ts    # Update checker utility
components/UpdateBanner.tsx        # UI component
types/electron.d.ts                # Type definitions
```

### Modified Files
```
electron/preload.ts                # Add IPC bridge
electron/main.ts                   # Add IPC handlers
app/layout.tsx                     # Add UpdateBanner
```

### Total Lines of Code
- `platform.ts`: ~80 lines
- `usePlatform.ts`: ~70 lines
- `updateChecker.ts`: ~100 lines
- `UpdateBanner.tsx`: ~80 lines
- `preload.ts`: +10 lines
- `main.ts`: +15 lines
- `electron.d.ts`: ~15 lines
- `layout.tsx`: +2 lines

**Total: ~372 lines** (includes platform detection system)

---

## Configuration

### GitHub API Limits
- **Unauthenticated**: 60 requests/hour per IP
- **Impact**: Users can launch app 60 times/hour before rate limit
- **Mitigation**: Cache last check timestamp (optional Phase 6)

### Version Format
- Uses semantic versioning: `MAJOR.MINOR.PATCH`
- Example: `1.0.0`, `1.1.0`, `2.0.0`
- GitHub tag format: `v1.0.0` (automatically strips `v`)

### Update Frequency
- **Current**: Check on every app launch

---


## Migration Path: Option 3 (Code Signed Updates)

When ready to implement true auto-updates:

### Prerequisites
1. Apple Developer account ($99/year)
2. Developer ID certificate
3. Notarization setup

### Changes Required
1. Install `electron-updater`
   ```bash
   yarn add electron-updater
   ```

2. Update `electron-builder.json`
   ```json
   {
     "publish": {
       "provider": "github",
       "owner": "Sam-Bonin",
       "repo": "ai-nexus"
     },
     "mac": {
       "hardenedRuntime": true,
       "gatekeeperAssess": false,
       "entitlements": "build/entitlements.mac.plist"
     }
   }
   ```

3. Replace update checker with `autoUpdater`
   ```typescript
   import { autoUpdater } from 'electron-updater';

   autoUpdater.checkForUpdatesAndNotify();
   ```

4. **Remove** `UpdateBanner.tsx` (replaced by native updater UI)

---

## Success Criteria

### Must Have
- ✅ App checks GitHub API on launch
- ✅ Banner appears when update available
- ✅ "Download Update" opens browser to GitHub
- ✅ "Dismiss" hides banner
- ✅ Works in both dev and production
- ✅ Silent failure on network errors
- ✅ No impact on app startup time

### Nice to Have
- ✅ Clean, theme-aware UI
- ✅ Accessible (keyboard, screen readers)
- ✅ Respects user dismissal
- ✅ Shows version number and release date

### Should Not
- ❌ Block app startup
- ❌ Show errors to user
- ❌ Require network connection
- ❌ Break web version

---

## Timeline Estimate

**Total Time: 2-3 hours**

| Phase | Task | Time |
|-------|------|------|
| 1 | Update checker utility | 30 min |
| 2 | IPC bridge | 15 min |
| 3 | Update banner UI | 45 min |
| 4 | Integration | 15 min |
| 5 | Testing | 45 min |
| - | Buffer | 30 min |

---

## Notes

### Why This Approach?
1. **No code signing required** - Works with current setup
2. **Simple implementation** - ~200 lines, no external dependencies
3. **Better than nothing** - Users know updates exist
4. **No ongoing costs** - Uses free GitHub API
5. **Safe** - Can't accidentally break Gatekeeper flow
6. **Respects shared codebase philosophy** - Minimal Electron code, component is smart about environment

### Limitations
1. **Not fully automatic** - User must download DMG manually
2. **Gatekeeper bypass still required** - Same as initial install
3. **No background downloads** - User initiates download
4. **Rate limited** - 60 checks/hour (unlikely to hit)
5. **Electron-only feature** - Web users see nothing (but that's intentional)

### When to Upgrade to Option 3?
- You have 100+ active users
- Support requests about updates increase
- You're willing to invest $99/year
- You want professional-grade UX

---

## Questions & Troubleshooting

### Q: What if GitHub API is down?
**A:** App launches normally, no banner shown. Silent failure.

### Q: What if user is offline?
**A:** Same as above. Update check fails silently.

### Q: Can we check more frequently?
**A:** Yes, but be aware of 60 requests/hour limit. Could add background check every 24 hours.

### Q: Will this work in web version?
**A:** No. `window.electron` only exists in Electron. Component checks for it and returns null in web. This is intentional - web users update via `git pull` or redeployment, not DMG downloads.

### Q: Isn't this violating the shared codebase philosophy?
**A:** No. This is the ONE acceptable Electron-only feature because:
- Web and Electron have fundamentally different update mechanisms
- Web updates automatically via deployment
- Electron requires manual DMG download
- The component is smart (checks environment, returns null on web)
- Electron code is minimal (~100 lines in utilities)

### Q: What about Linux/Windows?
**A:** This plan is macOS-specific. For cross-platform, would need to adjust installer detection and Gatekeeper handling.

---

## Related Documentation

- **Main Implementation**: `docs/features/electron/implementation-plan.md`
- **Distribution**: `docs/distribution/INSTALL.md`
- **Build Process**: `electron/README.md`
- **Release Notes**: `RELEASE_NOTES_UPDATED.md`

---

## Approval Checklist

Before starting implementation:
- [ ] Review this plan
- [ ] Confirm approach (Option 1 vs Option 3)
- [ ] Approve UI design (UpdateBanner)
- [ ] Confirm GitHub repo is public (for API access)
- [ ] Ready to tag releases with semantic versioning

---

**Status**: Draft
**Last Updated**: November 16, 2024
**Author**: Claude Code
**Approved By**: [Pending]
