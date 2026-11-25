import { NextRequest } from "next/server";

export const NEMOTRON_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
export const NEMOTRON_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

/**
 * Robustly extracts and sanitizes the NVIDIA Nemotron API Key.
 * Checks request headers (client key), request body, and multiple environment variable aliases.
 * Trims surrounding quotes and whitespace.
 */
export function getNemotronApiKey(req?: NextRequest, bodyApiKey?: string): string | null {
  // 1. Check direct parameter from body
  let key = bodyApiKey;

  // 2. Check client-supplied custom header (allows instant browser-side key configuration)
  if (!key && req) {
    key = req.headers.get("x-nemotron-api-key") || req.headers.get("x-nvidia-api-key") || undefined;
  }

  // 3. Check environment variables (supports standard, alias, and Next.js public prefixes)
  if (!key) {
    key =
      process.env.NEMOTRON_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.NEXT_PUBLIC_NEMOTRON_API_KEY ||
      process.env.NEXT_PUBLIC_NVIDIA_API_KEY ||
      undefined;
  }

  if (!key) {
    return null;
  }

  // Clean quotes and whitespace
  const sanitized = key.trim().replace(/^["']|["']$/g, "").trim();
  return sanitized.length > 0 ? sanitized : null;
}
