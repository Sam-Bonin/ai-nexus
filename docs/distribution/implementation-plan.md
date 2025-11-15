# DMG Distribution Implementation Plan

## Implementation Status

**Last Updated**: November 15, 2024

- ✅ **Phase 0**: Security - API Key Protection (COMPLETED)
- ✅ **Phase 1**: Build Configuration (COMPLETED)
- ✅ **Phase 2**: Build and Test DMG (COMPLETED)
- ⏳ **Phase 3**: GitHub Release Setup (PENDING)
- ⏳ **Phase 4**: User Documentation (PENDING)
- ⏳ **Phase 5**: Distribution Checklist (PENDING)
- 📋 **Phase 6**: Future Enhancements (PLANNED)

**Additional Work Completed**:
- ✅ Renamed package from `claude-ai-clone` to `ai-nexus`
- ✅ Verified DMG security (no API key bundled)
- ✅ Tested DMG installation and functionality

---

## Overview

This document outlines the implementation plan for creating a DMG installer and hosting it on GitHub Releases for easy distribution of AI Nexus to end users.

---

## Goals

- Enable one-click download and install experience for Mac users
- Provide professional DMG installer with drag-to-Applications UI
- Host releases on GitHub with version tracking
- Create clear user documentation for installation process
- Handle macOS Gatekeeper warnings appropriately

---

## Current State

- **Build target**: `"dir"` (outputs raw `.app` to `dist/mac/`)
- **Distribution method**: Manual zip and share
- **App size**: 254MB installed, ~240MB estimated DMG
- **Packaging**: ASAR + extraResources pattern (working correctly)

---

## ✅ Phase 0: Security - Prevent API Key Leakage (CRITICAL) - COMPLETED

### 0.1 The Problem

**Currently**: `.env.local` (containing your personal API key) is being copied into the Electron build at `Contents/Resources/standalone/.env.local`

**Risk**: Anyone who downloads your DMG would get YOUR API key and could use YOUR OpenRouter account at YOUR expense.

**Why it happens**: Electron-builder's `extraResources` copies the entire `.next/standalone/` directory, which may include `.env.local` from the build process.

### 0.2 The Solution

Add a pre-build script to remove `.env.local` from the standalone directory before packaging.

**File**: `package.json`

**Add to scripts**:
```json
"scripts": {
  "prebuild:electron": "rm -f .next/standalone/.env.local",
  "build:electron": "next build && npx tsc -p electron/tsconfig.json && electron-builder"
}
```

**How it works**:
1. `prebuild:electron` runs automatically before `build:electron`
2. Removes `.env.local` from standalone directory if it exists
3. Electron-builder then packages the clean standalone bundle
4. Users will need to enter their own API key

### 0.3 Verify the Fix

After building, verify API key is NOT in the bundle:

```bash
# Build the app
yarn build:electron

# Check if .env.local exists in build
test -f "dist/mac/AI Nexus.app/Contents/Resources/standalone/.env.local" \
  && echo "⚠️  API KEY STILL IN BUILD!" \
  || echo "✅ API key removed - safe to distribute"
```

**Expected result**: ✅ API key removed - safe to distribute

### 0.4 Additional Protection (Optional)

Add to `.gitignore` to prevent accidental commits:
```
# Already there, but verify
.env.local

# Also ignore any .env files that might end up in standalone
.next/standalone/.env*
```

### 0.5 User Experience Impact

**Before fix**: Users inherit your API key (security issue)
**After fix**: Users must enter their own API key (correct behavior)

Users will:
1. Launch app
2. See error about missing API key
3. Go to Settings → API Settings
4. Enter their own OpenRouter API key
5. App works with their account

This is the **intended and secure** behavior.

---

## ✅ Phase 1: Update Build Configuration - COMPLETED

### 1.1 Modify electron-builder.json

**File**: `electron-builder.json`

**Change**:
```json
"mac": {
  "target": "dir",      // Current
  "icon": "resources/icon.icns",
  "category": "public.app-category.productivity"
}
```

**To**:
```json
"mac": {
  "target": ["dir", "dmg"],      // Build both formats
  "icon": "resources/icon.icns",
  "category": "public.app-category.productivity"
}
```

**Why both?**
- `dir`: Produces raw `.app` for quick local testing and debugging
- `dmg`: Produces DMG installer for distribution
- Only adds ~20-30 seconds to build time
- Allows testing both the app and the installation flow

**Optional DMG Customization** (can add later):
```json
"dmg": {
  "iconSize": 100,
  "window": {
    "width": 600,
    "height": 400
  },
  "contents": [
    {
      "x": 150,
      "y": 200,
      "type": "file"
    },
    {
      "x": 450,
      "y": 200,
      "type": "link",
      "path": "/Applications"
    }
  ]
}
```

### 1.2 Version Bump Strategy

**File**: `package.json`

Current version: Check `"version"` field
- DMG filename will be: `AI Nexus-{version}.dmg`
- Example: `AI Nexus-1.0.0.dmg`

**Versioning plan**:
- Initial release: `1.0.0`
- Future updates: Follow semantic versioning (major.minor.patch)

---

## ✅ Phase 2: Build and Test DMG - COMPLETED

### 2.1 Clean Build

**Commands**:
```bash
# Clean previous builds
rm -rf dist/

# Build DMG
yarn build:electron
```

**Expected output**:
```
dist/
├── mac/
│   ├── AI Nexus.app              (raw app - still created)
│   └── AI Nexus-1.0.0.dmg        (DMG installer)
└── builder-debug.yml              (build metadata)
```

**Build time**: ~2-5 minutes (Next.js build + DMG creation)

### 2.2 Test DMG Locally

#### Step 2.2.1: Remove Existing Installation
```bash
# Option A: Delete existing app
rm -rf "/Applications/AI Nexus.app"

# Option B: Rename for backup
mv "/Applications/AI Nexus.app" "/Applications/AI Nexus OLD.app"
```

#### Step 2.2.2: Mount and Install from DMG
1. Double-click `dist/mac/AI Nexus-1.0.0.dmg`
2. Verify installer window appears with:
   - AI Nexus app icon (left)
   - Applications folder shortcut (right)
3. Drag AI Nexus to Applications
4. Eject DMG volume

#### Step 2.2.3: Test Gatekeeper Bypass
1. Go to Applications folder
2. **Double-click** AI Nexus.app (should fail with Gatekeeper warning)
3. **Right-click** → Open (should show different dialog with "Open" button)
4. Click "Open" button
5. Verify app launches successfully

#### Step 2.2.4: Test Functionality
- [ ] Loading screen appears
- [ ] Server starts on port 54321
- [ ] UI loads correctly
- [ ] Settings → API Settings works
- [ ] Can save API key
- [ ] Can send chat messages
- [ ] Data persists after quit/reopen

### 2.3 Test DMG File Properties

**Check file size**:
```bash
du -sh dist/mac/AI\ Nexus-1.0.0.dmg
# Expected: ~220-240MB
```

**Check DMG integrity**:
```bash
hdiutil verify dist/mac/AI\ Nexus-1.0.0.dmg
# Should show: "verified   CRC32 $XXXXXXXX"
```

---

## Phase 3: GitHub Release Setup

### 3.1 Create First Release

**Steps**:
1. Go to GitHub repository: `https://github.com/Sam-Bonin/ai-nexus`
2. Click "Releases" → "Draft a new release"
3. Fill in release details:
   - **Tag version**: `v1.0.0` (create new tag)
   - **Release title**: `AI Nexus v1.0.0 - Initial Release`
   - **Description**: See template below
4. Upload DMG: Drag `dist/mac/AI Nexus-1.0.0.dmg` to assets
5. Check "Set as the latest release"
6. Click "Publish release"

**Release Description Template**:
```markdown
# AI Nexus v1.0.0

A native macOS desktop application for Claude AI with streaming responses, file attachments, and extended thinking mode.

## 🎉 Features

- **Streaming chat** with real-time UI updates
- **5 Claude models** (Sonnet 4.5, Sonnet 4, 3.7, 3.5, Opus 4)
- **File attachments** (images, PDFs)
- **Extended thinking mode** with separate reasoning display
- **Projects system** for organizing conversations
- **Dual-axis themes** (5 color palettes + light/dark modes)
- **Export conversations** to Markdown or JSON

## 📥 Download

**macOS 10.13 or later**

Download: [AI Nexus-1.0.0.dmg](direct-link-here) (~240MB)

## 📦 Installation

1. Download the DMG file above
2. Double-click to mount it
3. Drag "AI Nexus" to Applications folder
4. **Important**: Right-click → Open (first launch only)
5. Enter your OpenRouter API key in Settings

See [Installation Guide](#installation-guide) below for detailed instructions.

## ⚙️ Requirements

- macOS 10.13 or later
- Internet connection
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai))

## 📖 Installation Guide

### First Launch (Gatekeeper Bypass)

Because this app is not code-signed, macOS will block it on first launch:

1. Go to Applications folder
2. **Right-click** (or Control-click) on "AI Nexus"
3. Select "Open"
4. Click "Open" in the security dialog

**After this one-time step**, the app will launch normally.

### Setup API Key

1. Open AI Nexus
2. Click Settings (gear icon)
3. Go to "API Settings"
4. Get a free API key from [openrouter.ai](https://openrouter.ai)
5. Paste your key and click Save

## 🐛 Troubleshooting

**"Cannot be opened because developer cannot be verified"**
- Solution: Right-click → Open (see Installation Guide above)

**API errors / "No API key configured"**
- Solution: Add your OpenRouter API key in Settings → API Settings

**Server startup errors**
- Check debug log: `~/Library/Application Support/AI Nexus/debug.log`
- Try restarting the app
- Ensure port 54321 is not occupied

## 📝 Release Notes

Initial release of AI Nexus desktop app for macOS.

**What's New:**
- Native macOS desktop application
- Electron wrapper with embedded Next.js server
- Self-contained (~254MB installed)
- Data stored locally in `~/Library/Application Support/AI Nexus`

## 💬 Feedback

Report issues or request features at: https://github.com/Sam-Bonin/ai-nexus/issues
```

### 3.2 Get Download Link

After publishing, the download link will be:
```
https://github.com/Sam-Bonin/ai-nexus/releases/download/v1.0.0/AI-Nexus-1.0.0.dmg
```

**Note**: GitHub automatically URL-encodes spaces, so "AI Nexus-1.0.0.dmg" becomes "AI-Nexus-1.0.0.dmg" in the URL.

---

## Phase 4: User Documentation

### 4.1 Create INSTALL.md

**File**: `docs/distribution/INSTALL.md`

Create a simple installation guide users can reference.

### 4.2 Update README.md

Add a prominent "Download" section at the top of README.md:

```markdown
## Download

**[Download AI Nexus for macOS](https://github.com/Sam-Bonin/ai-nexus/releases/latest)**

Native macOS desktop app with Claude AI. No browser required.
```

### 4.3 Create Quick Start Guide

**File**: `docs/distribution/QUICK-START.md`

Simple one-page guide for new users.

---

## Phase 5: Distribution Checklist

Before sharing the download link, verify:

### Security Checks (Critical)
- [ ] **API key NOT in build** - Run verification command from Phase 0.3
- [ ] **No .env.local in DMG** - Mount DMG and verify it's not in standalone/
- [ ] **No personal data in build** - Check for any other sensitive files

### Build Quality
- [ ] DMG builds successfully without errors
- [ ] DMG file size is reasonable (~220-240MB)
- [ ] Both `dir` and `dmg` outputs are created

### Functionality Testing
- [ ] Local installation test passes (from DMG, not raw .app)
- [ ] Gatekeeper bypass works (right-click → Open)
- [ ] App launches and shows loading screen
- [ ] **App shows "API key required" error** (correct behavior!)
- [ ] Settings → API Settings works
- [ ] Can enter and save API key
- [ ] After entering key, can send messages
- [ ] All features work (file upload, projects, themes, etc.)

### Distribution
- [ ] GitHub Release is published
- [ ] Download link is accessible (test in incognito browser)
- [ ] Release notes are clear and complete
- [ ] Installation instructions are accurate and include Gatekeeper bypass
- [ ] API key setup instructions are prominent
- [ ] Troubleshooting section covers common issues

---

## Phase 6: Future Enhancements

### 6.1 Code Signing (Removes Gatekeeper Warning)

**Requirements**:
- Apple Developer account ($99/year)
- Developer ID Application certificate

**Implementation**:
```json
// electron-builder.json
"mac": {
  "target": "dmg",
  "identity": "Developer ID Application: Your Name (TEAMID)",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "entitlements.mac.plist",
  "entitlementsInherit": "entitlements.mac.plist"
}
```

**Benefit**: Users can double-click to launch (no right-click needed)

### 6.2 Notarization (Apple Verification)

**Requirements**:
- Code signing (above)
- Automated via electron-builder

**Implementation**:
```json
"mac": {
  "notarize": {
    "teamId": "TEAMID"
  }
}
```

**Benefit**: macOS fully trusts the app, no warnings at all

### 6.3 Auto-Updates

**Requirements**:
- electron-updater package
- Update server or GitHub Releases

**Implementation**:
- Add update checking code to `electron/main.ts`
- Publish updates to GitHub Releases
- App checks for updates on launch

**Benefit**: Users get new versions automatically

### 6.4 DMG Background Image

**Optional Enhancement**:
- Create custom background image with app logo
- Add to `resources/dmg-background.png`
- Configure in electron-builder.json

**Benefit**: More professional appearance

### 6.5 DMG-Only Builds (If Needed)

**Current**: Builds both `dir` and `dmg` for flexibility
**Alternative**: DMG-only for CI/CD or production-only workflows

```json
"mac": {
  "target": "dmg",  // Just DMG, no raw .app
  "icon": "resources/icon.icns",
  "category": "public.app-category.productivity"
}
```

**Or override for one-off builds**:
```bash
yarn electron-builder --mac dmg
```

**When to use**:
- Automated release pipelines (don't need raw `.app`)
- Saving disk space on build servers
- Faster builds when only distributing DMG

### 6.6 Multi-Architecture Builds

**Current**: Universal binary (works on Intel and Apple Silicon)
**Future**: Separate optimized builds for each architecture

```json
"mac": {
  "target": [
    {
      "target": "dmg",
      "arch": ["x64", "arm64"]
    }
  ]
}
```

**Output**:
- `AI Nexus-1.0.0-x64.dmg` (Intel Macs)
- `AI Nexus-1.0.0-arm64.dmg` (Apple Silicon)
- `AI Nexus-1.0.0.dmg` (Universal)

---

## Testing Matrix

Before each release, test on:

- [ ] macOS 13 Ventura (Intel)
- [ ] macOS 14 Sonoma (Apple Silicon)
- [ ] macOS 15 Sequoia (if available)
- [ ] Clean install (no previous version)
- [ ] Upgrade install (replace existing version)

**Test scenarios**:
- [ ] Fresh download and install
- [ ] Gatekeeper bypass
- [ ] API key setup
- [ ] Send first message
- [ ] File upload (image and PDF)
- [ ] Theme switching
- [ ] Project creation
- [ ] Export conversation
- [ ] Quit and relaunch (data persistence)

---

## Rollback Plan

If DMG distribution has issues:

1. Keep `"target": "dir"` option available
2. Can revert to zip file distribution
3. Previous `.app` builds still work
4. Delete GitHub Release if needed

**No changes to core app functionality**, so rollback is simple.

---

## Success Criteria

- ✅ DMG builds without errors
- ✅ DMG installs correctly on test Mac
- ✅ App functions identically to development version
- ✅ GitHub Release is publicly accessible
- ✅ Download link works from external browser
- ✅ Users can install and run with provided instructions
- ✅ No critical bugs in production DMG

---

## Timeline Estimate

- **Phase 1** (Config update): 5 minutes
- **Phase 2** (Build and test): 30-45 minutes
- **Phase 3** (GitHub Release): 15 minutes
- **Phase 4** (Documentation): 30 minutes
- **Phase 5** (Final checks): 15 minutes

**Total**: ~2 hours for first release

Future releases: ~30 minutes (once workflow is established)

---

## Notes

- DMG creation adds ~15-30 seconds to build time
- GitHub Releases supports files up to 2GB (our ~240MB is fine)
- Download speed depends on user's connection (~30-60 seconds on typical broadband)
- Gatekeeper warning is expected and normal for unsigned apps
- Consider code signing ($99/year) if distributing widely

---

## References

- electron-builder DMG docs: https://www.electron.build/configuration/dmg
- GitHub Releases docs: https://docs.github.com/en/repositories/releasing-projects-on-github
- macOS Gatekeeper: https://support.apple.com/en-us/HT202491
- Code Signing Guide: https://www.electron.build/code-signing
