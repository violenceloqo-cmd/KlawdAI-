"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  MoreHorizontal,
  Archive,
  Trash2,
  Plus,
  FileText,
  X,
  MessageSquare,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

interface Document {
  id: string;
  name: string;
  file_size: number;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  instructions: string;
  starred: boolean;
  archived: boolean;
  documents: Document[];
  conversations: Conversation[];
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [instructions, setInstructions] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setNameValue(data.name || "");
        setInstructions(data.instructions || "");
      })
      .catch(() => toast("fayld 2 lode projek", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue === project?.name) {
      setEditingName(false);
      return;
    }
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      setProject((p) => (p ? { ...p, name: nameValue.trim() } : p));
      setEditingName(false);
    } catch {
      toast("fayld 2 reenaym", "error");
    }
  };

  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      toast("instrukshunz sayvd", "success");
    } catch {
      toast("fayld 2 sayv", "error");
    }
    setSavingInstructions(false);
  };

  const handleStar = async () => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !project?.starred }),
      });
      setProject((p) => (p ? { ...p, starred: !p.starred } : p));
    } catch {
      toast("fayld", "error");
    }
  };

  const handleArchive = async () => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      toast("projek archivd", "success");
      router.push("/projects");
    } catch {
      toast("fayld", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      toast("projek deleetd", "success");
      router.push("/projects");
    } catch {
      toast("fayld 2 deleet", "error");
    }
    setShowDelete(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      const doc = await res.json();
      setProject((p) =>
        p ? { ...p, documents: [doc, ...p.documents] } : p
      );
      toast("dokument uploded", "success");
    } catch {
      toast("uplode fayld", "error");
    }
    e.target.value = "";
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await fetch(`/api/projects/${id}/documents/${docId}`, {
        method: "DELETE",
      });
      setProject((p) =>
        p
          ? { ...p, documents: p.documents.filter((d) => d.id !== docId) }
          : p
      );
      toast("dokument remuvd", "success");
    } catch {
      toast("fayld 2 deleet dokument", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <p className="text-sm text-ink-400">loadin...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <p className="text-sm text-ink-400">projek not fownd</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-bg">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="text-sm text-ink-500 hover:text-ink-700 dark:text-cream-400"
          >
            ← Build app
          </button>
          <Button
            size="sm"
            onClick={() => router.push(`/projects/${id}/workspace`)}
          >
            <Hammer size={14} className="mr-1" />
            Open Workspace
          </Button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="rounded-md border border-terracotta-500 bg-white px-2 py-1 text-xl font-semibold outline-none dark:bg-dark-surface dark:text-cream-100"
              />
            ) : (
              <h1
                onClick={() => {
                  setNameValue(project.name);
                  setEditingName(true);
                }}
                className="cursor-pointer text-xl font-semibold text-ink-900 dark:text-cream-100 hover:text-terracotta-500"
              >
                {project.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStar}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                project.starred
                  ? "text-terracotta-500"
                  : "text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
              }`}
            >
              <Star
                size={18}
                className={project.starred ? "fill-current" : ""}
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                    <button
                      onClick={() => { setMenuOpen(false); handleArchive(); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
                    >
                      <Archive size={14} /> Archiv
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setShowDelete(true); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} /> Deleet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Instructions + Chats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink-700 dark:text-cream-300">
                projek instrukshunz
              </h2>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="tel Klawd how 2 behaev in dis projek..."
                rows={6}
                className="w-full"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveInstructions}
                  disabled={savingInstructions}
                >
                  {savingInstructions ? "savin..." : "sayv instrukshunz"}
                </Button>
              </div>
            </div>

            {/* Conversations */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-700 dark:text-cream-300">
                  chatz in dis projek
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/?project=${id}`)}
                >
                  <Plus size={14} className="mr-1" /> noo chat
                </Button>
              </div>
              {project.conversations.length === 0 ? (
                <p className="text-sm text-ink-400 dark:text-cream-500">
                  no chatz in dis projek yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {project.conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => router.push(`/?chat=${conv.id}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
                    >
                      <MessageSquare size={14} className="shrink-0 text-ink-400" />
                      <span className="truncate text-sm text-ink-700 dark:text-cream-300">
                        {conv.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Knowledge base */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-700 dark:text-cream-300">
                nolej base
              </h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.txt,.csv,.docx,.md,.json,.py,.js,.ts,.tsx,.jsx,.html,.css"
                />
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors">
                  <Plus size={16} />
                </span>
              </label>
            </div>
            {project.documents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-cream-400 p-6 text-center dark:border-dark-border">
                <FileText
                  size={24}
                  className="mx-auto mb-2 text-ink-300 dark:text-cream-600"
                />
                <p className="text-xs text-ink-400 dark:text-cream-500">
                  uplode dokuments 2 add contekst
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-cream-200 dark:hover:bg-dark-surface2 group"
                  >
                    <FileText size={14} className="shrink-0 text-ink-400" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm text-ink-700 dark:text-cream-300">
                        {doc.name}
                      </div>
                      <div className="text-xs text-ink-400">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-600 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="deleet projek"
        message="r u shur? dis wil permunently deleet da projek, its instrukshunz, and nolej base."
        confirmLabel="ya, deleet"
        danger
      />
    </div>
  );
}
