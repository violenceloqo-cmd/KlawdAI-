"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, Square, Paperclip, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ModelSelector } from "./ModelSelector";
import { ModeSelector } from "./ModeSelector";
import { ProjectPicker } from "./ProjectPicker";
import { SearchAndTools } from "./SearchAndTools";
import { Tooltip } from "@/components/ui/Tooltip";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onFileAttach?: () => void;
  placeholder?: string;
  /** Claude-style centered pill on home; bottom composer in threads */
  variant?: "welcome" | "chat";
  /** Increment to focus the textarea and move caret to end (e.g. after prefill). */
  focusRequestId?: number;
  /** Hide mode selector (e.g. in basic chat) */
  hideModeSelector?: boolean;
  /** Hide project picker (e.g. in workspace or basic chat) */
  hideProjectPicker?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  onFileAttach,
  placeholder = "repli 2 Klawd...",
  variant = "chat",
  focusRequestId = 0,
  hideModeSelector = false,
  hideProjectPicker = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusRequestId) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [focusRequestId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const isWelcome = variant === "welcome";
  const AttachIcon = isWelcome ? Plus : Paperclip;
  const attachLabel = isWelcome ? "add atachments" : "atach fiel";

  const shell =
    "rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm dark:border-[#3d3d3d] dark:bg-[#2b2b2b] dark:shadow-none";
  const toolbarBtn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-cream-200 dark:text-neutral-400 dark:hover:bg-white/10";

  return (
    <div
      className={
        isWelcome
          ? "w-full"
          : "border-t border-neutral-200/80 bg-neutral-50/80 px-4 py-3 dark:border-dark-border dark:bg-dark-bg"
      }
    >
      <div className={isWelcome ? "w-full" : "mx-auto max-w-3xl"}>
        <div className={shell}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={isWelcome ? 3 : 1}
            className={`w-full resize-none bg-transparent px-5 text-ink-900 placeholder-ink-400 outline-none dark:text-neutral-100 dark:placeholder-neutral-500 ${
              isWelcome
                ? "pt-5 pb-2 text-base leading-relaxed"
                : "pt-3.5 pb-1 text-sm"
            }`}
            style={{
              minHeight: isWelcome ? "120px" : "44px",
              maxHeight: "200px",
            }}
          />

          <div
            className={`flex items-center justify-between px-3 ${isWelcome ? "pb-3 pt-1" : "pb-2"}`}
          >
            <div className="flex min-w-0 items-center gap-0.5">
              <Tooltip content={attachLabel} side="top">
                <button
                  type="button"
                  onClick={() => {
                    if (onFileAttach) {
                      onFileAttach();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={toolbarBtn}
                >
                  <AttachIcon size={isWelcome ? 18 : 16} strokeWidth={2} />
                </button>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,.csv,.docx,.md,.json,.py,.js,.ts,.tsx,.jsx,.html,.css"
              />
              {!hideModeSelector && <ModeSelector />}
              {!isWelcome && <SearchAndTools />}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {!hideProjectPicker && <ProjectPicker />}
              <ModelSelector />

              {isStreaming ? (
                <Tooltip content="stopp jenerating" side="top">
                  <button
                    type="button"
                    onClick={onStop}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition-colors dark:bg-neutral-600 dark:hover:bg-neutral-500"
                  >
                    <Square size={14} fill="currentColor" />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip content="sennd mesaje" side="top">
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!value.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg rounded-br-md bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-neutral-600 dark:hover:bg-neutral-500"
                  >
                    <ArrowUp size={16} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
