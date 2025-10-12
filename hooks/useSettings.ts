import { useState } from 'react';

interface SettingsStatus {
  hasKey: boolean;
  lastFourChars?: string;
}

interface UseSettingsResult {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  status: SettingsStatus | null;
  isLoading: boolean;
  error: string | null;
  testKey: (key: string) => Promise<boolean>;
  saveKey: (key: string) => Promise<boolean>;
  clearKey: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSettings = () => {
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  const refreshStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/settings');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch API key status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error refreshing status:', err);
      // Don't set error state for refresh failures to avoid disrupting UI
      setStatus(null);
    }
  };

  const testKey = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key, testOnly: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test API key');
      }

      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test API key';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveKey = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      if (data.success) {
        await refreshStatus();
      }

      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save API key';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearKey = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear API key');
      }

      if (data.success) {
        await refreshStatus();
      }

      return data.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear API key';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    openSettings,
    closeSettings,
    status,
    isLoading,
    error,
    testKey,
    saveKey,
    clearKey,
    refreshStatus,
  };
}
