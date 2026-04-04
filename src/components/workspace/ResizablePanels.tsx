"use client";

import {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

const STORAGE_KEY = "klawd-workspace-panels";
const DEFAULT_LEFT_PX = 240;
const DEFAULT_RIGHT_PX = 420;
const MIN_LEFT = 180;
const MAX_LEFT = 400;
const MIN_RIGHT = 300;
const MAX_RIGHT = 700;
const MIN_CENTER = 200;

interface PanelSizes {
  leftPx: number;
  rightPx: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}

function readStored(): PanelSizes {
  if (typeof window === "undefined")
    return { leftPx: DEFAULT_LEFT_PX, rightPx: DEFAULT_RIGHT_PX, leftCollapsed: false, rightCollapsed: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { leftPx: DEFAULT_LEFT_PX, rightPx: DEFAULT_RIGHT_PX, leftCollapsed: false, rightCollapsed: false };
    return JSON.parse(raw) as PanelSizes;
  } catch {
    return { leftPx: DEFAULT_LEFT_PX, rightPx: DEFAULT_RIGHT_PX, leftCollapsed: false, rightCollapsed: false };
  }
}

function persist(sizes: PanelSizes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch { /* ignore */ }
}

function Separator({ onMouseDown, direction }: { onMouseDown: (e: React.MouseEvent) => void; direction: "left" | "right" }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`resize ${direction} panel`}
      onMouseDown={onMouseDown}
      className="group relative z-10 w-1.5 shrink-0 cursor-col-resize"
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-200 group-hover:bg-terracotta-400/70 dark:bg-dark-border dark:group-hover:bg-terracotta-500/50 transition-colors" />
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}

export function ResizablePanels({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  const [sizes, setSizes] = useState<PanelSizes>({
    leftPx: DEFAULT_LEFT_PX,
    rightPx: DEFAULT_RIGHT_PX,
    leftCollapsed: false,
    rightCollapsed: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setSizes(readStored());
  }, []);

  const update = useCallback((patch: Partial<PanelSizes>) => {
    setSizes((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const onLeftSeparatorDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const startX = e.clientX;
      const startPx = sizes.leftPx;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      let lastPx = startPx;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        lastPx = Math.min(MAX_LEFT, Math.max(MIN_LEFT, startPx + dx));
        setSizes((prev) => ({ ...prev, leftPx: lastPx }));
      };

      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setSizes((prev) => {
          const next = { ...prev, leftPx: lastPx };
          persist(next);
          return next;
        });
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [sizes.leftPx]
  );

  const onRightSeparatorDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const startX = e.clientX;
      const startPx = sizes.rightPx;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      let lastPx = startPx;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        lastPx = Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, startPx - dx));
        setSizes((prev) => ({ ...prev, rightPx: lastPx }));
      };

      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setSizes((prev) => {
          const next = { ...prev, rightPx: lastPx };
          persist(next);
          return next;
        });
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [sizes.rightPx]
  );

  const leftWidth = sizes.leftCollapsed ? 0 : sizes.leftPx;
  const rightWidth = sizes.rightCollapsed ? 0 : sizes.rightPx;

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Left panel: file tree */}
      {!sizes.leftCollapsed && (
        <>
          <div
            className="relative flex min-h-0 shrink-0 flex-col overflow-hidden"
            style={{ width: leftWidth }}
          >
            <div className="absolute right-2 top-2 z-20">
              <button
                onClick={() => update({ leftCollapsed: true })}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
                title="collaps file tree"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
            {left}
          </div>
          <Separator onMouseDown={onLeftSeparatorDown} direction="left" />
        </>
      )}

      {/* Center panel: editor + preview */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="absolute left-2 top-2 z-20 flex gap-1">
          {sizes.leftCollapsed && (
            <button
              onClick={() => update({ leftCollapsed: false })}
              className="flex h-6 w-6 items-center justify-center rounded bg-white/80 text-ink-400 hover:bg-cream-200 dark:bg-dark-surface/80 dark:hover:bg-dark-surface2 transition-colors shadow-sm"
              title="sho file tree"
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
        </div>
        <div className="absolute right-2 top-2 z-20 flex gap-1">
          {sizes.rightCollapsed && (
            <button
              onClick={() => update({ rightCollapsed: false })}
              className="flex h-6 w-6 items-center justify-center rounded bg-white/80 text-ink-400 hover:bg-cream-200 dark:bg-dark-surface/80 dark:hover:bg-dark-surface2 transition-colors shadow-sm"
              title="sho chat"
            >
              <PanelRightOpen size={14} />
            </button>
          )}
        </div>
        {center}
      </div>

      {/* Right panel: chat */}
      {!sizes.rightCollapsed && (
        <>
          <Separator onMouseDown={onRightSeparatorDown} direction="right" />
          <div
            className="relative flex min-h-0 shrink-0 flex-col overflow-hidden"
            style={{ width: rightWidth, minWidth: MIN_RIGHT }}
          >
            <div className="absolute left-2 top-2 z-20">
              <button
                onClick={() => update({ rightCollapsed: true })}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2 transition-colors"
                title="collaps chat"
              >
                <PanelRightClose size={14} />
              </button>
            </div>
            {right}
          </div>
        </>
      )}
    </div>
  );
}
