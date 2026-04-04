import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/")
    ? searchParams.get("next")!
    : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component boundary
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Persist GitHub provider_token so we can push repos later
      const session = data.session;
      if (session?.provider_token) {
        const hasGitHub = session.user?.identities?.some(
          (i) => i.provider === "github"
        );
        if (hasGitHub) {
          const ghUsername =
            session.user?.user_metadata?.user_name ??
            session.user?.user_metadata?.preferred_username ??
            "";
          await supabase.from("github_connections").upsert(
            {
              user_id: session.user.id,
              access_token: session.provider_token,
              github_username: ghUsername,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
