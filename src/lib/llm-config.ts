/**
 * LLM engine chains for Veracar — cloud only.
 *
 * TEXT   : NVIDIA NIM  ->  OpenRouter  ->  Groq
 * VISION : env-driven (VERACAR_VISION_*), NIM hosted vision models
 */
const NIM_BASE = 'https://integrate.api.nvidia.com/v1';
const OR_BASE = 'https://openrouter.ai/api/v1';
const GROQ_BASE = 'https://api.groq.com/openai/v1';

export const TEXT_MODEL = process.env.VERACAR_LLM_MODEL || 'nvidia/nemotron-3-super-120b-a12b';

// legacy exports kept for existing call sites
export const TEXT_BASE = NIM_BASE;
export const TEXT_KEY = process.env.NVIDIA_API_KEY || '';

type Endpoint = { name: string; base: string; model: string; key: string };

function textChain(): Endpoint[] {
  const chain: Endpoint[] = [];
  if (process.env.NVIDIA_API_KEY) {
    chain.push({ name: 'nim', base: NIM_BASE, model: TEXT_MODEL, key: process.env.NVIDIA_API_KEY });
  }
  if (process.env.OPENROUTER_API_KEY) {
    chain.push({ name: 'openrouter', base: OR_BASE, model: `${TEXT_MODEL}:free`, key: process.env.OPENROUTER_API_KEY });
  }
  if (process.env.GROQ_API_KEY) {
    chain.push({ name: 'groq', base: GROQ_BASE, model: 'openai/gpt-oss-120b', key: process.env.GROQ_API_KEY });
  }
  return chain;
}

export const VISION_BASE = process.env.VERACAR_VISION_BASE || NIM_BASE;
export const VISION_MODEL = process.env.VERACAR_VISION_MODEL || 'meta/llama-3.2-90b-vision-instruct';
export const VISION_KEY = process.env.VERACAR_VISION_KEY || process.env.NVIDIA_API_KEY || 'local';

const post = (ep: { base: string; key: string; model: string }, body: Record<string, any>) =>
  fetch(`${ep.base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ep.key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://veracar.co',
      'X-Title': 'Veracar',
    },
    body: JSON.stringify({ ...body, model: ep.model }),
    signal: AbortSignal.timeout(240000),
  });

/**
 * Text completion across the cloud chain: try each engine until one answers
 * with a non-5xx response. Throws only if every engine fails.
 */
export async function llmFetch(body: Record<string, any>): Promise<Response> {
  const chain = textChain();
  let lastErr: any = new Error('no engines configured');
  for (const ep of chain) {
    try {
      const res = await post(ep, body);
      if (res.status >= 500 || res.status === 429) {
        console.warn(`[LLM] ${ep.name} -> ${res.status}; trying next engine`);
        lastErr = new Error(`${ep.name} ${res.status}`);
        continue;
      }
      if (chain.indexOf(ep) > 0) console.log(`[LLM] served by fallback engine: ${ep.name}`);
      return res;
    } catch (e: any) {
      console.warn(`[LLM] ${ep.name} failed (${e?.message}); trying next engine`);
      lastErr = e;
    }
  }
  throw lastErr;
}
