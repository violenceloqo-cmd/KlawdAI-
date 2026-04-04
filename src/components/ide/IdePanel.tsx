"use client";

import { useAppStore } from "@/lib/store";
import { InlineIde } from "./InlineIde";

export function IdePanel() {
  const ideOpen = useAppStore((s) => s.ideOpen);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  if (!ideOpen || !activeProjectId) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-cream-200 dark:border-dark-border">
      <InlineIde projectId={activeProjectId} />
    </div>
  );
}
