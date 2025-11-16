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

Download the DMG file below (~102MB)

## 📦 Installation

1. Download the DMG file above
2. Double-click to mount it
3. Drag "AI Nexus" to Applications folder
4. **Important**: Right-click → Open (first launch only)
5. Enter your OpenRouter API key in Settings

See Installation Guide below for detailed instructions.

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
- Check debug log: `~/Library/Application Support/ai-nexus/debug.log`
- Try restarting the app
- Ensure port 54321 is not occupied

## 📝 Release Notes

Initial release of AI Nexus desktop app for macOS.

**What's New:**
- Native macOS desktop application
- Electron wrapper with embedded Next.js server
- Self-contained (~254MB installed)
- Data stored locally in `~/Library/Application Support/ai-nexus`

## 💬 Feedback

Report issues or request features at: https://github.com/Sam-Bonin/ai-nexus/issues
