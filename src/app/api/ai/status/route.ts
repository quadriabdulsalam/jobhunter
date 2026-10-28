import { NextResponse } from 'next/server';
import { AI_MODEL, AI_PROVIDER, AI_PROVIDER_LABEL, isAIConfigured } from '@/lib/openai-config';

export async function GET() {
  return NextResponse.json({
    configured: isAIConfigured(),
    provider: AI_PROVIDER,
    providerLabel: AI_PROVIDER_LABEL,
    model: AI_MODEL
  });
}
