"use client";

import { usePathname } from "next/navigation";
import { MessagesSquare, Code2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

const navItems: {
  icon: typeof MessagesSquare;
  label: string;
  path: string;
  match: (path: string) => boolean;
}[] = [
  {
    icon: MessagesSquare,
    label: "Chatz",
    path: "/recents",
    match: (p) => p === "/" || p.startsWith("/recents"),
  },
  {
    icon: Code2,
    label: "Build app",
    path: "/projects",
    match: (p) => p.startsWith("/projects"),
  },
];

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname() ?? "";

  const rowClass = (active: boolean, extra?: string) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
      "text-neutral-600 hover:bg-neutral-200/80 dark:text-[#d1d1d1] dark:hover:bg-sidebar-row-hover",
      active &&
        "bg-neutral-200/90 dark:bg-sidebar-row-active dark:hover:bg-sidebar-row-active",
      collapsed && "justify-center px-0",
      extra
    );

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {navItems.map((item) => {
        const active = item.match(pathname);
        const btn = (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={rowClass(active)}
          >
            <item.icon size={18} className="shrink-0 stroke-[1.5]" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.path} content={item.label} side="right">
              {btn}
            </Tooltip>
          );
        }
        return btn;
      })}
    </nav>
  );
}
