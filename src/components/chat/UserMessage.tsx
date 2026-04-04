"use client";

import { Avatar } from "@/components/ui/Avatar";

interface UserMessageProps {
  content: string;
  userName: string;
}

export function UserMessage({ content, userName }: UserMessageProps) {
  return (
    <div className="group flex gap-4 px-4 py-4">
      <Avatar name={userName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-sm font-medium text-ink-700 dark:text-cream-300">
          U
        </div>
        <div className="text-sm text-ink-800 whitespace-pre-wrap dark:text-cream-200">
          {content}
        </div>
      </div>
    </div>
  );
}
