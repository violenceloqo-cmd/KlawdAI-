"use client";

import { useCallback, useRef, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { parseSkillMarkdown } from "@/lib/skill-markdown";
import { readSkillFileText } from "@/lib/read-skill-file";
import { useUserSkillsStore } from "@/lib/user-skills-store";
import { cn } from "@/lib/utils";

const DOCS_SKILLS =
  "https://docs.claude.com/en/docs/claude-code/skills";
const EXAMPLE_SKILLS = "https://github.com/anthropics/skills";

interface UploadSkillModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadSkillModal({ open, onClose }: UploadSkillModalProps) {
  const addSkill = useUserSkillsStore((s) => s.addSkill);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  const ingestFile = useCallback(
    async (file: File) => {
      try {
        const { text, sourceLabel } = await readSkillFileText(file);
        const { name, description, body } = parseSkillMarkdown(text);
        const content = body || text;
        addSkill({
          name,
          description,
          content,
          fileName: sourceLabel,
        });
        toast(`skil “${name}” addid 2 Klawd`, "success");
        onClose();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not read file", "error");
      }
    },
    [addSkill, onClose]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void ingestFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void ingestFile(f);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <Modal open={open} onClose={onClose} title="uplode skil" maxWidth="max-w-md">
      <input
        ref={inputRef}
        type="file"
        accept=".md,.zip,.skill,application/zip,text/markdown"
        className="hidden"
        onChange={onInputChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors",
          "border-neutral-300 bg-neutral-50 dark:border-dark-border dark:bg-dark-bg",
          dragOver && "border-terracotta-500 bg-terracotta-500/5 dark:bg-dark-surface2"
        )}
      >
        <FolderPlus
          size={40}
          strokeWidth={1.25}
          className="mb-4 text-neutral-500 dark:text-cream-500"
        />
        <span className="text-sm text-neutral-600 dark:text-cream-400">
          drag n drop or klik 2 uplode
        </span>
      </button>

      <div className="mt-6">
        <h3 className="mb-2 text-xs font-medium text-neutral-500 dark:text-cream-500">
          fiel reekwirements
        </h3>
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-neutral-600 dark:text-cream-500">
          <li>
            .md file must contain skill name and description formatted in YAML
          </li>
          <li>.zip or .skill file must include a SKILL.md file</li>
        </ul>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-neutral-600 dark:text-cream-500">
        <a
          href={DOCS_SKILLS}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:decoration-cream-600 dark:hover:text-cream-300"
        >
          reed moar abowt creatin skilz
        </a>
        {" or "}
        <a
          href={EXAMPLE_SKILLS}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:decoration-cream-600 dark:hover:text-cream-300"
        >
          see an exampel
        </a>
        .
      </p>
    </Modal>
  );
}
