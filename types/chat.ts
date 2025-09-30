export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

export interface MessageMetadata {
  model?: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  duration?: number; // in milliseconds
  timestamp?: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  files?: FileAttachment[];
  metadata?: MessageMetadata;
}

export type ModelId =
  | 'anthropic/claude-sonnet-4.5'
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-3.7-sonnet'
  | 'anthropic/claude-3.5-sonnet'
  | 'anthropic/claude-opus-4';

export interface Model {
  id: ModelId;
  name: string;
  category?: 'sonnet' | 'opus';
}

export interface ChatRequest {
  messages: Message[];
  model?: ModelId;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model?: ModelId;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark' | 'system';