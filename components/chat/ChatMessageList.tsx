'use client';

import { MutableRefObject, useEffect } from 'react';
import MessageComponent from '@/components/Message';
import { Message } from '@/types/chat';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  endRef: MutableRefObject<HTMLDivElement | null>;
  onSelectPrompt: (prompt: string) => void;
  focusComposer: () => void;
  onShowScrollButtonChange: (show: boolean) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Write an email',
    subtitle: 'Draft a professional message',
    icon: (
      <svg className="w-4 h-4 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    prompt: "Help me write a professional email to my team about an upcoming project deadline",
  },
  {
    title: 'Explain a concept',
    subtitle: 'Learn something new',
    icon: (
      <svg className="w-4 h-4 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    prompt: "Explain quantum computing to me like I'm a beginner, using simple analogies",
  },
  {
    title: 'Debug code',
    subtitle: 'Get help with programming',
    icon: (
      <svg className="w-4 h-4 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    prompt: "Help me debug this code and explain what's causing the error",
  },
  {
    title: 'Brainstorm ideas',
    subtitle: 'Get creative inspiration',
    icon: (
      <svg className="w-4 h-4 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    prompt: "Help me brainstorm creative ideas for a weekend project",
  },
];

export function ChatMessageList({
  messages,
  isLoading,
  containerRef,
  endRef,
  onSelectPrompt,
  focusComposer,
  onShowScrollButtonChange,
}: ChatMessageListProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const totalScrollableDistance = scrollHeight - clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const scrollPercentage = totalScrollableDistance > 0 ? distanceFromBottom / totalScrollableDistance : 0;

      // Show button when user has scrolled up beyond 33% of total chat length
      const hasScrolledUp = scrollPercentage > 0.33;
      onShowScrollButtonChange(hasScrolledUp && messages.length > 0);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length, onShowScrollButtonChange]);

  const shouldShowLoadingIndicator =
    isLoading &&
    (
      messages[messages.length - 1]?.role !== 'assistant' ||
      (messages[messages.length - 1]?.content === '' && (!messages[messages.length - 1]?.thinking || messages[messages.length - 1]?.thinking === ''))
    );

  const handlePromptClick = (prompt: string) => {
    onSelectPrompt(prompt);
    focusComposer();
  };

  return (
    <div
      className="flex-1 overflow-y-auto relative [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden"
      ref={containerRef}
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 120px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 120px), transparent 100%)',
      }}
    >
      <div className="max-w-[900px] mx-auto min-h-full flex flex-col pb-[20px]">
        <div className="flex-1 flex items-center justify-center">
          {messages.length === 0 ? (
            <div className="w-full px-4 py-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-theme-primary rounded-claude-lg mx-auto mb-6 flex items-center justify-center shadow-claude-md">
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

                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_PROMPTS.map(prompt => (
                    <button
                      key={prompt.title}
                      onClick={() => handlePromptClick(prompt.prompt)}
                      className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-4 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10 hover:border-theme-primary dark:hover:border-theme-primary hover:shadow-claude-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-theme-primary/20 rounded-claude-sm flex items-center justify-center group-hover:bg-theme-primary/30 transition-colors">
                          {prompt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-pure-black dark:text-pure-white mb-1">{prompt.title}</p>
                          <p className="text-xs text-neutral-gray dark:text-neutral-gray">{prompt.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-left bg-pure-white dark:bg-dark-gray rounded-claude-md p-6 shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10">
                  <h3 className="text-sm font-semibold text-pure-black dark:text-pure-white mb-3">Keyboard Shortcuts</h3>
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
            <div className="px-6 py-8 w-full">
              {messages.map((message, index) => (
                <MessageComponent key={index} message={message} />
              ))}
              {shouldShowLoadingIndicator && (
                <div className="flex justify-start mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
