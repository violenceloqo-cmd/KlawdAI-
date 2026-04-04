"use client";

import { useState } from "react";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/ui/Toast";

interface MessageActionsProps {
  messageId: string;
  content: string;
  feedback: "up" | "down" | null;
  onRetry?: () => void;
  onFeedback?: (feedback: "up" | "down") => void;
}

export function MessageActions({
  messageId,
  content,
  feedback,
  onRetry,
  onFeedback,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(feedback);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("copeed 2 clipbord", "success");
  };

  const handleFeedback = async (value: "up" | "down") => {
    const newValue = currentFeedback === value ? null : value;
    setCurrentFeedback(newValue);
    onFeedback?.(value);

    try {
      await fetch(`/api/conversations/message-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, feedback: newValue }),
      });
    } catch {
      // Silently fail for feedback
    }
  };

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip content="Kopy" side="top">
        <button
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </Tooltip>

      {onRetry && (
        <Tooltip content="Retri" side="top">
          <button
            onClick={onRetry}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </Tooltip>
      )}

      <Tooltip content="guud responce" side="top">
        <button
          onClick={() => handleFeedback("up")}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            currentFeedback === "up"
              ? "text-terracotta-500 bg-terracotta-500/10"
              : "text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          }`}
        >
          <ThumbsUp size={14} />
        </button>
      </Tooltip>

      <Tooltip content="bad responce" side="top">
        <button
          onClick={() => handleFeedback("down")}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            currentFeedback === "down"
              ? "text-red-500 bg-red-500/10"
              : "text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          }`}
        >
          <ThumbsDown size={14} />
        </button>
      </Tooltip>
    </div>
  );
}
