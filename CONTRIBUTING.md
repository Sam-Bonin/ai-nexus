# Contributing to AI Nexus

Thanks for your interest in contributing to AI Nexus! This guide will help you get started.

## Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-nexus.git
   cd ai-nexus
   ```
3. **Install dependencies**:
   ```bash
   yarn install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## Development Workflow

### Running the App

```bash
# Web mode (fastest for development)
yarn dev

# Electron mode (test desktop app)
# Terminal 1:
yarn dev
# Terminal 2:
yarn electron
```

### Before Committing

Run these checks to ensure your code meets our standards:

```bash
# Type check
yarn tsc --noEmit

# Lint
yarn lint

# Build (ensure no build errors)
yarn build
```

### Testing Your Changes

- **Test in both web and Electron** (if your changes affect functionality)
- **Test in both light and dark modes**
- **Test with all 5 color palettes** (if your changes affect UI)
- **Test on different screen sizes** (responsive design)

## Code Standards

### Shared Codebase Philosophy

AI Nexus uses a **single shared codebase** for both web and Electron. When contributing:

✅ **Do:**
- Build features that work in both web and Electron
- Keep platform-specific code in `electron/` (window management only)
- Use platform-agnostic APIs and libraries
- Test your changes in both environments

❌ **Don't:**
- Create parallel implementations for different platforms
- Fork components for web vs. Electron
- Put business logic in the `electron/` directory

### TypeScript

- All new code must include proper types
- No `any` types unless absolutely necessary
- Use existing types from `types/chat.ts`
- Add JSDoc comments for complex functions

### Components

- Place components in the appropriate feature directory:
  - `components/chat/` - Chat interface
  - `components/sidebar/` - Sidebar and projects
  - `components/settings/` - Settings UI
- Keep components focused and single-purpose
- Use TypeScript with proper typing
- Follow design system conventions (see `STYLEGUIDE.md`)

### Styling

- Use Tailwind CSS classes (no inline styles)
- Use theme-aware colors: `theme-primary`, `theme-secondary`, etc.
- Support both light and dark modes: `dark:` prefix
- Follow the design system in `STYLEGUIDE.md`
- Use custom utilities: `rounded-claude-md`, `shadow-claude-sm`, etc.

### File Organization

```
app/                    # Next.js app (shared)
├── api/               # API routes (server-side)
components/            # React components (shared)
├── chat/             # Chat interface
├── sidebar/          # Sidebar & projects
└── settings/         # Settings UI
electron/              # Electron wrapper (minimal, desktop only)
lib/                   # Business logic (shared)
types/                 # TypeScript types
hooks/                 # React hooks
```

## Pull Request Process

### 1. Create Your Branch

Use descriptive branch names:
- `feature/add-usage-tracking`
- `fix/streaming-connection-error`
- `docs/update-installation-guide`

### 2. Make Your Changes

- Follow the code standards above
- Write clear, concise commit messages
- Keep commits focused (one logical change per commit)

### 3. Test Thoroughly

Before submitting, ensure:
- [ ] `yarn tsc --noEmit` passes (no TypeScript errors)
- [ ] `yarn lint` passes (no ESLint errors)
- [ ] `yarn build` succeeds (no build errors)
- [ ] Changes work in web mode (`yarn dev`)
- [ ] Changes work in Electron mode (if applicable)
- [ ] UI tested in both light and dark modes
- [ ] No console errors in browser DevTools

### 4. Submit Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Go to the [AI Nexus repository](https://github.com/Sam-Bonin/ai-nexus)
3. Click "New Pull Request"
4. Select your fork and branch
5. Fill out the PR template
6. Submit!

### 5. Code Review

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged!

## What to Contribute

### Good First Issues

- Bug fixes
- Documentation improvements
- UI/UX enhancements
- Performance optimizations
- Test coverage improvements

### Feature Ideas

Before working on a major feature:
1. **Open an issue first** to discuss the idea
2. Wait for maintainer feedback
3. Get approval before starting work

This prevents duplicate work and ensures the feature aligns with the project's goals.

## Code Architecture

### Component Pattern

```typescript
// Good: Platform-agnostic component
export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="rounded-claude-md bg-pure-white dark:bg-dark-gray">
      {message.content}
    </div>
  );
}

// Bad: Platform-specific fork
export function ChatMessageWeb({ message }: { message: Message }) { ... }
export function ChatMessageElectron({ message }: { message: Message }) { ... }
```

### API Route Pattern

```typescript
// app/api/your-endpoint/route.ts
import { getOpenAIClient } from '@/lib/openaiClient';

export async function POST(req: Request) {
  try {
    const client = getOpenAIClient();
    // Your logic here
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Descriptive error message' },
      { status: 500 }
    );
  }
}
```

### Storage Pattern

```typescript
// Use type-safe storage helpers
import { getConversations, saveConversation } from '@/lib/storage';

// Good
const conversations = getConversations();
saveConversation(newConversation);

// Bad: Direct localStorage access
const data = JSON.parse(localStorage.getItem('conversations'));
```

## Common Questions

### How do I add a new feature?

1. Check if it works in both web and Electron
2. Add types to `types/chat.ts` if needed
3. Create components in appropriate feature directory
4. Add API routes if server-side logic needed
5. Update storage schema if new data needed
6. Test thoroughly in both environments

### How do I add a new theme color?

1. Add palette to `ColorPalette` type in `types/chat.ts`
2. Define colors in `lib/colorPalettes.ts`
3. Update `applyTheme()` in `hooks/useTheme.ts`
4. Add preview in `components/settings/personalization/ThemePreview.tsx`

### How do I handle platform-specific code?

Only when absolutely necessary:

```typescript
// Detect environment
const isElectron = typeof window !== 'undefined' &&
                   window.process?.type === 'renderer';

// Conditional rendering
{isElectron ? <ElectronFeature /> : <WebFeature />}
```

Keep this minimal. Most features should work everywhere.

## Resources

- **[CLAUDE.md](./CLAUDE.md)** - Complete developer documentation
- **[STYLEGUIDE.md](./STYLEGUIDE.md)** - Design system reference
- **[README.md](./README.md)** - Project overview
- **[electron/README.md](./electron/README.md)** - Electron documentation

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/Sam-Bonin/ai-nexus/discussions)
- **Bug reports?** Open an [Issue](https://github.com/Sam-Bonin/ai-nexus/issues)
- **Need clarification?** Comment on an existing issue or PR

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow GitHub's [Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines)

---

Thank you for contributing to AI Nexus! 🎉
