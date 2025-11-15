# SQLite Implementation Plan for AI Nexus Electron App

## Executive Summary

This document provides a comprehensive plan to implement SQLite database storage for the AI Nexus **Electron desktop application**. The implementation will replace the current browser localStorage with a proper file-based database, enabling robust data persistence, better performance, and unlimited storage capacity for the desktop application.

**Key Facts**:
- **Platform**: Electron desktop app only (no web version)
- **Fresh Start**: No migration from localStorage needed
- **Architecture**: Electron main process with SQLite + IPC to renderer process
- **Categorization**: Conversations start uncategorized (projectId = null), then get categorized via user action or auto-matching API

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Goals & Constraints](#2-goals--constraints)
3. [Database Schema Design](#3-database-schema-design)
4. [Electron Architecture](#4-electron-architecture)
5. [IPC Design](#5-ipc-design)
6. [Storage Layer Implementation](#6-storage-layer-implementation)
7. [Implementation Phases](#7-implementation-phases)
8. [Testing Strategy](#8-testing-strategy)
9. [Future Considerations](#9-future-considerations)

---

## 1. Current Architecture Analysis

### 1.1 Current Storage Implementation

**Location**: `lib/storage.ts`

**Storage Medium**: Browser localStorage (Electron's Chromium renderer)

**Data Operations**:
```typescript
// Conversations
getConversations(): Conversation[]
saveConversation(conversation: Conversation)
deleteConversation(id: string)
updateConversationProject(conversationId: string, projectId: string | null)

// Projects
getProjects(): Project[]
saveProject(project: Project)
deleteProject(id: string)

// Theme & UI State
getThemeSettings(): ThemeSettings
setThemeSettings(settings: ThemeSettings)
getActiveConversationId(): string | null
```

### 1.2 Data Types

**From `types/chat.ts`**:

```typescript
interface Conversation {
  id: string;                    // UUID
  title: string;                 // User-visible title
  description?: string;          // AI-generated summary (for project auto-matching)
  messages: Message[];           // Array of messages
  model?: ModelId;               // Last used model
  projectId: string | null;      // NULL = Uncategorized, else belongs to project
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
}

interface Message {
  role: 'user' | 'assistant';
  content: string;               // Message text
  thinking?: string;             // Extended thinking content (Claude-specific)
  files?: FileAttachment[];      // Attached files
  metadata?: MessageMetadata;    // Model response metadata
}

interface FileAttachment {
  name: string;                  // Original filename
  type: string;                  // MIME type
  size: number;                  // File size in bytes
  data: string;                  // Base64-encoded file data
}

interface MessageMetadata {
  model?: string;                // Model used for this response
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  duration?: number;             // Response time (ms)
  timestamp?: number;            // Unix timestamp (ms)
}

interface Project {
  id: string;                    // UUID
  name: string;                  // Project name
  description: string;           // One-liner for auto-matching algorithm
  color: string;                 // Hex color (#RRGGBB)
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
}

interface ThemeSettings {
  brightness: 'light' | 'dark' | 'system';
  palette: 'yellow' | 'blue' | 'purple' | 'green' | 'pink';
}
```

### 1.3 Current Data Flow

**Current Flow** (localStorage):
1. User interacts with UI (React renderer process)
2. `useChatController` hook manages state
3. State changes → `storage.saveConversation()` call
4. Data serialized to JSON → `localStorage.setItem()`
5. On app start → `storage.getConversations()` → `localStorage.getItem()`
6. Data hydrated into React state

**Characteristics**:
- **Synchronous**: All storage operations are immediate
- **Renderer-only**: No main process involvement
- **Size-limited**: ~10MB practical limit
- **Nested data**: Messages stored inline within conversations

### 1.4 Chat Categorization Flow

**Correct Understanding**:

1. **New conversation created** → `projectId = null` (uncategorized)
2. **User manually assigns** → UI updates `projectId` to selected project
3. **Auto-categorization** (after first exchange):
   - Generate description via API call
   - Match description against existing projects via API call
   - If confidence ≥ 0.7 → set `projectId`
   - If confidence < 0.7 → keep `projectId = null` (remains uncategorized)

**Key Point**: Conversations are "Uncategorized" by default, not "Miscellaneous". They only get categorized when explicitly assigned or auto-matched with sufficient confidence.

---

## 2. Goals & Constraints

### 2.1 Goals

1. **Desktop-First Storage**: File-based SQLite database in Electron main process
2. **Maintain Functionality**: Zero breaking changes to user experience
3. **Performance**: Sub-50ms query times (main process, no network overhead)
4. **Scalability**: Support 100+ message conversations, 1000+ total conversations
5. **Data Integrity**: ACID guarantees, foreign key constraints, cascade deletes
6. **Type Safety**: Maintain TypeScript types across IPC boundary
7. **Clean Architecture**: Repository pattern in main, IPC layer, unchanged renderer interface

### 2.2 Constraints

1. **Electron Only**: No web app, no HTTP/REST API needed
   - Database lives in main process
   - Renderer communicates via IPC only
   - Cannot use SQLite directly in renderer (security)

2. **Single User**: One database per Electron app instance
   - No authentication needed
   - No multi-user concerns
   - Database stored in Electron user data directory

3. **File Attachments**: Keep base64 in TEXT column initially
   - Matches current localStorage format
   - Optimize later to separate file storage if needed

4. **Theme Settings**: Decision needed
   - Option A: Keep in localStorage (renderer-specific, persists across sessions)
   - Option B: Move to SQLite (consistent with other data)
   - **Recommendation**: Keep in localStorage (simpler, theme is UI preference not data)

5. **UI State**: Keep expanded/collapsed folders in localStorage
   - Transient UI state shouldn't pollute database
   - Fast access without IPC round-trip

### 2.3 Non-Goals

- Migration from localStorage (fresh start, no existing user data to preserve)
- Multi-user support (future enhancement)
- Cloud sync (future enhancement)
- Web version (Electron desktop only)

---

## 3. Database Schema Design

### 3.1 Schema Overview

**Entities**:
1. `projects` - Top-level organizational unit
2. `conversations` - Chat sessions (uncategorized by default)
3. `messages` - Individual messages within conversations
4. `files` - Attached files (extracted from messages for normalization)

**Relationships**:
- `projects` 1:N `conversations` (one project has many conversations)
- `conversations` 1:N `messages` (one conversation has many messages)
- `messages` 1:N `files` (one message can have many file attachments)

### 3.2 SQL Schema

```sql
-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,           -- UUID (e.g., '550e8400-e29b-41d4-a716-446655440000')
  name TEXT NOT NULL,                     -- Project name (e.g., 'AI Nexus Development')
  description TEXT NOT NULL DEFAULT '',   -- One-liner for AI auto-matching (e.g., 'Building a Claude clone')
  color TEXT NOT NULL,                    -- Hex color (e.g., '#FFD700')
  created_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds
  updated_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds

  -- Constraints
  CHECK (length(id) > 0),
  CHECK (length(name) > 0),
  CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  CHECK (created_at > 0),
  CHECK (updated_at >= created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name COLLATE NOCASE);


-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY NOT NULL,           -- UUID
  title TEXT NOT NULL,                    -- User-visible title (e.g., 'Database Implementation Plan')
  description TEXT DEFAULT NULL,          -- AI-generated one-liner for project auto-matching
  model TEXT DEFAULT NULL,                -- Last used model ID (e.g., 'anthropic/claude-sonnet-4.5')
  project_id TEXT DEFAULT NULL,           -- Foreign key to projects (NULL = Uncategorized)
  created_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds
  updated_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds

  -- Constraints
  CHECK (length(id) > 0),
  CHECK (length(title) > 0),
  CHECK (created_at > 0),
  CHECK (updated_at >= created_at),

  -- Foreign key (with SET NULL on project delete → conversation becomes uncategorized)
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_title ON conversations(title COLLATE NOCASE);


-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  conversation_id TEXT NOT NULL,          -- Foreign key to conversations
  role TEXT NOT NULL,                     -- 'user' | 'assistant'
  content TEXT NOT NULL DEFAULT '',       -- Message content (can be empty for file-only messages)
  thinking TEXT DEFAULT NULL,             -- Extended thinking content (Claude feature)

  -- Metadata (flattened from MessageMetadata interface)
  metadata_model TEXT DEFAULT NULL,       -- Model used for this message
  metadata_tokens_input INTEGER DEFAULT NULL,
  metadata_tokens_output INTEGER DEFAULT NULL,
  metadata_tokens_total INTEGER DEFAULT NULL,
  metadata_duration INTEGER DEFAULT NULL, -- Response duration in ms
  metadata_timestamp INTEGER DEFAULT NULL,-- Unix timestamp in ms

  -- Ordering
  sequence_number INTEGER NOT NULL,       -- Order within conversation (0-indexed)
  created_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds

  -- Constraints
  CHECK (length(conversation_id) > 0),
  CHECK (role IN ('user', 'assistant')),
  CHECK (sequence_number >= 0),
  CHECK (created_at > 0),
  CHECK (metadata_tokens_input IS NULL OR metadata_tokens_input >= 0),
  CHECK (metadata_tokens_output IS NULL OR metadata_tokens_output >= 0),
  CHECK (metadata_tokens_total IS NULL OR metadata_tokens_total >= 0),
  CHECK (metadata_duration IS NULL OR metadata_duration >= 0),

  -- Foreign key (with CASCADE delete)
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,

  -- Unique constraint (prevent duplicate sequence numbers in same conversation)
  UNIQUE(conversation_id, sequence_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);


-- ============================================================================
-- FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  message_id INTEGER NOT NULL,            -- Foreign key to messages
  name TEXT NOT NULL,                     -- Original filename (e.g., 'screenshot.png')
  type TEXT NOT NULL,                     -- MIME type (e.g., 'image/png')
  size INTEGER NOT NULL,                  -- File size in bytes
  data TEXT NOT NULL,                     -- Base64-encoded file data
  created_at INTEGER NOT NULL,            -- Unix timestamp in milliseconds

  -- Constraints
  CHECK (length(name) > 0),
  CHECK (length(type) > 0),
  CHECK (size > 0),
  CHECK (length(data) > 0),
  CHECK (created_at > 0),

  -- Foreign key (with CASCADE delete)
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_message_id ON files(message_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);


-- ============================================================================
-- METADATA TABLE (for schema versioning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- Insert schema version
INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', '1');
INSERT OR REPLACE INTO metadata (key, value) VALUES ('created_at', strftime('%s', 'now') || '000');
```

### 3.3 Schema Rationale

**Design Decisions**:

1. **Primary Keys**:
   - `projects.id`, `conversations.id`: UUID strings (generated in renderer)
   - `messages.id`, `files.id`: Auto-increment integers (never referenced externally)

2. **Timestamps**:
   - Store as INTEGER (Unix milliseconds)
   - Matches JavaScript `Date.now()` format
   - SQLite has no native timestamp type; integers are efficient

3. **Foreign Keys**:
   - `conversations.project_id → projects.id`: `ON DELETE SET NULL` (deleted project → uncategorized conversations)
   - `messages.conversation_id → conversations.id`: `ON DELETE CASCADE` (deleted conversation → delete messages)
   - `files.message_id → messages.id`: `ON DELETE CASCADE` (deleted message → delete files)

4. **Normalization**:
   - Messages extracted to separate table (enables efficient pagination, search)
   - Files extracted to separate table (cleaner schema, future optimization)
   - Metadata flattened (avoid JSON column, enables SQL queries on token counts)

5. **sequence_number**:
   - Preserves message order within conversation
   - Allows efficient re-ordering if needed
   - Unique constraint prevents duplicates

6. **Base64 Storage**:
   - Keep files as base64 TEXT (matches current localStorage format)
   - Easier JSON serialization across IPC boundary
   - Future: Migrate to BLOB or file system storage

### 3.4 Database File Location

**Electron User Data Directory**:
```typescript
import { app } from 'electron';
import path from 'path';

// Database location
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'ai-nexus.db');

// Example paths:
// macOS: ~/Library/Application Support/ai-nexus/ai-nexus.db
// Windows: %APPDATA%/ai-nexus/ai-nexus.db
// Linux: ~/.config/ai-nexus/ai-nexus.db
```

---

## 4. Electron Architecture

### 4.1 Technology Stack

**Database**:
- **better-sqlite3** (https://github.com/WiseLibs/better-sqlite3)
  - Synchronous API (perfect for Electron main process)
  - Fastest Node.js SQLite library
  - Production-ready (used by VS Code, Discord, Obsidian)
  - Native module (requires electron-rebuild)
  - Supports prepared statements, transactions, WAL mode

**Electron IPC**:
- **contextBridge** + **ipcRenderer** (renderer → main)
- **ipcMain.handle()** (main handlers)
- Type-safe with TypeScript + typed IPC channels

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ RENDERER PROCESS (React UI)                        │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ hooks/useChatController.ts                   │  │
│  │ components/sidebar/SidebarShell.tsx          │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│  ┌─────────────────▼────────────────────────────┐  │
│  │ lib/storage.ts (unchanged interface)         │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│  ┌─────────────────▼────────────────────────────┐  │
│  │ preload.ts (contextBridge)                   │  │
│  │ window.electronAPI.storage.*                 │  │
│  └─────────────────┬────────────────────────────┘  │
└────────────────────┼────────────────────────────────┘
                     │ IPC
                     │ (invoke/handle)
┌────────────────────▼────────────────────────────────┐
│ MAIN PROCESS (Node.js + SQLite)                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ main/ipc/storageHandlers.ts                 │  │
│  │ (IPC event handlers)                         │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│  ┌─────────────────▼────────────────────────────┐  │
│  │ main/services/storageService.ts              │  │
│  │ (Business logic)                             │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│  ┌─────────────────▼────────────────────────────┐  │
│  │ main/repositories/                           │  │
│  │   - conversationRepository.ts                │  │
│  │   - projectRepository.ts                     │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│  ┌─────────────────▼────────────────────────────┐  │
│  │ main/database/db.ts (SQLite singleton)       │  │
│  └─────────────────┬────────────────────────────┘  │
│                    │                                │
│                    ▼                                │
│              ai-nexus.db                            │
└─────────────────────────────────────────────────────┘
```

### 4.3 File Structure

**New/Modified Files**:
```
electron/
  main/
    database/
      db.ts                          # SQLite singleton & connection management
      schema.ts                      # SQL schema definition
      types.ts                       # Database row types

    repositories/
      conversationRepository.ts      # Conversation CRUD operations
      projectRepository.ts           # Project CRUD operations

    services/
      storageService.ts              # High-level storage service (business logic)

    ipc/
      storageHandlers.ts             # IPC handlers (glue between renderer and services)
      types.ts                       # IPC channel names + typed payloads

    index.ts                         # Main process entry (register IPC handlers)

  preload/
    index.ts                         # Expose electronAPI via contextBridge

src/
  lib/
    storage.ts                       # MODIFIED: Call window.electronAPI instead of localStorage

  hooks/
    useChatController.ts             # MODIFIED: Add async/await (already mostly async)

  components/
    sidebar/SidebarShell.tsx         # MODIFIED: Add async/await for project operations

package.json                         # Add better-sqlite3, electron-rebuild script
```

### 4.4 Database Singleton (Main Process)

**`electron/main/database/db.ts`**:

```typescript
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';

let db: Database.Database | null = null;

/**
 * Get or create the database instance (singleton)
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Database in Electron user data directory
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'ai-nexus.db');

  console.log('[Database] Opening SQLite database at:', dbPath);

  // Open database
  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema
  initializeSchema(db);

  console.log('[Database] SQLite database initialized');

  return db;
}

/**
 * Close the database connection (for app shutdown)
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[Database] Closing database');
    db.close();
    db = null;
  }
}

/**
 * Execute a function within a transaction
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  const txn = database.transaction(fn);
  return txn();
}
```

---

## 5. IPC Design

### 5.1 IPC Channel Naming Convention

**Pattern**: `storage:{resource}:{action}`

**Channels**:
```typescript
// Conversations
'storage:conversations:getAll'
'storage:conversations:getById'
'storage:conversations:save'
'storage:conversations:delete'
'storage:conversations:updateProject'

// Projects
'storage:projects:getAll'
'storage:projects:getById'
'storage:projects:save'
'storage:projects:delete'

// Utility
'storage:export'
'storage:import'
'storage:health'
```

### 5.2 Typed IPC Definitions

**`electron/main/ipc/types.ts`**:

```typescript
import { Conversation, Project } from '@/types/chat';

/**
 * IPC channel names
 */
export const IPC_CHANNELS = {
  // Conversations
  CONVERSATIONS_GET_ALL: 'storage:conversations:getAll',
  CONVERSATIONS_GET_BY_ID: 'storage:conversations:getById',
  CONVERSATIONS_SAVE: 'storage:conversations:save',
  CONVERSATIONS_DELETE: 'storage:conversations:delete',
  CONVERSATIONS_UPDATE_PROJECT: 'storage:conversations:updateProject',

  // Projects
  PROJECTS_GET_ALL: 'storage:projects:getAll',
  PROJECTS_GET_BY_ID: 'storage:projects:getById',
  PROJECTS_SAVE: 'storage:projects:save',
  PROJECTS_DELETE: 'storage:projects:delete',

  // Utility
  STORAGE_EXPORT: 'storage:export',
  STORAGE_IMPORT: 'storage:import',
  STORAGE_HEALTH: 'storage:health',
} as const;

/**
 * IPC request/response types
 */
export interface IpcInvokeMap {
  [IPC_CHANNELS.CONVERSATIONS_GET_ALL]: {
    request: void;
    response: Conversation[];
  };
  [IPC_CHANNELS.CONVERSATIONS_GET_BY_ID]: {
    request: { id: string };
    response: Conversation | null;
  };
  [IPC_CHANNELS.CONVERSATIONS_SAVE]: {
    request: { conversation: Conversation };
    response: void;
  };
  [IPC_CHANNELS.CONVERSATIONS_DELETE]: {
    request: { id: string };
    response: void;
  };
  [IPC_CHANNELS.CONVERSATIONS_UPDATE_PROJECT]: {
    request: { conversationId: string; projectId: string | null };
    response: void;
  };
  [IPC_CHANNELS.PROJECTS_GET_ALL]: {
    request: void;
    response: Project[];
  };
  [IPC_CHANNELS.PROJECTS_GET_BY_ID]: {
    request: { id: string };
    response: Project | null;
  };
  [IPC_CHANNELS.PROJECTS_SAVE]: {
    request: { project: Project };
    response: void;
  };
  [IPC_CHANNELS.PROJECTS_DELETE]: {
    request: { id: string };
    response: void;
  };
  [IPC_CHANNELS.STORAGE_EXPORT]: {
    request: void;
    response: { conversations: Conversation[]; projects: Project[] };
  };
  [IPC_CHANNELS.STORAGE_IMPORT]: {
    request: { conversations: Conversation[]; projects: Project[] };
    response: void;
  };
  [IPC_CHANNELS.STORAGE_HEALTH]: {
    request: void;
    response: { ok: boolean; dbSize: number; conversationCount: number; projectCount: number };
  };
}
```

### 5.3 IPC Handlers (Main Process)

**`electron/main/ipc/storageHandlers.ts`**:

```typescript
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './types';
import { storageService } from '../services/storageService';

/**
 * Register all storage IPC handlers
 */
export function registerStorageHandlers() {
  // Conversations
  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_GET_ALL, async () => {
    return storageService.getConversations();
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_GET_BY_ID, async (_, { id }) => {
    return storageService.getConversation(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_SAVE, async (_, { conversation }) => {
    return storageService.saveConversation(conversation);
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_DELETE, async (_, { id }) => {
    return storageService.deleteConversation(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_UPDATE_PROJECT, async (_, { conversationId, projectId }) => {
    return storageService.updateConversationProject(conversationId, projectId);
  });

  // Projects
  ipcMain.handle(IPC_CHANNELS.PROJECTS_GET_ALL, async () => {
    return storageService.getProjects();
  });

  ipcMain.handle(IPC_CHANNELS.PROJECTS_GET_BY_ID, async (_, { id }) => {
    return storageService.getProject(id);
  });

  ipcMain.handle(IPC_CHANNELS.PROJECTS_SAVE, async (_, { project }) => {
    return storageService.saveProject(project);
  });

  ipcMain.handle(IPC_CHANNELS.PROJECTS_DELETE, async (_, { id }) => {
    return storageService.deleteProject(id);
  });

  // Utility
  ipcMain.handle(IPC_CHANNELS.STORAGE_EXPORT, async () => {
    return storageService.exportData();
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_IMPORT, async (_, { conversations, projects }) => {
    return storageService.importData(conversations, projects);
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_HEALTH, async () => {
    return storageService.healthCheck();
  });

  console.log('[IPC] Storage handlers registered');
}
```

### 5.4 Preload Script (Context Bridge)

**`electron/preload/index.ts`**:

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type IpcInvokeMap } from '../main/ipc/types';

/**
 * Type-safe IPC invoke wrapper
 */
function createIpcInvoke<T extends keyof IpcInvokeMap>(channel: T) {
  return (args: IpcInvokeMap[T]['request']): Promise<IpcInvokeMap[T]['response']> => {
    return ipcRenderer.invoke(channel, args);
  };
}

/**
 * Expose storage API to renderer via contextBridge
 */
const electronAPI = {
  storage: {
    // Conversations
    getConversations: () => ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_GET_ALL),
    getConversation: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_GET_BY_ID, { id }),
    saveConversation: (conversation: any) => ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_SAVE, { conversation }),
    deleteConversation: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_DELETE, { id }),
    updateConversationProject: (conversationId: string, projectId: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.CONVERSATIONS_UPDATE_PROJECT, { conversationId, projectId }),

    // Projects
    getProjects: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_GET_ALL),
    getProject: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_GET_BY_ID, { id }),
    saveProject: (project: any) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_SAVE, { project }),
    deleteProject: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_DELETE, { id }),

    // Utility
    export: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_EXPORT),
    import: (conversations: any[], projects: any[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.STORAGE_IMPORT, { conversations, projects }),
    health: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_HEALTH),
  },
};

// Expose to window object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript declaration for renderer
export type ElectronAPI = typeof electronAPI;
```

### 5.5 TypeScript Declarations

**`src/global.d.ts`**:

```typescript
import type { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## 6. Storage Layer Implementation

### 6.1 Repository Pattern (Main Process)

**`electron/main/repositories/conversationRepository.ts`** (excerpt):

```typescript
import { getDatabase } from '../database/db';
import type { Conversation, Message } from '@/types/chat';
import type { ConversationRow, MessageRow, FileRow } from '../database/types';

export class ConversationRepository {
  private db = getDatabase();

  // Prepared statements (created once, reused)
  private stmts = {
    getAll: this.db.prepare(`
      SELECT * FROM conversations
      ORDER BY updated_at DESC
    `),

    getById: this.db.prepare(`
      SELECT * FROM conversations
      WHERE id = ?
    `),

    insert: this.db.prepare(`
      INSERT INTO conversations (id, title, description, model, project_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),

    update: this.db.prepare(`
      UPDATE conversations
      SET title = ?, description = ?, model = ?, project_id = ?, updated_at = ?
      WHERE id = ?
    `),

    delete: this.db.prepare(`
      DELETE FROM conversations WHERE id = ?
    `),

    updateProject: this.db.prepare(`
      UPDATE conversations
      SET project_id = ?, updated_at = ?
      WHERE id = ?
    `),

    // Messages
    getMessagesByConversationId: this.db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY sequence_number ASC
    `),

    insertMessage: this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, thinking, metadata_model, metadata_tokens_input, metadata_tokens_output, metadata_tokens_total, metadata_duration, metadata_timestamp, sequence_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),

    deleteMessages: this.db.prepare(`
      DELETE FROM messages WHERE conversation_id = ?
    `),

    // Files
    getFilesByMessageId: this.db.prepare(`
      SELECT * FROM files
      WHERE message_id = ?
    `),

    insertFile: this.db.prepare(`
      INSERT INTO files (message_id, name, type, size, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
  };

  /**
   * Get all conversations (without messages - performance)
   */
  findAll(): Conversation[] {
    const rows = this.stmts.getAll.all() as ConversationRow[];
    return rows.map(row => this.rowToConversation(row, []));
  }

  /**
   * Get conversation by ID (with messages)
   */
  findById(id: string): Conversation | null {
    const row = this.stmts.getById.get(id) as ConversationRow | undefined;
    if (!row) return null;

    const messages = this.getMessagesForConversation(id);
    return this.rowToConversation(row, messages);
  }

  /**
   * Create or update conversation
   */
  save(conversation: Conversation): void {
    const now = Date.now();
    const exists = this.stmts.getById.get(conversation.id);

    const txn = this.db.transaction(() => {
      if (exists) {
        // Update conversation
        this.stmts.update.run(
          conversation.title,
          conversation.description ?? null,
          conversation.model ?? null,
          conversation.projectId ?? null,
          now,
          conversation.id
        );
      } else {
        // Insert conversation
        this.stmts.insert.run(
          conversation.id,
          conversation.title,
          conversation.description ?? null,
          conversation.model ?? null,
          conversation.projectId ?? null,
          conversation.createdAt,
          now
        );
      }

      // Delete existing messages and re-insert (simplest approach)
      this.stmts.deleteMessages.run(conversation.id);

      // Insert messages
      conversation.messages.forEach((message, index) => {
        const result = this.stmts.insertMessage.run(
          conversation.id,
          message.role,
          message.content,
          message.thinking ?? null,
          message.metadata?.model ?? null,
          message.metadata?.tokens?.input ?? null,
          message.metadata?.tokens?.output ?? null,
          message.metadata?.tokens?.total ?? null,
          message.metadata?.duration ?? null,
          message.metadata?.timestamp ?? null,
          index,
          Date.now()
        );

        const messageId = result.lastInsertRowid;

        // Insert files
        if (message.files) {
          message.files.forEach(file => {
            this.stmts.insertFile.run(
              messageId,
              file.name,
              file.type,
              file.size,
              file.data,
              Date.now()
            );
          });
        }
      });
    });

    txn();
  }

  /**
   * Delete conversation
   */
  deleteById(id: string): void {
    this.stmts.delete.run(id);
  }

  /**
   * Update conversation's project
   */
  updateProject(conversationId: string, projectId: string | null): void {
    this.stmts.updateProject.run(projectId, Date.now(), conversationId);
  }

  // Private helper methods...
  private getMessagesForConversation(conversationId: string): Message[] {
    const messageRows = this.stmts.getMessagesByConversationId.all(conversationId) as MessageRow[];
    return messageRows.map(row => this.rowToMessage(row));
  }

  private rowToMessage(row: MessageRow): Message {
    const files = this.stmts.getFilesByMessageId.all(row.id) as FileRow[];

    return {
      role: row.role as 'user' | 'assistant',
      content: row.content,
      thinking: row.thinking ?? undefined,
      files: files.length > 0 ? files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        data: f.data,
      })) : undefined,
      metadata: row.metadata_model ? {
        model: row.metadata_model,
        tokens: row.metadata_tokens_total ? {
          input: row.metadata_tokens_input!,
          output: row.metadata_tokens_output!,
          total: row.metadata_tokens_total,
        } : undefined,
        duration: row.metadata_duration ?? undefined,
        timestamp: row.metadata_timestamp ?? undefined,
      } : undefined,
    };
  }

  private rowToConversation(row: ConversationRow, messages: Message[]): Conversation {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      model: row.model as any,
      projectId: row.project_id,
      messages,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

### 6.2 Storage Service (Main Process)

**`electron/main/services/storageService.ts`**:

```typescript
import { ConversationRepository } from '../repositories/conversationRepository';
import { ProjectRepository } from '../repositories/projectRepository';
import { transaction } from '../database/db';
import type { Conversation, Project } from '@/types/chat';

class StorageService {
  private conversationRepo = new ConversationRepository();
  private projectRepo = new ProjectRepository();

  // Conversations
  getConversations(): Conversation[] {
    return this.conversationRepo.findAll();
  }

  getConversation(id: string): Conversation | null {
    return this.conversationRepo.findById(id);
  }

  saveConversation(conversation: Conversation): void {
    this.conversationRepo.save(conversation);
  }

  deleteConversation(id: string): void {
    this.conversationRepo.deleteById(id);
  }

  updateConversationProject(conversationId: string, projectId: string | null): void {
    this.conversationRepo.updateProject(conversationId, projectId);
  }

  // Projects
  getProjects(): Project[] {
    return this.projectRepo.findAll();
  }

  getProject(id: string): Project | null {
    return this.projectRepo.findById(id);
  }

  saveProject(project: Project): void {
    this.projectRepo.save(project);
  }

  deleteProject(id: string): void {
    this.projectRepo.deleteById(id);
    // Note: Foreign key ON DELETE SET NULL handles orphaned conversations
  }

  // Utility
  exportData(): { conversations: Conversation[]; projects: Project[] } {
    const conversations = this.conversationRepo.findAll().map(c =>
      this.conversationRepo.findById(c.id)! // Load with messages
    );
    const projects = this.projectRepo.findAll();

    return { conversations, projects };
  }

  importData(conversations: Conversation[], projects: Project[]): void {
    transaction(() => {
      // Clear existing data
      this.conversationRepo.deleteAll();
      this.projectRepo.deleteAll();

      // Import
      projects.forEach(p => this.projectRepo.save(p));
      conversations.forEach(c => this.conversationRepo.save(c));
    });
  }

  healthCheck(): { ok: boolean; dbSize: number; conversationCount: number; projectCount: number } {
    const conversations = this.conversationRepo.findAll();
    const projects = this.projectRepo.findAll();

    // Get database file size
    const db = require('../database/db').getDatabase();
    const stmt = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
    const { size } = stmt.get() as { size: number };

    return {
      ok: true,
      dbSize: size,
      conversationCount: conversations.length,
      projectCount: projects.length,
    };
  }
}

export const storageService = new StorageService();
```

### 6.3 Renderer Storage Adapter

**`src/lib/storage.ts`** (modified):

```typescript
import { Conversation, Project, ThemeSettings } from '@/types/chat';

/**
 * Storage adapter that delegates to Electron IPC (SQLite in main process)
 * Maintains same interface as original localStorage implementation
 */
export const storage = {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return window.electronAPI.storage.getConversations();
  },

  async saveConversations(conversations: Conversation[]): Promise<void> {
    // Batch save (rarely used, but keep for compatibility)
    await Promise.all(conversations.map(c => this.saveConversation(c)));
  },

  async getConversation(id: string): Promise<Conversation | null> {
    return window.electronAPI.storage.getConversation(id);
  },

  async saveConversation(conversation: Conversation): Promise<void> {
    return window.electronAPI.storage.saveConversation(conversation);
  },

  async deleteConversation(id: string): Promise<void> {
    return window.electronAPI.storage.deleteConversation(id);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return window.electronAPI.storage.getProjects();
  },

  async saveProjects(projects: Project[]): Promise<void> {
    await Promise.all(projects.map(p => this.saveProject(p)));
  },

  async getProject(id: string): Promise<Project | null> {
    return window.electronAPI.storage.getProject(id);
  },

  async saveProject(project: Project): Promise<void> {
    return window.electronAPI.storage.saveProject(project);
  },

  async deleteProject(id: string): Promise<void> {
    return window.electronAPI.storage.deleteProject(id);
  },

  async updateConversationProject(conversationId: string, projectId: string | null): Promise<void> {
    return window.electronAPI.storage.updateConversationProject(conversationId, projectId);
  },

  // Active conversation (keep in localStorage - transient UI state)
  getActiveConversationId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('claude-active-conversation');
  },

  setActiveConversationId(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id) {
      localStorage.setItem('claude-active-conversation', id);
    } else {
      localStorage.removeItem('claude-active-conversation');
    }
  },

  // Theme (keep in localStorage - renderer-specific preference)
  getTheme(): 'light' | 'dark' | 'system' {
    if (typeof window === 'undefined') return 'system';
    const theme = localStorage.getItem('claude-theme');
    return (theme as 'light' | 'dark' | 'system') || 'system';
  },

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('claude-theme', theme);
  },

  getThemeSettings(): ThemeSettings {
    if (typeof window === 'undefined') {
      return { brightness: 'system', palette: 'yellow' };
    }
    const data = localStorage.getItem('claude-theme-settings');
    return data ? JSON.parse(data) : { brightness: 'system', palette: 'yellow' };
  },

  setThemeSettings(settings: ThemeSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('claude-theme-settings', JSON.stringify(settings));
  },

  // Convenience getters (keep for backward compat)
  getBrightness() { return this.getThemeSettings().brightness; },
  getPalette() { return this.getThemeSettings().palette; },
  setBrightness(brightness: any) {
    const current = this.getThemeSettings();
    this.setThemeSettings({ ...current, brightness });
  },
  setPalette(palette: any) {
    const current = this.getThemeSettings();
    this.setThemeSettings({ ...current, palette });
  },
};
```

---

## 7. Implementation Phases

### Phase 1: Electron + SQLite Setup (Week 1)

**Goal**: Set up Electron with SQLite, no UI changes yet.

**Tasks**:
1. [ ] Install dependencies
   ```bash
   npm install better-sqlite3
   npm install -D @types/better-sqlite3 electron-rebuild
   npm install -D electron electron-builder
   ```

2. [ ] Configure electron-rebuild
   ```json
   // package.json
   {
     "scripts": {
       "postinstall": "electron-rebuild"
     }
   }
   ```

3. [ ] Create Electron main process structure
   - [ ] `electron/main/index.ts` - Entry point
   - [ ] `electron/main/database/db.ts` - SQLite singleton
   - [ ] `electron/main/database/schema.ts` - Schema initialization
   - [ ] `electron/main/database/types.ts` - TypeScript types

4. [ ] Create preload script
   - [ ] `electron/preload/index.ts` - contextBridge setup

5. [ ] Test Electron app launches
   - [ ] Create basic window
   - [ ] Verify SQLite database created in userData

**Deliverable**: Electron app launches, SQLite database initializes.

---

### Phase 2: Database Layer (Week 2)

**Goal**: Build repository layer, no IPC yet.

**Tasks**:
1. [ ] Create repositories
   - [ ] `electron/main/repositories/conversationRepository.ts`
   - [ ] `electron/main/repositories/projectRepository.ts`

2. [ ] Write unit tests
   - [ ] Test CRUD operations
   - [ ] Test transactions
   - [ ] Test foreign key constraints (delete project → conversations become uncategorized)
   - [ ] Test cascade deletes (delete conversation → messages deleted)

3. [ ] Create storage service
   - [ ] `electron/main/services/storageService.ts`
   - [ ] Business logic layer on top of repositories

**Deliverable**: Repository layer functional and tested (unit tests in main process).

---

### Phase 3: IPC Integration (Week 3)

**Goal**: Connect renderer to main process via IPC.

**Tasks**:
1. [ ] Define IPC types
   - [ ] `electron/main/ipc/types.ts` - Channel names + typed payloads

2. [ ] Implement IPC handlers
   - [ ] `electron/main/ipc/storageHandlers.ts` - Register all handlers
   - [ ] Wire up to storageService

3. [ ] Expose API in preload
   - [ ] `electron/preload/index.ts` - Expose window.electronAPI via contextBridge

4. [ ] Add TypeScript declarations
   - [ ] `src/global.d.ts` - window.electronAPI types

5. [ ] Test IPC communication
   - [ ] Call IPC from renderer console
   - [ ] Verify data flows correctly

**Deliverable**: IPC layer functional, can call storage from renderer console.

---

### Phase 4: Renderer Integration (Week 4)

**Goal**: Update renderer to use IPC storage instead of localStorage.

**Tasks**:
1. [ ] Update `lib/storage.ts`
   - [ ] Replace localStorage calls with window.electronAPI calls
   - [ ] All methods return Promises

2. [ ] Update hooks
   - [ ] `hooks/useChatController.ts` - Add async/await for storage calls
   - [ ] Handle loading states (most hooks already async)

3. [ ] Update components
   - [ ] `components/sidebar/SidebarShell.tsx` - Async project operations
   - [ ] Add loading states where needed

4. [ ] Test full user flows
   - [ ] Create conversation → persists to SQLite
   - [ ] Create project → persists to SQLite
   - [ ] Auto-categorize conversation → updates projectId
   - [ ] Delete project → conversations become uncategorized
   - [ ] Restart app → data persists

**Deliverable**: Full app functional with SQLite backend, no localStorage for data.

---

### Phase 5: Polish & Testing (Week 5)

**Goal**: Production-ready implementation.

**Tasks**:
1. [ ] Add export/import functionality
   - [ ] Settings page: Export button (JSON file)
   - [ ] Settings page: Import button (restore from JSON)
   - [ ] Show storage statistics (DB size, conversation count)

2. [ ] Performance optimization
   - [ ] Profile IPC latency
   - [ ] Optimize slow queries (if any)
   - [ ] Add lazy loading if needed (conversations without messages)

3. [ ] Error handling
   - [ ] Handle IPC errors gracefully
   - [ ] Show user-friendly error messages
   - [ ] Add database corruption recovery

4. [ ] Documentation
   - [ ] Update README with Electron architecture
   - [ ] Document database schema
   - [ ] Document IPC API

5. [ ] End-to-end testing
   - [ ] Test with 1000+ conversations
   - [ ] Test concurrent operations
   - [ ] Test app restart/recovery

**Deliverable**: Production-ready Electron app with SQLite.

---

## 8. Testing Strategy

### 8.1 Unit Tests (Main Process)

**Database Layer** (`electron/main/database/__tests__/`):
```typescript
import Database from 'better-sqlite3';
import { ConversationRepository } from '../repositories/conversationRepository';
import { initializeSchema } from '../database/schema';

describe('ConversationRepository', () => {
  let db: Database.Database;
  let repo: ConversationRepository;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new Database(':memory:');
    initializeSchema(db);
    repo = new ConversationRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should insert and retrieve conversation', () => {
    const conversation: Conversation = {
      id: 'test-1',
      title: 'Test Chat',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ],
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    repo.save(conversation);
    const retrieved = repo.findById('test-1');

    expect(retrieved).toEqual(conversation);
  });

  it('should set project_id to null when project deleted', () => {
    const projectRepo = new ProjectRepository(db);
    const project: Project = {
      id: 'proj-1',
      name: 'Test Project',
      description: 'Test',
      color: '#FF0000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    projectRepo.save(project);

    const conversation: Conversation = {
      id: 'conv-1',
      title: 'Test',
      messages: [],
      projectId: 'proj-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    repo.save(conversation);

    // Delete project
    projectRepo.deleteById('proj-1');

    // Conversation should become uncategorized
    const updated = repo.findById('conv-1');
    expect(updated!.projectId).toBeNull();
  });

  it('should cascade delete messages when conversation deleted', () => {
    const conversation: Conversation = {
      id: 'conv-1',
      title: 'Test',
      messages: [{ role: 'user', content: 'Hello' }],
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    repo.save(conversation);

    repo.deleteById('conv-1');

    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ?').all('conv-1');
    expect(messages).toHaveLength(0);
  });
});
```

### 8.2 Integration Tests (IPC)

**IPC Communication** (`electron/__tests__/ipc.test.ts`):
```typescript
import { app } from 'electron';
import { ConversationRepository } from '../main/repositories/conversationRepository';

// Mock Electron IPC for testing
describe('IPC Integration', () => {
  beforeAll(async () => {
    await app.whenReady();
  });

  it('should save conversation via IPC', async () => {
    const conversation: Conversation = {
      id: 'test-1',
      title: 'IPC Test',
      messages: [],
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Simulate IPC call
    await window.electronAPI.storage.saveConversation(conversation);

    // Verify in database
    const repo = new ConversationRepository();
    const retrieved = repo.findById('test-1');
    expect(retrieved).toEqual(conversation);
  });
});
```

### 8.3 E2E Tests (Electron)

**User Flows** (using Spectron or Playwright):
```typescript
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('user can create and persist conversation', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();

  // Type message
  await window.fill('textarea', 'Hello Claude!');
  await window.click('button[type="submit"]');

  // Wait for response
  await window.waitForSelector('[data-role="assistant"]');

  // Close and reopen app
  await app.close();
  const app2 = await electron.launch({ args: ['.'] });
  const window2 = await app2.firstWindow();

  // Conversation should persist
  await expect(window2.locator('[data-role="user"]')).toContainText('Hello Claude!');

  await app2.close();
});
```

### 8.4 Performance Tests

**Load Testing**:
```typescript
test('performance: 1000 conversations', () => {
  const repo = new ConversationRepository();

  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    repo.save({
      id: `conv-${i}`,
      title: `Conversation ${i}`,
      messages: Array(10).fill(null).map((_, j) => ({
        role: j % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${j}`,
      })),
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  const saveTime = Date.now() - start;

  const queryStart = Date.now();
  const all = repo.findAll();
  const queryTime = Date.now() - queryStart;

  console.log(`Saved 1000 conversations in ${saveTime}ms`);
  console.log(`Queried 1000 conversations in ${queryTime}ms`);

  expect(all).toHaveLength(1000);
  expect(queryTime).toBeLessThan(50); // Main process, should be <50ms
});
```

---

## 9. Future Considerations

### 9.1 Multi-User Support (If Needed)

**Changes Required**:
1. Add `users` table with authentication
2. Add `user_id` column to `conversations`, `projects`
3. Add row-level security (all queries filter by user_id)
4. Implement session management

**Schema Update**:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL
);

ALTER TABLE conversations ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN user_id TEXT REFERENCES users(id);
```

### 9.2 Cloud Sync (Future Enhancement)

**Architecture**:
- Keep local SQLite for performance + offline support
- Add sync layer to push changes to cloud
- Use CRDTs or operational transformation for conflict resolution
- Consider: Supabase, Firebase, or custom sync server

### 9.3 Full-Text Search

**SQLite FTS5**:
```sql
CREATE VIRTUAL TABLE messages_fts USING fts5(
  conversation_id,
  role,
  content,
  thinking
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, conversation_id, role, content, thinking)
  VALUES (new.id, new.conversation_id, new.role, new.content, new.thinking);
END;

-- Search query
SELECT conversations.*
FROM conversations
JOIN messages_fts ON messages_fts.conversation_id = conversations.id
WHERE messages_fts MATCH 'database migration'
ORDER BY rank;
```

### 9.4 File Storage Optimization

**Move to File System**:
- Extract base64 files from database
- Store in `userData/files/{message_id}/{filename}`
- Keep only file path in database
- Significantly reduces database size

**Schema Update**:
```sql
ALTER TABLE files ADD COLUMN file_path TEXT;
-- data column becomes optional
```

### 9.5 Backup & Restore

**Automated Backups** (Electron main process):
```typescript
import { CronJob } from 'cron';
import fs from 'fs';
import path from 'path';

// Daily backup at 2 AM
new CronJob('0 2 * * *', () => {
  const dbPath = path.join(app.getPath('userData'), 'ai-nexus.db');
  const backupPath = path.join(app.getPath('userData'), 'backups', `ai-nexus-${Date.now()}.db`);

  fs.copyFileSync(dbPath, backupPath);
  console.log('[Backup] Created:', backupPath);

  // Keep last 30 days
  // (implement cleanup logic)
}).start();
```

### 9.6 Analytics & Insights

**Potential Queries**:
```sql
-- Total conversations per project (including uncategorized)
SELECT
  COALESCE(p.name, 'Uncategorized') as name,
  COUNT(c.id) as conversation_count
FROM conversations c
LEFT JOIN projects p ON c.project_id = p.id
GROUP BY p.id;

-- Average conversation length
SELECT AVG(message_count) as avg_messages
FROM (
  SELECT conversation_id, COUNT(*) as message_count
  FROM messages
  GROUP BY conversation_id
);

-- Token usage over time
SELECT DATE(metadata_timestamp / 1000, 'unixepoch') as date,
       SUM(metadata_tokens_total) as total_tokens
FROM messages
WHERE metadata_tokens_total IS NOT NULL
GROUP BY date
ORDER BY date DESC;
```

---

## Conclusion

This implementation plan provides a comprehensive approach to implementing SQLite storage for the AI Nexus **Electron desktop application**. The plan prioritizes:

1. **Electron-First Architecture**: IPC-based communication between renderer and main process
2. **Clean Separation**: Repository pattern in main, unchanged storage interface in renderer
3. **Data Safety**: ACID transactions, foreign key constraints, cascade rules
4. **Performance**: Synchronous SQLite in main process, prepared statements, WAL mode
5. **Type Safety**: Full TypeScript types across IPC boundary
6. **Maintainability**: Clear layers (repositories → services → IPC → renderer)

**Key Facts**:
- **No migration needed**: Fresh start with SQLite
- **Chat categorization**: Starts uncategorized (projectId = null), categorized via user or auto-match
- **Electron only**: No web app, no HTTP/REST API, IPC-based architecture

**Estimated Timeline**: 5 weeks
**Risk Level**: Low-Medium (well-established patterns, no web complexities)
**Complexity**: Medium (Electron IPC + SQLite, but no migration needed)

---

**Document Version**: 2.0 (Electron-specific)
**Last Updated**: 2025-10-12
**Author**: Claude (AI Assistant)
**Status**: Ready for Implementation
