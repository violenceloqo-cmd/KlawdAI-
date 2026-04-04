const STORAGE_KEY = "klawd_client_session_key";

/** Stable per-browser key for session logging (not a secret). */
export function getOrCreateClientSessionKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}
