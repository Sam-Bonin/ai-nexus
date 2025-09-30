# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14+ clone of Claude.ai using OpenRouter API for Claude Sonnet 4.5, featuring streaming chat, conversation history, file attachments (images/PDFs), markdown rendering, and extended thinking mode.

## Common Commands

```bash
# Development (npm)
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint

# Development (yarn)
yarn dev                 # Start dev server on localhost:3000
yarn build               # Production build
yarn start               # Start production server
yarn lint                # Run ESLint

# Type checking
npx tsc --noEmit        # Verify TypeScript types (npm)
yarn tsc --noEmit       # Verify TypeScript types (yarn)
```

## Environment Setup

Required `.env.local` file:
```
OPENROUTER_API_KEY=your-key-here
YOUR_SITE_URL=http://localhost:3000
YOUR_SITE_NAME=Claude AI Clone
```

## Architecture

### API Routes (`app/api/`)

- **`chat/route.ts`**: Main streaming endpoint
  - Transforms messages to support multimodal content (images, PDFs)
  - Streams responses chunk-by-chunk using ReadableStream
  - Embeds metadata with `___METADATA___` delimiter
  - Embeds thinking content with `___THINKING___` delimiter when reasoning enabled
  - Handles image_url format for file attachments (base64 encoded)

- **`generate-title/route.ts`**: Auto-generates conversation titles from first exchange

### Core Components (`components/`)

- **`Chat.tsx`**: Main chat interface managing state, streaming, file uploads, model selection
  - Handles AbortController for canceling requests
  - Processes chunked streaming responses
  - Manages localStorage for conversation persistence

- **`Message.tsx`**: Renders individual messages with markdown, thinking blocks, metadata display

- **`CodeBlock.tsx`**: Syntax-highlighted code blocks with copy functionality

- **`Sidebar.tsx`**: Conversation history with rename/export/delete actions

### State Management

- Uses React useState for all state (no external state library)
- LocalStorage for persistence via `lib/storage.ts`
- Conversation format defined in `types/chat.ts`

### Data Flow

1. User submits message in `Chat.tsx`
2. POST to `/api/chat` with messages array, optional model ID, thinking flag
3. API transforms messages (handles file attachments), calls OpenRouter
4. Response streams back, parsed in `Chat.tsx`:
   - Regular content appended to assistant message
   - `___THINKING___` prefix indicates reasoning content
   - `___METADATA___` suffix contains token counts, duration, model
5. Conversation saved to localStorage on completion

### File Attachments

- Images and PDFs supported
- Converted to base64 in client, sent as `files` array on message
- API transforms to OpenRouter's `image_url` content format
- Attachments stored in localStorage with conversation

### Model Selection

Available models defined in `types/chat.ts`:
- `anthropic/claude-sonnet-4.5` (default)
- `anthropic/claude-sonnet-4`
- `anthropic/claude-3.7-sonnet`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-opus-4`

### Styling

- Tailwind CSS for all styling
- Theme system in `hooks/useTheme.ts` (light/dark/system)
- Custom animations in `app/globals.css`

## Key Implementation Details

- Streaming uses TextEncoder/TextDecoder for chunk processing
- AbortController pattern for canceling in-flight requests
- LocalStorage keys: `conversations`, `activeConversationId`, `theme`
- Message metadata includes token counts and response duration
- Extended thinking mode adds reasoning parameter to API call, displays thinking separately