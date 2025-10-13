# Nexus AI

A Next.js implementation of Claude.ai using OpenRouter API with streaming responses, file attachments, and extended thinking mode.

## Quick Start

```bash

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

**Alternative:** You can also set your API key through the Settings UI after starting the app. The key will be securely stored in `.env.local` with hot-reload support.

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
│  │  • POST /api/chat                 - Main chat endpoint   │    │
│  │  • POST /api/generate-title       - Auto-title          │    │
│  │  • POST /api/generate-description - Auto-description    │    │
│  │  • POST /api/match-project        - AI project matching │    │
│  │  • GET/POST /api/setting-key      - API key management  │    │
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

### Chat & AI
- **Streaming chat responses** with real-time UI updates
- **File attachments** (images, PDFs) with base64 encoding
- **Extended thinking mode** with separate reasoning display
- **5 Claude models** (Sonnet 4.5, Sonnet 4, 3.7, 3.5, Opus 4) selectable per conversation
- **Token usage tracking** with detailed metadata per message

### Organization
- **Projects system** for organizing conversations into categories
- **AI-powered project matching** automatically suggests projects for new conversations
- **Auto-generated titles** for conversations
- **Auto-generated descriptions** for better conversation summaries
- **Export conversations** to Markdown or JSON

### Personalization
- **Dual-axis theme system**:
  - **Brightness modes**: Light, Dark, System (auto)
  - **Color palettes**: 5 options (Yellow, Blue, Purple, Green, Pink)
- **Settings UI** with API key management (no manual `.env.local` editing required)
- **localStorage persistence** - All data stays in your browser, no database needed

### Interface
- **Modular component architecture** with feature-based organization
- **Keyboard shortcuts** for quick navigation
- **Responsive design** for mobile and desktop

## Project Structure

```
app/
├── api/                            # Next.js API routes (server-side)
│   ├── chat/route.ts               # Main streaming endpoint
│   ├── generate-title/route.ts     # Auto-title generation
│   ├── generate-description/route.ts
│   ├── match-project/route.ts      # AI-powered project matching
│   └── setting-key/route.ts        # API key management
├── layout.tsx                      # Root layout with theme provider
├── page.tsx                        # Main chat page
└── globals.css                     # Global styles + CSS variables

components/
├── chat/                           # Chat interface components
│   ├── ChatShell.tsx              # Main container, manages state & streaming
│   ├── ChatComposer.tsx           # Input area with file attachments
│   ├── ChatMessageList.tsx        # Message rendering
│   ├── ChatHeader.tsx
│   ├── ModelSelector.tsx
│   ├── AttachmentPreviewList.tsx
│   └── ScrollToBottomButton.tsx
├── sidebar/                        # Sidebar & project management
│   ├── SidebarShell.tsx           # Main sidebar container
│   ├── ProjectSection.tsx         # Project list and organization
│   ├── ProjectModal.tsx           # Create/edit projects
│   ├── ConversationListItem.tsx
│   ├── ConversationMenu.tsx
│   └── MoveConversationModal.tsx
├── settings/                       # Settings UI
│   ├── SettingsMenu.tsx           # Main settings modal
│   ├── APISettings.tsx            # API key management
│   ├── AboutSettings.tsx
│   ├── AccountSettings.tsx
│   ├── PrivacySettings.tsx
│   └── personalization/
│       ├── PersonalizationSettings.tsx
│       └── ThemePreview.tsx
├── Message.tsx                     # Message renderer with markdown
└── CodeBlock.tsx                   # Syntax-highlighted code blocks

types/
└── chat.ts                         # TypeScript interfaces
                                    # Message, Conversation, Project, etc.

lib/                                # Business logic & utilities
├── openaiClient.ts                 # Factory for OpenAI client instances
├── apiKeyManager.ts                # Singleton API key manager
├── storage.ts                      # localStorage helpers
├── chatService.ts                  # Chat API client functions
├── file.ts                         # File handling utilities
├── format.ts                       # Formatting utilities
├── colorPalettes.ts                # Theme color definitions
└── utils.ts                        # General utilities

hooks/
└── useTheme.ts                     # Theme management hook
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

**Request:**
```typescript
{
  messages: Message[];  // First user + assistant exchange
}
```

**Response:**
```typescript
{
  title: string;        // Generated title (e.g., "Python Debugging Help")
}
```

### POST `/api/generate-description`

Generates a concise one-line description of a conversation.

**Request:**
```typescript
{
  title: string;
  messages: Message[];  // Recent messages for context
}
```

**Response:**
```typescript
{
  description: string;  // One-line summary
}
```

### POST `/api/match-project`

Uses AI to suggest a matching project for a conversation.

**Request:**
```typescript
{
  conversationTitle: string;
  conversationDescription?: string;
  projects: Project[];  // Available projects
}
```

**Response:**
```typescript
{
  projectId: string | null;  // Best matching project, or null
  confidence: number;         // Match confidence (0-1)
}
```

### GET/POST `/api/setting-key`

Manage OpenRouter API key securely.

**GET Response:**
```typescript
{
  hasKey: boolean;      // Whether key is configured
  lastFour?: string;    // Last 4 chars of key (for display)
}
```

**POST Request:**
```typescript
{
  apiKey: string;       // New API key to set
}
```

**DELETE Request:** Send `{ apiKey: "" }` to remove key.

## Key Implementation Details

### Streaming

- Uses `ReadableStream` on server, `TextDecoder` on client
- `AbortController` for canceling mid-stream
- Chunks parsed in `ChatShell.tsx` to separate content/thinking/metadata
- Proper cleanup on abort with event listeners

### File Attachments

- Converted to base64 in browser
- Sent as `files[]` array on message
- API transforms to OpenRouter's `image_url` format
- Supports images and PDFs

### Storage

All data stored in localStorage via type-safe wrappers in `lib/storage.ts`:
- `claude-conversations` - Array of conversation objects with messages
- `claude-active-conversation` - Currently open conversation ID
- `claude-projects` - User-created projects for organizing conversations
- `claude-theme-settings` - Theme preferences (brightness + color palette)

Each conversation includes:
- `projectId` - Links to a project (or null for "Miscellaneous")
- `title` - Auto-generated or user-edited
- `description` - Optional one-line summary
- `messages[]` - Full conversation history with metadata

### API Key Management

Secure API key handling with hot-reload support:
- **Singleton pattern** (`ApiKeyManager`) with in-memory caching
- **Lazy initialization** - Reads from `.env.local` on first access
- **Hot-reload** - New keys take effect immediately without restart
- **Factory pattern** (`getOpenAIClient()`) - Fresh client per request
- **Settings UI** - Set/update keys via `/api/setting-key` endpoint
- **Secure storage** - Keys stored in `.env.local` (600 permissions)

### Available Models

Defined in `types/chat.ts`:
- `anthropic/claude-sonnet-4.5` (default)
- `anthropic/claude-sonnet-4`
- `anthropic/claude-3.7-sonnet`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-opus-4`

### Theme System

Dual-axis theming with full customization:
- **Brightness modes**: Light, Dark, System (follows OS preference)
- **Color palettes**: 5 options with unique color schemes
  - Yellow (default): Electric Yellow + Vibrant Coral
  - Blue, Purple, Green, Pink
- **CSS variables**: RGB format for dynamic theme switching
- **Tailwind integration**: `theme-primary`, `theme-secondary`, etc.
- **Persistent**: Saved to localStorage, synced across tabs

## Customization

### Change Default Model

Edit `app/api/chat/route.ts`:
```typescript
const selectedModel = model || "anthropic/claude-sonnet-4"; // Change here
```

### Add a New Color Palette

1. Add palette to `ColorPalette` type in `types/chat.ts`
2. Define colors in `lib/colorPalettes.ts` with primary/secondary/bg/text values
3. Update `applyTheme()` in `hooks/useTheme.ts` to set CSS variables
4. Add preview in `components/settings/personalization/ThemePreview.tsx`

### Modify Styles

- `tailwind.config.ts` - Theme colors, fonts, custom utilities
- `app/globals.css` - Global styles, animations, CSS variables
- `STYLEGUIDE.md` - Complete design system documentation
- Component files - Component-specific Tailwind classes

### Add New Features

**Component Guidelines:**
- Create in appropriate feature directory (`chat/`, `sidebar/`, `settings/`)
- Use TypeScript with proper typing from `types/chat.ts`
- Follow design system conventions (see `STYLEGUIDE.md`)
- Use theme-aware colors: `theme-primary`, `dark:` prefix for dark mode
- Export from `index.ts` if creating a new module

**API Route Guidelines:**
1. Create `app/api/[name]/route.ts`
2. Export `POST`, `GET`, or `DELETE` functions
3. Use `getOpenAIClient()` factory for OpenRouter calls
4. Handle errors with appropriate status codes (401, 429, 500)
5. Add client-side function in `lib/chatService.ts` if needed

**Storage Schema Updates:**
1. Update types in `types/chat.ts`
2. Add methods to `lib/storage.ts`
3. Consider migration strategy for existing localStorage data

## Projects & Organization

### What are Projects?

Projects are user-created categories for organizing conversations. Each project has:
- **Name**: Display name (e.g., "Web Development", "Python Scripts")
- **Description**: One-line description for AI matching algorithm
- **Color**: Visual identifier in hex format
- **Conversations**: Linked conversations (or null for "Miscellaneous")

### AI-Powered Project Matching

When creating a conversation, AI can automatically suggest the best project:
1. Conversation gets auto-generated title and description
2. `/api/match-project` analyzes conversation content
3. Compares against existing project descriptions
4. Suggests best match with confidence score
5. User can accept, reject, or manually assign

### Managing Projects

**Create Project:**
- Click "+ New Project" in sidebar
- Add name, description, and pick a color
- Description helps AI match future conversations

**Move Conversations:**
- Right-click conversation → "Move to Project"
- AI suggests best match or manually select
- Conversations without project go to "Miscellaneous"

**Delete Project:**
- Right-click project → "Delete Project"
- Orphaned conversations move to "Miscellaneous"
- Conversation data is preserved

## Component Architecture

### Modular Design Pattern

Components are organized by feature domain with a clear separation of concerns:

**Shell Components** (Container Logic)
- `ChatShell.tsx` - Manages chat state, streaming, file handling
- `SidebarShell.tsx` - Manages sidebar state, project/conversation lists

**Presentational Components** (UI Rendering)
- `ChatMessageList.tsx`, `ChatComposer.tsx`, `ChatHeader.tsx`
- `ConversationListItem.tsx`, `ProjectSection.tsx`

**Feature Components** (Self-contained Features)
- `ModelSelector.tsx` - Model selection dropdown
- `ProjectModal.tsx` - Create/edit projects
- `SettingsMenu.tsx` - Settings modal with tabs

### State Management
- **No global state library** - Component state with props drilling
- **localStorage sync** - Managed via `lib/storage.ts` helpers
- **URL state** - None (all state in localStorage)

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - New chat
- `⌘B` / `Ctrl+B` - Toggle sidebar
- `Enter` - Send message
- `Shift+Enter` - New line in composer

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

### API Key Issues

**401 Unauthorized Error:**
1. Check `OPENROUTER_API_KEY` in `.env.local` is valid
2. Verify key starts with `sk-or-v1-`
3. Try setting key via Settings UI (triggers hot-reload)
4. Get a new key at [openrouter.ai/keys](https://openrouter.ai/keys)

**API Key Not Detected:**
- Restart dev server after manually editing `.env.local`
- Or use Settings UI which applies immediately

### Streaming Issues

**Responses Not Streaming:**
- Ensure modern browser (Chrome 80+, Firefox 65+, Safari 14.1+)
- Check browser console for `ReadableStream` support
- Verify no browser extensions blocking streaming

**Stream Cuts Off Mid-Response:**
- Check network connection stability
- Look for 429 rate limit errors in Network tab
- OpenRouter free tier has rate limits

### UI Issues

**No Conversations Showing:**
- Create a new chat with `⌘K` / `Ctrl+K`
- Check localStorage is enabled (not in private/incognito mode)
- Open browser DevTools → Application → Local Storage

**Theme Not Persisting:**
- Verify localStorage is enabled
- Check `claude-theme-settings` key exists
- Try clearing cache and resetting theme

**Sidebar Not Responding:**
- Toggle with `⌘B` / `Ctrl+B`
- Check for JavaScript errors in console
- Try refreshing the page

### Development Issues

**TypeScript Errors:**
```bash
yarn tsc --noEmit  # Check for type errors
```

**Build Fails:**
1. Clear `.next/` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && yarn install`
3. Check for TypeScript errors

**Port 3000 Already in Use:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill
# Or use different port
yarn dev -p 3001
```

## Contributing

### Code Standards

- **TypeScript**: All new code must include proper types
- **Design System**: Follow conventions in `STYLEGUIDE.md`
- **Formatting**: Use project's ESLint config (`yarn lint`)
- **Components**: Place in appropriate feature directory
- **Theme Support**: Test both light and dark modes with all 5 palettes

### Before Submitting

1. **Type check**: `yarn tsc --noEmit`
2. **Lint**: `yarn lint`
3. **Build**: `yarn build` (ensure no build errors)
4. **Test manually**:
   - Test with and without API key configured
   - Verify responsive design on mobile
   - Check dark mode compatibility
   - Test keyboard shortcuts
   - Verify localStorage persistence

### Guidelines

- Keep components focused and single-purpose
- Use type-safe localStorage wrappers from `lib/storage.ts`
- Handle API errors gracefully with user-friendly messages
- Add JSDoc comments for complex functions
- Follow existing naming conventions

## Design System

This project includes a comprehensive design system documented in `STYLEGUIDE.md`.

### Key Design Principles

1. **Bold & Modern**: High contrast with vibrant accent colors
2. **Consistent Spacing**: 4px/8px grid system
3. **Smooth Transitions**: Everything animates (250-300ms)
4. **Typography-First**: Clean, readable Inter font at 18px base
5. **Subtle Depth**: Light shadows and borders, no heavy 3D effects
6. **Accessibility**: High contrast ratios, visible focus states

### Custom Tailwind Utilities

```css
/* Border Radius */
rounded-claude-sm  /* 8px */
rounded-claude-md  /* 12px */
rounded-claude-lg  /* 16px */

/* Shadows */
shadow-claude-sm   /* Subtle elevation */
shadow-claude-md   /* Cards, sidebar */
shadow-claude-lg   /* Dropdowns, modals */

/* Theme Colors */
theme-primary      /* Dynamic primary color */
theme-primary-hover
theme-secondary
theme-primary-bg   /* Background tint */
theme-primary-text /* Text color */
```

### Typography Scale

- **Hero**: 96px - Large landing page text
- **Section**: 48px - Major section headings
- **Body**: 18px - Base text size (default)
- **Nav**: 14px - UI elements
- **Label**: 12px - Small labels

See `STYLEGUIDE.md` for complete documentation.

## Related Documentation

- **CLAUDE.md** - AI-focused developer documentation
- **STYLEGUIDE.md** - Complete design system reference
- **docs/features/** - Feature implementation plans
- **docs/refactor/** - Architecture decisions

## License

MIT
