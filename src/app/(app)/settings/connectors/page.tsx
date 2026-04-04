"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLinkIdentityError } from "@/lib/github-link-identity-errors";
import { useGithubOAuthReturnToast } from "@/hooks/use-github-oauth-return";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-neutral-900 dark:text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

type OAuthProvider = "google" | "github";

function ConnectorRow({
  name,
  description,
  icon,
  provider,
  connected,
  onConnect,
  busy,
}: {
  name: string;
  description: string;
  icon: ReactNode;
  provider: OAuthProvider;
  connected: boolean;
  onConnect: (provider: OAuthProvider) => void;
  busy: OAuthProvider | null;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 py-5 last:border-b-0 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {name}
          </p>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">
        {connected ? (
          <span className="inline-flex rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-dark-surface2 dark:text-cream-300">
            Konektid
          </span>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => onConnect(provider)}
            className="border border-neutral-300 bg-white dark:border-dark-border dark:bg-dark-surface2"
          >
            {busy === provider ? "konekting…" : "Konekt"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ConnectorsSettingsPage() {
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [ghTokenConnected, setGhTokenConnected] = useState(false);
  const [useCustomOAuth, setUseCustomOAuth] = useState(false);

  const refreshIdentities = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const providers = new Set(
      (user?.identities ?? []).map((i) => i.provider)
    );
    setLinked(providers);
    setLoading(false);
  }, []);

  const refreshGithubStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/github/status");
      if (!res.ok) return;
      const d = (await res.json()) as {
        connected?: boolean;
        useCustomOAuthConnect?: boolean;
      };
      setGhTokenConnected(!!d.connected);
      setUseCustomOAuth(d.useCustomOAuthConnect === true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshIdentities();
  }, [refreshIdentities]);

  useEffect(() => {
    void refreshGithubStatus();
  }, [refreshGithubStatus]);

  useGithubOAuthReturnToast(() => {
    void refreshIdentities();
    void refreshGithubStatus();
  });

  const handleConnect = async (provider: OAuthProvider) => {
    if (provider === "github" && useCustomOAuth) {
      window.location.href = `/api/auth/github/connect?next=${encodeURIComponent("/settings/connectors")}`;
      return;
    }

    setBusy(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/settings/connectors`;

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo,
        scopes: provider === "github" ? "repo" : undefined,
      },
    });

    if (error) {
      toast(formatLinkIdentityError(error.message), "error");
      setBusy(null);
      return;
    }
    // Browser follows OAuth URL from linkIdentity when successful
    setBusy(null);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
        Konektors
      </h1>
      <p className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
        link Google or GitHub 2 sine in 2 Klawd wif thoz akountz.
      </p>

      <section className="rounded-xl border border-neutral-200 px-4 dark:border-neutral-700 sm:px-5">
        {loading ? (
          <p className="py-8 text-sm text-neutral-500 dark:text-neutral-400">
            loadin…
          </p>
        ) : (
          <>
            <ConnectorRow
              name="Google"
              description="uze ur Google akount 2 sine in."
              icon={<GoogleIcon />}
              provider="google"
              connected={linked.has("google")}
              onConnect={handleConnect}
              busy={busy}
            />
            <ConnectorRow
              name="GitHub"
              description="uze ur GitHub akount 2 sine in."
              icon={<GitHubIcon />}
              provider="github"
              connected={linked.has("github") || ghTokenConnected}
              onConnect={handleConnect}
              busy={busy}
            />
          </>
        )}
      </section>

    </div>
  );
}
