"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Pencil, Trash2, FolderInput } from "lucide-react";

interface ChatTitleDropdownProps {
  title: string;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMoveToProject: () => void;
}

export function ChatTitleDropdown({
  title,
  onRename,
  onDelete,
  onMoveToProject,
}: ChatTitleDropdownProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    if (editValue.trim() && editValue.trim() !== title) {
      onRename(editValue.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleRename();
          if (e.key === "Escape") setEditing(false);
        }}
        className="rounded-md border border-terracotta-500 bg-white px-2 py-1 text-sm font-medium outline-none dark:bg-dark-surface dark:text-cream-100"
      />
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink-800 hover:bg-cream-200 transition-colors dark:text-cream-200 dark:hover:bg-dark-surface2"
      >
        {title}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <button
            onClick={() => {
              setOpen(false);
              setEditValue(title);
              setEditing(true);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
          >
            <Pencil size={14} />
            Reenaym
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onMoveToProject();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
          >
            <FolderInput size={14} />
            add 2 projek
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 size={14} />
            Deleet
          </button>
        </div>
      )}
    </div>
  );
}
