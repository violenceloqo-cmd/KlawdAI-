"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Lock, Globe } from "lucide-react";

function GitHubIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
import { createClient } from "@/lib/supabase/client";
import { formatLinkIdentityError } from "@/lib/github-link-identity-errors";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

interface GitHubPushModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

function slugify(name: string) {
  return name
    .trim()
    .replace(/[^\w\-. ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 100);
}

export function GitHubPushModal({
  open,
  onClose,
  projectId,
  projectName,
}: GitHubPushModalProps) {
  const [status, setStatus] = useState<
    "loading" | "not_connected" | "ready" | "pushing" | "done"
  >("loading");
  const [ghUsername, setGhUsername] = useState("");
  const [repoName, setRepoName] = useState(slugify(projectName));
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [useCustomOAuthConnect, setUseCustomOAuthConnect] = useState(false);

  const checkConnection = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      setUseCustomOAuthConnect(data.useCustomOAuthConnect === true);
      if (data.connected) {
        setGhUsername(data.username ?? "");
        setStatus("ready");
      } else {
        setStatus("not_connected");
      }
    } catch {
      setUseCustomOAuthConnect(false);
      setStatus("not_connected");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setRepoName(slugify(projectName));
      setDescription("");
      setIsPrivate(false);
      setResultUrl("");
      setError("");
      void checkConnection();
    }
  }, [open, projectName, checkConnection]);

  const handleConnect = () => {
    if (useCustomOAuthConnect) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/api/auth/github/connect?next=${encodeURIComponent(next)}`;
      return;
    }
    void (async () => {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      const { error: err } = await supabase.auth.linkIdentity({
        provider: "github",
        options: { redirectTo, scopes: "repo" },
      });
      if (err) {
        toast(formatLinkIdentityError(err.message), "error");
      }
    })();
  };

  const handlePush = async () => {
    if (!repoName.trim()) {
      setError("Repo name iz requird");
      return;
    }
    setStatus("pushing");
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/github/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repoName.trim(),
          isPrivate,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "push fayld");
        setStatus("ready");
        return;
      }
      setResultUrl(data.url);
      setStatus("done");
      toast("pushd 2 GitHub!", "success");
    } catch {
      setError("sumthin went wrong");
      setStatus("ready");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="push 2 GitHub" maxWidth="max-w-md">
      {status === "loading" && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-ink-400" />
        </div>
      )}

      {status === "not_connected" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-cream-200 bg-cream-100/60 p-4 dark:border-dark-border dark:bg-dark-surface2/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-neutral-900 p-2 dark:bg-white">
                <GitHubIcon size={18} className="text-white dark:text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-cream-100">
                  konekt ur GitHub
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-cream-500">
                  link ur GitHub akount so Klawd can creat repositoriez an push
                  ur kod directly.
                </p>
                {!useCustomOAuthConnect && (
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-400 dark:text-cream-600">
                    If connect failz wif “Manual linking”: Supabase Dashboard →
                    Authentication → Sign In / Providers → turn on Allow manual
                    linking. Or add GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET to
                    .env.local.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              kancel
            </Button>
            <Button size="sm" onClick={handleConnect}>
              <GitHubIcon size={14} className="mr-1.5" />
              konekt GitHub
            </Button>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-4">
          {ghUsername && (
            <p className="text-xs text-ink-500 dark:text-cream-500">
              pusheen az{" "}
              <span className="font-medium text-ink-800 dark:text-cream-200">
                @{ghUsername}
              </span>
            </p>
          )}
          <Input
            label="repo naym"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="my-awesome-project"
            autoFocus
          />
          <Input
            label="descripshun (opshunul)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A project built with Klawd"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-cream-300">
              vizibility
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  !isPrivate
                    ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700 dark:border-terracotta-400 dark:bg-terracotta-500/10 dark:text-terracotta-300"
                    : "border-cream-300 text-ink-600 hover:bg-cream-100 dark:border-dark-border dark:text-cream-400 dark:hover:bg-dark-surface2"
                }`}
              >
                <Globe size={14} />
                publik
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  isPrivate
                    ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700 dark:border-terracotta-400 dark:bg-terracotta-500/10 dark:text-terracotta-300"
                    : "border-cream-300 text-ink-600 hover:bg-cream-100 dark:border-dark-border dark:text-cream-400 dark:hover:bg-dark-surface2"
                }`}
              >
                <Lock size={14} />
                privat
              </button>
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onClose}>
              kancel
            </Button>
            <Button size="sm" onClick={handlePush}>
              <GitHubIcon size={14} className="mr-1.5" />
              push 2 GitHub
            </Button>
          </div>
        </div>
      )}

      {status === "pushing" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={24} className="animate-spin text-terracotta-500" />
          <p className="text-sm text-ink-600 dark:text-cream-400">
            creatin repo an pushin filez…
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              repo creatd!
            </p>
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-green-700 underline hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
            >
              {resultUrl.replace("https://github.com/", "")}
              <ExternalLink size={13} />
            </a>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              dun
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
