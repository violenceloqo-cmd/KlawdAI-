"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  usernameToEmail,
  validateUsername,
} from "@/lib/auth-username";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo, AUTH_PAGE_LOGO_CLASS } from "@/components/brand/AppLogo";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const usernameErr = validateUsername(username);
    if (usernameErr) {
      setError(usernameErr);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 dark:bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <AppLogo size={96} className={AUTH_PAGE_LOGO_CLASS} priority />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-cream-100">
            welcom bak
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-cream-400">
            sine in 2 ur Klawd akount
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton label="continyoo wif Google" />

          <div className="relative flex items-center py-1">
            <div className="grow border-t border-cream-300 dark:border-dark-border" />
            <span className="mx-3 shrink-0 text-xs text-ink-400 dark:text-cream-500">
              or
            </span>
            <div className="grow border-t border-cream-300 dark:border-dark-border" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Usrnaym"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            required
            autoFocus
            autoComplete="username"
          />
          <Input
            label="Passwerd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "sining in..." : "log inn"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-cream-400">
          dont hav an akount?{" "}
          <Link
            href="/signup"
            className="font-medium text-terracotta-500 hover:text-terracotta-600"
          >
            sine up
          </Link>
        </p>
      </div>
    </div>
  );
}
