"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-xl dark:bg-dark-surface border border-cream-200 dark:border-dark-border`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4 dark:border-dark-border">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-cream-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
