import { Conversation, Message } from '@/types/chat';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Conversation';

  const content = firstUserMessage.content.trim();
  const maxLength = 50;

  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

export function exportConversationAsMarkdown(conversation: Conversation): string {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  conversation.messages.forEach((message) => {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    markdown += `## ${role}\n\n${message.content}\n\n`;
  });

  return markdown;
}

export function exportConversationAsJSON(conversation: Conversation): string {
  return JSON.stringify(conversation, null, 2);
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}