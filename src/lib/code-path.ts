/** Normalize and validate a relative file path (no .., no absolute). */
export function sanitizeCodePath(raw: string): string {
  const trimmed = raw.trim().replace(/\\/g, "/");
  const parts = trimmed.split("/").filter((p) => p && p !== ".");
  for (const p of parts) {
    if (p === "..") {
      throw new Error("Path cannot contain '..'");
    }
  }
  if (parts.length === 0) {
    throw new Error("Invalid path");
  }
  return parts.join("/");
}
