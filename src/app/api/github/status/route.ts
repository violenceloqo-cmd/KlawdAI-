import { createClient } from "@/lib/supabase/server";
import { isGitHubCustomOAuthConfigured } from "@/lib/github-oauth-env";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("github_connections")
    .select("github_username, updated_at")
    .eq("user_id", user.id)
    .single();

  return Response.json({
    connected: !!data,
    username: data?.github_username ?? null,
    /** When true, “Connect GitHub” uses app OAuth (no Supabase manual linking). */
    useCustomOAuthConnect: isGitHubCustomOAuthConfigured(),
  });
}
