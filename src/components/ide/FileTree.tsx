"use client";

import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { useState } from "react";
import type { IdeTreeNode } from "./ide-tree";

function TreeRow({
  node,
  depth,
  selectedPath,
  onSelectFile,
}: {
  node: IdeTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.name === "" && node.children) {
    return (
      <ul className="list-none p-0">
        {node.children.map((c) => (
          <TreeRow
            key={c.fullPath || c.name}
            node={c}
            depth={depth}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        ))}
      </ul>
    );
  }

  if (node.isFile) {
    const sel = selectedPath === node.fullPath;
    return (
      <li className="list-none">
        <button
          type="button"
          onClick={() => onSelectFile(node.fullPath)}
          style={{ paddingLeft: 8 + depth * 12 }}
          className={`flex w-full items-center gap-1 rounded-md py-1 text-left text-xs ${
            sel
              ? "bg-terracotta-500/20 text-ink-900 dark:text-cream-100"
              : "text-ink-600 hover:bg-cream-200 dark:text-cream-400 dark:hover:bg-dark-surface2"
          }`}
        >
          <File size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{node.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ paddingLeft: 4 + depth * 12 }}
        className="flex w-full items-center gap-0.5 rounded-md py-1 text-left text-xs text-ink-600 hover:bg-cream-200 dark:text-cream-400 dark:hover:bg-dark-surface2"
      >
        {open ? (
          <ChevronDown size={14} className="shrink-0 opacity-70" />
        ) : (
          <ChevronRight size={14} className="shrink-0 opacity-70" />
        )}
        <Folder size={12} className="shrink-0 opacity-60" />
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {open && node.children && (
        <ul className="list-none p-0">
          {node.children.map((c) => (
            <TreeRow
              key={c.fullPath || c.name}
              node={c}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({
  root,
  selectedPath,
  onSelectFile,
}: {
  root: IdeTreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  return (
    <nav className="px-2 py-2" aria-label="Project files">
      <TreeRow
        node={root}
        depth={0}
        selectedPath={selectedPath}
        onSelectFile={onSelectFile}
      />
    </nav>
  );
}
