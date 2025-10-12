import fs from 'fs/promises';
import path from 'path';

/**
 * Singleton API Key Manager
 * Manages the OPENROUTER_API_KEY with in-memory caching and .env.local persistence
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private cachedKey: string | null = null;
  private readonly envFilePath: string;
  private readonly ENV_KEY_NAME = 'OPENROUTER_API_KEY';

  private constructor() {
    this.envFilePath = path.join(process.cwd(), '.env.local');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Get the API key (lazy initialization from .env.local on first access)
   */
  public getKey(): string | null {
    // If cache is populated, return it
    if (this.cachedKey !== null) {
      return this.cachedKey;
    }

    // Lazy initialization: try to read from file
    try {
      const key = this.readKeyFromFileSync();
      if (key) {
        this.cachedKey = key;
      }
      return this.cachedKey;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Set the API key (updates cache immediately, then persists to file)
   */
  public async setKey(key: string): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid API key: must be a non-empty string');
    }

    // Update cache immediately
    this.cachedKey = key;

    // Persist to file
    try {
      await this.writeKeyToFile(key);
    } catch (error) {
      // Revert cache on write failure
      this.cachedKey = null;
      throw new Error(
        `Failed to persist API key to file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear the API key (removes from cache and file)
   */
  public async clearKey(): Promise<void> {
    // Clear cache immediately
    this.cachedKey = null;

    // Remove from file
    try {
      await this.removeKeyFromFile();
    } catch (error) {
      throw new Error(
        `Failed to remove API key from file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if an API key exists (triggers lazy initialization from file if needed)
   */
  public hasKey(): boolean {
    // Trigger lazy initialization by calling getKey()
    const key = this.getKey();
    return key !== null && key.length > 0;
  }

  /**
   * Get the last 4 characters of the API key (for display purposes)
   */
  public getLastFourChars(): string | null {
    const key = this.getKey();
    if (!key || key.length < 4) {
      return null;
    }
    return key.slice(-4);
  }

  /**
   * Synchronously read the API key from .env.local file
   * Used for lazy initialization in getKey()
   */
  private readKeyFromFileSync(): string | null {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(this.envFilePath, 'utf-8');
      return this.parseKeyFromContent(content);
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Asynchronously read the entire .env.local file
   */
  private async readEnvFile(): Promise<string> {
    try {
      return await fs.readFile(this.envFilePath, 'utf-8');
    } catch (error) {
      // File doesn't exist, return empty string
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  /**
   * Parse the API key from .env file content
   */
  private parseKeyFromContent(content: string): string | null {
    try {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (trimmedLine.startsWith('#') || !trimmedLine) {
          continue;
        }
        // Check if line contains our key
        if (trimmedLine.startsWith(`${this.ENV_KEY_NAME}=`)) {
          const value = trimmedLine.substring(`${this.ENV_KEY_NAME}=`.length).trim();
          // Remove quotes if present
          const unquoted = value.replace(/^["']|["']$/g, '');
          return unquoted || null;
        }
      }
      return null;
    } catch (error) {
      // Parsing error
      return null;
    }
  }

  /**
   * Write the API key to .env.local file (preserves other env vars)
   */
  private async writeKeyToFile(key: string): Promise<void> {
    try {
      // Read existing content
      const existingContent = await this.readEnvFile();
      const lines = existingContent.split('\n');

      // Find and update the key line, or add it
      let keyLineFound = false;
      const updatedLines = lines.map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(`${this.ENV_KEY_NAME}=`)) {
          keyLineFound = true;
          return `${this.ENV_KEY_NAME}=${key}`;
        }
        return line;
      });

      // If key line not found, add it
      if (!keyLineFound) {
        updatedLines.push(`${this.ENV_KEY_NAME}=${key}`);
      }

      // Write to file atomically
      const newContent = updatedLines.join('\n');
      await fs.writeFile(this.envFilePath, newContent, {
        encoding: 'utf-8',
        mode: 0o600 // Owner read/write only
      });
    } catch (error) {
      throw new Error(
        `File write operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Remove the API key from .env.local file (preserves other env vars)
   */
  private async removeKeyFromFile(): Promise<void> {
    try {
      // Read existing content
      const existingContent = await this.readEnvFile();

      // If file is empty, nothing to do
      if (!existingContent) {
        return;
      }

      const lines = existingContent.split('\n');

      // Filter out the key line
      const updatedLines = lines.filter((line) => {
        const trimmedLine = line.trim();
        return !trimmedLine.startsWith(`${this.ENV_KEY_NAME}=`);
      });

      // Write updated content back to file
      const newContent = updatedLines.join('\n');

      // If file would be empty, delete it
      if (!newContent.trim()) {
        try {
          await fs.unlink(this.envFilePath);
        } catch (error) {
          // Ignore if file doesn't exist
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
      } else {
        await fs.writeFile(this.envFilePath, newContent, {
          encoding: 'utf-8',
          mode: 0o600
        });
      }
    } catch (error) {
      throw new Error(
        `File removal operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
