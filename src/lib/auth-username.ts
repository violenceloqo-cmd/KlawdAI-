import type { User } from "@supabase/supabase-js";

/** Synthetic domain for Supabase email auth (username-only UX). */
export const USERNAME_AUTH_DOMAIN = "users.klawd.internal";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function usernameToEmail(username: string): string {
  const u = normalizeUsername(username);
  return `${u}@${USERNAME_AUTH_DOMAIN}`;
}

export function emailToUsername(email: string | undefined | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at === -1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain !== USERNAME_AUTH_DOMAIN) return null;
  return local || null;
}

export function getUsernameFromAuthUser(user: User): string {
  const meta = user.user_metadata as Record<string, string | undefined>;
  return (
    (typeof meta?.username === "string" && meta.username) ||
    emailToUsername(user.email) ||
    (user.email?.includes("@") ? user.email.split("@")[0] : user.email) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    ""
  );
}

/** 3–32 chars, letters, digits, underscore only (after normalize). */
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return "usrnaym must b at leest 3 karakters";
  if (u.length > 32) return "usrnaym must b at moast 32 karakters";
  if (!/^[a-z0-9_]+$/.test(u)) {
    return "uze onlee leters, numbrs, and underskores";
  }
  return null;
}
