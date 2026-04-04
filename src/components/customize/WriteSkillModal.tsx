"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useUserSkillsStore } from "@/lib/user-skills-store";

function slugify(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return s || "skill";
}

interface WriteSkillModalProps {
  open: boolean;
  onClose: () => void;
}

export function WriteSkillModal({ open, onClose }: WriteSkillModalProps) {
  const addSkill = useUserSkillsStore((s) => s.addSkill);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setInstructions("");
    }
  }, [open]);

  const handleCreate = () => {
    const n = name.trim();
    const body = instructions.trim();
    if (!n) {
      toast("entr a skil naym", "error");
      return;
    }
    if (!body) {
      toast("entr instrukshunz 4 dis skil", "error");
      return;
    }

    addSkill({
      name: n,
      description: description.trim(),
      content: body,
      fileName: `manual/${slugify(n)}.md`,
    });
    toast(`skil “${n}” addid 2 Klawd`, "success");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="rite skil instrukshunz"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5">
        <Input
          label="skil naym"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="weekly-status-report"
          autoComplete="off"
        />
        <Textarea
          label="deskripshun"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Generate weekly status reports from recent work. Use when asked for updates or progress summaries."
          rows={3}
          className="min-h-[4.5rem] resize-y"
        />
        <Textarea
          label="instrukshunz"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Summarize my recent work in three sections: wins, blockers, and next steps. Keep the tone professional but not stiff..."
          rows={10}
          className="min-h-[200px] resize-y"
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="border border-neutral-300 dark:border-dark-border"
            onClick={onClose}
          >
            kancel
          </Button>
          <Button
            type="button"
            size="md"
            className="border border-neutral-300 bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            onClick={handleCreate}
          >
            creat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
