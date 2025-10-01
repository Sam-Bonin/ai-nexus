# Modularization Plan for `components`

## 1. Repository Architecture Overview
- **App Entry**: `app/page.tsx` renders the monolithic `<Chat />` component; global styles in `app/globals.css`.
- **State/Storage Utilities**: `lib/storage.ts` encapsulates localStorage operations for conversations, projects, active conversation, and theme. `lib/utils.ts` provides helpers for ID generation, exports, etc.
- **Hooks**: `hooks/useTheme.ts` handles persisted theme state.
- **Component Layer**:
  - `components/Chat.tsx` orchestrates virtually all chat features (fetching, persistence, UI layout, form handling, attachments, scrolling, streaming, sidebar toggling, modals).
  - `components/Sidebar.tsx` mixes project management modals, project sections, conversation menu handling, and layout concerns.
  - Supporting components like `ProjectSection`, `ConversationDropdown`, modals, and `Message` provide UI but still include duplicated logic (e.g., conversation menu controls, rename handling, etc.).

## 2. Identified Issues
- **Monolithic Chat component**: 600+ lines combining service responsibilities (API communication, persistence, storage orchestration) with view rendering. Hard to maintain, test, or reuse logic.
- **Sidebar responsibilities**: Handles project persistence updates, modal orchestration, and rendering lists. Logic for conversation menus duplicated with `ProjectSection`.
- **Implicit services inside UI**: Functions for fetching/chat streaming, file reading, auto-categorization, etc., are embedded inside components rather than extracted to hooks or utilities.
- **Duplication**: Conversation menu handlers repeated in both `Sidebar` and `ProjectSection`; attachment preview markup inline; metadata formatting inside `Message`.
- **Cross-cutting state**: Chat-level state (e.g., selected model, thinking toggle, attachments) managed in a single component instead of focused subcomponents/hooks.

## 3. Modularization Goals
1. **Separate orchestration logic from presentation** to respect component vs. service boundaries.
2. **Create focused subcomponents** for repeated UI blocks (model selector, attachment preview, composer actions, scroll button, header controls).
3. **Introduce a reusable hook** to encapsulate chat conversation lifecycle (loading, persistence, streaming, title generation, auto-categorization).
4. **Restructure Sidebar** into composable units (header, search, project list, conversation list item) while keeping storage mutations in dedicated helpers.
5. **Improve Message component clarity** by extracting metadata formatters and optional sections to dedicated presentational helpers.

## 4. Proposed Refactor Outline

### 4.1 Chat Domain
- Create `hooks/useChatController.ts` that exposes:
  - Conversation state (list, active ID, messages) and persistence helpers (load, save, delete, rename, new chat).
  - Model/feature flags state (selected model, thinking toggle, attachments) with appropriate handlers.
  - Streaming workflow encapsulation (submit, stop, API fetch, title generation, auto-categorization).
  - Sidebar state toggling and scroll state exposures.
- Restructure `Chat` into a folder `components/chat/` containing:
  - `ChatShell.tsx` (former Chat) responsible for high-level layout and wiring hook data into presentational pieces.
  - `ChatHeader.tsx` for header controls (new chat, theme toggle, model switch trigger, plus menu trigger).
  - `ChatMessageList.tsx` rendering conversation messages, showing empty state, and hosting `ScrollToBottomButton` subcomponent.
  - `ChatComposer.tsx` for textarea input, attachments, submit/stop buttons, thinking toggle, plus menu, and file input. Split its parts into `ComposerToolbar`, `AttachmentPreviewList`, `FileAttachmentItem` as needed.
  - `ModelSelector.tsx` extracted dropdown with category hover behavior.
  - `PlusMenu.tsx` for attachments vs. future actions menu.
  - Utility components re-exported via `components/chat/index.ts` so `app/page.tsx` still imports from `@/components/chat`.

### 4.2 Sidebar Domain
- Move sidebar-related files into `components/sidebar/` with index re-exports.
- Extract:
  - `SidebarShell.tsx` (wrapper receiving props from Chat).
  - `SidebarHeader.tsx` (logo, new chat button, theme toggles if applicable).
  - `SidebarSearch.tsx` (search input field, handles change events via props).
  - `SidebarProjectList.tsx` to iterate and render `ProjectSection` like components.
  - `ConversationListItem.tsx` reusable for both Misc and Project sections, handling rename state and menu interactions in one place.
  - `ConversationMenu.tsx` to host dropdown actions (open, rename, delete, move, export) reused anywhere.
- Keep modals as-is but relocate imports accordingly.

### 4.3 Shared Utilities & Types
- Extract formatting helpers (duration/model names) from `Message` into `lib/format.ts` to encourage reuse.
- Provide typed service wrappers for chat API interactions (e.g., `lib/chatService.ts` with `sendMessageStream`, `generateTitle`, `categorizeConversation`). Hook consumes service to keep UI clean.
- Provide file helper for reading base64 attachments in `lib/file.ts`.

## 5. Implementation Steps
1. **Introduce new utilities** (`lib/chatService.ts`, `lib/file.ts`, `lib/format.ts`) capturing logic currently embedded in `Chat`/`Message`.
2. **Implement `useChatController` hook** using new services/utilities; ensure it mirrors existing behavior (including streaming, abort handling, persistence, file management, theme toggling, auto-categorization).
3. **Refactor Chat UI**:
   - Create `components/chat/` folder with shell + subcomponents.
   - Move presentational JSX from current `Chat.tsx` into new components, connecting via props to the hook.
   - Replace old `components/Chat.tsx` export with new index that re-exports `ChatShell` as default.
4. **Restructure Sidebar** into folder-based modules, consolidating menu handling and search state to reduce duplication.
5. **Update imports across repository** to new paths (e.g., `app/page.tsx`, components referencing Chat/Sidebar pieces).
6. **Refine Message component** to use extracted helpers and subcomponents for metadata, attachments, and markdown rendering.
7. **Run lint/build/test command (`yarn lint` if available or `yarn build`)** to ensure nothing breaks.

## 6. Validation
- Manual smoke test by running available lint/build command.
- Verify type safety via TypeScript compile (`yarn tsc --noEmit`) if feasible.
- Confirm UI-critical props/states remain functional by reviewing diff and ensuring `storage` usage unaffected.

## 7. Risks & Mitigations
- **Streaming regressions**: Keep API contract identical by centralizing fetch logic in service with same endpoint handling.
- **State synchronization**: Ensure `useChatController` updates localStorage exactly as before; reuse `storage` helpers and maintain call order.
- **Import path churn**: Provide re-export indices to avoid widespread import updates.
- **Time constraints**: Prioritize Chat + Sidebar modularization; message tweaks optional if time allows but keep plan to attempt format helper extraction.

## 8. Definition of Done
- Plan executed: Chat + Sidebar refactored into modular structure, helper utilities created, Message cleansed of inline formatters.
- Tests/build pass.
- Documentation (this plan) committed alongside code changes.
