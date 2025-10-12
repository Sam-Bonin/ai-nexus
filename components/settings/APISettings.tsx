'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2, ExternalLink, Key } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export function APISettings() {
  const settings = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChangingKey, setIsChangingKey] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current API key status when component mounts
  useEffect(() => {
    settings.refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.refreshStatus]);

  // Focus input when changing key
  useEffect(() => {
    if (isChangingKey && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChangingKey]);

  // Test API key connection
  const handleTest = async () => {
    if (!inputValue.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const success = await settings.testKey(inputValue);
    setIsLoading(false);

    if (success) {
      setSuccessMessage('Connection successful! API key is valid.');
    } else {
      setError(settings.error || 'Failed to test API key');
    }
  };


  // Save API key
  const handleSave = async () => {
    if (!inputValue.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const success = await settings.saveKey(inputValue);
    setIsLoading(false);

    if (success) {
      setSuccessMessage('API key saved successfully!');
      setInputValue('');
      setIsChangingKey(false);
      await settings.refreshStatus();
    } else {
      setError(settings.error || 'Failed to save API key');
    }
  };

  // Show clear confirmation
  const handleClearClick = () => {
    setShowClearConfirmation(true);
  };

  // Confirm and clear API key
  const handleConfirmClear = async () => {
    setShowClearConfirmation(false);
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const success = await settings.clearKey();
    setIsLoading(false);

    if (success) {
      setInputValue('');
      setIsChangingKey(false);
      setSuccessMessage('API key cleared successfully');
    } else {
      setError(settings.error || 'Failed to clear API key');
    }
  };

  // Cancel clear action
  const handleCancelClear = () => {
    setShowClearConfirmation(false);
  };

  const hasKey = settings.status?.hasKey || false;

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-neutral-gray dark:text-neutral-gray mb-6">
        Configure your OpenRouter API key to enable AI chat functionality
      </p>

      {/* Current Status */}
      <div className={`mb-6 p-4 rounded-claude-md border-2 transition-all ${
        hasKey
          ? 'bg-theme-primary/10 border-theme-primary'
          : 'bg-pure-black/5 dark:bg-pure-white/5 border-pure-black/10 dark:border-pure-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
            hasKey
              ? 'bg-theme-primary shadow-theme-primary/50'
              : 'bg-neutral-gray'
          }`} />
          <span className={`text-sm font-medium ${
            hasKey
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-neutral-gray dark:text-neutral-gray'
          }`}>
            {hasKey
              ? `Connected: ••••${settings.status?.lastFourChars || '****'}`
              : 'No API key configured'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-vibrant-coral/10 border border-vibrant-coral/30 rounded-claude-md flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-5 h-5 text-vibrant-coral flex-shrink-0 mt-0.5" />
          <p className="text-sm text-vibrant-coral font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-theme-primary/10 border border-theme-primary/30 rounded-claude-md flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <Check className="w-5 h-5 text-theme-primary dark:text-theme-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-theme-primary dark:text-theme-primary font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 flex items-center justify-center py-2">
          <Loader2 className="w-6 h-6 text-theme-primary dark:text-theme-primary animate-spin" />
        </div>
      )}

      {/* Conditional UI based on key status */}
      {hasKey && !isChangingKey ? (
        /* Has Key - Show management options or clear confirmation */
        <div className="space-y-4">
          {showClearConfirmation ? (
            /* Clear Confirmation - Replaces buttons */
            <div className="mb-6 p-4 bg-vibrant-coral/10 border-2 border-vibrant-coral rounded-claude-md animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-vibrant-coral flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-vibrant-coral mb-1">
                    Clear API Key?
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This will remove your API key. You&apos;ll need to add it again to use the chat.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelClear}
                  className="flex-1 px-4 py-2 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 text-gray-900 dark:text-gray-100 rounded-claude-md font-medium hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-all shadow-claude-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClear}
                  className="flex-1 px-4 py-2 bg-vibrant-coral hover:bg-vibrant-coral/80 text-pure-white rounded-claude-md font-medium transition-all shadow-claude-sm"
                >
                  Clear Key
                </button>
              </div>
            </div>
          ) : (
            /* Management buttons */
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setIsChangingKey(true)}
                disabled={isLoading}
                className="flex-1 min-w-[160px] px-5 py-3 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-claude-sm flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Change Key
              </button>
              <button
                onClick={handleClearClick}
                disabled={isLoading}
                className="flex-1 min-w-[160px] px-5 py-3 bg-vibrant-coral hover:bg-vibrant-coral/80 text-pure-white rounded-claude-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-claude-sm"
              >
                Clear Key
              </button>
            </div>
          )}
        </div>
      ) : (
        /* No Key OR Changing Key - Show input form */
        <div className="space-y-4">
          <div className="mb-6">
            <label
              htmlFor="api-key-input"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3"
            >
              {isChangingKey ? 'Enter New API Key' : 'OpenRouter API Key'}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="api-key-input"
                type={showPassword ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="sk-or-..."
                disabled={isLoading}
                autoComplete="off"
                className="w-full px-4 py-3 pr-12 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-md focus:border-theme-primary dark:focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 placeholder-neutral-gray dark:placeholder-neutral-gray shadow-claude-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-gray dark:text-neutral-gray hover:text-theme-primary dark:hover:text-theme-primary hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-claude-sm transition-colors"
                aria-label={showPassword ? 'Hide API key' : 'Show API key'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-gray dark:text-neutral-gray">
              Your key is stored securely and never leaves your machine
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {isChangingKey && (
              <button
                onClick={() => {
                  setIsChangingKey(false);
                  setInputValue('');
                  setError(null);
                  setSuccessMessage(null);
                }}
                disabled={isLoading}
                className="flex-1 min-w-[120px] px-4 py-2.5 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 text-gray-900 dark:text-gray-100 rounded-claude-md font-medium hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-claude-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleTest}
              disabled={isLoading || !inputValue.trim()}
              className="flex-1 min-w-[120px] px-4 py-2.5 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 text-gray-900 dark:text-gray-100 rounded-claude-md font-medium hover:bg-pure-black/5 dark:hover:bg-pure-white/5 hover:border-theme-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-claude-sm"
            >
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !inputValue.trim()}
              className="flex-1 min-w-[120px] px-4 py-2.5 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-text rounded-claude-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-gray dark:disabled:bg-neutral-gray shadow-claude-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Help Links */}
      <div className="pt-4 border-t border-pure-black/10 dark:border-pure-white/10">
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-neutral-gray dark:text-neutral-gray hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
        >
          <span className="font-medium">Get your API key from OpenRouter</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
