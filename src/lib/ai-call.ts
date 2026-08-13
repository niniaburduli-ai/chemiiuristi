import { openOpenRouterStream } from "./openrouter-stream-core";
import { extractCostUsd } from "./openrouter-usage";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = () =>
  process.env.OPENROUTER_ANSWER_MODEL ||
  process.env.OPENROUTER_MODEL ||
  "google/gemini-2.5-flash";

/**
 * Streaming counterpart to `callOpenRouterChat` — opens the upstream
 * connection and resolves once it's confirmed live (HTTP 200), so callers
 * can still fall back to a clean error response if the connection itself
 * fails. Rejects with `OpenRouterConnectError` in that case; once resolved,
 * the generator yields content deltas as they arrive and returns the total
 * billed cost (USD) once the stream ends.
 */
export async function streamOpenRouterChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model?: string,
  maxTokens = 2500,
  temperature?: number
) {
  return openOpenRouterStream(messages, {
    model: model ?? MODEL(),
    maxTokens,
    temperature,
  });
}

const RETRYABLE_UPSTREAM_RETRIES = 2;
const RETRYABLE_UPSTREAM_DELAY_MS = 1500;

/**
 * OpenRouter can return HTTP 200 while embedding a failed generation in the
 * choice itself (`finish_reason: "error"`, e.g. an upstream 429 mid-stream)
 * — `res.ok` alone doesn't catch this, and the accompanying `content` is
 * partial/truncated, which fails JSON parsing downstream in a confusing way.
 * These are transient (observed clearing on the very next attempt), so a
 * short bounded retry is worth it before surfacing an error.
 */
async function requestOpenRouterChat(
  key: string,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  maxTokens: number
): Promise<{ content: string; costUsd: number }> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
      error?: { code?: number; message?: string };
    }>;
  };
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "error" || choice?.error) {
    throw new Error(
      `OpenRouter upstream error: ${choice?.error?.message ?? "generation failed mid-stream"}`
    );
  }

  return {
    content: choice?.message?.content ?? "",
    costUsd: extractCostUsd(data),
  };
}

export async function callOpenRouterChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model?: string,
  maxTokens = 2500
): Promise<{ content: string; costUsd: number }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  const resolvedModel = model ?? MODEL();

  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRYABLE_UPSTREAM_RETRIES; attempt++) {
    try {
      return await requestOpenRouterChat(key, resolvedModel, messages, maxTokens);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRYABLE_UPSTREAM_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRYABLE_UPSTREAM_DELAY_MS));
      }
    }
  }
  throw lastErr;
}
