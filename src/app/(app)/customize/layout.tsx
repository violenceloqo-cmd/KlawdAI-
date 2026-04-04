"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [{ path: "/customize/skills", label: "Skilz", icon: ScrollText }];

export default function CustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-white text-neutral-900 dark:bg-dark-bg dark:text-neutral-100 md:flex-row">
      <nav className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-dark-border dark:bg-dark-bg md:w-52 md:border-b-0 md:border-r md:px-3 md:py-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-200/80 dark:text-cream-400 dark:hover:bg-sidebar-row-hover dark:hover:text-cream-200"
        >
          <ArrowLeft size={18} strokeWidth={1.5} className="shrink-0" />
          <span className="font-medium text-neutral-900 dark:text-cream-100">
            Kustomize
          </span>
        </button>

        <div className="space-y-0.5">
          {items.map((item) => {
            const active =
              pathname === item.path ||
              pathname.startsWith(`${item.path}/`);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-dark-surface2 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-200/80 dark:text-cream-400 dark:hover:bg-sidebar-row-hover dark:hover:text-cream-200"
                )}
              >
                <item.icon size={18} strokeWidth={1.5} className="shrink-0 opacity-90" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-dark-surface">
        {children}
      </main>
    </div>
  );
}
