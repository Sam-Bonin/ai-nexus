'use client';

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useState,
  type RefObject,
  type ClipboardEvent as ReactClipboardEvent,
} from 'react';
import { FileAttachment } from '@/types/chat';
import { AttachmentPreviewList } from './AttachmentPreviewList';

interface ChatComposerProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => Promise<void>;
  onStop: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  textareaRef: RefObject<HTMLTextAreaElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  attachedFiles: FileAttachment[];
  onFileSelect: (files: FileList | null) => Promise<void>;
  onRemoveFile: (index: number) => void;
  onPaste: (event: ReactClipboardEvent) => Promise<void>;
  thinkingEnabled: boolean;
  setThinkingEnabled: (value: boolean) => void;
  error: string | null;
  clearError: () => void;
}

export function ChatComposer({
  input,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  isStreaming,
  textareaRef,
  fileInputRef,
  attachedFiles,
  onFileSelect,
  onRemoveFile,
  onPaste,
  thinkingEnabled,
  setThinkingEnabled,
  error,
  clearError,
}: ChatComposerProps) {
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const fileInputId = useId();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 300);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = newHeight >= 300 ? 'auto' : 'hidden';
      setIsMultiline(newHeight > 64);
    }
  }, [input, textareaRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const handleFileChange = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    await onFileSelect(target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPlusMenuOpen(false);
  };

  return (
    <div className="bg-gradient-to-t from-pure-white via-pure-white to-pure-white/0 dark:from-dark-gray dark:via-dark-gray dark:to-dark-gray/0">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
        {error && (
          <div className="mb-3 px-6 py-3 bg-theme-primary/10 dark:bg-theme-primary/10 rounded-claude-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-theme-primary dark:text-theme-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-theme-primary dark:text-theme-primary text-sm font-sans">{error}</p>
            </div>
          </div>
        )}

        <div className={`mb-3 inline-flex items-center relative transition-all flex-none w-fit ${plusMenuOpen ? 'gap-2 bg-pure-white dark:bg-dark-gray rounded-full px-2 py-2 shadow-claude-md border border-pure-black/10 dark:border-pure-white/10' : 'gap-2'}`}>
          <div className="relative group">
            <button
              type="button"
              onClick={() => setPlusMenuOpen(prev => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 ${
                plusMenuOpen
                  ? 'text-theme-primary dark:text-theme-primary bg-theme-primary/10 dark:bg-theme-primary/20 rotate-45'
                  : 'text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
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

          {plusMenuOpen && (
            <>
              <div className="relative group">
                <label
                  htmlFor={fileInputId}
                  className="flex h-10 w-10 items-center justify-center text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 animate-fade-in cursor-pointer"
                  style={{ animationDelay: '0ms' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </label>
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-pure-black dark:bg-pure-black text-pure-white dark:text-pure-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Upload
                </span>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setThinkingEnabled(!thinkingEnabled)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 ${
                    thinkingEnabled
                      ? 'text-theme-primary dark:text-theme-primary bg-theme-primary/10 dark:bg-theme-primary/20'
                      : 'text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary bg-pure-white dark:bg-dark-gray hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(event);
          }}
        >
          <AttachmentPreviewList attachments={attachedFiles} onRemove={onRemoveFile} />

          <div className="relative bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-md border border-pure-black/10 dark:border-pure-white/10 focus-within:border-theme-primary dark:focus-within:border-theme-primary focus-within:shadow-theme-primary/20 transition-all flex items-center">
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
              aria-hidden="true"
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                clearError();
                onChange(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              placeholder="Type your message..."
              className="w-full px-5 pr-32 py-5 bg-transparent text-gray-900 dark:text-gray-100 placeholder-neutral-gray dark:placeholder-neutral-gray focus:outline-none resize-none max-h-[300px] rounded-claude-lg font-sans leading-normal overflow-y-hidden"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: '56px' }}
            />
            <div className={`absolute right-4 flex gap-2 transition-all ${isMultiline ? 'bottom-4' : ''}`}>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
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
                  className="p-2 bg-theme-primary hover:bg-theme-primary-hover disabled:bg-neutral-gray dark:disabled:bg-neutral-gray disabled:cursor-not-allowed text-theme-primary-text rounded-claude-sm transition-colors shadow-claude-sm"
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
            <p className="text-xs text-neutral-gray dark:text-neutral-gray font-mono">{input.length} chars</p>
          </div>
        </form>
      </div>
    </div>
  );
}
