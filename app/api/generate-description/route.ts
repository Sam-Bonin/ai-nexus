import { NextRequest } from 'next/server';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { getOpenAIClient } from '@/lib/openaiClient';

export async function POST(req: NextRequest) {
  try {
    // Initialize OpenAI client with hot-reload support
    const openai = getOpenAIClient();

    // Parse the incoming request body
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a prompt for description generation
    const descriptionPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: `Analyze this conversation and generate a single, concise sentence (8-12 words) describing what the user is trying to accomplish or discuss. Be specific and actionable.

Return ONLY a JSON object in this exact format:
{
  "description": "your description here"
}

Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      }
    ];

    // Call OpenRouter API (non-streaming)
    const requestPayload: ChatCompletionCreateParamsNonStreaming = {
      model: "anthropic/claude-3.5-sonnet",
      messages: descriptionPrompt,
      stream: false,
      max_tokens: 100,
      temperature: 0.7,
    };

    const response = await openai.chat.completions.create(requestPayload);

    // Extract description from response
    const content = response.choices[0]?.message?.content || '';

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (parsed.description && typeof parsed.description === 'string') {
        return new Response(
          JSON.stringify({ description: parsed.description }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // If JSON parsing fails, use content as-is (fallback)
      const cleanedDescription = content
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      return new Response(
        JSON.stringify({ description: cleanedDescription || "Untitled conversation" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback if parsing failed
    return new Response(
      JSON.stringify({ description: "Untitled conversation" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle missing API key error
    if (error?.message?.includes('API key not configured')) {
      return new Response(
        JSON.stringify({
          error: 'API key not configured. Please set your OpenRouter API key in settings.',
          requiresSetup: true
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle specific error cases
    if (error?.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key', requiresSetup: true }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error?.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred while generating description',
        description: "Untitled conversation" // Fallback
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}