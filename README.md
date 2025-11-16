# AI Nexus

A modern Claude.ai clone with streaming responses, file attachments, and extended thinking mode. Built with Next.js and available as both a web app and native macOS desktop application.

## Download

**[Download for macOS →](https://github.com/Sam-Bonin/ai-nexus/releases/latest)** (v1.0.0, 102MB)

Native desktop app. No browser required. Get started in 5 minutes.

📖 [Installation Guide](./docs/distribution/INSTALL.md) | 🚀 [Quick Start](./docs/distribution/QUICK-START.md) | 📦 [All Releases](https://github.com/Sam-Bonin/ai-nexus/releases)

---

## What is AI Nexus?

AI Nexus is a full-featured Claude interface that you can use as:
- **Web App** - Deploy to Vercel/Netlify or run locally
- **Desktop App** - Native macOS application with embedded server

Both implementations use **the same codebase** - features you build work everywhere.

### Key Features

- **Streaming chat** with real-time UI updates
- **5 Claude models** (Sonnet 4.5, Sonnet 4, 3.7, 3.5, Opus 4)
- **File attachments** (images, PDFs)
- **Extended thinking mode** with separate reasoning display
- **Projects system** for organizing conversations
- **Dual-axis themes** (5 color palettes + light/dark modes)
- **Export conversations** to Markdown or JSON
- **No database** - Everything stored in localStorage

## Quick Start

### Web App

```bash
# Clone and install
git clone https://github.com/Sam-Bonin/ai-nexus.git
cd ai-nexus
yarn install

# Set up API key
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local

# Start dev server
yarn dev

# Visit http://localhost:3000
```

Get your API key at [openrouter.ai](https://openrouter.ai/)

### Desktop App (macOS)

**For Users:** [Download the DMG](https://github.com/Sam-Bonin/ai-nexus/releases/latest)

**For Developers:**
```bash
# Development (requires two terminals)
yarn dev              # Terminal 1: Next.js dev server
yarn electron         # Terminal 2: Electron wrapper

# Production build
yarn build:electron   # Output: dist/mac/AI Nexus.app
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Styling with custom design system
- **OpenRouter API** - Access to Claude models
- **Electron** (optional) - Native desktop wrapper

## Project Structure

```
ai-nexus/
├── app/                    # Next.js app (shared by web + Electron)
│   ├── api/               # API routes (server-side)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat page
├── components/            # React components (shared)
│   ├── chat/             # Chat interface
│   ├── sidebar/          # Sidebar & projects
│   └── settings/         # Settings UI
├── electron/              # Electron wrapper (desktop only)
│   ├── main.ts           # Window management
│   └── utils/            # Server lifecycle
├── lib/                   # Business logic (shared)
├── types/                 # TypeScript types
└── hooks/                 # React hooks
```

**Key Principle:** All features live in `app/`, `components/`, and `lib/`. The Electron wrapper is minimal and only handles window management.

## Development

```bash
# Common commands
yarn dev              # Start Next.js dev server
yarn build            # Build for production
yarn lint             # Run ESLint
yarn tsc --noEmit     # Type check

# Electron-specific
yarn electron         # Launch Electron (requires yarn dev running)
yarn build:electron   # Build standalone .app
```

## Architecture

AI Nexus uses a simple three-layer architecture:

1. **Frontend (React)** - UI components, state management, localStorage
2. **Backend (Next.js API Routes)** - Secure API key handling, streaming proxy
3. **External (OpenRouter)** - Routes to Claude models

```
Browser ──fetch──> /api/chat ──proxy──> OpenRouter ──route──> Claude
   ↓                                         ↓
localStorage <────── streaming chunks ───────┘
```

**Why this works:**
- API keys stay secure on the server
- Streaming responses work natively
- No database needed - localStorage is enough
- Deploy anywhere that supports Node.js

## Configuration

### Environment Variables

```env
OPENROUTER_API_KEY=sk-or-v1-...    # Required: Get from openrouter.ai
YOUR_SITE_URL=http://localhost:3000 # Optional: for OpenRouter analytics
YOUR_SITE_NAME=AI Nexus             # Optional: for OpenRouter analytics
```

You can also set your API key through the Settings UI after starting the app.

### Shared Codebase Philosophy

AI Nexus supports both web and Electron using **a single shared codebase**. When building features:

✅ **Do:** Build features that work in both environments
✅ **Do:** Keep platform-specific code in `electron/` (window management only)
❌ **Don't:** Create parallel implementations
❌ **Don't:** Fork components for different platforms

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## Deployment

### Web App

**Vercel (Recommended):**
```bash
vercel
```

**Other Options:**
- Netlify, Railway, or any Node.js hosting
- Self-hosted: `yarn build && yarn start`

Add `OPENROUTER_API_KEY` to your deployment environment variables.

### Desktop App

```bash
# Build the .app
yarn build:electron

# Output: dist/mac/AI Nexus.app (~250MB)
```

For distribution:
1. Build creates both `.app` and `.dmg` installer
2. Upload DMG to [GitHub Releases](https://github.com/Sam-Bonin/ai-nexus/releases)
3. Users download and install

See [docs/distribution/](./docs/distribution/) for detailed release process.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete developer guide for AI assistants
- **[STYLEGUIDE.md](./STYLEGUIDE.md)** - Design system reference
- **[electron/README.md](./electron/README.md)** - Electron app documentation
- **[docs/distribution/](./docs/distribution/)** - Release and distribution guides
- **[docs/features/](./docs/features/)** - Feature implementation plans

## Contributing

We welcome contributions! Before submitting:

1. **Type check:** `yarn tsc --noEmit`
2. **Lint:** `yarn lint`
3. **Build:** `yarn build`
4. **Test:** Try your changes in both web and Electron modes

Read [CLAUDE.md](./CLAUDE.md) for architecture details and coding standards.

## License

MIT
