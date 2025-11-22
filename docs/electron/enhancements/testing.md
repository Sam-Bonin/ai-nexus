# Native macOS Features - Manual Testing Guide

## Overview
This document provides step-by-step manual testing procedures for all native macOS enhancements. Each feature has specific test cases with expected results.

**Prerequisites:**
- macOS 10.13+ (High Sierra or later)
- AI Nexus installed in `/Applications/`
- OpenRouter API key configured
- Clean test environment (no existing window-state.json)

---

## Test Environment Setup

### Before Each Test Session
1. **Clean Slate:**
   ```bash
   # Delete all user data
   rm -rf ~/Library/Application\ Support/ai-nexus/

   # Verify app is not running
   killall "AI Nexus" 2>/dev/null
   ```

2. **Development Mode:**
   ```bash
   # Terminal 1: Start Next.js dev server
   yarn dev

   # Terminal 2: Start Electron
   yarn electron
   ```

3. **Production Mode:**
   ```bash
   # Build production app
   yarn build:electron

   # Launch from Applications
   open /Applications/AI\ Nexus.app
   ```

---

## Feature 1: Window State Persistence

### Test 1.1: Window Size Persistence
**Steps:**
1. Launch AI Nexus
2. Note default window size (should be 1400x900)
3. Resize window to 1000x700 (drag corner)
4. Quit app (Cmd+Q)
5. Relaunch app

**Expected:**
- Window opens at 1000x700 (last size)
- Not default 1400x900

**Verify:**
```bash
cat ~/Library/Application\ Support/ai-nexus/window-state.json
# Should show: "width": 1000, "height": 700
```

### Test 1.2: Window Position Persistence
**Steps:**
1. Launch AI Nexus
2. Move window to top-left corner of screen
3. Quit app (Cmd+Q)
4. Relaunch app

**Expected:**
- Window appears in top-left corner (last position)
- Not centered (default)

**Verify:**
```bash
cat ~/Library/Application\ Support/ai-nexus/window-state.json
# Should show: "x": <small number>, "y": <small number>
```

### Test 1.3: Maximized State Persistence
**Steps:**
1. Launch AI Nexus (normal window)
2. Click green maximize button (top-left)
3. Window should maximize (not full screen)
4. Quit app (Cmd+Q)
5. Relaunch app

**Expected:**
- Window opens in maximized state
- Still has title bar (not full screen)

**Verify:**
```bash
cat ~/Library/Application\ Support/ai-nexus/window-state.json
# Should show: "isMaximized": true
```

### Test 1.4: Full Screen State Persistence
**Steps:**
1. Launch AI Nexus (normal window)
2. Press Cmd+Shift+F (or View → Toggle Full Screen)
3. Window enters full screen (no title bar, hides dock/menu)
4. Quit app (Cmd+Q while in full screen)
5. Relaunch app

**Expected:**
- Window opens in full screen mode
- No title bar, dock/menu hidden

**Verify:**
```bash
cat ~/Library/Application\ Support/ai-nexus/window-state.json
# Should show: "isFullScreen": true
```

### Test 1.5: Fallback to Defaults
**Steps:**
1. Quit AI Nexus
2. Delete window state file:
   ```bash
   rm ~/Library/Application\ Support/ai-nexus/window-state.json
   ```
3. Launch AI Nexus

**Expected:**
- Window opens at default 1400x900
- Window is centered on screen
- Not maximized or full screen

### Test 1.6: Multi-Monitor Handling
**Steps:**
1. Connect second monitor
2. Launch AI Nexus on primary monitor
3. Drag window to secondary monitor
4. Position in top-right corner
5. Quit app (Cmd+Q)
6. Relaunch app

**Expected:**
- Window appears on secondary monitor (if still connected)
- In top-right corner

**Steps (disconnected monitor):**
1. With app saved on secondary monitor, disconnect monitor
2. Launch app

**Expected:**
- Window appears on primary monitor (graceful fallback)
- Uses saved size, but not saved position (since monitor gone)

---

## Feature 2: Keyboard Shortcuts

### Test 2.1: Application Shortcuts

| Shortcut | Action | Test Steps | Expected Result |
|----------|--------|------------|----------------|
| `Cmd+Q` | Quit | Press Cmd+Q | App quits (may show confirmation) |
| `Cmd+,` | Settings | Press Cmd+, | Settings modal opens |
| `Cmd+W` | Close Window | Press Cmd+W | Window closes/hides (see Feature 5 tests) |
| `Cmd+H` | Hide | Press Cmd+H | App hidden, dock icon shows dot |
| `Cmd+M` | Minimize | Press Cmd+M | Window minimizes to dock |

**Verification:**
- Try each shortcut 3 times
- Verify no conflicts with system shortcuts
- Check menu bar shows correct accelerator labels

### Test 2.2: Conversation Shortcuts

#### Test 2.2a: New Conversation (Cmd+N)
**Steps:**
1. Launch app
2. Open existing conversation (or create one)
3. Press Cmd+N

**Expected:**
- Sidebar shows new "Untitled Conversation"
- Chat area clears (new conversation active)
- Composer is focused (can type immediately)

**Verify:**
- New conversation appears at top of sidebar
- Previous conversation still exists (not replaced)

#### Test 2.2b: New Project (Cmd+Shift+N)
**Steps:**
1. Press Cmd+Shift+N

**Expected:**
- "New Project" modal opens
- Name field is focused
- Can type project name immediately

**Verify:**
- After creating project, it appears in sidebar
- New conversation can be assigned to it

#### Test 2.2c: Search Conversations (Cmd+F)
**Steps:**
1. Create 3-4 conversations with different titles
2. Press Cmd+F

**Expected:**
- Sidebar search input is focused
- Can type search query immediately
- Results filter as you type

**Verify:**
- Search works (shows matching conversations)
- ESC clears search and returns focus to chat

#### Test 2.2d: Navigate Previous/Next (Cmd+[ and Cmd+])
**Setup:**
Create 5 conversations in this order:
1. "Conversation A"
2. "Conversation B"
3. "Conversation C"
4. "Conversation D"
5. "Conversation E"

**Steps:**
1. Open "Conversation C" (middle)
2. Press Cmd+] (next)
3. Press Cmd+] (next)
4. Press Cmd+[ (previous)
5. Press Cmd+[ (previous)
6. Press Cmd+[ (previous)

**Expected:**
1. Opens "Conversation C" ✓
2. Switches to "Conversation D" (next in list)
3. Switches to "Conversation E" (next in list)
4. Switches to "Conversation D" (back)
5. Switches to "Conversation C" (back)
6. Switches to "Conversation B" (back)

**Edge Cases:**
- Press Cmd+] on last conversation → wraps to first conversation
- Press Cmd+[ on first conversation → wraps to last conversation

#### Test 2.2e: Jump to Conversation (Cmd+1-9)
**Setup:**
Create 10+ conversations. Note the order in sidebar.

**Steps:**
1. Press Cmd+1

**Expected:**
- Opens first conversation in sidebar

**Steps:**
2. Press Cmd+5

**Expected:**
- Opens fifth conversation in sidebar

**Steps:**
3. Press Cmd+9

**Expected:**
- Opens ninth conversation in sidebar

**Steps:**
4. Press Cmd+0

**Expected:**
- Nothing happens (0 not bound)

**Verify:**
- Shortcuts map to visual order in sidebar
- Works even if sidebar is collapsed

#### Test 2.2f: Delete Conversation (Cmd+Backspace)
**Steps:**
1. Open a conversation
2. Press Cmd+Backspace

**Expected:**
- Confirmation dialog appears (native macOS dialog)
- Dialog says "Delete conversation?"
- Has "Cancel" and "Delete" buttons

**Steps:**
3. Click "Delete"

**Expected:**
- Conversation removed from sidebar
- Next conversation opens (or "new conversation" if was last)
- No crash, no errors

**Steps (cancel flow):**
1. Open a conversation
2. Press Cmd+Backspace
3. Click "Cancel" (or press ESC)

**Expected:**
- Dialog closes
- Conversation NOT deleted
- Still active and open

### Test 2.3: View Shortcuts

#### Test 2.3a: Toggle Sidebar (Cmd+B)
**Steps:**
1. Sidebar is open (default)
2. Press Cmd+B

**Expected:**
- Sidebar slides closed
- Chat area expands to fill space

**Steps:**
3. Press Cmd+B again

**Expected:**
- Sidebar slides open
- Chat area shrinks back to normal width

**Verify:**
- Animation is smooth (not instant)
- State persists (if you refresh, sidebar state preserved)

#### Test 2.3b: Zoom In/Out/Reset (Cmd+= / Cmd+- / Cmd+0)
**Steps:**
1. Note current UI size (100% default)
2. Press Cmd+= (zoom in)
3. Press Cmd+= (zoom in again)
4. Press Cmd+= (zoom in again)

**Expected:**
- Step 2: UI scales to 110%
- Step 3: UI scales to 125%
- Step 4: UI scales to 150%
- Text, buttons, everything scales proportionally

**Steps:**
5. Press Cmd+- (zoom out)

**Expected:**
- UI scales back to 125%

**Steps:**
6. Press Cmd+0 (reset)

**Expected:**
- UI resets to 100% (default)

**Verify:**
- Zoom level persists (if you quit and relaunch, zoom level preserved)
- Zoom affects entire app (not just chat area)
- Minimum zoom: 80%
- Maximum zoom: 200%

#### Test 2.3c: Toggle Full Screen (Cmd+Shift+F)
**Steps:**
1. Window in normal mode
2. Press Cmd+Shift+F

**Expected:**
- Window enters full screen
- macOS menu bar and dock hide
- Transition is animated (smooth)

**Steps:**
3. Press Cmd+Shift+F again (or ESC)

**Expected:**
- Window exits full screen
- Menu bar and dock reappear
- Window returns to previous size/position

**Verify:**
- Also works via View → Toggle Full Screen menu
- Also works via green button (hold Option, then click)

### Test 2.4: Export Shortcuts

#### Test 2.4a: Export Conversation (Cmd+E)
**Steps:**
1. Open conversation with some messages
2. Press Cmd+E

**Expected (Web):**
- Export modal opens
- Can choose format (Markdown/JSON)
- Can click "Export" button

**Expected (Electron):**
- Native save dialog appears (macOS Finder dialog)
- Default filename is conversation title
- Can choose save location
- Can choose format (.md or .json)

**Steps:**
3. Choose location (e.g., Desktop)
4. Click "Save"

**Expected:**
- File saved to chosen location
- Success notification shown
- File contains correct conversation data

#### Test 2.4b: Quick Export (Cmd+Shift+E)
**Steps:**
1. Open conversation with messages
2. Press Cmd+Shift+E

**Expected (Electron):**
- Native save dialog appears immediately
- Default format is Markdown (.md)
- Default filename is conversation title
- No export modal (direct to save)

**Steps:**
3. Click "Save"

**Expected:**
- Markdown file saved
- Success notification

**Verify:**
- Open saved .md file in text editor
- Verify content is correct (title, messages, timestamps)

### Test 2.5: Menu Bar Shortcuts
**Goal:** Verify ALL shortcuts work from menu bar (not just keyboard)

**Steps:**
1. Launch app
2. Click each menu item that has a shortcut
3. Verify action happens

**Menu Items to Test:**
- AI Nexus → Quit AI Nexus (Cmd+Q)
- AI Nexus → Settings (Cmd+,)
- File → New Conversation (Cmd+N)
- File → New Project (Cmd+Shift+N)
- File → Export Conversation (Cmd+E)
- File → Export to Markdown (Cmd+Shift+E)
- File → Close Window (Cmd+W)
- Edit → Find Conversations (Cmd+F)
- View → Toggle Sidebar (Cmd+B)
- View → Zoom In (Cmd+=)
- View → Zoom Out (Cmd+-)
- View → Actual Size (Cmd+0)
- View → Toggle Full Screen (Cmd+Shift+F)
- Conversation → Previous Conversation (Cmd+[)
- Conversation → Next Conversation (Cmd+])
- Conversation → Jump to Conversation 1-9 (Cmd+1-9)
- Conversation → Delete Conversation (Cmd+Backspace)

**Expected for ALL:**
- Menu item is enabled (not grayed out)
- Accelerator shown correctly in menu
- Clicking menu item triggers action
- Pressing keyboard shortcut triggers same action

---

## Feature 3: Menu Bar Completeness

### Test 3.1: App Menu (AI Nexus)
**Steps:**
1. Click "AI Nexus" in menu bar

**Expected Items:**
- About AI Nexus
- --- (separator)
- Settings... (Cmd+,)
- --- (separator)
- Hide AI Nexus (Cmd+H)
- Hide Others (Cmd+Option+H)
- Show All
- --- (separator)
- Quit AI Nexus (Cmd+Q)

**Verify:**
- "About AI Nexus" shows app version and info
- All shortcuts work
- "Hide Others" hides all apps except AI Nexus

### Test 3.2: File Menu
**Steps:**
1. Click "File" in menu bar

**Expected Items:**
- New Conversation (Cmd+N)
- New Project (Cmd+Shift+N)
- --- (separator)
- Export Conversation... (Cmd+E)
- Export to Markdown (Cmd+Shift+E)
- --- (separator)
- Close Window (Cmd+W)

**Verify:**
- All items clickable (no grayed out)
- All shortcuts match labels

### Test 3.3: Edit Menu
**Steps:**
1. Click "Edit" in menu bar

**Expected Items:**
- Undo (Cmd+Z)
- Redo (Cmd+Shift+Z)
- --- (separator)
- Cut (Cmd+X)
- Copy (Cmd+C)
- Paste (Cmd+V)
- Select All (Cmd+A)
- --- (separator)
- Find Conversations... (Cmd+F)

**Verify:**
- Text editing shortcuts work in composer
- "Find Conversations" focuses sidebar search

### Test 3.4: View Menu
**Steps:**
1. Click "View" in menu bar

**Expected Items:**
- Toggle Sidebar (Cmd+B)
- --- (separator)
- Zoom In (Cmd+=)
- Zoom Out (Cmd+-)
- Actual Size (Cmd+0)
- --- (separator)
- Toggle Full Screen (Cmd+Shift+F)

**Verify:**
- All zoom levels work
- Full screen toggles correctly

### Test 3.5: Conversation Menu
**Steps:**
1. Click "Conversation" in menu bar

**Expected Items:**
- Previous Conversation (Cmd+[)
- Next Conversation (Cmd+])
- --- (separator)
- Jump to Conversation 1 (Cmd+1)
- Jump to Conversation 2 (Cmd+2)
- ... (through 9)
- --- (separator)
- Delete Conversation (Cmd+Backspace)

**Verify:**
- Navigation shortcuts work
- Delete shows confirmation

### Test 3.6: Window Menu
**Steps:**
1. Click "Window" in menu bar

**Expected Items:**
- Minimize (Cmd+M)
- Zoom
- --- (separator)
- Bring All to Front

**Verify:**
- Standard macOS window menu
- "Zoom" button toggles window size (same as green button)

### Test 3.7: Help Menu
**Steps:**
1. Click "Help" in menu bar

**Expected Items:**
- AI Nexus Help
- Report Issue
- --- (separator)
- Check for Updates

**Verify:**
- "AI Nexus Help" opens GitHub repo in browser
- "Report Issue" opens GitHub issues in browser
- "Check for Updates" checks and shows dialog

---

## Feature 4: System Notifications

### Test 4.1: Response Complete Notification (Background)
**Setup:**
1. Launch AI Nexus
2. Start a conversation (send a message)
3. While Claude is responding, switch to another app (Cmd+Tab)

**Expected:**
- macOS notification appears when response completes
- Notification title: "AI Nexus"
- Notification body: "Claude has finished responding"
- Notification subtitle: (conversation title)
- Default system sound plays

**Steps:**
4. Click notification

**Expected:**
- AI Nexus comes to foreground
- Active conversation is the one that completed

### Test 4.2: No Notification When Focused
**Setup:**
1. Launch AI Nexus
2. Send a message (start streaming response)
3. Keep AI Nexus focused (don't switch apps)

**Expected:**
- NO notification when response completes
- (Notification only shows when app is in background)

### Test 4.3: Error Notification
**Setup:**
1. Remove API key (Settings → API Settings → delete key)
2. Try to send a message

**Expected:**
- macOS notification appears
- Notification title: "AI Nexus Error"
- Notification body: (error message, e.g., "No API key configured")

**Steps:**
3. Click notification

**Expected:**
- AI Nexus comes to foreground
- Settings modal opens (API Settings tab)

### Test 4.4: Update Available Notification
**Setup:**
1. Mock a newer version (or wait for real update)
2. App checks for updates (automatic or via Help → Check for Updates)

**Expected:**
- macOS notification appears
- Notification title: "AI Nexus Update Available"
- Notification body: "Version X.X.X is available for download"

**Steps:**
3. Click notification

**Expected:**
- GitHub releases page opens in browser
- Can download new version

### Test 4.5: Dock Badge for Streaming
**Setup:**
1. Launch AI Nexus
2. Send a message (start streaming)

**Expected:**
- Dock icon shows badge with number "1"
- Badge persists while streaming

**Steps:**
3. Open second conversation in new tab/window (future feature)
4. Start streaming in second conversation

**Expected:**
- Badge updates to "2" (two active streams)

**Steps:**
5. Wait for first stream to complete

**Expected:**
- Badge updates to "1" (one active stream remaining)

**Steps:**
6. Wait for second stream to complete

**Expected:**
- Badge disappears (no active streams)

### Test 4.6: Do Not Disturb Mode
**Setup:**
1. Enable macOS "Do Not Disturb" mode (Control Center → Focus → Do Not Disturb)
2. Switch AI Nexus to background
3. Send a message (start streaming)

**Expected:**
- NO notification appears (respecting Do Not Disturb)
- OR notification appears silently (no sound, but visible in Notification Center)

**Verify:**
- Check Notification Center after response completes
- Notification should be there (even if not shown)

---

## Feature 5: Window Management

### Test 5.1: Full Screen Mode
**Covered in Test 2.3c** (Toggle Full Screen)

Additional tests:

**Test 5.1a: Green Button Behavior**
**Steps:**
1. Normal window
2. Click green button (top-left, no modifier keys)

**Expected:**
- Window enters full screen
- Same as Cmd+Shift+F

**Steps:**
3. Hover over green button (don't click)
4. Hold Option key
5. Click green button while holding Option

**Expected:**
- Window zooms (toggles between sizes)
- Does NOT enter full screen

### Test 5.2: Close Window Behavior (Cmd+W)

#### Option A: Hide Window (Recommended)
**Steps:**
1. Window open and focused
2. Press Cmd+W

**Expected:**
- Window hides (still running)
- Dock icon shows dot (app is running)
- Menu bar still shows AI Nexus

**Steps:**
3. Click dock icon

**Expected:**
- Window reappears
- Previous conversation still open

#### Option B: Quit App (Alternative)
**Steps:**
1. Window open
2. Press Cmd+W

**Expected:**
- Quit confirmation dialog (if conversation in progress)
- Or app quits immediately (if no conversation)

**Note:** Discuss with user which behavior is preferred.

### Test 5.3: Minimize to Dock (Cmd+M)
**Steps:**
1. Window open
2. Press Cmd+M

**Expected:**
- Window minimizes to dock (right side, near trash)
- Dock icon shows minimized window thumbnail

**Steps:**
3. Click minimized window in dock

**Expected:**
- Window restores to previous size/position

### Test 5.4: Window Zoom (Green Button)
**Steps:**
1. Normal window (1000x700)
2. Click green button (with Option held, to avoid full screen)

**Expected:**
- Window zooms to optimal size (calculated by macOS)
- Usually maximizes vertically, centers horizontally

**Steps:**
3. Click green button again (with Option)

**Expected:**
- Window returns to previous size (1000x700)

---

## Feature 6: Dock Integration

### Test 6.1: Dock Menu (Right-Click)
**Setup:**
Create 3 conversations:
1. "Debug Python Script"
2. "Write README"
3. "Refactor API"

**Steps:**
1. Right-click AI Nexus dock icon

**Expected Menu:**
```
New Conversation
Open Recent  ▶
—————————————
Check for Updates
```

**Steps:**
2. Hover over "Open Recent"

**Expected Submenu:**
```
Debug Python Script
Write README
Refactor API
—————————————
Clear Recent
```

**Steps:**
3. Click "Write README"

**Expected:**
- App comes to foreground (if hidden)
- "Write README" conversation opens
- Ready to continue conversation

### Test 6.2: Dock Menu - New Conversation
**Steps:**
1. Right-click dock icon
2. Click "New Conversation"

**Expected:**
- App comes to foreground
- New conversation created
- Composer focused (ready to type)

### Test 6.3: Dock Menu - Clear Recent
**Steps:**
1. Right-click dock icon
2. Hover "Open Recent"
3. Click "Clear Recent"

**Expected:**
- Submenu closes
4. Right-click dock icon again
5. Hover "Open Recent"

**Expected:**
- Submenu is empty (or shows "No Recent Conversations")

### Test 6.4: Dock Menu - Check for Updates
**Steps:**
1. Right-click dock icon
2. Click "Check for Updates"

**Expected:**
- Update check runs
- Dialog appears with result (up to date or update available)

### Test 6.5: Dock Progress Indicator
**Setup:**
Trigger a long operation (e.g., export 20 conversations to PDF)

**Expected:**
- Dock icon shows progress bar (fills from left to right)
- Progress updates in real-time (0% → 100%)

**When Complete:**
- Progress bar disappears
- Dock icon returns to normal

### Test 6.6: Dock Bounce (Attention)
**Setup:**
1. AI Nexus is hidden or minimized
2. Trigger notification (e.g., error or update available)

**Expected:**
- Dock icon bounces (1-3 times)
- Draws user's attention to app

**Verify:**
- Bounce is not annoying (single bounce, not infinite)
- Can click icon to stop bounce

---

## Feature 7: Quit Confirmation

### Test 7.1: Quit During Streaming
**Steps:**
1. Send a message (start streaming response)
2. While streaming, press Cmd+Q

**Expected:**
- Native macOS dialog appears:
  - Title: "Quit AI Nexus?"
  - Message: "A conversation is in progress."
  - Detail: "Are you sure you want to quit? Your message will be lost."
  - Buttons: ["Cancel" (default), "Quit"]

**Steps:**
3. Click "Cancel" (or press ESC or Enter)

**Expected:**
- Dialog closes
- App continues running
- Streaming response continues

**Steps:**
4. Press Cmd+Q again
5. Click "Quit"

**Expected:**
- App quits immediately
- Streaming stops
- localStorage saves (conversation preserved, but incomplete message lost)

### Test 7.2: Quit with Unsent Message
**Steps:**
1. Type a message in composer (don't send)
2. Press Cmd+Q

**Expected:**
- Quit confirmation dialog appears
- Message: "You have an unsent message."
- Detail: "Quit anyway? Your message will be lost."

**Steps:**
3. Click "Quit"

**Expected:**
- App quits
- Unsent message lost
4. Relaunch app

**Expected:**
- Composer is empty (message not saved)

### Test 7.3: Quit Normally (No Confirmation)
**Steps:**
1. No streaming, no unsent message
2. Press Cmd+Q

**Expected:**
- App quits immediately
- NO confirmation dialog

### Test 7.4: Quit via Menu (Same Behavior)
**Steps:**
1. Start streaming response
2. Click AI Nexus → Quit AI Nexus

**Expected:**
- Same confirmation dialog as Cmd+Q

### Test 7.5: Quit via Red X Button (Same Behavior)
**Steps:**
1. Start streaming response
2. Click red X button (top-left)

**Expected:**
- Same confirmation dialog as Cmd+Q

---

## Feature 8: Native File Dialogs

### Test 8.1: File Upload (Attach to Message)

#### Web Behavior (Baseline)
**Steps:**
1. Open AI Nexus in browser (http://localhost:3000)
2. Click paperclip/attach button

**Expected:**
- Browser file picker appears (generic HTML input)
- Can select files
- Files attach to message

#### Electron Behavior (Enhanced)
**Steps:**
1. Launch AI Nexus Electron app
2. Click paperclip/attach button

**Expected:**
- **Native macOS file picker** appears (Finder dialog)
- Shows file browser with sidebar (Favorites, Recents, etc.)
- Has "Attach" button (not generic "Open")

**Steps:**
3. Navigate to Desktop
4. Select an image (PNG)
5. Click "Attach"

**Expected:**
- Dialog closes
- Image thumbnail appears in composer
- Can send message with attachment

### Test 8.2: Multiple File Selection
**Steps:**
1. Click attach button
2. In native dialog, select 3 images (Cmd+Click)
3. Click "Attach"

**Expected:**
- All 3 images attach
- 3 thumbnails shown in composer
- Can send message with all attachments

### Test 8.3: File Type Filters
**Steps:**
1. Click attach button
2. Look at "File Format" dropdown (bottom of dialog)

**Expected Options:**
- Images (PNG, JPG, JPEG, GIF, WEBP)
- PDFs
- All Files

**Steps:**
3. Select "Images"
4. Navigate to folder with mixed files (images + PDFs + text)

**Expected:**
- Only image files are selectable
- PDFs and text files are grayed out

**Steps:**
5. Change filter to "PDFs"

**Expected:**
- Only PDF files are selectable
- Image files now grayed out

### Test 8.4: Export Save Dialog (Native)

#### Web Behavior (Baseline)
**Steps:**
1. Open conversation in browser
2. Export to Markdown

**Expected:**
- File downloads to ~/Downloads/ (no choice)
- Filename is auto-generated

#### Electron Behavior (Enhanced)
**Steps:**
1. Open conversation in Electron app
2. Press Cmd+E (or File → Export Conversation)

**Expected:**
- **Native macOS save dialog** appears
- Default filename: "(conversation title).md"
- Can navigate to any folder
- Can rename file
- Has "Export" button (not generic "Save")

**Steps:**
3. Navigate to Desktop
4. Change filename to "my-conversation.md"
5. Click "Export"

**Expected:**
- File saved to Desktop as "my-conversation.md"
- Success notification shown
- File contains correct conversation data

### Test 8.5: Export Format Selector
**Steps:**
1. Open conversation
2. Press Cmd+E
3. In save dialog, look at "File Format" dropdown

**Expected Options:**
- Markdown (.md)
- JSON (.json)
- Text (.txt)

**Steps:**
4. Select "JSON"
5. Note filename changes to ".json" extension
6. Click "Export"

**Expected:**
- File saved as JSON
- Valid JSON structure

### Test 8.6: Overwrite Confirmation
**Steps:**
1. Export conversation to Desktop as "test.md"
2. Export same conversation again to Desktop as "test.md"

**Expected:**
- macOS native "Replace" dialog appears
- Message: "test.md already exists. Do you want to replace it?"
- Buttons: ["Cancel", "Replace"]

**Steps:**
3. Click "Replace"

**Expected:**
- File overwritten
- No error

---

## Cross-Feature Integration Tests

### Integration Test 1: Full Workflow
**Scenario:** User opens app, creates conversation, exports, quits

**Steps:**
1. Launch AI Nexus (first time, clean state)
2. Resize window to 1200x800
3. Move to top-right corner
4. Press Cmd+N (new conversation)
5. Type message, send
6. Wait for response
7. Press Cmd+E (export)
8. Save to Desktop as "my-chat.md"
9. Press Cmd+Q (quit)
10. Relaunch app

**Expected:**
- Window opens at 1200x800 in top-right corner ✓
- Conversation still exists ✓
- Can open exported file on Desktop ✓
- File contains correct data ✓

### Integration Test 2: Keyboard-Only Navigation
**Goal:** Complete tasks without mouse

**Steps:**
1. Launch app
2. Press Cmd+N (new conversation)
3. Type message: "Hello Claude"
4. Press Enter (send)
5. Wait for response
6. Press Cmd+N (another new conversation)
7. Press Cmd+[ (go back to previous)
8. Press Cmd+F (search)
9. Type "Hello"
10. Press Enter (open first result)
11. Press Cmd+E (export)
12. Type "test" (filename)
13. Press Enter (save)
14. Press Cmd+Q (quit)

**Expected:**
- All actions complete successfully
- No need to touch mouse
- Natural keyboard flow

### Integration Test 3: Rapid Shortcut Combos
**Goal:** Test for race conditions

**Steps:**
1. Launch app
2. Rapidly press:
   - Cmd+N (new)
   - Cmd+N (new)
   - Cmd+N (new)
   - Cmd+[ (back)
   - Cmd+] (forward)
   - Cmd+[ (back)
   - Cmd+1 (jump to 1)
   - Cmd+9 (jump to 9)

**Expected:**
- No crashes
- No UI glitches
- Final conversation is #9 (if exists)

---

## Performance Tests

### Performance Test 1: Window State Save Frequency
**Goal:** Ensure window state saves are debounced (not on every pixel)

**Steps:**
1. Open Activity Monitor → AI Nexus
2. Watch "Disk Writes" column
3. Rapidly resize window (drag corner back and forth for 10 seconds)

**Expected:**
- Disk writes should NOT happen constantly
- Should see 1-2 writes after you stop resizing (debounced)

### Performance Test 2: Keyboard Shortcut Responsiveness
**Goal:** Shortcuts should feel instant

**Steps:**
1. Press Cmd+N (new conversation)
2. Note time until UI responds

**Expected:**
- < 100ms response time (feels instant)
- No lag or delay

**Repeat for:**
- Cmd+B (toggle sidebar)
- Cmd+F (focus search)
- Cmd+[ (previous conversation)
- Cmd+] (next conversation)

### Performance Test 3: Menu Bar Rendering
**Goal:** Menu opens quickly

**Steps:**
1. Click "File" menu
2. Note time until menu appears

**Expected:**
- < 50ms (instant)
- No delay when navigating submenus

---

## Regression Tests

### Regression Test 1: Web Version Unaffected
**Goal:** Ensure web version still works (no Electron-only code leaked)

**Steps:**
1. Run `yarn dev`
2. Open browser to http://localhost:3000
3. Test all features:
   - Create conversation
   - Send message
   - Attach file (HTML file input should appear)
   - Export (download to ~/Downloads/)
   - All UI works

**Expected:**
- Web version 100% functional
- No errors in console
- No "window.electron is undefined" errors

### Regression Test 2: Existing Shortcuts Still Work
**Goal:** Ensure existing Cmd+Q and Cmd+Option+I still work

**Steps:**
1. Launch app
2. Press Cmd+Option+I

**Expected:**
- DevTools open

**Steps:**
3. Close DevTools
4. Press Cmd+Q

**Expected:**
- Quit confirmation (if needed)
- Or app quits

### Regression Test 3: Data Persistence
**Goal:** Ensure localStorage still works after all changes

**Steps:**
1. Create conversation with 5 messages
2. Create project "Test Project"
3. Assign conversation to project
4. Change theme to dark + blue palette
5. Quit app (Cmd+Q)
6. Relaunch app

**Expected:**
- Conversation exists with all 5 messages ✓
- Project exists ✓
- Conversation assigned to correct project ✓
- Theme is dark + blue ✓

---

## Edge Cases and Error Handling

### Edge Case 1: Rapid Window State Changes
**Steps:**
1. Rapidly toggle full screen (Cmd+Shift+F) 10 times
2. Check window-state.json

**Expected:**
- File not corrupted
- Contains valid JSON
- State reflects final state (not mid-transition)

### Edge Case 2: Keyboard Shortcuts During Modal
**Steps:**
1. Open Settings modal (Cmd+,)
2. Press Cmd+N (new conversation)

**Expected:**
- Modal stays open (shortcut blocked/ignored)
- OR modal closes and new conversation created (acceptable)
- NO crash or conflict

### Edge Case 3: Delete Last Conversation
**Steps:**
1. Create only 1 conversation
2. Press Cmd+Backspace (delete)
3. Confirm deletion

**Expected:**
- Conversation deleted
- New "Untitled Conversation" created automatically
- UI doesn't break (always has at least one conversation)

### Edge Case 4: Export with No Conversations
**Steps:**
1. Fresh app (no conversations)
2. Press Cmd+E (export)

**Expected:**
- Either:
  - A) Export button disabled (can't export nothing)
  - B) Friendly message: "No conversation to export"

### Edge Case 5: Notification Spam
**Setup:**
1. Send 10 messages rapidly (all start streaming)
2. Switch to another app

**Expected:**
- NOT 10 notifications when all complete
- Rate limited: Max 1 notification per 5 seconds
- Or: Single notification "Responses complete"

---

## Accessibility Tests

### Accessibility Test 1: VoiceOver Support
**Setup:**
1. Enable macOS VoiceOver (Cmd+F5)

**Steps:**
1. Navigate menu bar with VoiceOver
2. Navigate to File → New Conversation
3. Activate menu item

**Expected:**
- VoiceOver announces each menu item
- Shortcuts are announced ("Command N")
- Menu items are activatable

### Accessibility Test 2: Keyboard Navigation
**Goal:** All features accessible without mouse

**Covered in Integration Test 2** (Keyboard-Only Navigation)

---

## Testing Checklist Summary

### Phase 1 Features (v1.1)
- [ ] Window State Persistence (6 tests)
- [ ] Keyboard Shortcuts (20+ shortcuts to test)
- [ ] Menu Bar Completeness (7 menus)
- [ ] Quit Confirmation (5 scenarios)

### Phase 2 Features (v1.2)
- [ ] System Notifications (6 tests)
- [ ] Dock Integration (6 tests)
- [ ] Window Management (4 tests)
- [ ] Native File Dialogs (6 tests)

### Integration & Regression
- [ ] Cross-Feature Integration (3 tests)
- [ ] Performance Tests (3 tests)
- [ ] Regression Tests (3 tests)
- [ ] Edge Cases (5 tests)

### Total Test Cases
**~70 individual test cases**

**Estimated Testing Time:**
- Phase 1: 4-6 hours
- Phase 2: 3-4 hours
- Integration/Regression: 2-3 hours
- **Total: 9-13 hours**

---

## Bug Reporting Template

When filing bugs, use this template:

```markdown
## Bug Report

**Feature:** (e.g., Window State Persistence)
**Test Case:** (e.g., Test 1.3 - Maximized State)

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Environment:**
- macOS Version: (e.g., 14.5 Sonoma)
- AI Nexus Version: (e.g., 1.1.0)
- Build Mode: (Development / Production)

**Screenshots/Logs:**
(attach relevant screenshots or log output)

**Additional Context:**
(any other relevant information)
```

---

## Notes for Testers

1. **Test in Both Modes:**
   - Development mode (yarn dev + yarn electron)
   - Production mode (built .app)

2. **Test Clean State:**
   - Delete user data before major test sessions
   - Verify default behaviors work

3. **Test Dirty State:**
   - Test with existing conversations, projects, settings
   - Verify upgrades don't break existing data

4. **Test Edge Cases:**
   - Very long conversation titles
   - 100+ conversations
   - Very large messages (>10k characters)
   - Special characters in filenames

5. **Document Everything:**
   - If a test fails, note exact steps
   - Capture console output
   - Check debug.log file
