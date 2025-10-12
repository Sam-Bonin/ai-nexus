import { Message, MessageMetadata, ModelId, Project } from '@/types/chat';

interface StreamChatParams {
  messages: Message[];
  model: ModelId;
  thinking: boolean;
  signal?: AbortSignal;
  onDelta: (update: { content: string; thinking?: string }) => void;
}

interface StreamChatResult {
  content: string;
  thinking?: string;
  metadata?: MessageMetadata;
}

export async function streamChatCompletion({
  messages,
  model,
  thinking,
  signal,
  onDelta,
}: StreamChatParams): Promise<StreamChatResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, model, thinking }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.error || `API error: ${response.status}`);
    // Preserve requiresSetup flag for 401 errors
    if (errorData.requiresSetup) {
      error.requiresSetup = true;
    }
    throw error;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let assistantMessage = '';
  let thinkingContent = '';
  let metadata: MessageMetadata | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });

    if (chunk.includes('___THINKING___')) {
      const thinkingParts = chunk.split('___THINKING___');
      for (let i = 0; i < thinkingParts.length; i++) {
        if (i === 0) {
          assistantMessage += thinkingParts[0];
        } else {
          thinkingContent += thinkingParts[i];
        }
      }
    } else if (chunk.includes('___METADATA___')) {
      const parts = chunk.split('___METADATA___');
      assistantMessage += parts[0];
      try {
        metadata = JSON.parse(parts[1]);
      } catch (error) {
        console.error('Failed to parse metadata:', error);
      }
    } else {
      assistantMessage += chunk;
    }

    onDelta({
      content: assistantMessage,
      thinking: thinking ? thinkingContent : undefined,
    });
  }

  return {
    content: assistantMessage,
    thinking: thinking ? thinkingContent : undefined,
    metadata,
  };
}

export async function generateConversationTitle(messages: Message[]): Promise<string> {
  const response = await fetch('/api/generate-title', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.error || 'Failed to generate title');
    if (errorData.requiresSetup) {
      error.requiresSetup = true;
    }
    throw error;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body for title generation');
  }

  let generatedTitle = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    generatedTitle += decoder.decode(value, { stream: true });
  }

  return generatedTitle.trim();
}

export async function generateConversationDescription(messages: Message[]): Promise<string> {
  const response = await fetch('/api/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.error || `Description API failed: ${response.status}`);
    if (errorData.requiresSetup) {
      error.requiresSetup = true;
    }
    throw error;
  }

  const { description } = await response.json();
  return description || 'Untitled conversation';
}

export interface MatchProjectResult {
  matchedProjectId?: string | null;
  confidence?: number;
}

export async function matchProject(description: string, projects: Project[]): Promise<MatchProjectResult> {
  if (projects.length === 0) {
    return { matchedProjectId: null, confidence: 0 };
  }

  const response = await fetch('/api/match-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationDescription: description,
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
      })),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.error || `Match API failed: ${response.status}`);
    if (errorData.requiresSetup) {
      error.requiresSetup = true;
    }
    throw error;
  }

  return response.json();
}
