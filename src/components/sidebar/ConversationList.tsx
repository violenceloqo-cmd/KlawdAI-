"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { truncate } from "@/lib/utils";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  collapsed: boolean;
  onSelectConversation: (id: string) => void;
}

export function ConversationList({
  collapsed,
  onSelectConversation,
}: ConversationListProps) {
  const conversations = useAppStore((s) => s.conversations);
  const activeConversationId = useAppStore((s) => s.activeConversationId);

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [conversations]
  );

  if (collapsed) return null;

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-neutral-500 dark:text-sidebar-muted">
        no convos yet lol
      </div>
    );
  }

  return (
    <div className="px-2 py-3">
      <h3 className="mb-2 px-3 text-xs font-medium text-neutral-500 dark:text-sidebar-muted">
        Reesentz
      </h3>
      <div className="flex flex-col gap-0.5">
        {sorted.map((conv) => (
          <ConversationItem
            key={conv.id}
            id={conv.id}
            title={truncate(conv.title, 36)}
            active={conv.id === activeConversationId}
            starred={conv.starred}
            onClick={() => onSelectConversation(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
