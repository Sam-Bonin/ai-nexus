# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Nexus** is a Next.js-based Claude.ai clone that uses OpenRouter API to access Claude models with streaming responses, file attachments (images/PDFs), and extended thinking mode. All data is stored client-side in localStorage—no database required.


## IMPORTANT RULES 

 1. DO NOT run yarn dev. That is for me only. 
 2. If you are asked to do a task that will use a lot of tokens, use your task tool to offload the job to a sub agent. Make sure you give clear instructions and supporting considerations. Give full context. 
 3. You may not do hacky solutions if something doesn't work. Take your time, think about the correct solution and implement it correct using world class coding patterns.

## Development Commands

```bash
# Development
yarn dev              # Starts Next.js dev server on port 3000

# Type checking
yarn tsc --noEmit    # Run TypeScript type checker without emitting files

# Linting
yarn lint            # Run ESLint checks

# Production
yarn build           # Create production build
yarn start           # Start production server on port 3000
```

## Architecture Overview

### Three-Layer Architecture

1. **Frontend (React/Next.js)**
   - Components manage UI state, streaming responses, and localStorage
   - Main components: `ChatShell`, `ChatComposer`, `ChatMessageList`, `SidebarShell`
   - All state is ephemeral except what's saved to localStorage

2. **Backend (Next.js API Routes)**
   - `/app/api/chat/route.ts` - Main streaming endpoint for chat completions
   - `/app/api/generate-title/route.ts` - Auto-generate conversation titles
   - `/app/api/generate-description/route.ts` - Auto-generate conversation descriptions
   - `/app/api/match-project/route.ts` - AI-powered project matching for conversations
   - `/app/api/setting-key/route.ts` - Securely manage API keys in `.env.local`
   - API routes proxy requests to OpenRouter and handle streaming

3. **External (OpenRouter API)**
   - Routes to Claude models from Anthropic
   - Supports Claude Sonnet 4.5, 4, 3.7, 3.5, and Opus 4

### Key Data Flow

```
User Input → ChatComposer → /api/chat → OpenRouter → Claude
                ↓                              ↓
         localStorage ←── Streaming Response ←──
```

### Streaming Architecture

- **Server**: Uses OpenAI SDK's streaming (`stream: true`) and `ReadableStream` to forward chunks
- **Client**: Uses `fetch()` + `TextDecoder` to read streamed chunks in real-time
- **Abort handling**: `AbortController` cancels mid-stream requests when user stops generation
- **Special delimiters**:
  - `___THINKING___` prefix for reasoning/thinking content
  - `___METADATA___` suffix with JSON containing tokens, duration, timestamp

### API Key Management

- API keys are stored in `.env.local` for server-side security
- `ApiKeyManager` singleton pattern with in-memory caching for hot-reload support
- `getOpenAIClient()` factory function creates fresh OpenAI client per request
- API key can be set/updated via `/api/setting-key` endpoint without restart

### File Attachments

- Files converted to base64 in browser (`lib/file.ts`)
- Sent as `files[]` array on message object
- API route transforms to OpenRouter's `image_url` format for multimodal messages
- Supports images (PNG, JPG, etc.) and PDFs

### Storage Layer

- **All data in localStorage** (no database)
- Main keys: `claude-conversations`, `claude-active-conversation`, `claude-theme-settings`, `claude-projects`
- `lib/storage.ts` provides type-safe localStorage wrappers
- Projects organize conversations (null projectId = "Miscellaneous")

## Project Structure

```
app/
├── api/                    # Next.js API routes (server-side)
│   ├── chat/route.ts      # Streaming chat endpoint
│   ├── generate-title/route.ts
│   ├── generate-description/route.ts
│   ├── match-project/route.ts
│   └── setting-key/route.ts
├── layout.tsx             # Root layout with theme provider
├── page.tsx               # Main chat page
└── globals.css            # Global styles + CSS variables

components/
├── chat/                  # Chat interface components
│   ├── ChatShell.tsx     # Main container, manages state & streaming
│   ├── ChatComposer.tsx  # Input area with file attachments
│   ├── ChatMessageList.tsx
│   ├── ChatHeader.tsx
│   ├── ModelSelector.tsx
│   └── AttachmentPreviewList.tsx
├── sidebar/               # Sidebar components
│   ├── SidebarShell.tsx  # Main sidebar container
│   ├── ProjectSection.tsx
│   ├── ProjectModal.tsx
│   ├── ConversationListItem.tsx
│   ├── ConversationMenu.tsx
│   └── MoveConversationModal.tsx
├── settings/              # Settings UI
│   ├── SettingsMenu.tsx
│   ├── APISettings.tsx
│   ├── AboutSettings.tsx
│   ├── AccountSettings.tsx
│   ├── PrivacySettings.tsx
│   └── personalization/
│       ├── ThemePreview.tsx
│       └── PersonalizationSettings.tsx
├── Message.tsx            # Message renderer with markdown
└── CodeBlock.tsx          # Syntax-highlighted code blocks

lib/
├── openaiClient.ts        # Factory for OpenAI client instances
├── apiKeyManager.ts       # Singleton API key manager
├── storage.ts             # localStorage helpers
├── chatService.ts         # Chat API client functions
├── file.ts                # File handling utilities
├── format.ts              # Formatting utilities
├── colorPalettes.ts       # Theme color definitions
└── utils.ts               # General utilities

types/
└── chat.ts                # TypeScript interfaces for:
                           # Message, Conversation, Project, Model, ThemeSettings, etc.

hooks/
└── useTheme.ts            # Theme management hook
```

## Design System

### Colors
- **Primary accents**: Electric Yellow (`#FFD50F`), Vibrant Coral (`#FD765B`)
- **Theme system**: CSS variables with RGB format for dynamic palettes
  - `theme-primary`, `theme-primary-hover`, `theme-secondary`
  - Palettes: `yellow` (default), `blue`, `purple`, `green`, `pink`
- **Neutrals**: Pure Black (`#000000`), Dark Gray (`#1A1A1A`), Pure White (`#FFFFFF`)
- **Dark mode**: Use `dark:` prefix for Tailwind classes

### Custom Tailwind Utilities
- **Border radius**: `rounded-claude-sm` (8px), `rounded-claude-md` (12px), `rounded-claude-lg` (16px)
- **Shadows**: `shadow-claude-sm`, `shadow-claude-md`, `shadow-claude-lg`
- **Typography**: Custom font sizes like `text-body` (18px base), `text-hero` (96px), `text-section` (48px)
- **Font weights**: `font-light` (300, default body), `font-medium` (500, UI elements)

### Common Patterns
```tsx
// Hover with smooth transition
hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors

// Borders with theme awareness
border border-pure-black/10 dark:border-pure-white/10

// Theme-aware dynamic colors
bg-theme-primary text-theme-primary-text hover:bg-theme-primary-hover
```

## Type System

All types defined in `types/chat.ts`:

- **Message**: `{ role, content, thinking?, files?, metadata? }`
- **Conversation**: `{ id, title, description?, messages[], projectId, createdAt, updatedAt }`
- **Project**: `{ id, name, description, color, createdAt, updatedAt }`
- **ThemeSettings**: `{ brightness: 'light'|'dark'|'system', palette: 'yellow'|'blue'|'purple'|'green'|'pink' }`
- **ModelId**: Union type of available Claude models

## Important Implementation Details

### Component Architecture

Components are organized by feature domain:
- **`chat/`** - All chat UI components (composer, message list, header, etc.)
- **`sidebar/`** - Sidebar and project management
- **`settings/`** - Settings modal and panels

Main state management happens in `ChatShell.tsx` which handles:
- Message streaming
- Conversation persistence
- File attachment handling
- Abort/cancel operations

### Theme System

- **Dual-axis theming**: Brightness (light/dark/system) + Color palette (5 options)
- CSS variables in `globals.css` define `--color-primary`, `--color-secondary`, etc.
- `useTheme.ts` hook manages theme state and applies classes to `<html>` element
- Tailwind config uses RGB format: `rgb(var(--color-primary) / <alpha-value>)`

### Modular Component Pattern

Components are broken down into focused, single-responsibility modules:
- **Shell components** (`ChatShell`, `SidebarShell`): Container logic and state management
- **Presentational components**: UI rendering without complex state
- **Feature components**: Self-contained features like `ModelSelector`, `ProjectModal`

### API Route Patterns

- All routes return JSON or streaming responses
- Error handling includes status codes (401, 429, 500) with descriptive messages
- API key validation happens in `getOpenAIClient()` factory
- Streaming routes use `ReadableStream` with proper cleanup on abort

## Environment Variables

Required in `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-...    # Get from openrouter.ai
YOUR_SITE_URL=http://localhost:3000 # Optional: for OpenRouter referrer
YOUR_SITE_NAME=AI Nexus             # Optional: for OpenRouter headers
```

API key can also be set via Settings UI which calls `/api/setting-key` endpoint.

## Features

- **Streaming responses** with real-time UI updates
- **Extended thinking mode** with separate reasoning display
- **File attachments** (images, PDFs) with base64 encoding
- **5 Claude models** selectable per conversation
- **Projects** for organizing conversations with AI-powered auto-categorization
- **Theme customization** with 5 color palettes + light/dark/system modes
- **Export conversations** to Markdown or JSON
- **Token usage tracking** with metadata per message
- **Conversation management**: title generation, descriptions, move/delete operations

## Common Tasks

### Adding a New API Route

1. Create `app/api/[name]/route.ts`
2. Export `POST` or `GET` function
3. Use `getOpenAIClient()` for API calls
4. Handle errors with appropriate status codes
5. Update `lib/chatService.ts` if adding client-side function

### Adding a New Component

1. Create in appropriate `components/` subdirectory
2. Use TypeScript with proper typing from `types/chat.ts`
3. Follow design system conventions (see STYLEGUIDE.md)
4. Use theme-aware colors: `theme-primary`, `dark:` prefix
5. Export from `index.ts` if creating a new module

## Documentation

Additional documentation in `docs/`:
- `docs/features/` - Feature implementation plans and specs
- `docs/refactor/` - Refactoring and architecture decisions

