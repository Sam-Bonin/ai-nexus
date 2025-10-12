import { ApiKeyManager } from '@/lib/apiKeyManager';
import OpenAI from 'openai';
import { NextRequest } from 'next/server';

/**
 * GET /api/setting-key
 * Check if API key exists and return masked information
 */
export async function GET() {
  try {
    const apiKeyManager = ApiKeyManager.getInstance();
    const hasKey = apiKeyManager.hasKey();

    if (hasKey) {
      const lastFourChars = apiKeyManager.getLastFourChars();
      return Response.json({
        hasKey: true,
        lastFourChars,
      });
    }

    return Response.json({
      hasKey: false,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: 'Failed to retrieve API key status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/setting-key
 * Test and optionally save API key
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, testOnly } = body as { apiKey?: string; testOnly?: boolean };

    // Validate API key
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'API key is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Test the API key with a real API call
    try {
      const testClient = new OpenAI({
        apiKey: trimmedKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });

      await testClient.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 401) {
        return Response.json(
          {
            success: false,
            error: 'Invalid API key',
          },
          { status: 401 }
        );
      }

      if (error?.status === 429) {
        return Response.json(
          {
            success: false,
            error: 'Rate limit exceeded',
          },
          { status: 429 }
        );
      }

      // Network errors
      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.message?.includes('fetch failed')) {
        return Response.json(
          {
            success: false,
            error: 'Unable to connect to OpenRouter',
          },
          { status: 503 }
        );
      }

      // Generic error for other cases
      return Response.json(
        {
          success: false,
          error: error?.message || 'Failed to validate API key',
        },
        { status: 500 }
      );
    }

    // If testOnly, return success without saving
    if (testOnly) {
      const lastFourChars = trimmedKey.slice(-4);
      return Response.json({
        success: true,
        message: 'API key is valid',
        lastFourChars,
      });
    }

    // Save the API key
    const apiKeyManager = ApiKeyManager.getInstance();
    await apiKeyManager.setKey(trimmedKey);
    const lastFourChars = apiKeyManager.getLastFourChars();

    return Response.json({
      success: true,
      message: 'API key saved successfully',
      lastFourChars,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/setting-key
 * Clear the stored API key
 */
export async function DELETE() {
  try {
    const apiKeyManager = ApiKeyManager.getInstance();
    apiKeyManager.clearKey();

    return Response.json({
      success: true,
      message: 'API key cleared successfully',
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: 'Failed to clear API key',
      },
      { status: 500 }
    );
  }
}
