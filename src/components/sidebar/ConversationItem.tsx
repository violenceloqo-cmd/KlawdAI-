"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/ui/Toast";

interface ConversationItemProps {
  id: string;
  title: string;
  active: boolean;
  starred: boolean;
  onClick: () => void;
}

export function ConversationItem({
  id,
  title,
  active,
  onClick,
}: ConversationItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const updateConversation = useAppStore((s) => s.updateConversation);
  const removeConversation = useAppStore((s) => s.removeConversation);

  const handleRename = async () => {
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      updateConversation(id, { title: editTitle.trim() });
      setEditing(false);
    } catch {
      toast("fayld 2 reenaym", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      removeConversation(id);
      toast("conversashun deleetd", "success");
    } catch {
      toast("fayld 2 deleet", "error");
    }
  };

  if (editing) {
    return (
      <div className="px-2 py-1">
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded-md border border-terracotta-500 bg-white px-2 py-1 text-sm outline-none dark:bg-dark-surface dark:text-cream-100"
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative flex cursor-pointer items-center rounded-lg transition-colors ${
        active
          ? "bg-neutral-200/90 dark:bg-sidebar-row-active"
          : "hover:bg-neutral-100 dark:hover:bg-sidebar-row-hover"
      }`}
    >
      <button
        onClick={onClick}
        className="flex-1 truncate px-3 py-2 text-left text-sm text-neutral-800 dark:text-cream-300"
      >
        {title}
      </button>

      <div
        className={`absolute right-1 ${
          showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
      >
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((o) => !o);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-300/80 dark:hover:bg-dark-surface3"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setEditing(true);
                    setEditTitle(title);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
                >
                  <Pencil size={14} />
                  Reenaym
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={14} />
                  Deleet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
