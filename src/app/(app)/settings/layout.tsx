"use client";

import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, User, Plug2 } from "lucide-react";

const tabs = [
  { path: "/settings/general", label: "Jenerul", icon: SlidersHorizontal },
  { path: "/settings/account", label: "Akount", icon: User },
  { path: "/settings/connectors", label: "Konektors", icon: Plug2 },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white text-neutral-900 dark:bg-dark-bg dark:text-neutral-100 md:flex-row">
      <nav className="flex shrink-0 flex-col border-b border-neutral-200 px-5 py-6 dark:border-dark-border dark:bg-dark-surface md:w-56 md:border-b-0 md:border-r">
        <h1 className="font-display mb-6 text-2xl font-normal tracking-tight text-neutral-900 dark:text-white">
          Setingz
        </h1>

        <div className="space-y-0.5">
          {tabs.map((tab) => {
            const active = pathname === tab.path;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => router.push(tab.path)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-dark-surface2 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-cream-400 dark:hover:bg-dark-surface2"
                }`}
              >
                <tab.icon size={16} className="shrink-0 opacity-80" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
