'use client';

import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type FormEvent as ReactFormEvent } from 'react';
import { Conversation, FileAttachment, Message, ModelId } from '@/types/chat';
import { storage } from '@/lib/storage';
import { generateId, generateConversationTitle as generateTitleFallback } from '@/lib/utils';
import {
  streamChatCompletion,
  generateConversationTitle as requestConversationTitle,
  generateConversationDescription,
  matchProject,
} from '@/lib/chatService';
import {
  fileToAttachment,
  getMaxAttachmentSize,
  isSupportedAttachmentType,
  isWithinFileSizeLimit,
} from '@/lib/file';

interface UseChatControllerResult {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;
  thinkingEnabled: boolean;
  setThinkingEnabled: (value: boolean) => void;
  attachedFiles: FileAttachment[];
  handleFileSelect: (files: FileList | null) => Promise<void>;
  removeFile: (index: number) => void;
  handlePaste: (event: ReactClipboardEvent) => Promise<void>;
  handleSubmit: (event?: ReactFormEvent) => Promise<void>;
  handleStopGeneration: () => void;
  handleNewChat: () => void;
  handleDeleteConversation: (id: string) => void;
  handleRenameConversation: (id: string, newTitle: string) => void;
  handleConversationsUpdate: () => void;
  loadConversation: (id: string) => void;
  setError: (value: string | null) => void;
}

export function useChatController(): UseChatControllerResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('anthropic/claude-sonnet-4.5');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedConversations = storage.getConversations();
    setConversations(savedConversations);

    const activeId = storage.getActiveConversationId();
    if (activeId && savedConversations.find(c => c.id === activeId)) {
      loadConversation(activeId, savedConversations);
    }
  }, []);

  const loadConversation = (id: string, existing?: Conversation[]) => {
    const source = existing ?? storage.getConversations();
    const conversation = source.find(c => c.id === id) || storage.getConversation(id);

    if (conversation) {
      setActiveConversationId(id);
      setMessages(conversation.messages);
      storage.setActiveConversationId(id);
      if (conversation.model) {
        setSelectedModel(conversation.model);
      }
    }
  };

  const saveCurrentConversation = (updatedMessages: Message[]): string | null => {
    if (activeConversationId) {
      const conversation = storage.getConversation(activeConversationId);
      if (conversation) {
        const updated = {
          ...conversation,
          messages: updatedMessages,
          title: updatedMessages.length > 0
            ? generateTitleFallback(updatedMessages)
            : conversation.title,
          updatedAt: Date.now(),
        };
        storage.saveConversation(updated);
        setConversations(storage.getConversations());
      }
      return activeConversationId;
    }

    const newConversation: Conversation = {
      id: generateId(),
      title: generateTitleFallback(updatedMessages),
      messages: updatedMessages,
      model: selectedModel,
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.saveConversation(newConversation);
    storage.setActiveConversationId(newConversation.id);
    setActiveConversationId(newConversation.id);
    setConversations(storage.getConversations());
    return newConversation.id;
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setIsStreaming(false);
    setAttachedFiles([]);
    setActiveConversationId(null);
    storage.setActiveConversationId(null);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    storage.deleteConversation(id);
    setConversations(storage.getConversations());

    if (id === activeConversationId) {
      handleNewChat();
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const conversation = storage.getConversation(id);
    if (conversation) {
      const updated = { ...conversation, title: newTitle, updatedAt: Date.now() };
      storage.saveConversation(updated);
      setConversations(storage.getConversations());
    }
  };

  const handleConversationsUpdate = () => {
    setConversations(storage.getConversations());
  };

  const categorizeConversation = async (conversationId: string) => {
    try {
      const conversation = storage.getConversation(conversationId);
      if (!conversation) return;

      if (conversation.projectId !== null) {
        return;
      }

      const description = await generateConversationDescription(conversation.messages);
      conversation.description = description;

      const projects = storage.getProjects();
      if (projects.length === 0) {
        conversation.projectId = null;
        storage.saveConversation(conversation);
        setConversations(storage.getConversations());
        return;
      }

      const result = await matchProject(description, projects);
      const confidence = typeof result.confidence === 'number'
        ? Math.max(0, Math.min(1, result.confidence))
        : 0;

      const currentConversation = storage.getConversation(conversationId);
      if (!currentConversation || currentConversation.projectId !== null) {
        return;
      }

      if (confidence >= 0.7 && result.matchedProjectId) {
        conversation.projectId = result.matchedProjectId;
      } else {
        conversation.projectId = null;
      }

      storage.saveConversation(conversation);
      setConversations(storage.getConversations());
    } catch (catError) {
      console.error('Auto-categorization failed:', catError);
      const conversation = storage.getConversation(conversationId);
      if (conversation) {
        conversation.description = conversation.description || 'Untitled conversation';
        conversation.projectId = null;
        storage.saveConversation(conversation);
        setConversations(storage.getConversations());
      }
    }
  };

  const generateConversationTitleFromAPI = async (messagesForTitle: Message[], conversationId: string) => {
    try {
      const fullTitle = await requestConversationTitle(messagesForTitle);
      if (!fullTitle) {
        return;
      }

      for (let i = 1; i <= fullTitle.length; i++) {
        const partialTitle = fullTitle.substring(0, i);
        setConversations(prev => {
          let updated = false;
          const next = prev.map(conversation => {
            if (conversation.id === conversationId) {
              updated = true;
              return {
                ...conversation,
                title: partialTitle,
                updatedAt: Date.now(),
              };
            }
            return conversation;
          });
          return updated ? next : prev;
        });
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      const storedConversation = storage.getConversation(conversationId);
      if (storedConversation) {
        const finalized = {
          ...storedConversation,
          title: fullTitle,
          updatedAt: Date.now(),
        };
        storage.saveConversation(finalized);
        setConversations(storage.getConversations());
        categorizeConversation(conversationId);
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }
  };

  const handleSubmit = async (event?: ReactFormEvent) => {
    event?.preventDefault();

    if ((!input.trim() && attachedFiles.length === 0) || isLoading) {
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setAttachedFiles([]);
    setError(null);
    setIsLoading(true);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '', thinking: thinkingEnabled ? '' : undefined },
      ]);

      const result = await streamChatCompletion({
        messages: updatedMessages,
        model: selectedModel,
        thinking: thinkingEnabled,
        signal: abortControllerRef.current.signal,
        onDelta: ({ content, thinking }) => {
          setMessages(prev => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (lastIndex >= 0 && next[lastIndex]?.role === 'assistant') {
              next[lastIndex] = {
                ...next[lastIndex],
                content,
                thinking: thinkingEnabled ? thinking : undefined,
              };
            }
            return next;
          });
        },
      });

      const finalMessages = [
        ...updatedMessages,
        {
          role: 'assistant' as const,
          content: result.content,
          thinking: thinkingEnabled ? result.thinking : undefined,
          metadata: result.metadata,
        },
      ];

      const isNewConversation = !activeConversationId && finalMessages.length === 2;
      const conversationId = saveCurrentConversation(finalMessages);

      if (isNewConversation && conversationId) {
        generateConversationTitleFromAPI(finalMessages, conversationId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const currentMessages = messages.filter(m => m.content !== '');
        if (currentMessages.length > 0) {
          saveCurrentConversation(currentMessages);
        }
      } else {
        console.error('Error:', err);
        setError(err.message || 'An error occurred. Please try again.');
        setMessages(prev => {
          const next = [...prev];
          if (next[next.length - 1]?.role === 'assistant' && next[next.length - 1]?.content === '') {
            next.pop();
          }
          return next;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const attachmentsToAdd: FileAttachment[] = [];
    const maxSize = getMaxAttachmentSize();

    for (const file of Array.from(files)) {
      if (!isSupportedAttachmentType(file.type)) {
        setError(`File type not supported: ${file.name}. Only images and PDFs are allowed.`);
        continue;
      }

      if (!isWithinFileSizeLimit(file.size, maxSize)) {
        setError(`File too large: ${file.name}. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
        continue;
      }

      try {
        const attachment = await fileToAttachment(file);
        attachmentsToAdd.push(attachment);
      } catch (fileError) {
        console.error('Error reading file:', fileError);
        setError(`Failed to read file: ${file.name}`);
      }
    }

    if (attachmentsToAdd.length > 0) {
      setAttachedFiles(prev => [...prev, ...attachmentsToAdd]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (event: ReactClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length === 0) {
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    await handleFileSelect(dataTransfer.files);
  };

  return {
    conversations,
    activeConversationId,
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    error,
    selectedModel,
    setSelectedModel,
    thinkingEnabled,
    setThinkingEnabled,
    attachedFiles,
    handleFileSelect,
    removeFile,
    handlePaste,
    handleSubmit,
    handleStopGeneration,
    handleNewChat,
    handleDeleteConversation,
    handleRenameConversation,
    handleConversationsUpdate,
    loadConversation,
    setError,
  };
}
