"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { SkillsPlusMenu } from "@/components/customize/SkillsPlusMenu";
import { Tooltip } from "@/components/ui/Tooltip";
import { useUserSkillsStore } from "@/lib/user-skills-store";
import { cn } from "@/lib/utils";

export default function SkillsLibraryPage() {
  const skills = useUserSkillsStore((s) => s.skills);
  const removeSkill = useUserSkillsStore((s) => s.removeSkill);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = skills.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <section className="relative z-10 flex min-h-[12rem] w-full shrink-0 flex-col border-b border-neutral-200 bg-white dark:border-dark-border dark:bg-dark-bg md:min-h-0 md:w-72 md:border-b-0 md:border-r">
        <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5 dark:border-dark-border">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-cream-100">
            Skilz
          </h2>
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip content="surch skilz" side="bottom">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-200/80 dark:text-cream-400 dark:hover:bg-sidebar-row-hover"
                aria-label="Search skills"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <SkillsPlusMenu />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {skills.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-neutral-500 dark:text-cream-500">
              no skilz yet. uplode a .md or archive wif SKILL.md.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {skills.map((sk) => (
                <li key={sk.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(sk.id)}
                    className={cn(
                      "flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selectedId === sk.id
                        ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-dark-surface2 dark:text-cream-100"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-cream-300 dark:hover:bg-sidebar-row-hover"
                    )}
                  >
                    <span className="truncate">{sk.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-neutral-100 dark:bg-dark-surface">
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-dark-border">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-cream-100">
                  {selected.name}
                </h3>
                {selected.description ? (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-cream-400">
                    {selected.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-neutral-500 dark:text-cream-500">
                  {selected.fileName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeSkill(selected.id);
                  setSelectedId(null);
                }}
                className="shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                aria-label="Remove skill"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-800 dark:text-cream-300">
                {selected.content}
              </pre>
            </div>
            <p className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-500 dark:border-dark-border dark:text-cream-500">
              dis skil iz incluuded in Klawd chat az sistem contekst 4 ur
              akount on dis devis.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-0">
            <p className="text-center text-sm text-neutral-500 dark:text-cream-500">
              selekt a skil 2 vew detailz
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
