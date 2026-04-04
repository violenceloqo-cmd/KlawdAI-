"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  usernameToEmail,
  validateUsername,
  normalizeUsername,
} from "@/lib/auth-username";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo, AUTH_PAGE_LOGO_CLASS } from "@/components/brand/AppLogo";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordStrength = () => {
    if (password.length === 0) return { label: "", color: "" };
    if (password.length < 6) return { label: "2 short", color: "bg-red-400" };
    if (password.length < 8) return { label: "weekk", color: "bg-orange-400" };
    if (password.length < 12) return { label: "guud", color: "bg-yellow-400" };
    return { label: "stronk", color: "bg-green-500" };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const usernameErr = validateUsername(username);
    if (usernameErr) {
      setError(usernameErr);
      return;
    }

    if (password.length < 6) {
      setError("passwerd must b at leest 6 karakters");
      return;
    }

    setLoading(true);

    const normalized = normalizeUsername(username);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        data: {
          username: normalized,
          display_name: normalized,
        },
      },
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
            creat ur akount
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-cream-400">
            start uzing Klawd 4 free
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton label="sine up wif Google" />

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
            placeholder="your_username"
            required
            autoFocus
            autoComplete="username"
          />
          <p className="-mt-2 text-xs text-ink-400 dark:text-cream-500">
            leters, numbrs, and underskores. 3–32 karakters.
          </p>
          <div>
            <Input
              label="Passwerd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-cream-300 dark:bg-dark-surface3">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{
                      width:
                        password.length < 6
                          ? "25%"
                          : password.length < 8
                          ? "50%"
                          : password.length < 12
                          ? "75%"
                          : "100%",
                    }}
                  />
                </div>
                <span className="text-xs text-ink-500">{strength.label}</span>
              </div>
            )}
          </div>

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
            {loading ? "creatin akount..." : "creat akount"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-cream-400">
          alredy hav akount?{" "}
          <Link
            href="/login"
            className="font-medium text-terracotta-500 hover:text-terracotta-600"
          >
            log inn
          </Link>
        </p>
      </div>
    </div>
  );
}
