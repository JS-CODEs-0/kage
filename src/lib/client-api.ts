export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("socialpilot_nemotron_key") || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim().replace(/^["']|["']$/g, "").trim();
  if (trimmed) {
    localStorage.setItem("socialpilot_nemotron_key", trimmed);
  } else {
    localStorage.removeItem("socialpilot_nemotron_key");
  }
}

export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = getStoredApiKey();
  if (key) {
    headers["x-nemotron-api-key"] = key;
  }
  return headers;
}
