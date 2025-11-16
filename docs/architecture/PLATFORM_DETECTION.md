# Platform Detection System

## Overview

AI Nexus uses a **centralized platform detection system** to elegantly handle differences between Electron and web environments without scattering conditional logic throughout the codebase.

## The Problem We're Solving

Without centralized detection, you'd see this scattered everywhere:

```typescript
// ❌ BAD: Scattered checks everywhere
if (typeof window !== 'undefined' && window.electron) {
  // Electron-specific code
}

if (typeof window !== 'undefined' && !window.electron) {
  // Web-specific code
}
```

Problems:
- Verbose and repetitive
- Error-prone (easy to forget checks)
- Hard to maintain (change logic = update everywhere)
- Not TypeScript-friendly
- Violates DRY principle

## The Solution

Two-part system:
1. **`lib/platform.ts`** - Utility functions (use anywhere)
2. **`hooks/usePlatform.ts`** - React hooks (use in components)

## API Reference

### Utilities (`lib/platform.ts`)

#### `isElectron(): boolean`
Check if app is running in Electron.

```typescript
import { isElectron } from '@/lib/platform';

if (isElectron()) {
  console.log('Running in Electron');
}
```

#### `isWeb(): boolean`
Check if app is running in web browser (inverse of `isElectron()`).

```typescript
import { isWeb } from '@/lib/platform';

if (isWeb()) {
  console.log('Running in web browser');
}
```

#### `getPlatform(): 'electron' | 'web'`
Get current platform as string.

```typescript
import { getPlatform } from '@/lib/platform';

const platform = getPlatform();
console.log(`Running on: ${platform}`);
```

#### `platformConfig<T>(config): T`
Get platform-specific values without conditionals.

```typescript
import { platformConfig } from '@/lib/platform';

// Different ports for different environments
const port = platformConfig({
  electron: 54321,
  web: 3000
});

// Different update intervals
const updateCheckInterval = platformConfig({
  electron: 60000,  // Check every minute
  web: null         // Don't check on web
});

// Different feature flags
const hasAutoUpdate = platformConfig({
  electron: true,
  web: false
});
```

### React Hooks (`hooks/usePlatform.ts`)

#### `usePlatform(): PlatformInfo`
Full platform information object.

```typescript
import { usePlatform } from '@/hooks/usePlatform';

function MyComponent() {
  const { isElectron, isWeb, platform, isReady } = usePlatform();

  if (!isReady) {
    return <Loading />; // Platform detection in progress
  }

  return (
    <div>
      Running on: {platform}
      {isElectron && <ElectronFeature />}
      {isWeb && <WebFeature />}
    </div>
  );
}
```

#### `useIsElectron(): boolean`
Simple hook that returns boolean (most common use case).

```typescript
import { useIsElectron } from '@/hooks/usePlatform';

function UpdateBanner() {
  const isElectron = useIsElectron();

  // Don't render on web
  if (!isElectron) return null;

  return <ElectronUpdateBanner />;
}
```

#### `useIsWeb(): boolean`
Hook for web-only features.

```typescript
import { useIsWeb } from '@/hooks/usePlatform';

function DeploymentGuide() {
  const isWeb = useIsWeb();

  if (!isWeb) return null;

  return <WebDeploymentInstructions />;
}
```

## Usage Examples

### Example 1: Conditional Component Rendering

```typescript
// components/UpdateBanner.tsx
import { useIsElectron } from '@/hooks/usePlatform';

export function UpdateBanner() {
  const isElectron = useIsElectron();

  // Only show in Electron
  if (!isElectron) return null;

  return <div>Update available!</div>;
}
```

### Example 2: Platform-Specific Configuration

```typescript
// lib/config.ts
import { platformConfig } from '@/lib/platform';

export const SERVER_PORT = platformConfig({
  electron: 54321,  // Production Electron uses different port
  web: 3000         // Web uses standard Next.js port
});

export const ENABLE_AUTO_UPDATE = platformConfig({
  electron: true,   // Electron has update checker
  web: false        // Web updates via deployment
});
```

### Example 3: Conditional Logic in Utilities

```typescript
// lib/storage.ts
import { isElectron } from '@/lib/platform';

export function getStoragePath(): string {
  if (isElectron()) {
    // Electron uses userData directory
    return app.getPath('userData');
  } else {
    // Web uses localStorage
    return 'localStorage';
  }
}
```

### Example 4: Menu Bar (Electron-Only)

```typescript
// components/MenuBar.tsx
import { useIsElectron } from '@/hooks/usePlatform';

export function MenuBar() {
  const isElectron = useIsElectron();

  return (
    <nav>
      <Logo />
      {/* Only show "Check for Updates" in Electron */}
      {isElectron && <UpdateMenuItem />}
    </nav>
  );
}
```

### Example 5: Platform Detection in API Routes

```typescript
// app/api/config/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Server-side detection via headers
  const userAgent = req.headers.get('user-agent') || '';
  const isElectron = userAgent.includes('Electron');

  return NextResponse.json({
    platform: isElectron ? 'electron' : 'web',
    features: {
      autoUpdate: isElectron,
      webDeployment: !isElectron
    }
  });
}
```

## How It Works

### Detection Methods (Priority Order)

The platform detection uses **three methods** for reliability:

1. **Electron API Check** (primary)
   ```typescript
   (window as any).electron !== undefined
   ```
   - Checks for `window.electron` from preload script
   - Most reliable method
   - Works if preload script loads correctly

2. **Process Type Check** (secondary)
   ```typescript
   (window as any).process?.type === 'renderer'
   ```
   - Electron-specific window property
   - Fallback if preload fails
   - Still reliable

3. **User Agent Check** (fallback)
   ```typescript
   navigator.userAgent.includes('electron')
   ```
   - Last resort
   - Works even if other methods fail
   - Less reliable but better than nothing

### Why Multiple Methods?

- **Redundancy**: If one method fails, others work
- **Development vs Production**: Different environments may expose different APIs
- **Future-proofing**: Electron updates won't break detection
- **Edge cases**: Custom builds or modified preload scripts

## When to Use What

### Use `isElectron()` / `useIsElectron()` when:
- ✅ Checking if running in Electron
- ✅ Electron-only features (auto-update, native menus)
- ✅ Platform-specific API calls

### Use `isWeb()` / `useIsWeb()` when:
- ✅ Web-only features (deployment guides, web analytics)
- ✅ Conditional rendering for web-specific UI
- ✅ Browser-specific APIs

### Use `platformConfig()` when:
- ✅ Different values for different platforms
- ✅ Configuration constants
- ✅ Feature flags
- ✅ Avoiding if/else chains

### Use `usePlatform()` when:
- ✅ Need full platform information
- ✅ Need loading state (`isReady`)
- ✅ Complex conditional logic
- ✅ Multiple platform checks in same component

## Best Practices

### ✅ DO:

```typescript
// Clean, centralized detection
import { useIsElectron } from '@/hooks/usePlatform';

function MyComponent() {
  const isElectron = useIsElectron();
  if (!isElectron) return null;
  return <ElectronFeature />;
}
```

```typescript
// Platform-specific config
import { platformConfig } from '@/lib/platform';

const port = platformConfig({ electron: 54321, web: 3000 });
```

### ❌ DON'T:

```typescript
// Don't check window.electron directly
if (window.electron) {
  // Bad: should use useIsElectron()
}

// Don't duplicate platform logic
if (typeof window !== 'undefined' && window.electron) {
  // Bad: should use isElectron()
}

// Don't create platform-specific components
function MyComponentElectron() { }
function MyComponentWeb() { }
// Bad: should use one component with conditional rendering
```

## TypeScript Support

Full TypeScript support with type guards:

```typescript
import { hasElectronAPI } from '@/lib/platform';

function doSomething() {
  if (hasElectronAPI()) {
    // TypeScript knows window.electron exists here
    window.electron.openUrl('https://example.com');
  }
}
```

## Testing

### Unit Tests

```typescript
import { isElectron, isWeb, platformConfig } from '@/lib/platform';

describe('Platform Detection', () => {
  it('should detect Electron environment', () => {
    // Mock window.electron
    (window as any).electron = {};
    expect(isElectron()).toBe(true);
    expect(isWeb()).toBe(false);
  });

  it('should detect web environment', () => {
    // Remove window.electron
    delete (window as any).electron;
    expect(isElectron()).toBe(false);
    expect(isWeb()).toBe(true);
  });

  it('should return platform-specific config', () => {
    const port = platformConfig({ electron: 54321, web: 3000 });
    expect(port).toBe(isElectron() ? 54321 : 3000);
  });
});
```

### Component Tests

```typescript
import { render } from '@testing-library/react';
import { UpdateBanner } from '@/components/UpdateBanner';

describe('UpdateBanner', () => {
  it('should render in Electron', () => {
    (window as any).electron = {};
    const { container } = render(<UpdateBanner />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('should not render on web', () => {
    delete (window as any).electron;
    const { container } = render(<UpdateBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

## Future Extensions

This system can be extended for:

### Platform-Specific Routing
```typescript
import { platformConfig } from '@/lib/platform';

const updateRoute = platformConfig({
  electron: '/electron/updates',
  web: '/web/deployment'
});
```

### Analytics
```typescript
import { getPlatform } from '@/lib/platform';

analytics.track('page_view', {
  platform: getPlatform(),
  timestamp: Date.now()
});
```

### Feature Flags
```typescript
import { platformConfig } from '@/lib/platform';

const FEATURES = {
  autoUpdate: platformConfig({ electron: true, web: false }),
  webDeployment: platformConfig({ electron: false, web: true }),
  nativeMenus: platformConfig({ electron: true, web: false })
};
```

## Related Documentation

- **Auto-Update Implementation**: `docs/distribution/auto-update-implementation-plan.md`
- **Electron Architecture**: `electron/README.md`
- **Shared Codebase Philosophy**: `CLAUDE.md` (Rule #4)

---

**Status**: Implemented
**Last Updated**: November 16, 2024
**Author**: Claude Code
