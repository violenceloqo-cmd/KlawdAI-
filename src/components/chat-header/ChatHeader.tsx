"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ChatTitleDropdown } from "./ChatTitleDropdown";
import { ShareDialog } from "./ShareDialog";
import { Tooltip } from "@/components/ui/Tooltip";

interface ChatHeaderProps {
  conversationId: string;
  title: string;
  shared: boolean;
  shareId: string | null;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMoveToProject: () => void;
}

export function ChatHeader({
  conversationId,
  title,
  shared,
  shareId,
  onRename,
  onDelete,
  onMoveToProject,
}: ChatHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-dark-border dark:bg-dark-surface">
      <ChatTitleDropdown
        title={title}
        onRename={onRename}
        onDelete={onDelete}
        onMoveToProject={onMoveToProject}
      />

      <div className="flex items-center gap-1">
        <Tooltip content="shar" side="bottom">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-200 transition-colors dark:text-cream-400 dark:hover:bg-dark-surface2"
          >
            <Share2 size={16} />
          </button>
        </Tooltip>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        conversationId={conversationId}
        shared={shared}
        shareId={shareId}
      />
    </div>
  );
}
