# Prompt for Claude

I want you to convert this Next.js Nexus AI repository into an Electron desktop application for macOS. This is a personal AI chat interface (similar to claude.ai but with custom features) that currently runs via `yarn dev` and opens in a browser. I want to transform it into a native Mac application that I can launch from my Applications folder like any other app - think Slack, VS Code, or Spotify.

## Why We're Doing This

**The Goal:** Create a standalone Mac app (.app file) that feels native and professional, rather than a web app running in a browser tab. This app is for my personal use only - I'm not distributing it to others, so we can skip code signing, notarization, and all the Apple Developer Program requirements.

**What I Want:**
- A dedicated app window with its own Dock icon that I can Cmd+Tab to
- The ability to double-click an icon to launch the app, rather than opening a terminal and running `yarn dev`
- An experience that feels like a "real" Mac application - isolated from my browser tabs, with its own localStorage, and a clean interface without browser chrome (no address bar, tabs, bookmarks bar)
- The app to live in my Applications folder and behave like any other Mac app
- Proper lifecycle management - when I Cmd+Q, everything shuts down cleanly

**What I Still Need During Development:**
- The ability to develop with hot reload - I should be able to make code changes and see them instantly reflected in the Electron app window, just like the current dev workflow
- Access to DevTools for debugging
- A simple command to run the development version vs. building the production .app
- The existing codebase should remain largely unchanged - we're wrapping it in Electron, not rewriting it

**What I Don't Need:**
- Code signing or notarization (personal use only)
- Auto-update mechanisms (I'll manually rebuild when I add features)
- Distribution setup or DMG installers (just the raw .app file is fine)
- Cross-platform support (Mac only)

## Current Architecture

This is a Next.js 14 App Router application that:
- Makes API calls to OpenRouter (which routes to Claude and other LLMs) via server-side API routes (`app/api/`)
- Stores all data (conversations, projects, settings) in browser localStorage
- Uses environment variables from `.env.local` for API keys
- Handles streaming responses from AI models
- Supports file uploads (images and PDFs converted to base64)
- Has a custom project system and the ability to switch between different model providers

The app currently requires a Node.js server running (for the API routes), so it can't be statically exported. It needs both the Next.js server and the frontend running together.

## What You Should Do

**First, analyze the repository thoroughly:**
- Examine the tech stack, dependencies, and build configuration
- Understand how API calls are structured (client → API routes → external APIs)
- Identify where data is stored and how it persists
- Check for any browser-specific APIs or features that might behave differently in Electron
- Review the build process and determine the best approach for packaging with Electron
- Consider how environment variables and API keys should be handled securely

**Then, develop a strategy for:**
- Setting up Electron in a way that preserves the current development workflow (hot reload, fast iteration)
- Integrating Next.js's server with Electron's main process
- Ensuring localStorage works properly and persists between app restarts in an isolated environment
- Handling the build process - both development mode (for fast iteration) and production builds (for creating the standalone .app)
- Managing environment variables and API keys securely within the packaged app
- Creating a proper app lifecycle (startup, running, shutdown)
- Adding macOS-specific features like a menu bar, proper window management, and native feel

**Consider different approaches:**
- Next.js standalone mode vs. other packaging strategies
- How to run the Next.js server within Electron (spawn vs. integrated vs. other approaches)
- Development workflow setup - should it be one command or multiple?
- File structure and organization for Electron-specific code

**Think about edge cases and potential issues:**
- What happens if the Next.js server takes time to start up?
- How do we ensure environment variables are loaded correctly in both dev and production?
- Will file uploads work the same way in Electron?
- What's the cleanest way to manage the dual nature of development (fast iteration) vs. production (standalone app)?

## What I Need From You

After thoroughly analyzing the repository and developing your implementation strategy, please:

1. **Ask me any clarifying questions** about:
   - Preferences for the development workflow
   - Any specific native macOS features I'd like (system tray, notifications, global shortcuts, etc.)
   - How I want to handle app updates and versioning
   - Any concerns about app size, startup time, or performance
   - Preferences for tooling and packages (if there are multiple viable options)

2. **Present your recommended approach** including:
   - The overall architecture and strategy
   - Key decisions you made and why
   - Any tradeoffs or considerations I should be aware of
   - What the development workflow will look like day-to-day
   - What the production build and installation process will look like

3. **Identify any potential issues or limitations** you foresee with the current codebase that might need addressing

4. **Outline what will change** in the repository:
   - New files that need to be created
   - Existing files that need modification
   - New dependencies required
   - Configuration changes needed

Only after we've discussed your analysis and strategy should you proceed with implementation. I want to make sure we're aligned on the approach before making changes to the codebase.


## Future Considerations (Context Only)

For context, this app may eventually:
- Be deployed as a web app in addition to Electron
- Migrate from localStorage to SQLite

**For this implementation:** Don't over-engineer for these scenarios. Just keep Electron-specific code reasonably isolated (e.g., in the `electron/` directory) and avoid breaking the existing Next.js web architecture. We'll handle the storage layer refactor when we actually need it.