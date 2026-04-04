"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";

interface ThinkingBlockProps {
  content: string;
  duration?: number;
  isThinking?: boolean;
}

export function ThinkingBlock({
  content,
  duration,
  isThinking = false,
}: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3 rounded-lg border border-cream-300 dark:border-dark-border overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-cream-100 dark:hover:bg-dark-surface2 transition-colors"
      >
        <Brain
          size={16}
          className={`text-terracotta-500 shrink-0 ${isThinking ? "thinking-pulse" : ""}`}
        />
        <span className="text-sm font-medium text-ink-700 dark:text-cream-300">
          {isThinking ? "Thonking" : "Thonking"}
        </span>
        {duration != null && (
          <span className="text-xs text-ink-400 dark:text-cream-500">
            {isThinking ? `${duration}s` : `for ${duration}s`}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronDown size={14} className="text-ink-400" />
          ) : (
            <ChevronRight size={14} className="text-ink-400" />
          )}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink-600 whitespace-pre-wrap dark:border-dark-border dark:bg-dark-surface dark:text-cream-400">
          {content || "thonking..."}
        </div>
      )}
    </div>
  );
}
