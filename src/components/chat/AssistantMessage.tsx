"use client";

import { Hammer } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ThinkingBlock } from "./ThinkingBlock";
import { MessageActions } from "./MessageActions";
import { useAppStore } from "@/lib/store";

interface AssistantMessageProps {
  id: string;
  content: string;
  thinkingContent?: string | null;
  thinkingDuration?: number;
  isThinking?: boolean;
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
  onRetry?: () => void;
  chatMode?: string;
}

export function AssistantMessage({
  id,
  content,
  thinkingContent,
  thinkingDuration,
  isThinking,
  isStreaming,
  feedback = null,
  onRetry,
  chatMode,
}: AssistantMessageProps) {
  const setChatMode = useAppStore((s) => s.setChatMode);
  const setPendingChatPrefill = useAppStore((s) => s.setPendingChatPrefill);

  const showStartBuilding =
    !isStreaming && content && chatMode === "plan";

  const handleStartBuilding = () => {
    setChatMode("code");
    setPendingChatPrefill(
      "Start building the project based on the plan above."
    );
  };

  return (
    <div className="group flex gap-4 px-4 py-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-terracotta-500/10">
        <AppLogo size={36} className="h-9 w-9 object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-sm font-medium text-ink-700 dark:text-cream-300">
          Klawd
        </div>

        {thinkingContent != null && (
          <ThinkingBlock
            content={thinkingContent}
            duration={thinkingDuration}
            isThinking={isThinking}
          />
        )}

        <div className={isStreaming && content ? "streaming-cursor" : ""}>
          {content ? (
            <MarkdownRenderer content={content} />
          ) : isStreaming && !isThinking ? (
            <div className="streaming-cursor text-sm text-ink-400" />
          ) : null}
        </div>

        {showStartBuilding && (
          <button
            onClick={handleStartBuilding}
            className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-500/20 dark:text-green-400"
          >
            <Hammer size={15} />
            Start Bilding in Code Mode
          </button>
        )}

        {!isStreaming && content && (
          <div className="mt-2">
            <MessageActions
              messageId={id}
              content={content}
              feedback={feedback}
              onRetry={onRetry}
            />
          </div>
        )}
      </div>
    </div>
  );
}
