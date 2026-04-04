import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGitHubCustomOAuthConfigured } from "@/lib/github-oauth-env";
import { safeNextPath } from "@/lib/safe-redirect-path";

const STATE_COOKIE = "github_oauth_state";
const NEXT_COOKIE = "github_oauth_next";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");
  const errDesc = searchParams.get("error_description");

  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;
  const nextRaw = cookieStore.get(NEXT_COOKIE)?.value;

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(NEXT_COOKIE);

  const next = safeNextPath(nextRaw);

  if (err) {
    const q = new URLSearchParams({ github_oauth: "error", reason: errDesc ?? err });
    return NextResponse.redirect(`${origin}${next}?${q.toString()}`);
  }

  if (
    !isGitHubCustomOAuthConfigured() ||
    !code ||
    !state ||
    !storedState ||
    state !== storedState
  ) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const redirectUri = `${origin}/api/auth/github/callback`;

  const tokenBody = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody.toString(),
  });

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenJson.access_token) {
    const q = new URLSearchParams({
      github_oauth: "error",
      reason: tokenJson.error_description ?? tokenJson.error ?? "token_exchange_failed",
    });
    return NextResponse.redirect(`${origin}${next}?${q.toString()}`);
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const ghUser = (await userRes.json()) as { login?: string };

  const { error: dbErr } = await supabase.from("github_connections").upsert(
    {
      user_id: user.id,
      access_token: tokenJson.access_token,
      github_username: ghUser.login ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (dbErr) {
    const q = new URLSearchParams({ github_oauth: "error", reason: dbErr.message });
    return NextResponse.redirect(`${origin}${next}?${q.toString()}`);
  }

  return NextResponse.redirect(`${origin}${next}?github_oauth=success`);
}
