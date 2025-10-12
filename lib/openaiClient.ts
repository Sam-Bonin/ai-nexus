import OpenAI from 'openai';
import { ApiKeyManager } from './apiKeyManager';

/**
 * Factory function to create an OpenAI client instance with the current API key.
 *
 * This function creates a fresh client for each request, reading the key from
 * the in-memory cache to support hot-reload when the API key changes.
 *
 * @returns OpenAI client instance configured for OpenRouter
 * @throws Error if API key is not configured
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = ApiKeyManager.getInstance().getKey();

  if (!apiKey) {
    throw new Error('API key not configured. Please set your OpenRouter API key in settings.');
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.YOUR_SITE_NAME || "AI Nexus"
    }
  });
}
