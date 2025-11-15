import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Electron app verification
 * Returns a unique identifier to confirm this is the AI Nexus Next.js server
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'ai-nexus',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
