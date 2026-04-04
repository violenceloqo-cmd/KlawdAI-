"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Brain, Globe } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Toggle } from "@/components/ui/Toggle";
import { Tooltip } from "@/components/ui/Tooltip";

export function SearchAndTools() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const extendedThinking = useAppStore((s) => s.extendedThinking);
  const setExtendedThinking = useAppStore((s) => s.setExtendedThinking);
  const webSearch = useAppStore((s) => s.webSearch);
  const setWebSearch = useAppStore((s) => s.setWebSearch);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const anyActive = extendedThinking || webSearch;

  return (
    <div ref={ref} className="relative">
      <Tooltip content="surch n toolz" side="top">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            anyActive
              ? "text-terracotta-500 bg-terracotta-500/10"
              : "text-ink-400 hover:bg-cream-200 dark:text-cream-500 dark:hover:bg-dark-surface2"
          }`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-cream-200 bg-white p-4 shadow-lg dark:border-dark-border dark:bg-dark-surface z-50">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-cream-500">
            surch n toolz
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-ink-500 dark:text-cream-400" />
                <span className="text-sm text-ink-700 dark:text-cream-300">
                  Extendid thonking
                </span>
              </div>
              <Toggle
                checked={extendedThinking}
                onChange={setExtendedThinking}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-ink-500 dark:text-cream-400" />
                <span className="text-sm text-ink-700 dark:text-cream-300">
                  Web surch
                </span>
              </div>
              <Toggle checked={webSearch} onChange={setWebSearch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
