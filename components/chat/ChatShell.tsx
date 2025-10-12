'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { useChatController } from '@/hooks/useChatController';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';
import SettingsModal from '@/components/settings/SettingsModal';

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
  const settings = useSettings();

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

  // Check API key status on mount and auto-open settings if no key exists
  useEffect(() => {
    const checkApiKey = async () => {
      await settings.refreshStatus();
      if (!settings.status?.hasKey) {
        settings.openSettings();
      }
    };
    checkApiKey();
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
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        settings.openSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat, toggleSidebar, settings]);

  // Listen for custom 'openSettings' event (e.g., from 401 errors)
  useEffect(() => {
    const handleOpenSettings = () => {
      settings.openSettings();
    };

    window.addEventListener('openSettings', handleOpenSettings);
    return () => window.removeEventListener('openSettings', handleOpenSettings);
  }, [settings]);

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{
        background: theme === 'dark'
          ? `
            radial-gradient(circle at 20% 20%, rgba(255, 213, 15, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(253, 118, 91, 0.04) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255, 213, 15, 0.03) 0%, transparent 40%, rgba(253, 118, 91, 0.03) 100%),
            #1a1a1a
          `
          : `
            radial-gradient(circle at 20% 20%, rgba(255, 213, 15, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(253, 118, 91, 0.08) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255, 213, 15, 0.06) 0%, rgba(255, 255, 255, 1) 40%, rgba(253, 118, 91, 0.06) 100%),
            #ffffff
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
          theme={theme}
          onToggleTheme={cycleTheme}
          onNewChat={handleNewChat}
          onOpenSettings={settings.openSettings}
          hasApiKey={settings.status?.hasKey ?? false}
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

      <SettingsModal
        isOpen={settings.isOpen}
        onClose={settings.closeSettings}
      />
    </div>
  );
}
