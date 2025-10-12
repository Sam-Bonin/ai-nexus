import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { getOpenAIClient } from '@/lib/openaiClient';

interface Project {
  id: string;
  name: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get OpenAI client with current API key (supports hot-reload)
    const openai = getOpenAIClient();

    // Parse the incoming request body
    const { conversationDescription, projects } = await req.json();

    // Validate input
    if (!conversationDescription || typeof conversationDescription !== 'string') {
      return new Response(
        JSON.stringify({ error: 'conversationDescription is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!projects || !Array.isArray(projects)) {
      return new Response(
        JSON.stringify({ error: 'projects array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If no projects, return no match
    if (projects.length === 0) {
      return new Response(
        JSON.stringify({ matchedProjectId: null, confidence: 0.0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create prompt with confidence rubric
    const projectsList = projects
      .map((p: Project) => `- ID: ${p.id}, Name: ${p.name}, Description: ${p.description}`)
      .join('\n');

    const matchPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: `You are matching a conversation to projects based on semantic similarity.

Conversation description: "${conversationDescription}"

Available projects:
${projectsList}

Task: Determine if this conversation belongs to any existing project.

Scoring Rubric (0.0-1.0 in 0.1 increments):
- 0.9-1.0: Direct topic match, same tools/technologies, same problem domain
- 0.7-0.8: Related topic, overlapping domain, similar context
- 0.5-0.6: Tangentially related, some keyword overlap
- 0.3-0.4: Weak connection, different domain but related field
- 0.0-0.2: No meaningful connection, different topics

Rules:
- Return matchedProjectId ONLY if confidence >= 0.7
- Return null if no project scores >= 0.7
- Be conservative - only match if truly relevant
- Consider: topic overlap, technical stack similarity, problem domain alignment
- If multiple projects score >= 0.7, choose the highest scoring one

Return ONLY valid JSON in this exact format:
{
  "matchedProjectId": "project-id-here-or-null",
  "confidence": 0.8
}

No additional text or explanation.`
      }
    ];

    // Call OpenRouter API (non-streaming)
    const requestPayload: ChatCompletionCreateParamsNonStreaming = {
      model: "anthropic/claude-3.5-sonnet",
      messages: matchPrompt,
      stream: false,
      max_tokens: 150,
      temperature: 0.3, // Lower temperature for more consistent scoring
    };

    const response = await openai.chat.completions.create(requestPayload);

    // Extract content from response
    const content = response.choices[0]?.message?.content || '';

    // Try to parse JSON response
    try {
      const cleanedContent = content
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleanedContent);

      // Validate and clamp confidence
      let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.0;
      confidence = Math.max(0.0, Math.min(1.0, confidence)); // Clamp to 0-1

      // Validate matchedProjectId
      let matchedProjectId = parsed.matchedProjectId;

      // If matchedProjectId is not null, verify it exists in projects
      if (matchedProjectId !== null && matchedProjectId !== undefined) {
        const projectExists = projects.some((p: Project) => p.id === matchedProjectId);
        if (!projectExists) {
          console.warn(`Matched project ID ${matchedProjectId} not found in projects list`);
          matchedProjectId = null;
          confidence = 0.0;
        }
      } else {
        matchedProjectId = null;
      }

      return new Response(
        JSON.stringify({
          matchedProjectId,
          confidence: Number(confidence.toFixed(1)) // Round to 1 decimal place
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Failed to parse match response:', parseError, 'Content:', content);

      // Fallback: no match
      return new Response(
        JSON.stringify({ matchedProjectId: null, confidence: 0.0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
        JSON.stringify({ error: 'Invalid API key', requiresSetup: true, matchedProjectId: null, confidence: 0.0 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error?.status === 429) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          matchedProjectId: null,
          confidence: 0.0
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error response with fallback
    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred while matching project',
        matchedProjectId: null,
        confidence: 0.0
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}