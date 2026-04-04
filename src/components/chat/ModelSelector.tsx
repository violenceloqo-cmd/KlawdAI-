"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { MODELS } from "@/lib/models";
import { useAppStore } from "@/lib/store";

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);

  const current = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-cream-200 transition-colors dark:text-cream-400 dark:hover:bg-dark-surface2"
      >
        {current.name}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface z-50">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-cream-100 dark:hover:bg-dark-surface2"
            >
              <div>
                <div className="text-sm font-medium text-ink-800 dark:text-cream-200">
                  {model.name}
                </div>
                <div className="text-xs text-ink-400 dark:text-cream-500">
                  {model.description}
                </div>
              </div>
              {model.id === selectedModel && (
                <Check size={16} className="text-terracotta-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
