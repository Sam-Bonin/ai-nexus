import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';
import { getOpenAIClient } from '@/lib/openaiClient';

export async function POST(req: NextRequest) {
  try {
    // Create OpenAI client with current API key (supports hot-reload)
    const openai = getOpenAIClient();

    // Parse the incoming request body
    const { messages, model, thinking } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use provided model or default to Claude Sonnet 4
    const selectedModel = model || "anthropic/claude-sonnet-4";

    // Transform messages to support file attachments
    const transformedMessages = messages.map((msg: any) => {
      if (msg.files && msg.files.length > 0) {
        // Convert to content array format for multimodal messages
        const contentArray: any[] = [];

        // Add text content first
        if (msg.content) {
          contentArray.push({ type: 'text', text: msg.content });
        }

        // Add file attachments
        msg.files.forEach((file: any) => {
          if (file.type.startsWith('image/')) {
            contentArray.push({
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${file.data}`
              }
            });
          } else if (file.type === 'application/pdf') {
            // For PDFs, use document format
            contentArray.push({
              type: 'image_url', // OpenRouter/Claude handles PDFs through this
              image_url: {
                url: `data:${file.type};base64,${file.data}`
              }
            });
          }
        });

        return {
          role: msg.role,
          content: contentArray
        };
      } else {
        // Regular text-only message
        return {
          role: msg.role,
          content: msg.content
        };
      }
    });

    // Call OpenRouter API with streaming enabled
    type StreamingParams = ChatCompletionCreateParamsStreaming & {
      reasoning?: {
        effort: 'low' | 'medium' | 'high';
      };
    };

    const requestPayload: StreamingParams = {
      model: selectedModel,
      messages: transformedMessages,
      stream: true,
      ...(thinking ? { reasoning: { effort: 'low' } } : {}),
    };

    const response = await openai.chat.completions.create(requestPayload);

    // Track metadata
    let inputTokens = 0;
    let outputTokens = 0;
    const startTime = Date.now();

    // Create a ReadableStream to stream the response back to the client
    let cancelled = false;
    let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

    const onAbort = () => {
      cancelled = true;
      try {
        // Abort upstream OpenAI stream promptly
        (response as any)?.controller?.abort?.();
      } catch (_) {
        // noop
      }
      try {
        controllerRef?.close?.();
      } catch (_) {
        // noop
      }
    };

    // Propagate client aborts
    req.signal.addEventListener('abort', onAbort);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controllerRef = controller as any;
        try {
          for await (const chunk of response) {
            if (cancelled || req.signal.aborted) break;

            const content = chunk.choices[0]?.delta?.content || '';
            if (content && !cancelled) {
              try {
                controller.enqueue(new TextEncoder().encode(content));
              } catch (e) {
                // Controller likely closed due to client abort
                break;
              }
            }

            // Handle thinking/reasoning content
            const reasoningDetails = (chunk.choices[0]?.delta as any)?.reasoning_details;
            if (!cancelled && reasoningDetails && Array.isArray(reasoningDetails)) {
              for (const detail of reasoningDetails) {
                if (cancelled || req.signal.aborted) break;
                if (detail.text) {
                  try {
                    controller.enqueue(
                      new TextEncoder().encode(`___THINKING___${detail.text}`)
                    );
                  } catch (_) {
                    break;
                  }
                }
              }
            }

            // Collect usage data if available
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens || 0;
              outputTokens = chunk.usage.completion_tokens || 0;
            }
          }

          if (!cancelled && !req.signal.aborted) {
            // Send metadata as a final chunk with a special delimiter
            const duration = Date.now() - startTime;
            const metadata = {
              model: selectedModel,
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: inputTokens + outputTokens,
              },
              duration,
              timestamp: Date.now(),
            };

            try {
              controller.enqueue(
                new TextEncoder().encode(`\n___METADATA___${JSON.stringify(metadata)}`)
              );
            } catch (_) {
              // ignore if already closed
            }
          }
        } catch (error) {
          // Ignore errors triggered by client aborts
          if (!(req.signal.aborted || cancelled)) {
            console.error('Error streaming response:', error);
            try {
              controller.error(error as any);
            } catch (_) {
              // ignore
            }
          }
        } finally {
          try {
            if (!(req.signal.aborted || cancelled)) controller.close();
          } catch (_) {
            // ignore
          } finally {
            req.signal.removeEventListener('abort', onAbort);
          }
        }
      },
      cancel() {
        onAbort();
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

    // Handle API key not configured error
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
        error: error?.message || 'An error occurred while processing your request'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
