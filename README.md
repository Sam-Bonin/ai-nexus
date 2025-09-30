# Nexus AI

A Next.js implementation of Claude.ai using OpenRouter API with streaming responses, file attachments, and extended thinking mode.

## Quick Start

```bash
# Install dependencies (choose one)
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local

# Start dev server (choose one)
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000`

## Environment Variables

```env
OPENROUTER_API_KEY=your-key-here
YOUR_SITE_URL=http://localhost:3000
YOUR_SITE_NAME=Claude AI Clone
```

Get your API key at [openrouter.ai](https://openrouter.ai/)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Frontend)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React Components (Chat.tsx, Message.tsx, Sidebar.tsx) │    │
│  │                                                          │    │
│  │  • User types message + selects model                   │    │
│  │  • Attaches files (images/PDFs)                         │    │
│  │  • Manages state (messages, conversations)              │    │
│  │  • Renders streaming responses in real-time             │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  localStorage (Data Persistence)                        │    │
│  │  • Conversations history                                │    │
│  │  • File attachments (base64)                            │    │
│  │  • Theme preferences                                    │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                    fetch('/api/chat', {
                      messages, model, thinking
                    })
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                    Node.js Server (Backend)                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API Routes (/app/api/)                                  │    │
│  │                                                           │    │
│  │  • POST /api/chat           - Main chat endpoint         │    │
│  │  • POST /api/generate-title - Auto-title generation      │    │
│  │                                                           │    │
│  │  Responsibilities:                                        │    │
│  │  ✓ Securely stores OPENROUTER_API_KEY                    │    │
│  │  ✓ Validates & transforms requests                       │    │
│  │  ✓ Proxies to OpenRouter API                             │    │
│  │  ✓ Streams responses back to client                      │    │
│  │  ✓ Extracts metadata (tokens, thinking)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                    OpenAI SDK with OpenRouter
                    baseURL + API Key headers
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                    OpenRouter API (External)                      │
│                  https://openrouter.ai/api/v1                     │
│                                                                   │
│  • Routes requests to Claude (Anthropic)                         │
│  • Supports multiple Claude models:                              │
│    - Sonnet 4.5, Sonnet 4, Sonnet 3.7, Sonnet 3.5, Opus 4       │
│  • Streams AI responses in real-time                             │
│  • Handles file attachments (images, PDFs)                       │
│  • Extended thinking mode with reasoning                         │
│  • Returns token usage & metadata                                │
└───────────────────────────────────────────────────────────────────┘

Data Flow:
  1. User → Browser: Types message, attaches files
  2. Browser → Server: HTTP POST with messages array
  3. Server → OpenRouter: Proxied request with API key
  4. OpenRouter → Claude: Routes to Anthropic's Claude
  5. Claude → OpenRouter → Server: Streams response chunks
  6. Server → Browser: Passes through streamed chunks
  7. Browser: Updates UI in real-time + saves to localStorage
```

### Why This Architecture?

- **Frontend (React)**: Rich, interactive UI with real-time updates
- **Backend (Next.js API)**: Secure API key handling + streaming proxy
- **localStorage**: No database needed - all data stays in browser
- **OpenRouter**: Access to latest Claude models via unified API

⚠️ **Note**: Cannot deploy to GitHub Pages (requires Node.js server). Use Vercel, Netlify, or similar.

## Development

```bash
# npm
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check

# yarn
yarn dev             # Start dev server
yarn build           # Production build
yarn start           # Start production server
yarn lint            # Run ESLint
yarn tsc --noEmit    # Type check
```

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Styling
- **OpenRouter API** - Claude Sonnet 4.5 via OpenAI SDK
- **react-markdown** + **react-syntax-highlighter** - Message rendering

## Features

- Streaming chat responses
- File attachments (images, PDFs)
- Extended thinking mode with reasoning display
- 5 Claude models (Sonnet 4.5, Sonnet 4, 3.7, 3.5, Opus 4)
- Conversation history with localStorage persistence
- Dark/light/system themes
- Export conversations (Markdown/JSON)
- Token usage and response metadata tracking

## Project Structure

```
app/
├── api/
│   ├── chat/route.ts           # Main streaming endpoint
│   └── generate-title/route.ts # Auto-title generation
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── Chat.tsx        # Main interface, handles streaming & state
├── Message.tsx     # Renders messages with markdown
├── CodeBlock.tsx   # Syntax highlighting
└── Sidebar.tsx     # Conversation history

types/chat.ts       # TypeScript interfaces
lib/
├── storage.ts      # localStorage helpers
└── utils.ts        # Utility functions
hooks/useTheme.ts   # Theme management
```

## API Routes

### POST `/api/chat`

Streams chat responses from OpenRouter.

**Request:**
```typescript
{
  messages: Message[];
  model?: ModelId;      // Default: "anthropic/claude-sonnet-4"
  thinking?: boolean;   // Enable extended thinking
}
```

**Response:**
- Streams text content as it arrives
- `___THINKING___` prefix for reasoning content
- `___METADATA___` suffix with token counts and duration

### POST `/api/generate-title`

Generates conversation title from first message exchange.

## Key Implementation Details

### Streaming

- Uses `ReadableStream` on server, `TextDecoder` on client
- `AbortController` for canceling mid-stream
- Chunks parsed in `Chat.tsx` to separate content/thinking/metadata

### File Attachments

- Converted to base64 in browser
- Sent as `files[]` array on message
- API transforms to OpenRouter's `image_url` format
- Supports images and PDFs

### Storage

All data stored in localStorage:
- `conversations` - Array of conversation objects
- `activeConversationId` - Currently open conversation
- `theme` - User's theme preference

### Available Models

Defined in `types/chat.ts`:
- `anthropic/claude-sonnet-4.5` (default)
- `anthropic/claude-sonnet-4`
- `anthropic/claude-3.7-sonnet`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-opus-4`

## Customization

### Change Default Model

Edit `app/api/chat/route.ts`:
```typescript
const selectedModel = model || "anthropic/claude-sonnet-4"; // Change here
```

### Modify Styles

- `tailwind.config.ts` - Theme colors, fonts
- `app/globals.css` - Global styles, animations
- Component files - Component-specific Tailwind classes

### Add New Features

- Types: `types/chat.ts`
- Storage helpers: `lib/storage.ts`
- Utilities: `lib/utils.ts`
- Components: `components/`

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - New chat
- `⌘B` / `Ctrl+B` - Toggle sidebar
- `Enter` - Send message
- `Shift+Enter` - New line

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Deploy via Vercel CLI
vercel

# Or connect repo at vercel.com
```

Add environment variables in Vercel dashboard.

## Troubleshooting

**401 Error:** Check `OPENROUTER_API_KEY` in `.env.local`

**Streaming Issues:** Ensure modern browser with `ReadableStream` support

**No Conversations:** Create a new chat first

**Dark Mode Not Persisting:** Check localStorage is enabled

## Contributing

- Follow existing code style
- Add TypeScript types for new features
- Test responsive design
- Verify dark mode compatibility

## License

MIT
