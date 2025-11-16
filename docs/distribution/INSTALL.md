# Installation Guide - AI Nexus for macOS

Complete installation instructions for AI Nexus desktop application.

## System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Architecture**: Intel or Apple Silicon (Universal binary)
- **Disk Space**: ~260MB free space
- **Internet**: Required for API access

## Download

Download the latest version from GitHub Releases:

**[Download AI Nexus v1.0.0 (102MB)](https://github.com/Sam-Bonin/ai-nexus/releases/download/v1.0.0/AI.Nexus-1.0.0.dmg)**

Or visit: https://github.com/Sam-Bonin/ai-nexus/releases/latest

## Installation Steps

### 1. Download the DMG

Click the download link above to get `AI.Nexus-1.0.0.dmg` (~102MB)

### 2. Mount the DMG

Double-click the downloaded DMG file. A Finder window will open showing:
- AI Nexus.app (left)
- Applications folder shortcut (right)

### 3. Install the App

Drag **AI Nexus** to the **Applications** folder shortcut.

The app will copy to `/Applications/AI Nexus.app` (~254MB installed)

### 4. Eject the DMG

After installation completes:
1. Right-click the mounted DMG volume in Finder
2. Select "Eject"

Or drag the DMG volume to the Trash.

## First Launch

### Bypass Gatekeeper (Required - One Time Only)

Because AI Nexus is not code-signed with an Apple Developer certificate, macOS Gatekeeper will block it on first launch.

**Follow these steps to allow the app:**

1. Try to open **AI Nexus** from the **Applications** folder (it will be blocked)
2. A dialog appears saying the app cannot be opened
3. Open **System Settings** (or **System Preferences** on older macOS)
4. Go to **Privacy & Security**
5. Scroll down to the **Security** section
6. You'll see a message: *"AI Nexus was blocked from use because it is not from an identified developer"*
7. Click **"Open Anyway"** button
8. Confirm by clicking **"Open"** in the dialog that appears

**After this one-time step**, the app will launch normally from Launchpad, Spotlight, or double-clicking.

**Alternative method (if you don't see the Security section):**
1. Open **Finder** → **Applications**
2. **Right-click** (or Control-click) on **AI Nexus**
3. Select **"Open"** from the menu
4. Click **"Open"** in the security dialog

### Loading Screen

On launch, you'll see a loading screen with:
- Yellow-to-coral gradient background
- "AI Nexus" text
- "Loading..." message

The app is starting the embedded Next.js server on port 54321. This takes 2-5 seconds.

### Setup API Key (Required)

1. Once the app loads, click the **Settings** icon (⚙️ gear icon, top right)
2. Navigate to **"API Settings"**
3. Get your OpenRouter API key:
   - Visit https://openrouter.ai
   - Sign up or log in
   - Go to Settings → API Keys
   - Create a new key (free tier available)
4. Paste your API key into the input field
5. Click **"Save API Key"**

The app is now ready to use!

## Troubleshooting

### "Cannot be opened because the developer cannot be verified"

**Symptom**: Dialog appears when trying to open the app.

**Solution**:
1. Go to **System Settings** → **Privacy & Security**
2. Scroll to the **Security** section
3. Click **"Open Anyway"** next to the AI Nexus message
4. Confirm by clicking **"Open"**

**Alternative**: Right-click on AI Nexus in Applications → Select "Open" → Click "Open" in dialog

**Why this happens**: AI Nexus is not code-signed with an Apple Developer certificate ($99/year). This is normal for unsigned open-source apps.

### "The application AI Nexus can't be opened"

**Symptom**: App fails to launch with no error message.

**Solution**:
1. Check macOS version (10.13+ required)
2. Verify installation location is `/Applications/`
3. Check debug log: `~/Library/Application Support/ai-nexus/debug.log`

### Server Startup Errors

**Symptom**: Loading screen doesn't progress, or error message appears.

**Possible causes**:
- Port 54321 is already in use
- File permissions issue
- Corrupted installation

**Solutions**:
1. **Check port availability**:
   ```bash
   lsof -ti:54321
   ```
   If a process is found, kill it: `kill -9 $(lsof -ti:54321)`

2. **Check debug log**:
   ```bash
   cat ~/Library/Application\ Support/ai-nexus/debug.log
   ```

3. **Reinstall the app**:
   - Delete `/Applications/AI Nexus.app`
   - Delete `~/Library/Application Support/ai-nexus/`
   - Reinstall from DMG

### API Key Not Working

**Symptom**: "No API key configured" or API errors when sending messages.

**Solution**:
1. Verify you saved the key (Settings → API Settings → Save)
2. Check the key is valid at https://openrouter.ai
3. Restart the app

### App Won't Quit

**Symptom**: App doesn't quit when selecting Quit or pressing Cmd+Q.

**Solution**:
1. Force quit: Press **Cmd+Option+Esc** → Select AI Nexus → Force Quit
2. Or from Terminal: `killall "AI Nexus"`

## Data Storage

AI Nexus stores all data locally on your Mac:

- **User Data**: `~/Library/Application Support/ai-nexus/`
  - Conversations (localStorage)
  - Projects
  - Theme settings
  - API key (stored in `.env.local`)

- **Debug Logs**: `~/Library/Application Support/ai-nexus/debug.log`

**Privacy**: No data is sent to external servers except OpenRouter API calls for Claude.

## Uninstallation

To completely remove AI Nexus:

1. **Delete the app**:
   ```bash
   rm -rf /Applications/AI\ Nexus.app
   ```

2. **Delete user data** (optional - removes all conversations):
   ```bash
   rm -rf ~/Library/Application\ Support/ai-nexus
   ```

## Updating

When a new version is released:

1. Download the new DMG
2. Quit AI Nexus if running
3. Install the new version (replaces old version)
4. Launch the app

**Your data is preserved** - conversations, projects, and settings are stored separately in `~/Library/Application Support/ai-nexus/`

## Security Notes

- **API Key**: Stored locally in `~/Library/Application Support/ai-nexus/.env.local`
- **Not code-signed**: App is not signed with Apple Developer certificate
- **Gatekeeper bypass required**: One-time right-click → Open
- **No telemetry**: App does not collect usage data
- **Open source**: Code is available at https://github.com/Sam-Bonin/ai-nexus

## Support

- **Issues**: https://github.com/Sam-Bonin/ai-nexus/issues
- **Releases**: https://github.com/Sam-Bonin/ai-nexus/releases
- **Documentation**: https://github.com/Sam-Bonin/ai-nexus/tree/main/docs

## Version Information

- **Current Version**: 1.0.0
- **Release Date**: November 16, 2024
- **File Size**: 102MB (DMG), 254MB (installed)
- **Compatibility**: macOS 10.13+, Intel & Apple Silicon
