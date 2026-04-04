/** Prevent open redirects: only allow same-site paths. */
export function safeNextPath(next: string | undefined, fallback = "/"): string {
  if (!next || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  return t;
}
