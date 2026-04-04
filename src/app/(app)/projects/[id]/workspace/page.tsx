"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  FilePlus,
  FolderArchive,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { guessLanguageFromPath } from "@/lib/ide-language";
import { buildIdeTree } from "@/components/ide/ide-tree";
import { FileTree } from "@/components/ide/FileTree";
import { LivePreview } from "@/components/ide/LivePreview";
import { ResizablePanels } from "@/components/workspace/ResizablePanels";
import { WorkspaceChat } from "@/components/workspace/WorkspaceChat";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { sanitizeCodePath } from "@/lib/code-path";
import { GitHubPushModal } from "@/components/ide/GitHubPushModal";
import { useGithubOAuthReturnToast } from "@/hooks/use-github-oauth-return";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-500">
      loadin editer…
    </div>
  ),
});

type FileEntry = { id: string; content: string };

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);
  const monacoTheme = theme === "dark" ? "vs-dark" : "light";

  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<Record<string, FileEntry>>({});
  const [paths, setPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [filesLoading, setFilesLoading] = useState(true);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newPathInput, setNewPathInput] = useState("src/index.ts");
  const [creating, setCreating] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);

  useGithubOAuthReturnToast();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const activePathRef = useRef<string | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  activePathRef.current = activePath;

  useEffect(() => {
    setActiveProjectId(id);
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => setProjectName(data.name || "Projek"))
      .catch(() => toast("fayld 2 lode projek", "error"))
      .finally(() => setLoading(false));
  }, [id, setActiveProjectId]);

  const refreshFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/code`);
      if (!res.ok) throw new Error("load fayld");
      const data = (await res.json()) as {
        files: { id: string; path: string; content: string }[];
      };
      const map: Record<string, FileEntry> = {};
      const ps: string[] = [];
      for (const f of data.files ?? []) {
        map[f.path] = { id: f.id, content: f.content };
        ps.push(f.path);
      }
      ps.sort((a, b) => a.localeCompare(b));
      setFiles(map);
      setPaths(ps);
      setActivePath((prev) => {
        if (prev && map[prev]) return prev;
        return ps[0] ?? null;
      });
    } catch {
      toast("fayld 2 lode kod files", "error");
    }
    setFilesLoading(false);
  }, [id]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  const flushSave = useCallback(
    async (path: string, content: string) => {
      const res = await fetch(`/api/projects/${id}/code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "sayv fayld", "error");
      }
    },
    [id]
  );

  const scheduleSave = useCallback(
    (path: string, content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void flushSave(path, content);
      }, 750);
    },
    [flushSave]
  );

  const selectFile = useCallback(
    async (path: string) => {
      if (path === activePathRef.current) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const prev = activePathRef.current;
      if (prev) {
        const cur = filesRef.current[prev];
        if (cur) await flushSave(prev, cur.content);
      }
      setActivePath(path);
    },
    [flushSave]
  );

  const onEditorChange = useCallback(
    (value: string | undefined) => {
      const p = activePathRef.current;
      if (!p) return;
      const v = value ?? "";
      setFiles((prev) => ({
        ...prev,
        [p]: { ...prev[p], content: v },
      }));
      scheduleSave(p, v);
    },
    [scheduleSave]
  );

  const handleCreateFile = async () => {
    let path: string;
    try {
      path = sanitizeCodePath(newPathInput);
    } catch (e) {
      toast(e instanceof Error ? e.message : "bad path", "error");
      return;
    }
    if (files[path]) {
      toast("file alreddy existz", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${id}/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "creat fayld", "error");
        return;
      }
      setFiles((prev) => ({ ...prev, [path]: { id: data.id, content: "" } }));
      setPaths((prev) => [...prev, path].sort((a, b) => a.localeCompare(b)));
      setActivePath(path);
      setNewFileOpen(false);
      setNewPathInput("src/index.ts");
    } catch {
      toast("creat fayld", "error");
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deletePath) return;
    const p = deletePath;
    try {
      const res = await fetch(
        `/api/projects/${id}/code?path=${encodeURIComponent(p)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast("deleet fayld", "error");
        return;
      }
      setFiles((prev) => {
        const n = { ...prev };
        delete n[p];
        return n;
      });
      setPaths((prev) => {
        const next = prev.filter((x) => x !== p);
        setActivePath((cur) => (cur !== p ? cur : next[0] ?? null));
        return next;
      });
    } catch {
      toast("deleet fayld", "error");
    }
    setDeletePath(null);
  };

  const exportZip = async () => {
    if (paths.length === 0) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const p of paths) zip.file(p, files[p]?.content ?? "");
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${projectName || "project"}-kod.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast("eksport fayld", "error");
    }
  };

  const importZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const JSZip = (await import("jszip")).default;
      const z = await JSZip.loadAsync(await file.arrayBuffer());
      let newCount = 0;
      for (const relPath of Object.keys(z.files)) {
        const entry = z.files[relPath];
        if (entry.dir) continue;
        if (relPath.includes("__MACOSX") || relPath.endsWith(".DS_Store")) continue;
        let path: string;
        try { path = sanitizeCodePath(relPath); } catch { continue; }
        const text = await entry.async("string");
        let res = await fetch(`/api/projects/${id}/code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, content: text }),
        });
        if (res.status === 409) {
          res = await fetch(`/api/projects/${id}/code`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, content: text }),
          });
        } else if (res.ok) {
          newCount += 1;
        }
        if (!res.ok) break;
      }
      await refreshFiles();
      toast(`importd ${newCount} noo filez`, "success");
    } catch {
      toast("import fayld", "error");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <p className="text-sm text-ink-400">loadin workspace…</p>
      </div>
    );
  }

  const tree = buildIdeTree(paths);
  const activeContent = activePath ? files[activePath]?.content ?? "" : "";
  const lang = activePath ? guessLanguageFromPath(activePath) : "plaintext";

  const leftPanel = (
    <div className="flex h-full flex-col bg-white dark:bg-dark-surface">
      {/* File tree header */}
      <div className="flex shrink-0 items-center gap-1 border-b border-neutral-200 px-2 py-1.5 dark:border-dark-border">
        <button
          onClick={() => router.push(`/projects/${id}`)}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          title="bak 2 projek"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="truncate text-xs font-medium text-ink-700 dark:text-cream-300">
          {projectName}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={() => setNewFileOpen(true)} className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2" title="noo file">
            <FilePlus size={13} />
          </button>
          <button onClick={() => importInputRef.current?.click()} disabled={importing} className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2" title="import zip">
            {importing ? <Loader2 size={13} className="animate-spin" /> : <FolderArchive size={13} />}
          </button>
          <input ref={importInputRef} type="file" accept=".zip" className="hidden" onChange={importZip} />
          <button onClick={() => void exportZip()} disabled={paths.length === 0} className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2" title="eksport zip">
            <Download size={13} />
          </button>
        </div>
      </div>
      {/* File tree */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filesLoading ? (
          <p className="p-3 text-xs text-ink-400">loadin…</p>
        ) : paths.length === 0 ? (
          <p className="p-3 text-xs text-ink-400">no filez yet</p>
        ) : (
          <FileTree root={tree} selectedPath={activePath} onSelectFile={(p) => void selectFile(p)} />
        )}
      </div>
    </div>
  );

  const activeTab: "editor" | "preview" = previewOpen ? "preview" : "editor";
  const fileName = activePath ? activePath.split("/").pop() ?? activePath : null;

  const centerPanel = (
    <div className="flex h-full flex-col bg-cream-100 dark:bg-dark-bg">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b border-neutral-200 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
          {/* File tab */}
          {activePath && (
            <div
              className={`flex shrink-0 items-center border-r border-neutral-200 dark:border-dark-border ${
                activeTab === "editor"
                  ? "bg-white text-ink-800 dark:bg-dark-bg dark:text-cream-200"
                  : "bg-neutral-100 text-ink-500 dark:bg-dark-surface dark:text-cream-500"
              }`}
            >
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={`flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-xs ${
                  activeTab === "editor"
                    ? ""
                    : "text-ink-500 hover:bg-neutral-50 dark:text-cream-500 dark:hover:bg-dark-surface2"
                }`}
              >
                <span className="max-w-[140px] truncate">{fileName}</span>
              </button>
              {activeTab === "editor" && (
                <button
                  type="button"
                  onClick={() => setDeletePath(activePath)}
                  className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded text-ink-400 hover:bg-neutral-200 hover:text-red-600 dark:hover:bg-dark-surface2"
                  aria-label="Close file"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          )}
          {/* Preview tab */}
          <div
            className={`flex shrink-0 items-center border-r border-neutral-200 dark:border-dark-border ${
              activeTab === "preview"
                ? "bg-white text-green-700 dark:bg-dark-bg dark:text-green-400"
                : "bg-neutral-100 text-ink-500 dark:bg-dark-surface dark:text-cream-500"
            }`}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className={`flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-xs ${
                activeTab === "preview"
                  ? ""
                  : "text-ink-500 hover:bg-neutral-50 dark:text-cream-500 dark:hover:bg-dark-surface2"
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            {activeTab === "preview" && (
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded text-ink-400 hover:bg-neutral-200 dark:hover:bg-dark-surface2"
                aria-label="Close preview"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="relative min-h-0 flex-1">
        {activeTab === "preview" ? (
          <LivePreview
            files={files}
            paths={paths}
            onClose={() => setPreviewOpen(false)}
          />
        ) : activePath ? (
          <div className="absolute inset-0">
            <Editor
              height="100%"
              theme={monacoTheme}
              path={activePath}
              language={lang}
              value={activeContent}
              onChange={onEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: "on",
              }}
              onMount={(editor, monaco) => {
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                  () => {
                    const p = activePathRef.current;
                    if (!p) return;
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                      debounceRef.current = null;
                    }
                    void flushSave(p, editor.getValue());
                  }
                );
              }}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-500 dark:text-cream-500">
            {paths.length === 0 ? "uz da chat 2 start bildin" : "selekt a file"}
          </div>
        )}
      </div>
    </div>
  );

  const rightPanel = (
    <WorkspaceChat
      projectId={id}
      projectName={projectName}
      onFilesWritten={refreshFiles}
      onGitHubPush={() => setGithubOpen(true)}
      githubPushDisabled={paths.length === 0}
    />
  );

  return (
    <>
      <ResizablePanels
        left={leftPanel}
        center={centerPanel}
        right={rightPanel}
      />

      <Modal open={newFileOpen} onClose={() => setNewFileOpen(false)} title="noo file" maxWidth="max-w-md">
        <div className="space-y-4">
          <Input label="path" value={newPathInput} onChange={(e) => setNewPathInput(e.target.value)} placeholder="src/app.tsx" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNewFileOpen(false)}>kancel</Button>
            <Button onClick={() => void handleCreateFile()} disabled={creating}>{creating ? "creatin…" : "creat"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deletePath} onClose={() => setDeletePath(null)} onConfirm={() => void handleDelete()} title="deleet file" message={`deleet "${deletePath ?? ""}"?`} confirmLabel="ya" danger />

      <GitHubPushModal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        projectId={id}
        projectName={projectName}
      />
    </>
  );
}
