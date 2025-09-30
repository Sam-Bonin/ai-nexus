'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useId } from 'react';
import Message from './Message';
import Sidebar from './Sidebar';
import { Message as MessageType, Conversation, ModelId, Model, MessageMetadata, FileAttachment } from '@/types/chat';
import { storage } from '@/lib/storage';
import { generateId, generateConversationTitle } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

const AVAILABLE_MODELS: Model[] = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Sonnet 4.5', category: 'sonnet' },
  { id: 'anthropic/claude-sonnet-4', name: 'Sonnet 4', category: 'sonnet' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Sonnet 3.7', category: 'sonnet' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Sonnet 3.5', category: 'sonnet' },
  { id: 'anthropic/claude-opus-4', name: 'Opus 4', category: 'opus' },
];

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('anthropic/claude-sonnet-4.5');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const fileInputId = useId();

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = storage.getConversations();
    setConversations(savedConversations);

    const activeId = storage.getActiveConversationId();
    if (activeId && savedConversations.find(c => c.id === activeId)) {
      loadConversation(activeId);
    }

    // Set initial sidebar state based on screen size
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll detection for "scroll to bottom" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '72px';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 300);
      textareaRef.current.style.height = newHeight + 'px';
      textareaRef.current.style.overflowY = newHeight >= 300 ? 'auto' : 'hidden';

      // Track if textarea has grown beyond single line
      setIsMultiline(newHeight > 72);
    }
  }, [input]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      // Don't auto-close plus menu on outside click - requires explicit click on plus button
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      // Cmd/Ctrl + B for toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadConversation = (id: string) => {
    const conversation = storage.getConversation(id);
    if (conversation) {
      setActiveConversationId(id);
      setMessages(conversation.messages);
      storage.setActiveConversationId(id);

      // Set the model from the conversation, or default to claude-sonnet-4
      if (conversation.model) {
        setSelectedModel(conversation.model);
      }

      // Close sidebar on mobile after selecting conversation
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const saveCurrentConversation = (updatedMessages: MessageType[]): string | null => {
    if (activeConversationId) {
      const conversation = storage.getConversation(activeConversationId);
      if (conversation) {
        const updated = {
          ...conversation,
          messages: updatedMessages,
          title: updatedMessages.length > 0 ? generateConversationTitle(updatedMessages) : conversation.title,
          updatedAt: Date.now(),
        };
        storage.saveConversation(updated);
        setConversations(storage.getConversations());
      }
      return activeConversationId;
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: generateId(),
        title: generateConversationTitle(updatedMessages),
        messages: updatedMessages,
        model: selectedModel,
        projectId: null, // Start in Miscellaneous, will be categorized after title generation
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveConversation(newConversation);
      storage.setActiveConversationId(newConversation.id);
      setActiveConversationId(newConversation.id);
      setConversations(storage.getConversations());
      return newConversation.id;
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setIsStreaming(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow submission if there's text or files attached
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: MessageType = {
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          thinking: thinkingEnabled
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';
      let thinkingContent = '';
      let metadata: MessageMetadata | undefined;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', thinking: thinkingEnabled ? '' : undefined },
      ]);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        // Check if this chunk contains thinking
        if (chunk.includes('___THINKING___')) {
          const thinkingParts = chunk.split('___THINKING___');
          for (let i = 0; i < thinkingParts.length; i++) {
            if (i === 0) {
              // First part is regular content
              assistantMessage += thinkingParts[0];
            } else {
              // Rest are thinking content
              thinkingContent += thinkingParts[i];
            }
          }
        } else if (chunk.includes('___METADATA___')) {
          // Check if this chunk contains metadata
          const parts = chunk.split('___METADATA___');
          assistantMessage += parts[0]; // Add any content before metadata
          try {
            metadata = JSON.parse(parts[1]);
          } catch (e) {
            console.error('Failed to parse metadata:', e);
          }
        } else {
          assistantMessage += chunk;
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantMessage,
            thinking: thinkingEnabled ? thinkingContent : undefined,
            metadata: metadata,
          };
          return newMessages;
        });
      }

      // Save conversation after successful response
      const finalMessages = [...updatedMessages, {
        role: 'assistant' as const,
        content: assistantMessage,
        thinking: thinkingEnabled ? thinkingContent : undefined,
        metadata
      }];

      // Check if this is a new conversation before saving
      const isNewConversation = !activeConversationId && finalMessages.length === 2;

      // Save and get the conversation ID
      const conversationId = saveCurrentConversation(finalMessages);

      // Generate title for new conversations (only after first exchange)
      if (isNewConversation && conversationId) {
        generateConversationTitleFromAPI(finalMessages, conversationId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user');
        // Save the conversation even if stopped
        const currentMessages = messages.filter(m => m.content !== '');
        if (currentMessages.length > 0) {
          saveCurrentConversation(currentMessages);
        }
      } else {
        console.error('Error:', err);
        setError(err.message || 'An error occurred. Please try again.');

        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === 'assistant' &&
              newMessages[newMessages.length - 1]?.content === '') {
            newMessages.pop();
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const generateConversationTitleFromAPI = async (messages: MessageType[], conversationId: string) => {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        console.error('Failed to generate title');
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error('No response body for title generation');
        return;
      }

      let generatedTitle = '';

      // Collect the entire title first
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        generatedTitle += chunk;
      }

      const fullTitle = generatedTitle.trim();
      if (!fullTitle) {
        return;
      }

      // Animate in memory so we avoid repeated large localStorage writes
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
        setConversations(prev => prev.map(conversation => (
          conversation.id === conversationId
            ? { ...conversation, title: fullTitle, updatedAt: finalized.updatedAt }
            : conversation
        )));

        // After title generation, auto-categorize the conversation
        categorizeConversation(conversationId);
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }
  };

  const categorizeConversation = async (conversationId: string) => {
    try {
      const conversation = storage.getConversation(conversationId);
      if (!conversation) return;

      // Only auto-categorize if still uncategorized (race condition prevention)
      if (conversation.projectId !== null) {
        console.log('Conversation already categorized, skipping');
        return;
      }

      // 1. Generate description
      const descResponse = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation.messages }),
      });

      if (!descResponse.ok) {
        throw new Error(`Description API failed: ${descResponse.status}`);
      }

      const { description } = await descResponse.json();
      conversation.description = description || "Untitled conversation";

      // 2. Match project
      const projects = storage.getProjects();
      if (projects.length === 0) {
        // No projects exist → skip matching, stay in Miscellaneous
        conversation.projectId = null;
        storage.saveConversation(conversation);
        setConversations(storage.getConversations());
        return;
      }

      const matchResponse = await fetch('/api/match-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationDescription: description,
          projects: projects.map(p => ({ id: p.id, name: p.name, description: p.description })),
        }),
      });

      if (!matchResponse.ok) {
        throw new Error(`Match API failed: ${matchResponse.status}`);
      }

      const result = await matchResponse.json();

      // Validate confidence
      const confidence = typeof result.confidence === 'number'
        ? Math.max(0, Math.min(1, result.confidence))
        : 0.0;

      // Re-check if conversation is still uncategorized (user might have moved it manually)
      const currentConversation = storage.getConversation(conversationId);
      if (!currentConversation || currentConversation.projectId !== null) {
        console.log('Conversation was manually categorized, skipping auto-assignment');
        return;
      }

      // Only assign if confidence meets threshold
      if (confidence >= 0.7 && result.matchedProjectId) {
        conversation.projectId = result.matchedProjectId;
        console.log(`Auto-categorized to project ${result.matchedProjectId} with confidence ${confidence}`);
      } else {
        conversation.projectId = null; // Stay in Miscellaneous
        console.log(`Low confidence (${confidence}), staying in Miscellaneous`);
      }

    } catch (error) {
      console.error('Auto-categorization failed:', error);
      // Fallback: assign to Miscellaneous
      const conversation = storage.getConversation(conversationId);
      if (conversation) {
        conversation.description = conversation.description || "Untitled conversation";
        conversation.projectId = null;
      }
    } finally {
      // Always save conversation
      const conversation = storage.getConversation(conversationId);
      if (conversation) {
        storage.saveConversation(conversation);
        setConversations(storage.getConversations());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: FileAttachment[] = [];

    const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB keeps localStorage usage below quota

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if file type is supported (images and PDFs)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError(`File type not supported: ${file.name}. Only images and PDFs are allowed.`);
        continue;
      }

      // Check file size (max 3MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large: ${file.name}. Maximum size is 3MB.`);
        continue;
      }

      try {
        const base64 = await readFileAsBase64(file);
        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        });
      } catch (err) {
        console.error('Error reading file:', err);
        setError(`Failed to read file: ${file.name}`);
      }
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (newFiles.length > 0) {
      setPlusMenuOpen(false);
      setError(null);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is a file
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const fileList = files.reduce((acc, file) => {
        const dt = new DataTransfer();
        acc.forEach(f => dt.items.add(f));
        dt.items.add(file);
        return Array.from(dt.files);
      }, [] as File[]);

      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));

      await handleFileSelect(dataTransfer.files);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-electric-yellow/20 via-pure-white to-vibrant-coral/20 dark:bg-gradient-to-br dark:from-electric-yellow/10 dark:via-dark-gray dark:to-vibrant-coral/10">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-pure-white dark:bg-dark-gray border-b border-pure-black/10 dark:border-pure-white/10 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow p-2 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Model Selector */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-900 dark:text-gray-100 hover:text-electric-yellow dark:hover:text-electric-yellow rounded-claude-sm hover:bg-pampas/50 dark:hover:bg-dark-bg/50 focus:outline-none transition-colors font-sans cursor-pointer text-base"
              >
                <span>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</span>
                <svg className={`w-4 h-4 text-neutral-gray dark:text-neutral-gray transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Custom Dropdown */}
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 z-50 animate-fade-in">
                  {/* Sonnet Category */}
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredCategory('sonnet')}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="px-4 py-2.5 text-base font-sans text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 cursor-pointer flex items-center justify-between">
                      <span>Sonnet</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Sonnet Submenu */}
                    {hoveredCategory === 'sonnet' && (
                      <div className="absolute left-full top-0 ml-1 w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 animate-fade-in">
                        {AVAILABLE_MODELS.filter(m => m.category === 'sonnet').map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsModelDropdownOpen(false);
                              setHoveredCategory(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-base font-sans transition-colors ${
                              model.id === selectedModel
                                ? 'bg-electric-yellow/10 dark:bg-electric-yellow/20 text-electric-yellow dark:text-electric-yellow'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                            }`}
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Opus Category */}
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredCategory('opus')}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="px-4 py-2.5 text-base font-sans text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 cursor-pointer flex items-center justify-between">
                      <span>Opus</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Opus Submenu */}
                    {hoveredCategory === 'opus' && (
                      <div className="absolute left-full top-0 ml-1 w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 animate-fade-in">
                        {AVAILABLE_MODELS.filter(m => m.category === 'opus').map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsModelDropdownOpen(false);
                              setHoveredCategory(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-base font-sans transition-colors ${
                              model.id === selectedModel
                                ? 'bg-electric-yellow/10 dark:bg-electric-yellow/20 text-electric-yellow dark:text-electric-yellow'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                            }`}
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
              aria-label="Toggle theme"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-electric-yellow hover:bg-vibrant-coral text-pure-black rounded-claude-sm transition-colors font-medium text-sm hidden sm:block shadow-claude-sm"
            >
              New Chat
            </button>
          </div>
        </header>

        {/* Unified Chat Container */}
        <div className="flex-1 overflow-y-auto relative" ref={messagesContainerRef}>
          <div className="max-w-[900px] mx-auto min-h-full flex flex-col pb-[140px]">
            {/* Messages Area */}
            <div className="flex-1 flex items-center justify-center">
              {messages.length === 0 ? (
                <div className="w-full px-4 py-8">
                  <div className="text-center max-w-2xl mx-auto">
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-electric-yellow rounded-claude-lg mx-auto mb-6 flex items-center justify-center shadow-claude-md">
                        <svg className="w-10 h-10 text-pure-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h2 className="text-4xl font-semibold text-pure-black dark:text-pure-white mb-4 font-sans">
                        Welcome to AI Nexus
                      </h2>
                      <p className="text-neutral-gray dark:text-neutral-gray text-lg font-sans mb-8">
                        Start a conversation by typing a message or click a sample prompt
                      </p>
                    </div>

                    {/* Sample Prompts */}
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setInput("Help me write a professional email to my team about an upcoming project deadline");
                          textareaRef.current?.focus();
                        }}
                        className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-4 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10 hover:border-electric-yellow dark:hover:border-electric-yellow hover:shadow-claude-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-electric-yellow/20 dark:bg-electric-yellow/30 rounded-claude-sm flex items-center justify-center group-hover:bg-electric-yellow/30 dark:group-hover:bg-electric-yellow/40 transition-colors">
                            <svg className="w-4 h-4 text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-pure-black dark:text-pure-white mb-1">Write an email</p>
                            <p className="text-xs text-neutral-gray dark:text-neutral-gray">Draft a professional message</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setInput("Explain quantum computing to me like I'm a beginner, using simple analogies");
                          textareaRef.current?.focus();
                        }}
                        className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-4 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10 hover:border-electric-yellow dark:hover:border-electric-yellow hover:shadow-claude-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-electric-yellow/20 dark:bg-electric-yellow/30 rounded-claude-sm flex items-center justify-center group-hover:bg-electric-yellow/30 dark:group-hover:bg-electric-yellow/40 transition-colors">
                            <svg className="w-4 h-4 text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-pure-black dark:text-pure-white mb-1">Explain a concept</p>
                            <p className="text-xs text-neutral-gray dark:text-neutral-gray">Learn something new</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setInput("Help me debug this code and explain what's causing the error");
                          textareaRef.current?.focus();
                        }}
                        className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-4 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10 hover:border-electric-yellow dark:hover:border-electric-yellow hover:shadow-claude-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-electric-yellow/20 dark:bg-electric-yellow/30 rounded-claude-sm flex items-center justify-center group-hover:bg-electric-yellow/30 dark:group-hover:bg-electric-yellow/40 transition-colors">
                            <svg className="w-4 h-4 text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-pure-black dark:text-pure-white mb-1">Debug code</p>
                            <p className="text-xs text-neutral-gray dark:text-neutral-gray">Get help with programming</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setInput("Help me brainstorm creative ideas for a weekend project");
                          textareaRef.current?.focus();
                        }}
                        className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-4 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10 hover:border-electric-yellow dark:hover:border-electric-yellow hover:shadow-claude-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-electric-yellow/20 dark:bg-electric-yellow/30 rounded-claude-sm flex items-center justify-center group-hover:bg-electric-yellow/30 dark:group-hover:bg-electric-yellow/40 transition-colors">
                            <svg className="w-4 h-4 text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-pure-black dark:text-pure-white mb-1">Brainstorm ideas</p>
                            <p className="text-xs text-neutral-gray dark:text-neutral-gray">Get creative inspiration</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-6 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10">
                      <h3 className="text-sm font-semibold text-pure-black dark:text-pure-white mb-3">
                        Keyboard Shortcuts
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-gray dark:text-neutral-gray">
                        <div className="flex justify-between">
                          <span>New chat</span>
                          <kbd className="px-2 py-1 bg-pure-white/5 dark:bg-dark-gray/5 rounded text-xs font-mono border border-pure-black/10 dark:border-pure-white/10">⌘K</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Toggle sidebar</span>
                          <kbd className="px-2 py-1 bg-pure-white/5 dark:bg-dark-gray/5 rounded text-xs font-mono border border-pure-black/10 dark:border-pure-white/10">⌘B</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Send message</span>
                          <kbd className="px-2 py-1 bg-pure-white/5 dark:bg-dark-gray/5 rounded text-xs font-mono border border-pure-black/10 dark:border-pure-white/10">Enter</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>New line</span>
                          <kbd className="px-2 py-1 bg-pure-white/5 dark:bg-dark-gray/5 rounded text-xs font-mono border border-pure-black/10 dark:border-pure-white/10">Shift+Enter</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-8">
                  {messages.map((message, index) => (
                    <Message key={index} message={message} />
                  ))}
                  {isLoading && (
                    messages[messages.length - 1]?.role !== 'assistant' ||
                    (messages[messages.length - 1]?.content === '' && (!messages[messages.length - 1]?.thinking || messages[messages.length - 1]?.thinking === ''))
                  ) && (
                    <div className="flex justify-start mb-6">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-electric-yellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-electric-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-electric-yellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Floating Input Form */}
              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-pure-white via-pure-white to-pure-white/0 dark:from-dark-gray dark:via-dark-gray dark:to-dark-gray/0 pt-2 pb-4 pointer-events-none" style={{ left: sidebarOpen ? '288px' : '0' }}>
                <div className="max-w-[900px] mx-auto px-6 pointer-events-auto">
                  {/* Error Display */}
                  {error && (
                    <div className="mb-3 px-6 py-3 bg-electric-yellow/10 dark:bg-electric-yellow/10 rounded-claude-md">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-electric-yellow dark:text-electric-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-electric-yellow dark:text-electric-yellow text-sm font-sans">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Plus menu - appears above chatbar */}
                  <div
                    className={`mb-3 inline-flex items-center relative transition-all flex-none w-fit ${
                      plusMenuOpen
                        ? 'gap-2 bg-pure-white dark:bg-dark-gray rounded-full px-2 py-2 shadow-claude-md border border-pure-black/10 dark:border-pure-white/10'
                        : 'gap-2'
                    }`}
                    ref={plusMenuRef}
                  >
                    {/* Plus button */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 ${
                          plusMenuOpen
                            ? 'text-electric-yellow dark:text-electric-yellow bg-electric-yellow/10 dark:bg-electric-yellow/20 rotate-45'
                            : 'text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      {!plusMenuOpen && (
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-pure-black dark:bg-pure-black text-pure-white dark:text-pure-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Options
                        </span>
                      )}
                    </div>

                    {/* Expanded buttons - slide in from plus */}
                    {plusMenuOpen && (
                      <>
                        <div className="relative group">
                          <label
                            htmlFor={fileInputId}
                            className="flex h-10 w-10 items-center justify-center text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 animate-fade-in cursor-pointer"
                            style={{ animationDelay: '0ms' }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          </label>
                          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-pure-black dark:bg-pure-black text-pure-white dark:text-pure-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Attach files
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => {
                              setThinkingEnabled(!thinkingEnabled);
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 animate-fade-in ${
                              thinkingEnabled
                                ? 'text-electric-yellow dark:text-electric-yellow bg-electric-yellow/10 dark:bg-electric-yellow/20'
                                : 'text-neutral-gray dark:text-neutral-gray hover:text-electric-yellow dark:hover:text-electric-yellow bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                            }`}
                            style={{ animationDelay: '50ms' }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </button>
                          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-pure-black dark:bg-pure-black text-pure-white dark:text-pure-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Thinking
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                <form onSubmit={handleSubmit}>
            {/* File Previews */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group bg-pure-black/5 dark:bg-pure-white/5 border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm p-2 pr-8 flex items-center gap-2"
                  >
                    {file.type.startsWith('image/') ? (
                      <Image
                        src={`data:${file.type};base64,${file.data}`}
                        alt={file.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-electric-yellow/20 dark:bg-electric-yellow/30 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-electric-yellow dark:text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-pure-black dark:text-pure-white truncate">{file.name}</p>
                      <p className="text-xs text-neutral-gray dark:text-neutral-gray">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-electric-yellow hover:bg-vibrant-coral text-pure-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 focus-within:border-electric-yellow dark:focus-within:border-electric-yellow focus-within:shadow-electric-yellow/20 transition-all">
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="sr-only"
                aria-hidden="true"
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type your message..."
                className="w-full px-5 pr-32 bg-transparent text-gray-900 dark:text-gray-100 placeholder-neutral-gray dark:placeholder-neutral-gray focus:outline-none resize-none max-h-[300px] rounded-claude-lg font-sans leading-[48px] overflow-y-hidden flex items-center"
                disabled={isLoading}
                rows={1}
                style={{ height: '72px', paddingTop: '12px', paddingBottom: '12px' }}
              />
              <div className={`absolute right-4 flex gap-2 transition-all ${isMultiline ? 'bottom-4' : 'top-1/2 -translate-y-1/2'}`}>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="p-2 bg-vibrant-coral hover:bg-vibrant-coral/80 text-pure-white rounded-claude-sm transition-colors shadow-claude-sm"
                    title="Stop generation"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                    className="p-2 bg-electric-yellow hover:bg-vibrant-coral disabled:bg-neutral-gray dark:disabled:bg-neutral-gray disabled:cursor-not-allowed text-pure-black rounded-claude-sm transition-colors shadow-claude-sm"
                    title="Send message"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-neutral-gray dark:text-neutral-gray font-sans">
                        Press Enter to send • Shift+Enter for new line • ⌘K for new chat • ⌘B for sidebar
                      </p>
                      <p className="text-xs text-neutral-gray dark:text-neutral-gray font-mono">
                        {input.length} chars
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 p-3 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 text-electric-yellow hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-full shadow-claude-lg transition-all hover:scale-110"
              aria-label="Scroll to bottom"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
