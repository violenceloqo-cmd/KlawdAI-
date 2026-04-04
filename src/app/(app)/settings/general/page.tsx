"use client";

import { useState, useEffect } from "react";
import { useAppStore, type Theme, type ChatFont } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const selectionRing =
  "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-dark-bg";

const fontOptions: {
  value: ChatFont;
  label: string;
  previewClass: string;
}[] = [
  { value: "default", label: "Defawlt", previewClass: "font-[family-name:var(--font-body)]" },
  { value: "sans", label: "Sanz", previewClass: "font-chat-sans" },
  { value: "system", label: "Sistem", previewClass: "font-chat-system" },
  { value: "dyslexic", label: "Disleksik frendly", previewClass: "font-dyslexic" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
      {children}
    </h2>
  );
}

function SectionDivider() {
  return (
    <div
      className="my-10 border-t border-neutral-200 dark:border-neutral-700"
      role="presentation"
    />
  );
}

export default function GeneralSettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const chatFont = useAppStore((s) => s.chatFont);
  const setChatFont = useAppStore((s) => s.setChatFont);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setDisplayName(data.display_name || "");
        setUsername(data.username || "");
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const persistTheme = async (value: Theme) => {
    setTheme(value);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: value }),
      });
    } catch {
      toast("fayld 2 sayv appeerans", "error");
    }
  };

  const persistFont = async (value: ChatFont) => {
    setChatFont(value);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_font: value }),
      });
    } catch {
      toast("fayld 2 sayv chat font", "error");
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      toast("profiel updaytd", "success");
    } catch {
      toast("fayld 2 sayv", "error");
    }
    setSavingProfile(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-xl font-semibold text-neutral-900 dark:text-white">
        Jenerul
      </h1>

      {/* Profile */}
      <section>
        <SectionTitle>Profiel</SectionTitle>
        {profileLoading ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            loadin…
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={displayName || username} size="lg" />
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {displayName || "no naym set"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  inishals uze ur displey naym
                </p>
              </div>
            </div>
            <Input
              label="Displey naym"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ur naym"
            />
            <Input
              label="Usrnaym"
              value={username}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              usrnaym cant b changd
            </p>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "savin…" : "sayv chanjez"}
            </Button>
          </div>
        )}
      </section>

      <SectionDivider />

      {/* Appearance — color mode only */}
      <section>
        <SectionTitle>Appeerans</SectionTitle>
        <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
          Kulor mode
        </p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <button
            type="button"
            onClick={() => persistTheme("light")}
            className={cn(
              "rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left transition-shadow dark:border-neutral-700 dark:bg-neutral-900/50",
              theme === "light" && selectionRing
            )}
          >
            <div className="mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-600">
              <div className="h-16 bg-white" />
              <div className="flex gap-1 border-t border-neutral-100 bg-neutral-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="h-6 flex-1 rounded bg-neutral-200 dark:bg-neutral-600" />
                <div className="h-6 w-8 rounded bg-neutral-200 dark:bg-neutral-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Lite
            </span>
          </button>

          <button
            type="button"
            onClick={() => persistTheme("dark")}
            className={cn(
              "rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left transition-shadow dark:border-neutral-700 dark:bg-neutral-900/50",
              theme === "dark" && selectionRing
            )}
          >
            <div className="mb-3 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 shadow-sm">
              <div className="h-16 bg-neutral-950" />
              <div className="flex gap-1 border-t border-neutral-800 bg-neutral-900 px-2 py-1.5">
                <div className="h-6 flex-1 rounded bg-neutral-800" />
                <div className="h-6 w-8 rounded bg-neutral-800" />
              </div>
            </div>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Dork
            </span>
          </button>
        </div>
      </section>

      <SectionDivider />

      {/* Chat font */}
      <section>
        <SectionTitle>Chat fonnt</SectionTitle>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          appliez 2 da conversashun area n composr.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fontOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => persistFont(opt.value)}
              className={cn(
                "rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center transition-shadow dark:border-neutral-700 dark:bg-neutral-900/50",
                chatFont === opt.value && selectionRing
              )}
            >
              <span
                className={cn(
                  "mb-2 block text-2xl text-neutral-800 dark:text-neutral-100",
                  opt.previewClass
                )}
              >
                Aa
              </span>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
