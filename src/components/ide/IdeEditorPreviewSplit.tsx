"use client";

import {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY = "klawd-ide-preview-pct";
const DEFAULT_PREVIEW_PCT = 62;
const MIN_PREVIEW_PCT = 22;
const MAX_PREVIEW_PCT = 82;

function clampPct(n: number): number {
  return Math.min(MAX_PREVIEW_PCT, Math.max(MIN_PREVIEW_PCT, n));
}

function readStoredPct(): number {
  if (typeof window === "undefined") return DEFAULT_PREVIEW_PCT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw == null) return DEFAULT_PREVIEW_PCT;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? clampPct(n) : DEFAULT_PREVIEW_PCT;
}

/**
 * Editor + live preview with a draggable vertical splitter (preview on the right).
 */
export function IdeEditorPreviewSplit({
  previewOpen,
  editor,
  preview,
}: {
  previewOpen: boolean;
  editor: ReactNode;
  preview: ReactNode;
}) {
  const [previewPct, setPreviewPct] = useState(DEFAULT_PREVIEW_PCT);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client hydration from localStorage
    setPreviewPct(readStoredPct());
  }, []);

  const onSeparatorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const startX = e.clientX;
      const startPct = previewPct;
      const width = container.getBoundingClientRect().width;
      if (width < 1) return;

      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      let lastPct = startPct;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const deltaPct = (dx / width) * 100;
        lastPct = clampPct(startPct + deltaPct);
        setPreviewPct(lastPct);
      };

      const onUp = () => {
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        try {
          window.localStorage.setItem(STORAGE_KEY, String(lastPct));
        } catch {
          /* ignore */
        }
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [previewPct]
  );

  if (!previewOpen) {
    return (
      <div className="relative min-h-0 min-w-0 flex-1">{editor}</div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 min-w-0 w-full flex-1"
    >
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {editor}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="resize prevyu"
        title="drag 2 resize"
        onMouseDown={onSeparatorMouseDown}
        className="group relative z-10 w-2 shrink-0 cursor-col-resize"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-cream-200 group-hover:bg-terracotta-400/70 dark:bg-dark-border dark:group-hover:bg-terracotta-500/50" />
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      <div
        className="min-h-0 min-w-0 overflow-hidden border-l border-cream-200 dark:border-dark-border"
        style={{
          flex: `0 0 ${previewPct}%`,
          minWidth: 200,
        }}
      >
        {preview}
      </div>
    </div>
  );
}
