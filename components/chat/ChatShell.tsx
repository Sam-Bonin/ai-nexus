'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';
import { ScrollToBottomButton } from './ScrollToBottomButton';
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
  useTheme(); // Initialize theme system

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
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
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 20%, var(--gradient-primary-radial) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, var(--gradient-secondary-radial) 0%, transparent 50%),
          linear-gradient(135deg, var(--gradient-primary-linear) 0%, transparent 40%, var(--gradient-secondary-linear) 100%),
          var(--gradient-base-bg)
        `,
      }}
    >
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
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            containerRef={messagesContainerRef}
            endRef={messagesEndRef}
            onSelectPrompt={(prompt) => setInput(prompt)}
            focusComposer={focusComposer}
            onShowScrollButtonChange={setShowScrollButton}
          />
          {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}
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
