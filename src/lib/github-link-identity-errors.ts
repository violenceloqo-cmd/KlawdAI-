/** User-friendly copy when Supabase rejects linkIdentity(). */
export function formatLinkIdentityError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("manual linking")) {
    return "Manual linking is disabled in Supabase. Open Dashboard → Authentication → Sign In / Providers → enable “Allow manual linking”. Or set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local (same GitHub OAuth app; add redirect URL for this app).";
  }
  return message;
}
