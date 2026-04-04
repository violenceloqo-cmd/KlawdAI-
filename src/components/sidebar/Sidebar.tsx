"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { SidebarNav } from "./SidebarNav";
import { ConversationList } from "./ConversationList";
import { UserProfileMenu } from "./UserProfileMenu";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
  Briefcase,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: { id: string; username: string; display_name: string };
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export function Sidebar({
  user,
  onNewChat,
  onSelectConversation,
  onNavigate,
  onOpenSearch,
}: SidebarProps) {
  const pathname = usePathname();
  const customizeActive = pathname?.startsWith("/customize") ?? false;
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        onNewChat();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleSidebar, onNewChat]);

  const primaryBtnClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
      "text-neutral-600 dark:text-[#d1d1d1]",
      active
        ? "bg-neutral-200/90 dark:bg-sidebar-row-active dark:hover:bg-sidebar-row-active"
        : "hover:bg-neutral-200/80 dark:hover:bg-sidebar-row-hover"
    );

  const iconOnlyPrimaryClass = (active: boolean) =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors dark:text-[#d1d1d1]",
      active
        ? "bg-neutral-200/90 dark:bg-sidebar-row-active dark:hover:bg-sidebar-row-active"
        : "hover:bg-neutral-200/80 dark:hover:bg-sidebar-row-hover"
    );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r transition-all duration-200",
        "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-dark-bg",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {sidebarOpen ? (
        <>
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex min-w-0 items-center">
              <span className="font-display truncate text-lg font-medium tracking-tight text-neutral-900 dark:text-white">
                Klawd
              </span>
            </div>
            <Tooltip content="cloes sidbar (⌘.)" side="bottom">
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  "text-neutral-600 hover:bg-neutral-200/80 dark:text-[#d1d1d1] dark:hover:bg-sidebar-row-hover"
                )}
                aria-label="Toggle sidebar"
              >
                <PanelLeftClose size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-0.5 px-2 pb-2">
            <Tooltip content="noo chat (⌘⇧N)" side="right">
              <button
                type="button"
                onClick={onNewChat}
                className={primaryBtnClass(false)}
              >
                <PlusCircle size={18} className="shrink-0 stroke-[1.5]" />
                <span>Noo chat</span>
              </button>
            </Tooltip>
            <Tooltip content="surch chatz" side="right">
              <button
                type="button"
                onClick={onOpenSearch}
                className={primaryBtnClass(false)}
              >
                <Search size={18} className="shrink-0 stroke-[1.5]" />
                <span>Surch</span>
              </button>
            </Tooltip>
            <Tooltip content="Kustomize" side="right">
              <button
                type="button"
                onClick={() => onNavigate("/customize")}
                className={primaryBtnClass(customizeActive)}
              >
                <Briefcase size={18} className="shrink-0 stroke-[1.5]" />
                <span>Kustomize</span>
              </button>
            </Tooltip>
          </div>

          <div className="mx-3 border-t border-neutral-200 dark:border-white/[0.08]" />

          <SidebarNav collapsed={false} onNavigate={onNavigate} />
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1 border-b border-neutral-200 px-2 py-2 dark:border-white/[0.08]">
            <Tooltip content="opin sidbar (⌘.)" side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                className={iconOnlyPrimaryClass(false)}
                aria-label="Open sidebar"
              >
                <PanelLeftOpen size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip content="noo chat (⌘⇧N)" side="right">
              <button
                type="button"
                onClick={onNewChat}
                className={iconOnlyPrimaryClass(false)}
              >
                <PlusCircle size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip content="surch chatz" side="right">
              <button
                type="button"
                onClick={onOpenSearch}
                className={iconOnlyPrimaryClass(false)}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip content="Kustomize" side="right">
              <button
                type="button"
                onClick={() => onNavigate("/customize")}
                className={iconOnlyPrimaryClass(customizeActive)}
              >
                <Briefcase size={18} strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>

          <SidebarNav collapsed onNavigate={onNavigate} />
        </>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationList
          collapsed={!sidebarOpen}
          onSelectConversation={onSelectConversation}
        />
      </div>

      <UserProfileMenu
        user={user}
        collapsed={!sidebarOpen}
        onNavigate={onNavigate}
      />
    </aside>
  );
}
