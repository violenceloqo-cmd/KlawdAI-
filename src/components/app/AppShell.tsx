"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUsernameFromAuthUser } from "@/lib/auth-username";
import { useAppStore } from "@/lib/store";
import { isChatFont } from "@/lib/chat-font";
import type { Theme } from "@/lib/store";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SearchChatsModal } from "@/components/sidebar/SearchChatsModal";
import { ToastContainer } from "@/components/ui/Toast";
import { getOrCreateClientSessionKey } from "@/lib/client-session-key";

export interface AppUser {
  id: string;
  username: string;
  display_name: string;
}

const AppUserContext = createContext<AppUser | null>(null);

export function useAppUser(): AppUser | null {
  return useContext(AppUserContext);
}

function LoadingScreen() {
  // Defer <Image> until after mount so SSR + first client paint match (avoids hydration
  // mismatches when RSC cache / HMR lags behind the client bundle).
  const [logoReady, setLogoReady] = useState(false);
  useEffect(() => {
    setLogoReady(true);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-dark-bg">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl">
          {logoReady ? (
            <Image
              src="/favicon.png"
              alt="Klawd"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
              priority
              unoptimized
            />
          ) : (
            <div
              className="h-24 w-24 animate-pulse rounded-3xl bg-neutral-300/80 dark:bg-white/10"
              aria-hidden
            />
          )}
        </div>
        <p className="text-sm text-neutral-500 dark:text-cream-500">
          loadin Klawd...
        </p>
      </div>
    </div>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  const setConversations = useAppStore((s) => s.setConversations);
  const setActiveConversationId = useAppStore((s) => s.setActiveConversationId);
  const setTheme = useAppStore((s) => s.setTheme);
  const setChatFont = useAppStore((s) => s.setChatFont);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();

      const username = getUsernameFromAuthUser(authUser);
      setUser({
        id: authUser.id,
        username,
        display_name: profile.display_name || username,
      });

      const t = profile.theme as string;
      if (t === "light" || t === "dark") {
        setTheme(t as Theme);
      } else {
        setTheme("dark");
      }
      if (isChatFont(profile.chat_font)) {
        setChatFont(profile.chat_font);
      }

      const convsRes = await fetch("/api/conversations");
      const convsData = await convsRes.json();
      setConversations(convsData.conversations || []);

      const clientKey = getOrCreateClientSessionKey();
      if (clientKey) {
        void fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_key: clientKey }),
        });
      }

      const params = new URLSearchParams(window.location.search);
      const chatId = params.get("chat");
      if (chatId) {
        setActiveConversationId(chatId);
      }

      setLoading(false);
    };

    void init();
    // Intentionally once on mount; URL ?chat= is read at first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    router.push("/");
  }, [router, setActiveConversationId]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      router.push(`/?chat=${id}`, { scroll: false });
    },
    [router, setActiveConversationId]
  );

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);

  const handleSearchSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      router.push(`/?chat=${id}`, { scroll: false });
    },
    [router, setActiveConversationId]
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () =>
      mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
  }, [setSidebarOpen]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <AppUserContext.Provider value={user}>
      <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-dark-bg">
        <Sidebar
          user={user}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onNavigate={handleNavigate}
          onOpenSearch={handleOpenSearch}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <SearchChatsModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectConversation={handleSearchSelectConversation}
        />
        <ToastContainer />
      </div>
    </AppUserContext.Provider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
