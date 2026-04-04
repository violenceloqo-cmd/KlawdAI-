"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FolderOpen, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/ui/Toast";

interface Project {
  id: string;
  name: string;
  description: string;
}

interface MoveToProjectModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

export function MoveToProjectModal({
  open,
  onClose,
  conversationId,
}: MoveToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const updateConversation = useAppStore((s) => s.updateConversation);

  useEffect(() => {
    if (!open) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => toast("fayld 2 lode projektz", "error"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleMove = async (projectId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      updateConversation(conversationId, { project_id: projectId });
      toast("moovd 2 projek", "success");
      onClose();
    } catch {
      toast("fayld 2 moov", "error");
    }
  };

  const handleRemove = async () => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: null }),
      });
      updateConversation(conversationId, { project_id: null });
      toast("remuvd frum projek", "success");
      onClose();
    } catch {
      toast("fayld 2 remuv", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="moov 2 projek" maxWidth="max-w-md">
      {loading ? (
        <div className="py-8 text-center text-sm text-ink-400">loadin...</div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-400">
          no projektz yet. creat wun ferst.
        </div>
      ) : (
        <div className="space-y-1">
          <button
            onClick={handleRemove}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-500 hover:bg-cream-100 dark:hover:bg-dark-surface2"
          >
            no projek (standalon)
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => handleMove(p.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cream-100 dark:hover:bg-dark-surface2"
            >
              <FolderOpen size={16} className="shrink-0 text-ink-400" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-700 dark:text-cream-300">
                  {p.name}
                </div>
                {p.description && (
                  <div className="text-xs text-ink-400 truncate">
                    {p.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
