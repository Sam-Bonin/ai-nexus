import { Model } from '@/types/chat';

export const AVAILABLE_MODELS: Model[] = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Sonnet 4.5', category: 'sonnet' },
  { id: 'anthropic/claude-sonnet-4', name: 'Sonnet 4', category: 'sonnet' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Sonnet 3.7', category: 'sonnet' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Sonnet 3.5', category: 'sonnet' },
  { id: 'anthropic/claude-opus-4', name: 'Opus 4', category: 'opus' },
];
