"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Trash2, FolderInput, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MoveToProjectModal } from "@/components/projects/MoveToProjectModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

interface Conversation {
  id: string;
  title: string;
  model: string;
  starred: boolean;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function RecentsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-cream-100 dark:bg-dark-bg"><p className="text-sm text-ink-400">loadin...</p></div>}>
      <RecentsPage />
    </Suspense>
  );
}

function RecentsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moveConvId, setMoveConvId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterStarred = searchParams.get("filter") === "starred";

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStarred) params.set("starred", "true");
      if (search) params.set("search", search);

      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      toast("fayld 2 lode", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
  }, [filterStarred]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) loadConversations();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    try {
      await fetch("/api/conversations/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setConversations((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
      toast(`deleetd ${selected.size} conversashunz`, "success");
    } catch {
      toast("fayld 2 deleet", "error");
    }
    setShowDeleteConfirm(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "jus now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterdey";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 dark:bg-dark-bg">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-ink-500 hover:text-ink-700 dark:text-cream-400"
          >
            ← bak
          </button>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-cream-100">
            {filterStarred ? "Starrd" : "Chatz"}
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="surch conversashunz..."
            className="w-full rounded-lg border border-cream-300 bg-white py-2.5 pl-9 pr-4 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-terracotta-500 dark:border-dark-border dark:bg-dark-surface dark:text-cream-100"
          />
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-cream-200 px-4 py-2.5 dark:bg-dark-surface2">
            <span className="text-sm font-medium text-ink-700 dark:text-cream-300">
              {selected.size} selektid
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} className="mr-1" />
              deleet selektid
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              cleer
            </Button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">loadin...</div>
        ) : conversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={36} className="mx-auto mb-3 text-ink-300" />
            <p className="text-sm text-ink-400 dark:text-cream-500">
              {search ? "no conversashunz match ur surch" : "no conversashunz yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
              >
                <button
                  onClick={() => toggleSelect(conv.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    selected.has(conv.id)
                      ? "border-terracotta-500 bg-terracotta-500 text-white"
                      : "border-cream-400 opacity-0 group-hover:opacity-100 dark:border-dark-border"
                  }`}
                >
                  {selected.has(conv.id) && <Check size={12} />}
                </button>

                <button
                  onClick={() => router.push(`/?chat=${conv.id}`)}
                  className="flex flex-1 items-center justify-between text-left min-w-0"
                >
                  <span className="truncate text-sm text-ink-700 dark:text-cream-300">
                    {conv.title}
                  </span>
                  <span className="ml-3 shrink-0 text-xs text-ink-400 dark:text-cream-500">
                    {formatTime(conv.updated_at)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="deleet conversashunz"
        message={`Delete ${selected.size} conversation${selected.size > 1 ? "s" : ""}? This cannot be undone.`}
        confirmLabel="deleet"
        danger
      />

      {moveConvId && (
        <MoveToProjectModal
          open={!!moveConvId}
          onClose={() => setMoveConvId(null)}
          conversationId={moveConvId}
        />
      )}
    </div>
  );
}
