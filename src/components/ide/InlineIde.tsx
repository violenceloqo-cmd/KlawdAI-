"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  FilePlus,
  FolderArchive,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { LivePreview } from "./LivePreview";
import { IdeEditorPreviewSplit } from "./IdeEditorPreviewSplit";
import { useAppStore } from "@/lib/store";
import { guessLanguageFromPath } from "@/lib/ide-language";
import { buildIdeTree } from "./ide-tree";
import { FileTree } from "./FileTree";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { sanitizeCodePath } from "@/lib/code-path";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-500">
      loadin editer…
    </div>
  ),
});

type FileEntry = { id: string; content: string };

export function InlineIde({ projectId }: { projectId: string }) {
  const theme = useAppStore((s) => s.theme);
  const setIdeOpen = useAppStore((s) => s.setIdeOpen);
  const ideRefreshTick = useAppStore((s) => s.ideRefreshTick);
  const monacoTheme = theme === "dark" ? "vs-dark" : "light";

  const [files, setFiles] = useState<Record<string, FileEntry>>({});
  const [paths, setPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newPathInput, setNewPathInput] = useState("src/index.ts");
  const [creating, setCreating] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const activePathRef = useRef<string | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  activePathRef.current = activePath;

  const refreshFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/code`);
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
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  useEffect(() => {
    if (ideRefreshTick > 0) void refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideRefreshTick]);

  const flushSave = useCallback(
    async (path: string, content: string) => {
      const res = await fetch(`/api/projects/${projectId}/code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "sayv fayld", "error");
      }
    },
    [projectId]
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
      const res = await fetch(`/api/projects/${projectId}/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "creat fayld", "error");
        return;
      }
      setFiles((prev) => ({
        ...prev,
        [path]: { id: data.id, content: "" },
      }));
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
        `/api/projects/${projectId}/code?path=${encodeURIComponent(p)}`,
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
      a.download = `project-kod.zip`;
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
        let res = await fetch(`/api/projects/${projectId}/code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, content: text }),
        });
        if (res.status === 409) {
          res = await fetch(`/api/projects/${projectId}/code`, {
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const tree = buildIdeTree(paths);
  const activeContent = activePath ? files[activePath]?.content ?? "" : "";
  const lang = activePath ? guessLanguageFromPath(activePath) : "plaintext";

  return (
    <div className="flex h-full flex-col bg-cream-100 dark:bg-dark-bg">
      <header className="flex shrink-0 items-center gap-2 border-b border-cream-200 px-3 py-1.5 dark:border-dark-border">
        <span className="rounded-md bg-terracotta-500/15 px-2 py-0.5 text-xs font-medium text-terracotta-700 dark:text-terracotta-300">
          IDE
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => setNewFileOpen(true)}>
            <FilePlus size={12} className="mr-1" /> noo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => importInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 size={12} className="mr-1 animate-spin" /> : <FolderArchive size={12} className="mr-1" />}
            zip
          </Button>
          <input ref={importInputRef} type="file" accept=".zip" className="hidden" onChange={importZip} />
          <Button type="button" variant="secondary" size="sm" onClick={() => void exportZip()} disabled={paths.length === 0}>
            <Download size={12} className="mr-1" /> zip
          </Button>
          <Button
            type="button"
            variant={previewOpen ? "primary" : "secondary"}
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            <Eye size={12} className="mr-1" /> prevyu
          </Button>
          {activePath && (
            <Button type="button" variant="secondary" size="sm" className="text-red-600" onClick={() => setDeletePath(activePath)}>
              <Trash2 size={12} />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setIdeOpen(false)}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-48 shrink-0 flex-col border-r border-cream-200 bg-white dark:border-dark-border dark:bg-dark-surface">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-3 text-xs text-ink-400">loadin…</p>
            ) : paths.length === 0 ? (
              <p className="p-3 text-xs text-ink-400">no filez yet</p>
            ) : (
              <FileTree root={tree} selectedPath={activePath} onSelectFile={(p) => void selectFile(p)} />
            )}
          </div>
        </aside>
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <IdeEditorPreviewSplit
            previewOpen={previewOpen}
            editor={
              <div className="relative h-full min-h-0 min-w-0">
                {activePath ? (
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
                    {paths.length === 0 ? "uz kod mode 2 start bildin" : "selekt a file"}
                  </div>
                )}
              </div>
            }
            preview={
              <LivePreview
                files={files}
                paths={paths}
                onClose={() => setPreviewOpen(false)}
              />
            }
          />
        </main>
      </div>

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
    </div>
  );
}
