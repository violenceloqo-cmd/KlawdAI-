"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ChevronRight,
  FileText,
  MessageCircle,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { UploadSkillModal } from "@/components/customize/UploadSkillModal";
import { WriteSkillModal } from "@/components/customize/WriteSkillModal";
import { SKILL_CREATOR_CHAT_PREFILL } from "@/lib/skill-creator-prompt";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-sidebar-row-hover";

export function SkillsPlusMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const goToNewChatWithSkillCreator = () => {
    const { setActiveConversationId, setPendingChatPrefill } =
      useAppStore.getState();
    setActiveConversationId(null);
    setPendingChatPrefill(SKILL_CREATOR_CHAT_PREFILL);
    setOpen(false);
    setCreateSubOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreateSubOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) setCreateSubOpen(false);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-200/80 dark:text-cream-400 dark:hover:bg-sidebar-row-hover"
        aria-label="Skills actions"
        aria-expanded={open}
      >
        <Plus size={18} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-50 mt-1 min-w-[13.5rem] rounded-2xl border border-cream-200 bg-white p-1.5 shadow-lg dark:border-dark-border dark:bg-dark-surface2"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <Briefcase size={16} strokeWidth={1.5} className="shrink-0 opacity-90" />
            <span>browze skilz</span>
          </button>

          <div
            className="relative"
            onMouseEnter={() => setCreateSubOpen(true)}
            onMouseLeave={() => setCreateSubOpen(false)}
          >
            <div
              className={cn(
                itemClass,
                "cursor-default",
                createSubOpen && "dark:bg-sidebar-row-hover bg-cream-100"
              )}
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={createSubOpen}
            >
              <Plus size={16} strokeWidth={1.5} className="shrink-0 opacity-90" />
              <span className="min-w-0 flex-1">creat skil</span>
              <ChevronRight size={16} className="shrink-0 opacity-60" />
            </div>

            {createSubOpen && (
              <>
                <div
                  className="absolute left-full top-0 z-[60] h-full w-2 -translate-x-0.5"
                  aria-hidden
                />
                <div
                  className="absolute left-full top-0 z-[60] ml-1 min-w-[14rem] rounded-xl border border-cream-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface2"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass}
                    onClick={goToNewChatWithSkillCreator}
                  >
                    <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                      <MessageCircle
                        size={15}
                        strokeWidth={1.5}
                        className="text-cream-600 dark:text-cream-400"
                      />
                      <Sparkles
                        size={9}
                        strokeWidth={2}
                        className="absolute -right-0.5 -top-0.5 text-amber-400 dark:text-amber-300"
                      />
                    </span>
                    creat wif Klawd
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      setCreateSubOpen(false);
                      setWriteModalOpen(true);
                    }}
                  >
                    <FileText size={16} strokeWidth={1.5} className="shrink-0 opacity-90" />
                    rite skil instrukshunz
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      setCreateSubOpen(false);
                      setUploadModalOpen(true);
                    }}
                  >
                    <Upload size={16} strokeWidth={1.5} className="shrink-0 opacity-90" />
                    uplode a skil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <UploadSkillModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
      <WriteSkillModal
        open={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
      />
    </div>
  );
}
