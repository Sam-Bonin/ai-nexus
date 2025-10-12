'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<{
    hasKey: boolean;
    lastFourChars?: string;
  }>({ hasKey: false });

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current API key status when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fetch current API key status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setCurrentStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch API key status:', err);
    }
  };

  // Test API key connection
  const handleTest = async () => {
    if (!inputValue.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputValue, testOnly: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Connection successful! API key is valid.');
        setError(null);
      } else {
        setError(data.error || 'Failed to test API key');
        setSuccessMessage(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSuccessMessage(null);
    } finally {
      setIsLoading(false);
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

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputValue }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('API key saved successfully!');
        setError(null);
        await fetchStatus();
        setInputValue('');

        // Close modal after brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to save API key');
        setSuccessMessage(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSuccessMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear API key
  const handleClear = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear your API key?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStatus();
        setInputValue('');
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to clear API key');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure your OpenRouter API key
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                currentStatus.hasKey
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              }`}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentStatus.hasKey
                ? `Current key: ••••${currentStatus.lastFourChars}`
                : 'No API key configured'}
            </span>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mb-6">
          <label
            htmlFor="api-key-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            OpenRouter API Key
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
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
              aria-label={showPassword ? 'Hide API key' : 'Show API key'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Your key is stored securely and never leaves your machine
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mb-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={handleTest}
            disabled={isLoading || !inputValue.trim()}
            className="flex-1 min-w-[120px] px-4 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !inputValue.trim()}
            className="flex-1 min-w-[120px] px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          {currentStatus.hasKey && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 min-w-[120px] px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Key
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-w-[120px] px-4 py-2.5 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {/* Help Links */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>Get your API key from OpenRouter</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
