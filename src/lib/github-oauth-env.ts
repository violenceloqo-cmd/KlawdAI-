/** Server-only: true when app can run GitHub OAuth without Supabase linkIdentity. */
export function isGitHubCustomOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim()
  );
}
