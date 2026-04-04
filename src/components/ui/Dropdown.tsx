"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DropdownCloseContext = createContext<(() => void) | null>(null);

export function useDropdownClose() {
  return useContext(DropdownCloseContext);
}

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  side?: "top" | "bottom";
  className?: string;
  contentClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "left",
  side = "bottom",
  className = "",
  contentClassName = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const position =
    side === "top"
      ? align === "right"
        ? "bottom-full right-0 mb-1"
        : "bottom-full left-0 mb-1"
      : align === "right"
        ? "top-full right-0 mt-1"
        : "top-full left-0 mt-1";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <DropdownCloseContext.Provider value={close}>
          <div
            className={`absolute z-50 min-w-[220px] rounded-2xl border border-cream-200 bg-white p-2 shadow-lg dark:border-dark-border dark:bg-dark-surface2 ${position} ${contentClassName}`}
          >
            {children}
          </div>
        </DropdownCloseContext.Provider>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  icon?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  danger?: boolean;
}

export function DropdownItem({
  onClick,
  icon,
  trailing,
  children,
  danger,
}: DropdownItemProps) {
  const closeDropdown = useContext(DropdownCloseContext);

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        closeDropdown?.();
      }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          : "text-ink-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-sidebar-row-hover"
      }`}
    >
      {icon && <span className="shrink-0 opacity-90">{icon}</span>}
      <span className="min-w-0 flex-1 text-left">{children}</span>
      {trailing && (
        <span className="shrink-0 text-ink-400 dark:text-neutral-500">
          {trailing}
        </span>
      )}
    </button>
  );
}

export function DropdownDivider() {
  return (
    <div
      className="my-1 h-px bg-cream-200 dark:bg-dark-border"
      role="separator"
    />
  );
}
