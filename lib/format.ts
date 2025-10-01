import { ModelId } from '@/types/chat';

export const formatDuration = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatModelName = (modelId: string | ModelId) => {
  const parts = modelId.split('/');
  return parts[parts.length - 1];
};
