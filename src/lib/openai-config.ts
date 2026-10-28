import OpenAI from 'openai';

export type AIProvider = 'groq' | 'openai';

const requestedProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

export const AI_PROVIDER: AIProvider = requestedProvider === 'groq' ? 'groq' : 'openai';
export const AI_MODEL = AI_PROVIDER === 'groq'
  ? process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b'
  : process.env.OPENAI_MODEL?.trim() || 'gpt-4o';
export const AI_PROVIDER_LABEL = AI_PROVIDER === 'groq' ? 'Groq' : 'OpenAI';

export function isAIConfigured(): boolean {
  return Boolean(getAPIKey());
}

export function createAIClient(): OpenAI | null {
  const apiKey = getAPIKey();
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    ...(AI_PROVIDER === 'groq' ? { baseURL: 'https://api.groq.com/openai/v1' } : {})
  });
}

function getAPIKey(): string {
  const key = AI_PROVIDER === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  return key?.trim() || '';
}
