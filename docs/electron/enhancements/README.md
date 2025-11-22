# Native macOS Enhancements - Overview

## Summary
This directory contains specifications and testing documentation for transforming AI Nexus into a fully native-feeling macOS desktop application.

**Branch:** `feature/electron-native-enhancements`
**Status:** Specification Complete, Implementation Pending
**Target Version:** v1.1 (Phase 1), v1.2 (Phase 2)

---

## Documents

### 1. [`native-macos-features.md`](./native-macos-features.md)
**24KB specification document** covering 9 feature enhancements:

#### Phase 1 - Core Features (v1.1) ⭐️ PRIORITY
1. **Window State Persistence** - Remember window size, position, maximized/full screen state
2. **Comprehensive Keyboard Shortcuts** - 20+ shortcuts for all actions (Cmd+N, Cmd+F, Cmd+[, etc.)
3. **Proper Menu Bar** - Complete File/Edit/View/Conversation/Window/Help menus
4. **Quit Confirmation** - Prevent accidental data loss during streaming

**Effort:** ~2 days development

#### Phase 2 - Nice-to-Haves (v1.2)
5. **System Notifications** - Response complete, errors, updates (with Dock badges)
6. **Dock Integration** - Right-click menu with recent conversations and quick actions
7. **Window Management** - Full screen, Cmd+W behavior, native controls
8. **Native File Dialogs** - macOS Finder dialogs for attach and export

**Effort:** ~2 days development

#### Deferred Features
9. **Multiple Window Support** - Not recommended for v1 (complexity vs value)

### 2. [`testing.md`](./testing.md)
**31KB comprehensive testing guide** with:

- **~70 individual test cases** covering all features
- Step-by-step instructions with expected results
- Integration tests (cross-feature workflows)
- Performance tests (responsiveness, debouncing)
- Regression tests (web version, existing features)
- Edge cases and error handling
- Accessibility tests (VoiceOver, keyboard-only)

**Testing Time:** 9-13 hours total

---

## Key Design Principles

### 1. Shared Codebase Philosophy
**ALL features respect the shared codebase architecture:**
- Electron layer handles ONLY OS integration (menus, windows, notifications)
- Business logic stays in shared Next.js codebase
- React components work in BOTH web and Electron
- Use `lib/platform.ts` utilities for detection
- NO parallel implementations or forked components

### 2. Platform Detection Pattern
```typescript
// Components use hook
import { usePlatform } from '@/hooks/usePlatform';

function MyComponent() {
  const { isElectron } = usePlatform();

  const handleExport = async () => {
    if (isElectron && window.electron?.showSaveDialog) {
      // Native save dialog
      const result = await window.electron.showSaveDialog({...});
    } else {
      // Web fallback (download)
      downloadFile(content, filename);
    }
  };
}
```

### 3. Communication Pattern
```
React Component → IPC (preload.ts) → Main Process → Native API
                ← IPC Response    ←
```

**Example:**
1. User presses Cmd+N in React component
2. Menu item triggers IPC: `sendIPC('new-conversation')`
3. Preload exposes handler: `window.electron.onNewConversation(callback)`
4. React component registers listener in `useElectronShortcuts()` hook
5. Callback fires existing React action: `createNewConversation()`

---

## Implementation Checklist

### Pre-Implementation
- [x] Create feature branch: `feature/electron-native-enhancements`
- [x] Write specification document
- [x] Write testing documentation
- [ ] Review spec with stakeholders
- [ ] Prioritize Phase 1 vs Phase 2 features

### Phase 1 Implementation (v1.1)
- [ ] Create `electron/utils/windowState.ts` (window state manager)
- [ ] Expand `electron/utils/menu.ts` (full menu bar)
- [ ] Expand `electron/preload.ts` (IPC handlers)
- [ ] Create `hooks/useElectronShortcuts.ts` (React hook)
- [ ] Modify `electron/main.ts` (quit confirmation, window state)
- [ ] Modify `app/page.tsx` (register shortcuts hook)
- [ ] Run comprehensive testing (see testing.md)

### Phase 2 Implementation (v1.2)
- [ ] Create `electron/utils/notifications.ts` (notification manager)
- [ ] Modify `electron/main.ts` (dock menu, badge, file dialogs)
- [ ] Modify `components/chat/ChatShell.tsx` (stream events)
- [ ] Create native file dialog wrappers
- [ ] Run comprehensive testing

### Post-Implementation
- [ ] Update INSTALL.md with new features
- [ ] Update README.md with shortcuts reference
- [ ] Create release notes for v1.1 / v1.2
- [ ] Test on clean macOS installation
- [ ] Merge to main branch

---

## Files to Create

### New Files
```
electron/utils/windowState.ts       - Window state persistence
electron/utils/notifications.ts     - System notifications manager
hooks/useElectronShortcuts.ts       - React hook for shortcuts
```

### Files to Modify
```
electron/main.ts                    - Window management, quit confirmation
electron/preload.ts                 - IPC handlers for all shortcuts
electron/utils/menu.ts              - Expand to full menu bar
app/page.tsx                        - Register shortcuts hook
components/chat/ChatShell.tsx       - Stream start/end events
components/chat/ChatComposer.tsx    - Native file picker (optional)
```

**Total:** 3 new files, 6 modified files

---

## Success Criteria

### Must Have (Before Merge)
- ✅ All Phase 1 features working in dev and production
- ✅ Zero regressions (existing features still work)
- ✅ Web version unaffected (no Electron-only errors)
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes
- ✅ At least 50% of test cases passing

### Nice to Have
- ✅ All Phase 2 features working
- ✅ 90%+ test coverage
- ✅ Performance metrics meet targets (<100ms response)

---

## Estimated Effort

### Development
- Phase 1: ~14 hours (~2 days)
- Phase 2: ~13 hours (~2 days)
- **Total:** ~27 hours (~3-4 days)

### Testing
- Manual Testing: 9-13 hours
- Bug Fixes: 4-6 hours (estimated)
- **Total:** ~15 hours (~2 days)

### Documentation
- Update user docs: 2 hours
- Release notes: 1 hour
- **Total:** ~3 hours

**Grand Total:** ~45 hours (~1 week sprint)

---

## Open Questions for Stakeholders

### Question 1: Cmd+W Behavior
**Options:**
- A) Hide window (macOS standard for apps with dock menu)
- B) Quit app (simpler, current behavior)
- C) Make it a Settings toggle (most flexible)

**Recommendation:** Option A (hide), but with Settings toggle for users who prefer quit.

### Question 2: Multiple Windows
**Should we support multiple windows in v2?**
- Pro: Users can view multiple conversations side-by-side
- Con: Complex state management, localStorage conflicts
- Alternative: Improve sidebar navigation and search

**Recommendation:** Defer to v2, focus on improving sidebar for v1.

### Question 3: Notification Frequency
**How often should we show notifications?**
- Option A: Every response complete (could be spammy)
- Option B: Rate limited (max 1 per 5 seconds)
- Option C: Single "All responses complete" when multiple finish

**Recommendation:** Option B with Settings toggle to disable.

### Question 4: Dock Badge Count
**What should the dock badge show?**
- Option A: Number of active streaming responses
- Option B: Number of "unread" responses (requires new concept)
- Option C: No badge (just notifications)

**Recommendation:** Option A (active streams), clear when all complete.

### Question 5: Zoom Increments
**What zoom levels should we support?**
- Recommendation: 80%, 90%, 100%, 110%, 125%, 150%, 175%, 200%
- Default: 100%
- Increments: ±10% for 80-110%, ±25% for 125-200%

---

## Related Documentation

### Electron Architecture
- [`docs/electron/implementation-plan.md`](../implementation-plan.md) - Original Electron conversion
- [`docs/electron/electron-conversion-prompt.md`](../electron-conversion-prompt.md) - Conversion rationale
- [`docs/architecture/PLATFORM_DETECTION.md`](../../architecture/PLATFORM_DETECTION.md) - Platform detection system

### Distribution
- [`docs/distribution/INSTALL.md`](../../distribution/INSTALL.md) - Installation guide
- [`docs/distribution/implementation-plan.md`](../../distribution/implementation-plan.md) - DMG distribution

### Project Philosophy
- [`CLAUDE.md`](../../../CLAUDE.md) - Shared codebase principles
- [`IDEAS.md`](../../../IDEAS.md) - Feature ideas (source of requirements)

---

## Next Steps

1. **Review this spec with stakeholders**
   - Discuss open questions
   - Prioritize Phase 1 vs Phase 2
   - Confirm architecture approach

2. **Begin Phase 1 implementation**
   - Start with window state (easiest, foundational)
   - Then menu bar and shortcuts (most complex)
   - Finally quit confirmation (simplest)

3. **Test incrementally**
   - Test each feature as implemented
   - Don't wait until end to test
   - Fix bugs before moving to next feature

4. **Document as you go**
   - Update INSTALL.md with new shortcuts
   - Create user-facing shortcuts reference
   - Note any deviations from spec

---

## Questions or Feedback?

Contact the development team or file an issue on GitHub.
