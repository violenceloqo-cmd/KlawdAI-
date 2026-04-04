import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isGitHubCustomOAuthConfigured } from "@/lib/github-oauth-env";
import { safeNextPath } from "@/lib/safe-redirect-path";

const STATE_COOKIE = "github_oauth_state";
const NEXT_COOKIE = "github_oauth_next";

export async function GET(request: Request) {
  if (!isGitHubCustomOAuthConfigured()) {
    return Response.json(
      {
        error:
          "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local, or enable “Allow manual linking” in Supabase and use Connect from the app.",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next") ?? undefined);

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set(NEXT_COOKIE, next, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirectUri = `${origin}/api/auth/github/callback`;
  const scope = encodeURIComponent("repo");
  const ghUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(ghUrl);
}
