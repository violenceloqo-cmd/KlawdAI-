"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  useDropdownClose,
} from "@/components/ui/Dropdown";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/ui/Toast";
import {
  Settings,
  Globe,
  CircleHelp,
  Info,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface UserProfileMenuProps {
  user: { id: string; username: string; display_name: string };
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

function LanguageMenuRow() {
  const [subOpen, setSubOpen] = useState(false);
  const closeDropdown = useDropdownClose();

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setSubOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-sidebar-row-hover"
      >
        <Globe size={16} className="shrink-0 opacity-90" />
        <span className="min-w-0 flex-1">Langwaje</span>
        <ChevronRight
          size={16}
          className="shrink-0 text-ink-400 dark:text-neutral-500"
        />
      </button>
      {subOpen && (
        <div className="absolute bottom-0 left-full z-[60] ml-1 min-w-[148px] rounded-xl border border-cream-200 bg-white p-1 shadow-lg dark:border-dark-border dark:bg-dark-surface2">
          <button
            type="button"
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-sidebar-row-hover"
            onClick={() => {
              setSubOpen(false);
              closeDropdown?.();
            }}
          >
            Inglish
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileDropdownContent({
  onNavigate,
  onLogout,
  logoutBusy,
}: {
  onNavigate: (path: string) => void;
  onLogout: () => void;
  logoutBusy: boolean;
}) {
  return (
    <>
      <DropdownItem
        icon={<Settings size={16} />}
        onClick={() => onNavigate("/settings/general")}
      >
        Setingz
      </DropdownItem>
      <LanguageMenuRow />
      <DropdownItem
        icon={<CircleHelp size={16} />}
        onClick={() =>
          toast("halp centr iz comin soon lol.", "info")
        }
      >
        Git Halp
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem
        icon={<Info size={16} />}
        trailing={<ChevronRight size={16} />}
        onClick={() => onNavigate("/settings/general")}
      >
        Lern moar
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem
        icon={<LogOut size={16} />}
        onClick={() => {
          if (!logoutBusy) onLogout();
        }}
        danger
      >
        {logoutBusy ? "sining owt…" : "log owt"}
      </DropdownItem>
    </>
  );
}

export function UserProfileMenu({
  user,
  collapsed,
  onNavigate,
}: UserProfileMenuProps) {
  const router = useRouter();
  const [logoutBusy, setLogoutBusy] = useState(false);

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        toast(error.message, "error");
        setLogoutBusy(false);
        return;
      }
      toast("sinedd owt", "success");
      router.push("/");
      router.refresh();
    } catch {
      toast("sine owt fayld", "error");
    }
    setLogoutBusy(false);
  };

  const trigger = (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-200/80 dark:hover:bg-sidebar-row-hover ${collapsed ? "justify-center px-0" : ""}`}
    >
      <Avatar name={user.display_name || user.username} size="sm" />
      {!collapsed && (
        <span className="truncate text-sm font-medium text-neutral-800 dark:text-cream-300">
          {user.display_name || user.username}
        </span>
      )}
    </button>
  );

  const menu = (
    <Dropdown trigger={trigger} align="left" side="top">
      <ProfileDropdownContent
        onNavigate={onNavigate}
        onLogout={handleLogout}
        logoutBusy={logoutBusy}
      />
    </Dropdown>
  );

  if (collapsed) {
    return (
      <div className="border-t border-neutral-200 px-2 py-2 dark:border-white/[0.08]">
        <Tooltip content="profiel menoo" side="right">
          {menu}
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-200 px-2 py-2 dark:border-white/[0.08]">
      {menu}
    </div>
  );
}
