# Settings User Flows & Edge Cases

## Overview

This document details all user flows, UI states, and edge cases for the API key settings feature. Each flow includes step-by-step interactions, expected behavior, and error handling.

---

## Primary User Flows

### Flow 1: First-Time User Setup

**Context**: User opens the app for the first time, no API key configured

**Steps**:
1. User opens application
2. App checks API key status: `GET /api/settings`
   - Response: `{ hasKey: false }`
3. Settings modal automatically opens with welcome state
4. Modal displays:
   - Title: "Welcome to AI Nexus!"
   - Subtitle: "Let's get you set up with your OpenRouter API key"
   - Empty input field with placeholder: "sk-or-..."
   - Help text: "Your key is stored securely and never leaves your machine"
   - Link: "Get your API key from OpenRouter →"
   - Buttons: "Test Connection" (disabled), "Save" (disabled), "Cancel"

5. User enters API key in input field
6. Buttons become enabled: "Test Connection", "Save"
7. User clicks "Test Connection"
   - Button shows loading spinner
   - Request: `POST /api/settings { apiKey: "...", testOnly: true }`
   - System validates key with OpenRouter
   - Success: Green checkmark appears, "Valid API key!" message
   - Failure: Red error message appears with specific reason

8. User clicks "Save" button
   - Button shows loading spinner
   - Request: `POST /api/settings { apiKey: "..." }`
   - System tests and saves key
   - Success:
     - Green checkmark appears
     - "API key saved successfully!" message
     - Modal auto-closes after 1.5 seconds
   - Failure: Red error message appears, modal stays open

9. User can now interact with chat normally

**UI States**:
- **Loading**: Spinner in button, input disabled
- **Success**: Green checkmark icon + success message
- **Error**: Red alert icon + error message
- **Empty Input**: Save/Test buttons disabled

---

### Flow 2: Updating Existing API Key (Hot-Reload)

**Context**: User has an existing API key and wants to change it

**Steps**:
1. User opens settings modal via:
   - Clicking gear icon in header, OR
   - Keyboard shortcut: `⌘/Ctrl + ,`

2. Modal displays current status:
   - Title: "Settings"
   - Current status: "Current key: ••••X7Km" (green indicator)
   - Empty input field with placeholder: "Enter new API key"
   - Buttons: "Test Connection", "Save", "Clear Key", "Cancel"

3. User enters new API key
4. User clicks "Save"
   - Loading spinner appears
   - Request: `POST /api/settings { apiKey: "new-key" }`
   - System validates new key
   - **Key Moment**: If valid, cache updates immediately

5. Success response:
   - "API key updated successfully!" message
   - Updated status: "Current key: ••••Y8Lp"
   - Modal auto-closes after 1.5 seconds

6. **Hot-Reload Verification**:
   - User sends chat message immediately (no page refresh)
   - Request goes to `POST /api/chat`
   - `getOpenAIClient()` reads from cache
   - **New key is used instantly** (no server restart needed)

7. Message streams successfully with new key

**Expected Behavior**:
- Zero downtime between key change and usage
- No server restart required
- No page refresh required
- Immediate effect on all API routes

---

### Flow 3: Testing Connection Before Saving

**Context**: User wants to verify their key works before committing to save

**Steps**:
1. User opens settings modal
2. User enters API key
3. User clicks "Test Connection" (not "Save")
   - Button shows loading spinner
   - Request: `POST /api/settings { apiKey: "...", testOnly: true }`
   - System makes test request to OpenRouter
   - Key is NOT saved to cache or file

4. **If Valid**:
   - Green checkmark appears
   - Message: "✓ Connection successful! Your key is valid."
   - Input field remains filled
   - "Save" button becomes prominent/highlighted
   - User can now click "Save" to persist

5. **If Invalid**:
   - Red error appears
   - Message: "✗ Invalid API key. Please check and try again."
   - Input field remains filled
   - User can edit and retry

6. User clicks "Save" to persist the tested key, or "Cancel" to discard

**Use Case**: User wants confidence before saving, or testing multiple keys

---

### Flow 4: Clearing API Key

**Context**: User wants to remove their saved API key

**Steps**:
1. User opens settings modal
2. Modal shows current key: "Current key: ••••X7Km"
3. User clicks "Clear Key" button (red/danger style)
4. Confirmation dialog appears:
   - Title: "Clear API Key?"
   - Message: "You'll need to enter a new key to continue using the app."
   - Buttons: "Cancel", "Clear Key"

5. User confirms by clicking "Clear Key"
   - Loading spinner appears
   - Request: `DELETE /api/settings`
   - System removes key from cache and file

6. Success response:
   - Status updates to: "No API key configured" (yellow indicator)
   - Input field appears empty
   - "Clear Key" button becomes hidden
   - Success message: "API key cleared"

7. User must enter new key to use app again

**Expected Behavior**:
- Confirmation prevents accidental deletion
- Immediate effect (key no longer works)
- Status reflects cleared state
- File and cache both cleared

---

### Flow 5: Error Recovery from Failed API Request

**Context**: User sends a message but API key is invalid or expired

**Steps**:
1. User types message and clicks send
2. Request goes to `POST /api/chat`
3. `getOpenAIClient()` returns client with current key
4. OpenRouter API responds with 401 Unauthorized

5. **Automatic Error Recovery**:
   - Error caught in `useChatController`
   - Error message displayed: "API key is invalid or expired. Please update your settings."
   - Settings modal automatically opens
   - Modal shows current key with warning indicator
   - Input field pre-focused for quick editing

6. User enters new/corrected key
7. User clicks "Save"
   - Key tested and validated
   - If valid: saved successfully
   - Modal closes

8. **User can retry**:
   - Previous message is still in input field (or can be accessed from history)
   - User clicks send again
   - Message processes successfully with updated key

**Expected Behavior**:
- Graceful error handling
- Auto-open settings on auth errors
- Easy recovery path
- No lost user input

---

## Edge Cases & Error Handling

### Edge Case 1: Network Failure During Key Validation

**Scenario**: User tries to save key but network is unavailable

**Handling**:
1. User clicks "Save" or "Test Connection"
2. Request timeout after 10 seconds
3. Error message: "Unable to connect to OpenRouter. Please check your internet connection."
4. Key is NOT saved
5. User can retry when network is restored

**UI State**:
- Loading spinner disappears
- Error icon appears
- Input remains filled
- Buttons remain enabled for retry

---

### Edge Case 2: Invalid Key Format

**Scenario**: User enters malformed API key

**Handling**:
1. User enters key: "invalid-key-123"
2. User clicks "Test Connection"
3. OpenRouter returns 401
4. Error message: "Invalid API key format. Keys should start with 'sk-or-'."
5. Input remains filled for editing
6. User can correct and retry

**Validation**:
- No client-side format validation (allows flexibility)
- Server-side validation via actual API test
- Specific error messages from OpenRouter

---

### Edge Case 3: File Write Permission Error

**Scenario**: `.env.local` file cannot be written (permissions issue)

**Handling**:
1. User clicks "Save"
2. Key validation succeeds
3. Cache update succeeds
4. File write fails (permission error)
5. **Rollback**: Cache update is reverted
6. Error message: "Unable to save settings. Please check file permissions."
7. Key is NOT saved (consistent state)

**Technical Details**:
- Atomic operation: validate → save cache → save file
- If file save fails, rollback cache
- User sees clear error, can check permissions

---

### Edge Case 4: Concurrent Key Updates

**Scenario**: User opens settings in two browser tabs and updates key in both

**Handling**:
1. Tab A and Tab B both open settings
2. Tab A saves new key: "key-A"
   - Cache updated to "key-A"
   - File written with "key-A"
3. Tab B saves different key: "key-B"
   - Cache updated to "key-B"
   - File overwritten with "key-B"
4. **Result**: Last write wins
5. Both tabs now use "key-B" (cache is shared)

**Expected Behavior**:
- No corruption
- Consistent state
- Last update takes precedence
- File locking prevents partial writes

---

### Edge Case 5: Server Restart During Active Session

**Scenario**: Server restarts while user is chatting

**Handling**:
1. User has valid key saved: "key-ABC"
2. Server restarts (dev mode hot-reload or crash)
3. In-memory cache is cleared
4. User sends message
5. `getOpenAIClient()` called → cache is empty
6. **Cache Repopulation**:
   - First call reads from `.env.local`
   - Populates cache with "key-ABC"
   - Returns client with correct key
7. Message processes successfully

**Expected Behavior**:
- Seamless recovery
- No user intervention needed
- File is source of truth on restart

---

### Edge Case 6: Empty or Whitespace-Only Key

**Scenario**: User submits empty or whitespace-only input

**Handling**:
1. User enters: "   " (spaces only)
2. User clicks "Save"
3. Server trims input: `key.trim()`
4. Validation fails (empty string)
5. Error message: "API key cannot be empty"
6. Key is NOT saved

**Client-Side Prevention**:
- Save/Test buttons disabled when input is empty
- Trimming happens automatically on blur
- Visual indication of invalid state

---

### Edge Case 7: Rate Limiting from OpenRouter

**Scenario**: User tests connection multiple times rapidly

**Handling**:
1. User clicks "Test Connection" repeatedly
2. OpenRouter returns 429 Too Many Requests
3. Error message: "Rate limit exceeded. Please wait a moment before trying again."
4. User waits (OpenRouter rate limit window)
5. User retries successfully

**Prevention**:
- Disable button during test (prevent rapid clicks)
- Show loading state
- Clear error message with guidance

---

### Edge Case 8: Key Exists in .env.local but Not in Cache

**Scenario**: Server starts with existing `.env.local` file

**Handling**:
1. User has previously saved key to `.env.local`: "key-XYZ"
2. Server restarts (cache is empty)
3. User opens app
4. App checks: `GET /api/settings`
5. `ApiKeyManager.getInstance().hasKey()` called
6. Cache is empty → reads from `.env.local`
7. Populates cache with "key-XYZ"
8. Returns: `{ hasKey: true, lastFourChars: "kXYZ" }`
9. User can chat immediately (no re-entry needed)

**Expected Behavior**:
- Lazy initialization
- File is source of truth on cold start
- Seamless user experience

---

### Edge Case 9: .env.local File Corrupted

**Scenario**: `.env.local` file has invalid content

**Handling**:
1. File contains: `OPENROUTER_API_KEY=sk-or-12%$invalid`
2. Server starts, cache reads file
3. User sends message
4. OpenRouter returns 401 (invalid key)
5. Error recovery flow triggers (see Flow 5)
6. Settings modal opens automatically
7. User enters correct key
8. File overwritten with valid key

**Prevention**:
- File validation on read (optional)
- Graceful fallback to auth error
- User can always fix via UI

---

### Edge Case 10: Key Works Initially Then Expires

**Scenario**: User's API key is revoked or expires

**Handling**:
1. User has valid key: "key-OLD"
2. Key works for several days
3. User revokes key in OpenRouter dashboard
4. User sends message
5. OpenRouter returns 401
6. Error recovery flow triggers
7. Modal opens with error: "Your API key is no longer valid"
8. User enters new key
9. New key saved and works immediately

**User Communication**:
- Clear error message indicating expiration
- Link to OpenRouter dashboard
- Easy update path

---

## UI States Reference

### Settings Modal States

#### 1. Empty State (No Key)
- **Title**: "Settings"
- **Status**: "No API key configured" (yellow indicator)
- **Input**: Empty, focused
- **Buttons**:
  - Test Connection: Disabled
  - Save: Disabled
  - Clear Key: Hidden
  - Cancel: Enabled

#### 2. Existing Key State
- **Title**: "Settings"
- **Status**: "Current key: ••••X7Km" (green indicator)
- **Input**: Empty (placeholder: "Enter new API key")
- **Buttons**:
  - Test Connection: Enabled (when input filled)
  - Save: Enabled (when input filled)
  - Clear Key: Visible, enabled
  - Cancel: Enabled

#### 3. Loading State (Testing)
- **Status**: Unchanged
- **Input**: Disabled
- **Buttons**:
  - Test Connection: Spinner, "Testing..."
  - Save: Disabled
  - Clear Key: Disabled
  - Cancel: Enabled

#### 4. Loading State (Saving)
- **Status**: Unchanged
- **Input**: Disabled
- **Buttons**:
  - Test Connection: Disabled
  - Save: Spinner, "Saving..."
  - Clear Key: Disabled
  - Cancel: Disabled

#### 5. Success State (Test)
- **Status**: Unchanged
- **Message**: "✓ Connection successful! Your key is valid." (green banner)
- **Input**: Filled, enabled
- **Buttons**:
  - Test Connection: Enabled
  - Save: Enabled, highlighted/primary
  - Clear Key: Enabled (if had existing key)
  - Cancel: Enabled

#### 6. Success State (Save)
- **Status**: "Current key: ••••Y8Lp" (updated, green)
- **Message**: "✓ API key saved successfully!" (green banner)
- **Input**: Cleared
- **Modal**: Auto-closes after 1.5s

#### 7. Error State
- **Status**: Unchanged
- **Message**: "✗ [Specific error message]" (red banner)
- **Input**: Filled, enabled
- **Buttons**: All enabled for retry

#### 8. Confirmation Dialog (Clear Key)
- **Overlay**: Confirmation modal on top of settings modal
- **Title**: "Clear API Key?"
- **Message**: "You'll need to enter a new key to continue using the app."
- **Buttons**: "Cancel", "Clear Key" (danger)

---

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘/Ctrl + ,` | Open settings | Anywhere in app |
| `Escape` | Close settings | Settings modal open |
| `Enter` | Save key | Input focused, valid key entered |
| `⌘/Ctrl + K` | New chat | Existing shortcut (unchanged) |
| `⌘/Ctrl + B` | Toggle sidebar | Existing shortcut (unchanged) |

---

## Error Messages Reference

### Validation Errors
- **Empty Key**: "API key cannot be empty"
- **Invalid Format**: "Invalid API key. Please check and try again."
- **Test Failed**: "Unable to verify API key. Please check the key and try again."

### Network Errors
- **Connection Timeout**: "Unable to connect to OpenRouter. Please check your internet connection."
- **Network Unavailable**: "No internet connection. Please check your network."
- **DNS Resolution Failed**: "Unable to reach OpenRouter. Please check your network settings."

### API Errors
- **401 Unauthorized**: "Invalid API key. Please check your key or generate a new one."
- **429 Rate Limited**: "Rate limit exceeded. Please wait a moment before trying again."
- **500 Server Error**: "OpenRouter service error. Please try again later."

### File System Errors
- **Write Permission Denied**: "Unable to save settings. Please check file permissions."
- **File System Full**: "Unable to save settings. Disk space is full."
- **File Locked**: "Unable to save settings. File is in use by another process."

### Generic Fallback
- **Unknown Error**: "An unexpected error occurred. Please try again."

---

## Success Messages Reference

- **Key Validated**: "✓ Connection successful! Your key is valid."
- **Key Saved**: "✓ API key saved successfully!"
- **Key Updated**: "✓ API key updated successfully!"
- **Key Cleared**: "✓ API key cleared successfully"
- **Test Successful**: "✓ Connection test successful"

---

## Mobile Responsiveness

### Small Screens (< 640px)

**Settings Modal**:
- Full screen on mobile (no backdrop)
- Slide up animation
- Close button in top-left
- Stack buttons vertically
- Larger touch targets (min 44px)

**Header Button**:
- Gear icon remains visible
- Tooltip hidden on mobile
- Tap to open settings

### Medium Screens (640px - 1024px)

**Settings Modal**:
- Centered modal (80% width)
- Backdrop with blur
- Standard button layout

---

## Accessibility

### Keyboard Navigation
- Tab order: Input → Test → Save → Clear → Cancel
- Focus visible at all times
- Escape key closes modal
- Enter key submits form

### Screen Readers
- Modal has `role="dialog"`
- Status messages announced via `aria-live`
- Buttons have descriptive labels
- Error messages associated with input via `aria-describedby`

### Visual Indicators
- Loading states have both spinner and text
- Success/error states have both icon and text
- Color is not the only indicator (icons + text)

---

## Performance Expectations

### Response Times
- **GET /api/settings**: < 50ms (cache lookup)
- **POST /api/settings** (test): 500ms - 2s (network to OpenRouter)
- **POST /api/settings** (save): 500ms - 2s + 10ms (network + file write)
- **DELETE /api/settings**: < 100ms (cache clear + file delete)

### UI Responsiveness
- Modal open animation: 200ms
- Modal close animation: 150ms
- Button state transitions: 100ms
- Input field interactions: < 16ms (60fps)

### Timeout Settings
- Network request timeout: 10s
- Loading spinner minimum: 300ms (prevent flash)
- Success message auto-dismiss: 1.5s

---

## Testing Scenarios

### Manual Testing Checklist

#### Happy Path
- [ ] First-time setup flow completes successfully
- [ ] Existing key shows correct last 4 characters
- [ ] Test connection validates correctly
- [ ] Save updates key immediately
- [ ] Clear key removes key successfully
- [ ] Settings open via gear icon
- [ ] Settings open via keyboard shortcut
- [ ] Settings close via Escape key
- [ ] Settings close via outside click

#### Error Handling
- [ ] Invalid key shows appropriate error
- [ ] Network error shows appropriate message
- [ ] Rate limit error shows wait message
- [ ] Empty input keeps buttons disabled
- [ ] File permission error handled gracefully

#### Hot-Reload
- [ ] Updated key works in next chat message
- [ ] No server restart needed
- [ ] All API routes use new key immediately
- [ ] Server restart preserves key from file

#### Edge Cases
- [ ] Concurrent updates (two tabs) handled
- [ ] Rapid button clicks prevented
- [ ] Whitespace-only input rejected
- [ ] Modal state resets between opens
- [ ] Confirmation dialog prevents accidental clear

---

## Future Enhancements

### Potential Additions
1. **Key Rotation**: Support for multiple keys with automatic failover
2. **Usage Tracking**: Show API usage stats in settings
3. **Key Expiry Warnings**: Notify before key expires
4. **Backup Keys**: Configure fallback key
5. **Team Sharing**: Share keys across team members (enterprise)
6. **Audit Log**: Track when keys were changed

### Not In Scope (Current Version)
- Multiple key management
- Key sharing or synchronization
- Usage analytics
- Cost tracking
- Key expiry notifications
