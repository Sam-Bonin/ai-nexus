# Settings API Implementation Plan

## Overview

This document outlines the implementation plan for a secure, user-friendly API key management system with hot-reload capabilities. The solution allows users to configure their OpenRouter API key through a settings modal without requiring server restarts.

## Core Problem

Currently, all 4 API routes (`chat`, `generate-title`, `generate-description`, `match-project`) initialize the OpenAI client at module load time with `process.env.OPENROUTER_API_KEY`. This creates two problems:
1. No way for users to input their API key through the UI
2. Changing the API key requires a server restart

## Solution Architecture

### In-Memory Cache + Filesystem Persistence

The solution uses a dual-layer approach:
- **Runtime**: In-memory cache (instant reads, immediate effect on updates)
- **Persistence**: `.env.local` file (survives server restarts)

**Key Insight**: The cache is the source of truth during runtime, while the file is the source of truth on server restart.

---

## Component Specifications

### 1. API Key Manager (`lib/apiKeyManager.ts`)

**Purpose**: Singleton class managing the API key lifecycle

**Interface**:
```typescript
class ApiKeyManager {
  private static instance: ApiKeyManager;
  private cachedKey: string | null = null;

  static getInstance(): ApiKeyManager;
  getKey(): string | null;
  setKey(key: string): Promise<void>;
  clearKey(): Promise<void>;
  hasKey(): boolean;
  getLastFourChars(): string | null;
}
```

**Responsibilities**:
- Maintains in-memory cache of the API key
- Reads from `.env.local` on first access (lazy initialization)
- Writes to `.env.local` atomically when key is updated
- Provides thread-safe access to the key

**Implementation Details**:
- Singleton pattern ensures single source of truth
- On first `getKey()` call: checks cache → if empty, reads from `.env.local` → populates cache
- `setKey()`: Updates cache immediately → writes to file → returns success/error
- `clearKey()`: Removes from cache → removes from file
- File operations use `fs.promises` for async/await support
- Atomic writes using `fs.writeFile` with proper permissions (0600)

### 2. OpenAI Client Factory (`lib/openaiClient.ts`)

**Purpose**: Provides OpenAI client instances with current API key

**Interface**:
```typescript
function getOpenAIClient(): OpenAI;
```

**Implementation**:
```typescript
export function getOpenAIClient(): OpenAI {
  const apiKey = ApiKeyManager.getInstance().getKey();

  if (!apiKey) {
    throw new Error('API key not configured. Please set your OpenRouter API key in settings.');
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.YOUR_SITE_NAME || "AI Nexus",
    }
  });
}
```

**Key Benefits**:
- Per-request client creation (reads current key from cache)
- Centralized error handling for missing keys
- Hot-reload support (no module-level initialization)

### 3. Settings API Route (`app/api/settings/route.ts`)

#### GET `/api/settings`

**Purpose**: Check if API key is configured and get metadata

**Response**:
```typescript
{
  hasKey: boolean;
  lastFourChars?: string; // Only if hasKey is true
}
```

**Implementation**:
```typescript
export async function GET() {
  const manager = ApiKeyManager.getInstance();
  const hasKey = manager.hasKey();

  return Response.json({
    hasKey,
    lastFourChars: hasKey ? manager.getLastFourChars() : undefined
  });
}
```

#### POST `/api/settings`

**Purpose**: Test and save API key

**Request Body**:
```typescript
{
  apiKey: string;
  testOnly?: boolean; // If true, test but don't save
}
```

**Response (Success)**:
```typescript
{
  success: true;
  message: string;
  lastFourChars: string;
}
```

**Response (Error)**:
```typescript
{
  success: false;
  error: string; // Detailed error message
}
```

**Implementation Flow**:
1. Validate request body (apiKey is non-empty string)
2. Trim whitespace from key
3. Test key by making real request to OpenRouter:
   ```typescript
   const testClient = new OpenAI({
     baseURL: "https://openrouter.ai/api/v1",
     apiKey: trimmedKey
   });

   await testClient.chat.completions.create({
     model: "anthropic/claude-3.5-sonnet",
     messages: [{ role: "user", content: "test" }],
     max_tokens: 5
   });
   ```
4. If test fails → return error with specific message
5. If `testOnly` is true → return success without saving
6. Otherwise, save to cache and file:
   ```typescript
   await ApiKeyManager.getInstance().setKey(trimmedKey);
   ```
7. Return success with last 4 characters

**Error Handling**:
- 401: "Invalid API key"
- 429: "Rate limit exceeded"
- Network errors: "Unable to connect to OpenRouter"
- Other: Generic error message

#### DELETE `/api/settings`

**Purpose**: Clear the saved API key

**Response**:
```typescript
{
  success: true;
  message: string;
}
```

**Implementation**:
```typescript
export async function DELETE() {
  await ApiKeyManager.getInstance().clearKey();
  return Response.json({
    success: true,
    message: 'API key cleared successfully'
  });
}
```

### 4. Update Existing API Routes

**Files to Modify**:
- `app/api/chat/route.ts`
- `app/api/generate-title/route.ts`
- `app/api/generate-description/route.ts`
- `app/api/match-project/route.ts`

**Changes Required**:

1. **Remove module-level client initialization**:
   ```typescript
   // REMOVE THIS:
   const openai = new OpenAI({
     baseURL: "https://openrouter.ai/api/v1",
     apiKey: process.env.OPENROUTER_API_KEY,
     // ...
   });
   ```

2. **Add client factory import**:
   ```typescript
   import { getOpenAIClient } from '@/lib/openaiClient';
   ```

3. **Get client inside POST handler**:
   ```typescript
   export async function POST(req: NextRequest) {
     try {
       const openai = getOpenAIClient(); // Add this line

       // ... rest of the existing logic
     } catch (error: any) {
       // Handle missing API key error
       if (error.message?.includes('API key not configured')) {
         return new Response(
           JSON.stringify({
             error: 'API key not configured. Please set your OpenRouter API key in settings.',
             requiresSetup: true
           }),
           { status: 401, headers: { 'Content-Type': 'application/json' } }
         );
       }

       // ... existing error handling
     }
   }
   ```

### 5. Settings Modal (`components/settings/SettingsModal.tsx`)

**Props**:
```typescript
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**UI Elements**:

1. **Modal Container**
   - Backdrop with blur effect
   - Centered modal card
   - Close button (X icon top-right)

2. **Header Section**
   - Title: "Settings"
   - Subtitle: "Configure your OpenRouter API key"

3. **Current Status Display**
   - If key exists: "Current key: ••••X7Km" (green indicator)
   - If no key: "No API key configured" (yellow indicator)

4. **API Key Input**
   - Label: "OpenRouter API Key"
   - Input type: password (with show/hide toggle)
   - Placeholder: "sk-or-..."
   - Help text: "Your key is stored securely and never leaves your machine"

5. **Action Buttons**
   - **Test Connection**: Validates key without saving (secondary button)
   - **Save**: Tests and saves key (primary button)
   - **Clear Key**: Removes saved key (danger button, only shown if key exists)
   - **Cancel**: Closes modal without saving

6. **Help Links**
   - Link: "Get your API key from OpenRouter →" (opens in new tab)
   - Link to OpenRouter docs: https://openrouter.ai/keys

7. **Status Messages**
   - Loading spinner during test/save
   - Success: Green checkmark + "API key saved successfully"
   - Error: Red alert + specific error message

**State Management**:
```typescript
const [inputValue, setInputValue] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [currentStatus, setCurrentStatus] = useState<{
  hasKey: boolean;
  lastFourChars?: string;
}>({ hasKey: false });
```

**Behavior**:
- On mount: Fetch current status from `GET /api/settings`
- Test button: POST with `testOnly: true`
- Save button: POST without `testOnly`
- Clear button: DELETE request (with confirmation dialog)
- Auto-close on successful save after 1.5s
- Escape key to close
- Click outside to close

### 6. Settings Hook (`hooks/useSettings.ts`)

**Purpose**: Client-side state management for settings

**Interface**:
```typescript
interface UseSettingsResult {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  status: {
    hasKey: boolean;
    lastFourChars?: string;
  } | null;

  isLoading: boolean;
  error: string | null;

  testKey: (key: string) => Promise<boolean>;
  saveKey: (key: string) => Promise<boolean>;
  clearKey: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}
```

**Implementation**:
```typescript
export function useSettings(): UseSettingsResult {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshStatus = async () => {
    const response = await fetch('/api/settings');
    const data = await response.json();
    setStatus(data);
  };

  const testKey = async (key: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, testOnly: true })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Similar implementations for saveKey and clearKey

  return {
    isOpen,
    openSettings: () => setIsOpen(true),
    closeSettings: () => setIsOpen(false),
    status,
    isLoading,
    error,
    testKey,
    saveKey,
    clearKey,
    refreshStatus
  };
}
```

### 7. UI Integration

#### ChatHeader Component

**Changes**:
1. Add settings button (gear icon) next to theme toggle
2. Click opens settings modal
3. Show warning indicator if no API key configured

**Implementation**:
```typescript
import { Settings } from 'lucide-react';

// Inside component:
<button
  onClick={onOpenSettings}
  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
  title="Settings (⌘,)"
>
  <Settings className="w-5 h-5" />
  {!hasApiKey && (
    <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full" />
  )}
</button>
```

#### ChatShell Component

**Changes**:
1. Add settings modal state
2. Check for API key on mount
3. Auto-open settings if no key exists
4. Add keyboard shortcut (⌘/Ctrl + ,)
5. Listen for 401 errors and open settings

**Implementation**:
```typescript
const settings = useSettings();

useEffect(() => {
  settings.refreshStatus().then(() => {
    if (!settings.status?.hasKey) {
      settings.openSettings();
    }
  });
}, []);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      settings.openSettings();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### useChatController Hook

**Changes**:
1. Add error handling for 401 responses
2. Expose method to trigger settings modal
3. Show user-friendly error messages

**Implementation**:
```typescript
catch (err: any) {
  if (err.message?.includes('API key not configured') || err.status === 401) {
    setError('API key not configured. Please update your settings.');
    // Trigger settings modal via event or callback
    window.dispatchEvent(new CustomEvent('openSettings'));
  } else {
    setError(err.message || 'An error occurred. Please try again.');
  }
}
```

---

## Security Specifications

### Key Storage Security

✅ **Server-Side Only**
- API key stored in `.env.local` (server-side file system)
- Cached in Node.js memory (server process)
- Never transmitted to client
- Never logged to console or files

✅ **File Permissions**
- `.env.local` created with mode 0600 (owner read/write only)
- Already in `.gitignore` (Next.js default)
- Write operations are atomic
- Handle permission errors gracefully

✅ **Validation Before Storage**
- Test key with actual OpenRouter API request
- Validate format (non-empty, trimmed string)
- Reject invalid keys before saving
- Clear error messages without exposing key content

✅ **API Response Security**
- GET endpoint returns only last 4 characters
- Full key never included in responses
- Error messages don't leak key information
- No key exposure in stack traces

### UI Security

✅ **Input Field Protection**
- Default type: password (masked input)
- Optional show/hide toggle
- No browser autocomplete
- No form autofill
- Clear clipboard after sensitive operations

✅ **Network Security**
- All requests over HTTPS in production
- CSRF protection via Next.js
- No key transmission to client-side analytics

---

## Performance Considerations

### Read Operations
- **Frequency**: Every API request (chat, title generation, etc.)
- **Latency**: ~0.1ms (in-memory cache lookup)
- **Impact**: Negligible (faster than env var access)

### Write Operations
- **Frequency**: Only when user updates/clears key (rare)
- **Latency**: ~10ms (filesystem write)
- **Impact**: User-initiated action, acceptable delay

### Memory Usage
- **Cache**: ~100 bytes (single string)
- **Overhead**: Negligible (singleton pattern)

### Streaming Performance
- **No impact**: Client factory is called once per request
- **No overhead**: Same as current implementation after client creation

---

## File Structure

```
lib/
  apiKeyManager.ts          [NEW] Singleton API key cache manager
  openaiClient.ts           [NEW] OpenAI client factory function
  storage.ts                [EXISTS] No changes needed

app/api/
  settings/
    route.ts                [NEW] GET/POST/DELETE endpoints
  chat/route.ts             [MODIFY] Use getOpenAIClient()
  generate-title/route.ts   [MODIFY] Use getOpenAIClient()
  generate-description/     [MODIFY] Use getOpenAIClient()
    route.ts
  match-project/route.ts    [MODIFY] Use getOpenAIClient()

components/
  settings/
    SettingsModal.tsx       [NEW] Main settings modal UI
    ApiKeyInput.tsx         [NEW] Reusable masked input component
  chat/
    ChatHeader.tsx          [MODIFY] Add settings button
    ChatShell.tsx           [MODIFY] Add settings modal, keyboard shortcut

hooks/
  useSettings.ts            [NEW] Settings state management
  useChatController.ts      [MODIFY] Add 401 error handling

.env.local                  [AUTO-CREATED] Generated by settings API
.env.example                [MODIFY] Update documentation
```

---

## Testing Checklist

### Functional Tests

- [ ] First launch without key → settings modal auto-opens
- [ ] Enter valid key → test succeeds → save succeeds
- [ ] Enter invalid key → test fails → error shown → key not saved
- [ ] Test connection button validates without saving
- [ ] Save button tests and saves
- [ ] Clear key button removes key (with confirmation)
- [ ] Show/hide password toggle works
- [ ] Settings modal closes on successful save
- [ ] Settings modal closes on Escape key
- [ ] Settings modal closes on outside click

### Hot-Reload Tests

- [ ] Update key in settings → new key works immediately
- [ ] No server restart required after key change
- [ ] Can send message immediately after saving key
- [ ] All 4 API routes use new key instantly

### Error Handling Tests

- [ ] Missing key → 401 error → helpful message → auto-open settings
- [ ] Invalid key → test fails → specific error message
- [ ] Network error during test → appropriate error message
- [ ] Rate limit error → appropriate error message
- [ ] File write error → cache rollback → error shown

### Persistence Tests

- [ ] Server restart → key persists from .env.local
- [ ] Cache repopulates from file on first access
- [ ] Cleared key remains cleared after restart

### Security Tests

- [ ] GET /api/settings never returns full key
- [ ] API key not visible in browser DevTools
- [ ] API key not in network requests
- [ ] .env.local has correct permissions (0600)
- [ ] .env.local in .gitignore

### UX Tests

- [ ] Keyboard shortcut (⌘,) opens settings
- [ ] Current key status displayed (last 4 chars)
- [ ] Loading states show during async operations
- [ ] Success messages clear and visible
- [ ] Error messages clear and actionable
- [ ] Link to OpenRouter docs works

---

## Implementation Order

1. **Phase 1: Core Infrastructure**
   - Create `lib/apiKeyManager.ts`
   - Create `lib/openaiClient.ts`
   - Create `app/api/settings/route.ts`

2. **Phase 2: Update API Routes**
   - Modify all 4 API routes to use `getOpenAIClient()`
   - Add 401 error handling

3. **Phase 3: UI Components**
   - Create `components/settings/SettingsModal.tsx`
   - Create `hooks/useSettings.ts`

4. **Phase 4: Integration**
   - Update `ChatHeader.tsx`
   - Update `ChatShell.tsx`
   - Update `useChatController.ts`

5. **Phase 5: Testing**
   - Manual testing of all flows
   - Test hot-reload functionality
   - Test persistence across restarts

---

## Success Criteria

✅ **Security**: API key never exposed to client, stored securely on server

✅ **Convenience**: Hot-reload works without server restart

✅ **UX**: Intuitive settings modal with clear feedback

✅ **Reliability**: Graceful error handling and recovery

✅ **Performance**: No noticeable impact on request latency

✅ **Maintainability**: Clean code with centralized key management
