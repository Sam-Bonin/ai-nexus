'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleNewChat();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-electric-yellow/20 via-pure-white to-vibrant-coral/20 dark:bg-gradient-to-br dark:from-electric-yellow/10 dark:via-dark-gray dark:to-vibrant-coral/10">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onConversationsUpdate={handleConversationsUpdate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          theme={theme}
          onToggleTheme={cycleTheme}
          onNewChat={handleNewChat}
        />

        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          containerRef={messagesContainerRef}
          endRef={messagesEndRef}
          onScrollToBottom={scrollToBottom}
          onSelectPrompt={(prompt) => setInput(prompt)}
          focusComposer={focusComposer}
        />

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
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}
