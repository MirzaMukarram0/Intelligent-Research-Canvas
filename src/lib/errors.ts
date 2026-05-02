// Normalises Gemini SDK / Google API errors into a friendly { status, message, hint }.

export interface NormalizedError {
  status: number;
  message: string;
  hint?: string;
}

export function humanizeGeminiError(err: unknown): NormalizedError {
  const raw = err instanceof Error ? err.message : String(err);

  // 429 — quota / rate limit
  if (/429|quota|rate.?limit/i.test(raw)) {
    const isFreeTierZero = /limit:\s*0/i.test(raw);
    const retry = raw.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/i)?.[1];
    return {
      status: 429,
      message: isFreeTierZero
        ? "Your Gemini API key has no free-tier quota for this model."
        : "Gemini rate limit hit. Please try again in a moment.",
      hint: isFreeTierZero
        ? "Either enable billing on your Google Cloud project at https://aistudio.google.com/app/apikey, or set GEMINI_MODEL to a model your tier supports (e.g. gemini-2.5-flash)."
        : retry
        ? `Retry suggested in ${Math.ceil(parseFloat(retry))}s.`
        : "Wait ~30 seconds before retrying.",
    };
  }

  // 401 / 403 — invalid key
  if (/API[_ ]?key not valid|API_KEY_INVALID|401|403/i.test(raw)) {
    return {
      status: 401,
      message: "Gemini API key is invalid or missing.",
      hint: "Set GEMINI_API_KEY in .env.local (or your Cloud Run secret) to a valid key from https://aistudio.google.com/app/apikey.",
    };
  }

  // Model not found
  if (/not found|NOT_FOUND|unsupported/i.test(raw) && /model/i.test(raw)) {
    return {
      status: 400,
      message: "The configured Gemini model is not available for your key.",
      hint: "Override with GEMINI_MODEL=gemini-2.5-flash (or another model your account supports).",
    };
  }

  // Safety / blocked
  if (/SAFETY|blocked/i.test(raw)) {
    return {
      status: 422,
      message: "The model refused to generate a response for this content.",
      hint: "Try a different document or rephrase your question.",
    };
  }

  return {
    status: 500,
    message: "Something went wrong while talking to Gemini.",
    hint: raw.slice(0, 240),
  };
}
