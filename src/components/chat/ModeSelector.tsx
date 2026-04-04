"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, Map, Hammer, Check, ChevronDown } from "lucide-react";
import { useAppStore, type ChatMode } from "@/lib/store";

const MODES: { id: ChatMode; name: string; desc: string; icon: typeof Map }[] = [
  { id: "ask", name: "Ask", desc: "ask kwestshunz", icon: MessageCircleQuestion },
  { id: "plan", name: "Plan", desc: "plan n arkitekt", icon: Map },
  { id: "code", name: "Code", desc: "bild n rite kod", icon: Hammer },
];

export function ModeSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chatMode = useAppStore((s) => s.chatMode);
  const setChatMode = useAppStore((s) => s.setChatMode);

  const current = MODES.find((m) => m.id === chatMode) ?? MODES[2];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const colorClass: Record<ChatMode, string> = {
    ask: "text-blue-500 bg-blue-500/10",
    plan: "text-amber-500 bg-amber-500/10",
    code: "text-green-500 bg-green-500/10",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${colorClass[chatMode]}`}
      >
        <current.icon size={14} />
        {current.name}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-52 rounded-xl border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface z-50">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setChatMode(mode.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-cream-100 dark:hover:bg-dark-surface2"
            >
              <div className="flex items-center gap-2">
                <mode.icon size={14} className={colorClass[mode.id].split(" ")[0]} />
                <div>
                  <div className="text-sm font-medium text-ink-800 dark:text-cream-200">
                    {mode.name}
                  </div>
                  <div className="text-xs text-ink-400 dark:text-cream-500">
                    {mode.desc}
                  </div>
                </div>
              </div>
              {mode.id === chatMode && (
                <Check size={14} className="text-terracotta-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
