import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';

// Initialize OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.YOUR_SITE_NAME || "Claude AI Clone",
  }
});

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a prompt for title generation
    const titlePrompt: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: `Based on this conversation, generate a short, concise title (3-6 words) that captures the main topic. Only return the title text, nothing else.\n\nConversation:\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`
      }
    ];

    // Call OpenRouter API with streaming enabled
    type TitleStreamingParams = ChatCompletionCreateParamsStreaming & {
      max_tokens?: number;
      temperature?: number;
    };

    const requestPayload: TitleStreamingParams = {
      model: "anthropic/claude-3.5-sonnet",
      messages: titlePrompt,
      stream: true,
      max_tokens: 50,
      temperature: 0.7,
    };

    const response = await openai.chat.completions.create(requestPayload);

    // Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Encode the content and enqueue it
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          console.error('Error streaming title generation:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return the stream as the response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error?.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
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
        error: error?.message || 'An error occurred while generating title'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
