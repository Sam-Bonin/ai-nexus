# AI Nexus - Feature Ideas

## 1. Model Picker Global

Allow the user to select from classes of models or specific models under it to be echoed back to the Model Picker UI.

## 2. Onboarding UX and Modals

Implement user onboarding experience and modal dialogs.

## 3. Electron Enhancements

### 3.1. Window State Persistence ⭐️ PRIORITY

- **Current:** Window always opens at 1400x900 in default position
- **Missing:** Remembering window size, position, and state between sessions
- **Impact:** Users have to resize/reposition window every time they open the app

### 3.2. Comprehensive Keyboard Shortcuts ⭐️ PRIORITY

- **Current:** Only Cmd+Q (quit) and Cmd+Option+I (DevTools)
- **Missing:**
  - `Cmd+N` - New conversation
  - `Cmd+W` - Close window (currently just quits)
  - `Cmd+,` - Open settings (macOS standard)
  - `Cmd+F` - Search conversations
  - `Cmd+Shift+N` - New project
  - `Cmd+[` / `Cmd+]` - Navigate between conversations
  - `Cmd+1-9` - Switch between recent conversations

### 3.3. Proper Menu Bar ⭐️ PRIORITY

- **Current:** Only app name submenu (Quit) + Edit menu (copy/paste)
- **Missing:**
  - **File Menu:** New Conversation, Export, Close Window, etc.
  - **View Menu:** Toggle sidebar, zoom in/out, full screen
  - **Window Menu:** Minimize, zoom, bring all to front
  - **Help Menu:** Documentation, report bug, check for updates

### 3.5. Native System Notifications

- **Current:** No notifications
- **Missing:**
  - Notify when long-running response completes (if window is in background)
  - Notify on errors
  - Badge count on dock icon

### 3.6. Window Management Features

- **Current:** Single window, basic controls
- **Missing:**
  - Full screen mode support
  - Minimize to dock (works but no special handling)
  - Zoom button behavior
  - macOS native tabs support (could have multiple conversations in tabs)

### 3.7. Dock Integration

- **Current:** Basic dock icon
- **Missing:**
  - Right-click dock menu with quick actions (New Conversation, Open Recent, etc.)
  - Progress indicator for ongoing operations
  - Badge for unread/processing status

### 3.8. Quit Confirmation

- **Current:** Immediately quits when you Cmd+Q
- **Missing:** "Are you sure?" dialog if conversation is in progress
- **Impact:** Easy to accidentally lose in-progress work

### 3.9. Native File Dialogs

- **Current:** File upload uses HTML input
- **Missing:**
  - Native macOS file picker for attachments
  - Native save dialog for exports (currently downloads as file)

### 3.10. Multiple Window Support

- **Current:** Single window only
- **Missing:** Open multiple conversations in separate windows (like notes apps)