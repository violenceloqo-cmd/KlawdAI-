"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FolderOpen, ChevronDown, Check, Plus, X, Code2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/ui/Toast";

interface ProjectOption {
  id: string;
  name: string;
}

export function ProjectPicker() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  const ideOpen = useAppStore((s) => s.ideOpen);
  const setIdeOpen = useAppStore((s) => s.setIdeOpen);

  const loadProjects = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(
        (data.projects ?? []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }))
      );
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    void loadProjects();
    setOpen((o) => !o);
  };

  const handleIdeToggle = () => {
    if (!activeProjectId) {
      void loadProjects();
      setOpen(true);
      toast("selekt a projek below 2 open kod filez", "info");
      return;
    }
    setIdeOpen(!ideOpen);
  };

  const current = projects.find((p) => p.id === activeProjectId);

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <Tooltip content={current ? current.name : "selekt projek"} side="top">
        <button
          onClick={handleOpen}
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
            activeProjectId
              ? "bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-300 font-medium"
              : "text-ink-400 hover:bg-cream-200 dark:text-cream-500 dark:hover:bg-dark-surface2"
          }`}
        >
          <FolderOpen size={14} />
          <span className="max-w-[80px] truncate">
            {current ? current.name : "Projek"}
          </span>
          <ChevronDown size={12} />
        </button>
      </Tooltip>

      <Tooltip
        content={
          !activeProjectId
            ? "kod filez — selekt Projek 1st"
            : ideOpen
              ? "hied kod panel"
              : "sho kod filez"
        }
        side="top"
      >
        <button
          type="button"
          onClick={handleIdeToggle}
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
            ideOpen && activeProjectId
              ? "bg-green-500/15 font-medium text-green-600 dark:text-green-400"
              : activeProjectId
                ? "text-ink-400 hover:bg-cream-200 dark:text-cream-500 dark:hover:bg-dark-surface2"
                : "text-ink-300 hover:bg-cream-200 dark:text-cream-600 dark:hover:bg-dark-surface2"
          }`}
        >
          <Code2 size={14} />
          <span className="max-w-[52px] truncate sm:max-w-none">filez</span>
        </button>
      </Tooltip>

      {activeProjectId && (
        <Tooltip content="deselekt projek" side="top">
          <button
            type="button"
            onClick={() => {
              setActiveProjectId(null);
              setIdeOpen(false);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          >
            <X size={12} />
          </button>
        </Tooltip>
      )}

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface z-50">
          <button
            onClick={() => {
              setActiveProjectId(null);
              setIdeOpen(false);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-600 hover:bg-cream-100 dark:text-cream-400 dark:hover:bg-dark-surface2"
          >
            <X size={14} className="opacity-50" />
            no projek
            {!activeProjectId && <Check size={14} className="ml-auto text-terracotta-500" />}
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProjectId(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-800 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-dark-surface2"
            >
              <FolderOpen size={14} className="shrink-0 opacity-50" />
              <span className="truncate">{p.name}</span>
              {p.id === activeProjectId && <Check size={14} className="ml-auto text-terracotta-500 shrink-0" />}
            </button>
          ))}
          {projects.length === 0 && loaded && (
            <p className="px-3 py-2 text-xs text-ink-400">no projektz yet — creat wun in Build app payj</p>
          )}
          <div className="border-t border-cream-200 dark:border-dark-border mt-1 pt-1">
            <a
              href="/projects"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-terracotta-600 hover:bg-cream-100 dark:text-terracotta-300 dark:hover:bg-dark-surface2"
            >
              <Plus size={14} /> manaj projektz
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
