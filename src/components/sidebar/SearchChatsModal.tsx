"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  MessageSquare,
  FolderKanban,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row =
  | { kind: "chat"; id: string; title: string; updated_at: string }
  | { kind: "project"; id: string; title: string; updated_at: string };

interface SearchChatsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

function formatRelativeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  if (diffMs < 3600000) return "Past owr";
  const dayStart = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ds = dayStart(d);
  const ns = dayStart(now);
  if (ds === ns) return "Todey";
  const dayMs = 86400000;
  const days = Math.round((ns - ds) / dayMs);
  if (days === 1) return "Yesterdey";
  if (days < 7) return "Past weeck";
  if (days < 30) return "Past munth";
  if (days < 365) return "Past yeer";
  return "Oldur";
}

export function SearchChatsModal({
  open,
  onClose,
  onSelectConversation,
}: SearchChatsModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/projects"),
      ]);
      const cData = cRes.ok ? await cRes.json() : { conversations: [] };
      const pData = pRes.ok ? await pRes.json() : { projects: [] };
      const chats: Row[] = (cData.conversations || []).map(
        (c: { id: string; title: string; updated_at: string }) => ({
          kind: "chat" as const,
          id: c.id,
          title: c.title || "untiteld",
          updated_at: c.updated_at,
        })
      );
      const projects: Row[] = (pData.projects || []).map(
        (p: { id: string; name: string; updated_at: string }) => ({
          kind: "project" as const,
          id: p.id,
          title: p.name || "untiteld projek",
          updated_at: p.updated_at,
        })
      );
      const merged = [...chats, ...projects].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setRows(merged);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, query]);

  useEffect(() => {
    setActiveIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1)
    );
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && !e.shiftKey) {
        const row = filtered[activeIndex];
        if (!row) return;
        e.preventDefault();
        if (row.kind === "chat") {
          onSelectConversation(row.id);
        } else {
          router.push(`/projects/${row.id}`);
        }
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIndex, onClose, onSelectConversation, router]);

  const activateRow = (row: Row) => {
    if (row.kind === "chat") {
      onSelectConversation(row.id);
    } else {
      router.push(`/projects/${row.id}`);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="surch chatz n projektz"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[min(12vh,120px)] backdrop-blur-sm sm:pt-[15vh]"
    >
      <div
        className="flex max-h-[min(520px,70vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-700/80 bg-[#212121] shadow-2xl dark:border-[#333] sm:max-w-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search
            size={18}
            className="shrink-0 text-neutral-500"
            strokeWidth={1.75}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="surch chatz n projektz"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral-100 placeholder:text-neutral-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-200"
            aria-label="cloes surch"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="h-px bg-neutral-700/80 dark:bg-[#333]" />

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500">
              loadin…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500">
              {query.trim()
                ? "no rezults lol"
                : "no chatz or projektz yet"}
            </p>
          ) : (
            <ul className="space-y-0.5" role="listbox">
              {filtered.map((row, index) => {
                const selected = index === activeIndex;
                return (
                  <li key={`${row.kind}-${row.id}`} role="option">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => activateRow(row)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "bg-[#2f2f2f]"
                          : "hover:bg-white/[0.06]"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400">
                        {row.kind === "project" ? (
                          <FolderKanban size={18} strokeWidth={1.5} />
                        ) : (
                          <MessageSquare size={18} strokeWidth={1.5} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] text-neutral-100">
                        {row.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {formatRelativeLabel(row.updated_at)}
                        </span>
                        {selected && (
                          <CornerDownLeft
                            size={16}
                            className="text-neutral-500"
                            strokeWidth={1.75}
                          />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
