'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';
import { useChatController } from '@/hooks/useChatController';
import { useTheme } from '@/hooks/useTheme';

export function ChatShell() {
  const {
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
  } = useChatController();
  const { theme, setTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleConversationSelect = useCallback(
    (id: string) => {
      loadConversation(id);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    },
    [loadConversation]
  );

  const handleSidebarNewChat = useCallback(() => {
    handleNewChat();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [handleNewChat]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleNewChat();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat, toggleSidebar]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-gradient-to-br from-electric-yellow/20 via-pure-white to-vibrant-coral/20 dark:bg-gradient-to-br dark:from-electric-yellow/10 dark:via-dark-gray dark:to-vibrant-coral/10">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleConversationSelect}
        onNewChat={handleSidebarNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onConversationsUpdate={handleConversationsUpdate}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          theme={theme}
          onToggleTheme={cycleTheme}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            containerRef={messagesContainerRef}
            endRef={messagesEndRef}
            onScrollToBottom={scrollToBottom}
            onSelectPrompt={(prompt) => setInput(prompt)}
            focusComposer={focusComposer}
          />
        </div>

        <ChatComposer
          input={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={handleStopGeneration}
          isLoading={isLoading}
          isStreaming={isStreaming}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          attachedFiles={attachedFiles}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          onPaste={handlePaste}
          thinkingEnabled={thinkingEnabled}
          setThinkingEnabled={setThinkingEnabled}
          error={error}
          clearError={() => setError(null)}
        />
      </div>
    </div>
  );
}
