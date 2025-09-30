'use client';

import Image from 'next/image';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  // Start expanded if there's thinking content, collapse when final content arrives
  const hasContent = message.content && message.content.trim().length > 0;
  const [thinkingExpanded, setThinkingExpanded] = useState(true);

  // Auto-collapse when content arrives (but only once)
  const [hasCollapsed, setHasCollapsed] = useState(false);

  // Collapse thinking when content arrives
  if (!hasCollapsed && hasContent && message.thinking && message.thinking.trim().length > 0) {
    setThinkingExpanded(false);
    setHasCollapsed(true);
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatModelName = (modelId: string) => {
    const parts = modelId.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-6 animate-fade-in`}
    >
      <div
        className={`max-w-[85%] ${
          isUser ? '' : 'w-full'
        }`}
      >
        {/* Metadata for assistant messages */}
        {!isUser && message.metadata && (
          <div className="mb-2 px-2 flex items-center gap-3 text-xs text-neutral-gray dark:text-neutral-gray font-mono">
            {message.metadata.model && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                {formatModelName(message.metadata.model)}
              </span>
            )}
            {message.metadata.tokens && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {message.metadata.tokens.input}↑ {message.metadata.tokens.output}↓
              </span>
            )}
            {message.metadata.duration && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(message.metadata.duration)}
              </span>
            )}
          </div>
        )}

        {/* Thinking section - collapsible, no wrapper */}
        {!isUser && message.thinking && message.thinking.trim() && (
          <div className="mb-4">
            <button
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-electric-yellow dark:text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs font-medium text-neutral-gray dark:text-neutral-gray">
                Thinking
              </span>
              <svg
                className={`w-3 h-3 text-neutral-gray dark:text-neutral-gray transition-transform ${
                  thinkingExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {thinkingExpanded && (
              <div className="mt-2 pl-6">
                <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-gray dark:text-neutral-gray opacity-80">
                  {message.thinking}
                </p>
              </div>
            )}
          </div>
        )}

        <div
          className={`rounded-claude-md px-6 py-5 ${
            isUser
              ? 'bg-pure-white dark:bg-dark-gray text-pure-black dark:text-pure-white shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10'
              : 'bg-pure-white/5 dark:bg-dark-gray/5 text-pure-black dark:text-pure-white shadow-claude-sm border border-pure-black/10 dark:border-pure-white/10'
          }`}
        >

        {/* Display attached files */}
        {message.files && message.files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {message.files.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <Image
                    src={`data:${file.type};base64,${file.data}`}
                    alt={file.name}
                    width={512}
                    height={512}
                    unoptimized
                    className="max-w-xs max-h-64 rounded-claude-sm border border-pure-black/10 dark:border-pure-white/10 cursor-pointer hover:opacity-90 transition-opacity w-auto h-auto"
                    onClick={() => window.open(`data:${file.type};base64,${file.data}`, '_blank')}
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm">
                    <svg className="w-6 h-6 text-electric-yellow dark:text-electric-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-neutral-gray dark:text-neutral-gray">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed font-sans">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:m-0 font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  return !inline ? (
                    <CodeBlock
                      language={language}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code
                      className="bg-pure-white dark:bg-dark-gray/80 px-1.5 py-0.5 rounded text-sm font-mono text-electric-yellow dark:text-electric-yellow border border-pure-black/10 dark:border-pure-white/10"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0 leading-relaxed text-[17px]">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-semibold mb-4 mt-6 first:mt-0 text-pure-black dark:text-pure-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0 text-pure-black dark:text-pure-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-pure-black dark:text-pure-white">
                    {children}
                  </h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-electric-yellow/30 dark:border-electric-yellow/50 pl-4 italic my-4 text-gray-700 dark:text-neutral-gray">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-electric-yellow hover:text-vibrant-coral dark:text-electric-yellow dark:hover:text-vibrant-coral underline decoration-electric-yellow/30 hover:decoration-electric-yellow/80 underline-offset-2 transition-colors"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-claude-sm border border-pure-black/10 dark:border-pure-white/10">
                    <table className="min-w-full divide-y divide-pure-black/10 dark:divide-pure-white/10">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-pure-black/5 dark:bg-pure-white/5">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-pure-black dark:text-pure-white">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-pure-black dark:text-neutral-gray">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="my-6 border-pure-black/10 dark:border-pure-white/10" />
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-pure-black dark:text-pure-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
