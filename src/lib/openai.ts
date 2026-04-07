import OpenAI from 'openai';

// ─── NVIDIA NIM API client singleton (server-side only) ───────

let _client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.NVIDIA_API_KEY;
    const baseURL = process.env.NVIDIA_BASE_URL;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY saknas. Lägg till den i .env.local');
    }
    _client = new OpenAI({
      apiKey,
      baseURL: baseURL || 'https://integrate.api.nvidia.com/v1'
    });
  }
  return _client;
}

// ─── Model selection per task type ────────────────────────────
// Reasoning/analysis — best for matching, profile scoring, interview Q&A
export const AI_MODEL_REASONING = process.env.AI_MODEL_REASONING || 'deepseek-ai/deepseek-v3.2';

// Creative/writing — best for cover letters, summaries, natural text
export const AI_MODEL_CREATIVE = process.env.AI_MODEL_CREATIVE || 'meta/llama-3.3-70b-instruct';

// Default fallback
export const AI_MODEL = AI_MODEL_REASONING;
