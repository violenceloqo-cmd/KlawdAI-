"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  FolderOpen,
  ArchiveRestore,
  Search,
  ChevronDown,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type SortKey = "activity" | "name_asc" | "name_desc" | "created";

interface Project {
  id: string;
  name: string;
  description: string;
  starred: boolean;
  archived: boolean;
  created_at: string;
  updated_at?: string;
  conversations: { count: number }[];
}

function formatUpdatedAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds} second${seconds === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `Updated ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `Updated ${years} year${years === 1 ? "" : "s"} ago`;
}

function useFilteredSorted(
  projects: Project[],
  searchQuery: string,
  sortBy: SortKey
) {
  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });
    list = [...list];
    switch (sortBy) {
      case "activity":
        list.sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        );
        break;
      case "name_asc":
        list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
        break;
      case "name_desc":
        list.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
        break;
      case "created":
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }
    return list;
  }, [projects, searchQuery, sortBy]);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("activity");
  const router = useRouter();

  const filteredActive = useFilteredSorted(projects, searchQuery, sortBy);
  const filteredArchived = useFilteredSorted(archivedProjects, searchQuery, sortBy);

  useEffect(() => {
    if (
      searchQuery.trim() &&
      filteredActive.length === 0 &&
      filteredArchived.length > 0
    ) {
      setShowArchived(true);
    }
  }, [searchQuery, filteredActive.length, filteredArchived.length]);

  const loadProjects = async () => {
    try {
      const [activeRes, archiveRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/projects?archived=true"),
      ]);
      const activeData = await activeRes.json();
      const archiveData = await archiveRes.json();
      setProjects(activeData.projects || []);
      setArchivedProjects(archiveData.projects || []);
    } catch {
      toast("fayld 2 lode projektz", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      router.push(`/projects/${data.id}`);
    } catch {
      toast("fayld 2 creat projek", "error");
    }
    setCreating(false);
  };

  const handleAction = async (
    id: string,
    action: "star" | "archive" | "unarchive" | "delete"
  ) => {
    setMenuOpen(null);
    if (action === "delete") {
      setDeleteId(id);
      return;
    }

    try {
      const body: Record<string, unknown> = {};
      if (action === "star") {
        const p = [...projects, ...archivedProjects].find((x) => x.id === id);
        body.starred = !p?.starred;
      } else if (action === "archive") {
        body.archived = true;
      } else if (action === "unarchive") {
        body.archived = false;
      }

      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      loadProjects();
      toast(
        action === "star"
          ? "updaytd"
          : action === "archive"
            ? "projek archivd"
            : "projek restord",
        "success"
      );
    } catch {
      toast("akshun fayld", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/projects/${deleteId}`, { method: "DELETE" });
      loadProjects();
      toast("projek deleetd", "success");
    } catch {
      toast("fayld 2 deleet", "error");
    }
    setDeleteId(null);
  };

  const renderProjectCard = (project: Project, isArchived = false) => {
    const updatedIso = project.updated_at || project.created_at;
    const desc = project.description?.trim();

    return (
      <div
        key={project.id}
        className="group relative cursor-pointer rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 dark:border-dark-border dark:bg-dark-surface dark:hover:border-dark-surface3"
        onClick={() => router.push(`/projects/${project.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-ink-900 dark:text-white">
                {project.name}
              </h3>
              {project.starred && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-dark-surface2 dark:text-cream-400">
                  Starred
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-2 line-clamp-3 text-sm leading-relaxed",
                desc
                  ? "text-ink-600 dark:text-cream-400"
                  : "text-ink-400 dark:text-cream-600"
              )}
            >
              {desc || "No description"}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${project.id}/workspace`);
                }}
                className="flex items-center gap-1 rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20 dark:text-green-400"
              >
                <Hammer size={12} />
                Workspace
              </button>
              <span className="text-xs text-ink-400 dark:text-cream-500">
                {formatUpdatedAgo(updatedIso)}
              </span>
            </div>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(menuOpen === project.id ? null : project.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 opacity-0 transition-all hover:bg-cream-200 group-hover:opacity-100 dark:hover:bg-dark-surface2"
              aria-label="Project actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen === project.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(null);
                  }}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(project.id, "star");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
                  >
                    <Star size={14} />
                    {project.starred ? "Unstarr" : "Starr"}
                  </button>
                  {isArchived ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(project.id, "unarchive");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
                    >
                      <ArchiveRestore size={14} />
                      Unarchiv
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(project.id, "archive");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-dark-surface2"
                    >
                      <Archive size={14} />
                      Archiv
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(project.id, "delete");
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
  };

  const hasAnyProjects = projects.length > 0 || archivedProjects.length > 0;
  const emptyAfterSearch =
    hasAnyProjects && filteredActive.length === 0 && filteredArchived.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-cream-100 dark:bg-[#1a1a1a]">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 pb-12">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Projects
          </h1>
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="shrink-0 bg-white text-neutral-900 shadow-sm hover:bg-neutral-100 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <Plus size={16} className="mr-1.5" />
            New project
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-ink-400 dark:text-cream-500">
            loadin...
          </div>
        ) : !hasAnyProjects ? (
          <div className="py-16 text-center">
            <FolderOpen size={40} className="mx-auto mb-3 text-ink-300 dark:text-cream-600" />
            <p className="text-sm text-ink-500 dark:text-cream-500">
              no projektz yet. creat wun 2 organize ur chatz.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400 dark:text-cream-500"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className={cn(
                    "h-11 w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-[box-shadow,border-color]",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25",
                    "dark:border-dark-border dark:bg-dark-surface dark:text-cream-100 dark:placeholder:text-cream-500",
                    "dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  )}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-ink-500 dark:text-cream-500">Sort by</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className={cn(
                      "h-9 appearance-none rounded-lg border border-neutral-300 bg-white py-1.5 pl-3 pr-9 text-sm text-ink-900 outline-none",
                      "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25",
                      "dark:border-dark-border dark:bg-dark-surface dark:text-cream-100",
                      "dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    )}
                    aria-label="Sort projects"
                  >
                    <option value="activity">Activity</option>
                    <option value="name_asc">Name (A–Z)</option>
                    <option value="name_desc">Name (Z–A)</option>
                    <option value="created">Date created</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 dark:text-cream-400"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            {emptyAfterSearch ? (
              <p className="mt-8 text-center text-sm text-ink-500 dark:text-cream-500">
                No projects match your search.
              </p>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredActive.map((p) => renderProjectCard(p))}
                </div>

                {archivedProjects.length > 0 && (
                  <div className="mt-10">
                    <button
                      type="button"
                      onClick={() => setShowArchived(!showArchived)}
                      className="mb-4 text-sm font-medium text-ink-500 hover:text-ink-700 dark:text-cream-400 dark:hover:text-cream-200"
                    >
                      {showArchived ? "Hied" : "Sho"} archivd ({archivedProjects.length})
                    </button>
                    {showArchived && (
                      <div className="grid grid-cols-1 gap-4 opacity-80 md:grid-cols-2">
                        {filteredArchived.map((p) => renderProjectCard(p, true))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Noo Projek"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <Input
            label="projek naym"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="mai projek"
            autoFocus
          />
          <Textarea
            label="deskripshun (opshunul)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="watz dis projek abowt?"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              kancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? "creatin..." : "creat projek"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="deleet projek"
        message="r u shur? all projek instrukshunz and nolej wil b deleetd. chatz wil b moovd 2 standalon."
        confirmLabel="ya, deleet"
        danger
      />
    </div>
  );
}
