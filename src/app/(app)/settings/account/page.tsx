"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useAppUser } from "@/components/app/AppShell";
import { getOrCreateClientSessionKey } from "@/lib/client-session-key";
import { toast } from "@/components/ui/Toast";
import { AlertTriangle, Copy, Check, MoreHorizontal } from "lucide-react";

interface SessionRow {
  id: string;
  device_label: string;
  location_label: string;
  created_at: string;
  last_seen_at: string;
  is_current: boolean;
}

function formatSessionTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AccountActionRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-200 py-5 last:border-b-0 dark:border-neutral-700 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const appUser = useAppUser();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState<"all" | "local" | null>(null);

  const loadSessions = useCallback(async () => {
    const key = getOrCreateClientSessionKey();
    const q = key
      ? `?client_key=${encodeURIComponent(key)}`
      : "";
    const res = await fetch(`/api/sessions${q}`);
    if (!res.ok) {
      setSessions([]);
      setSessionsLoading(false);
      return;
    }
    const data = await res.json();
    setSessions(data.sessions || []);
    setSessionsLoading(false);
  }, []);

  useEffect(() => {
    const key = getOrCreateClientSessionKey();
    if (key) {
      void fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_key: key }),
      }).then(() => loadSessions());
    } else {
      void loadSessions();
    }
  }, [loadSessions]);

  const handleCopyUserId = async () => {
    if (!appUser?.id) return;
    try {
      await navigator.clipboard.writeText(appUser.id);
      setCopiedId(true);
      toast("copeed 2 clipbord", "success");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast("cudnt kopy", "error");
    }
  };

  const handleLogoutAllDevices = async () => {
    setLogoutBusy("all");
    try {
      const clearRes = await fetch("/api/sessions", { method: "DELETE" });
      if (!clearRes.ok) {
        toast("cudnt cleer seshun log", "error");
        setLogoutBusy(null);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast(error.message, "error");
        setLogoutBusy(null);
        return;
      }
      toast("sinedd owt evreewhere", "success");
      router.push("/login");
      router.refresh();
    } catch {
      toast("sine owt fayld", "error");
    }
    setLogoutBusy(null);
  };

  const handleLogoutThisBrowser = async () => {
    setLogoutBusy("local");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        toast(error.message, "error");
        setLogoutBusy(null);
        return;
      }
      toast("sinedd owt", "success");
      router.push("/login");
      router.refresh();
    } catch {
      toast("sine owt fayld", "error");
    }
    setLogoutBusy(null);
  };

  const handleRemoveSessionRow = async (id: string) => {
    setMenuSessionId(null);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("cudnt remuv seshun", "error");
        return;
      }
      toast("seshun remuvd frum list", "success");
      void loadSessions();
    } catch {
      toast("cudnt remuv seshun", "error");
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);

    try {
      await fetch("/api/account", { method: "DELETE" });

      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" });

      toast("akount deleetd", "success");
      router.push("/login");
    } catch {
      toast("fayld 2 deleet akount", "error");
    }

    setDeleting(false);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
        Akount
      </h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
        manaje sine-in, devises, and akount deleshun.
      </p>

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="px-4 sm:px-5">
          <AccountActionRow label="log owt of all devises">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={logoutBusy !== null}
              onClick={handleLogoutAllDevices}
              className="border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {logoutBusy === "all" ? "sining owt…" : "log owt"}
            </Button>
          </AccountActionRow>

          <AccountActionRow
            label="sine owt on dis browzer"
            description="endz da seshun in dis browzer onlee. othr devises stay sinedd in until dey expier or u log owt evreewhere."
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={logoutBusy !== null}
              onClick={handleLogoutThisBrowser}
            >
              {logoutBusy === "local" ? "sining owt…" : "sine owt"}
            </Button>
          </AccountActionRow>

          <AccountActionRow label="deleet ur akount">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              deleet akount
            </Button>
          </AccountActionRow>

          <AccountActionRow label="Akount ID">
            <div className="flex max-w-full items-center gap-2">
              <code className="truncate rounded-md bg-neutral-100 px-2 py-1.5 text-xs text-neutral-700 dark:bg-dark-surface2 dark:text-cream-300">
                {appUser?.id ?? "—"}
              </code>
              <button
                type="button"
                onClick={handleCopyUserId}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-dark-surface2 dark:hover:text-cream-200"
                aria-label="kopy akount ID"
              >
                {copiedId ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </AccountActionRow>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
          Aktiv seshunz
        </h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          devises n browzers dat hav reesently uzed ur akount. removin a
          row onlee cleers it frum dis list; uze “log owt of all devises” 2
          invalidayt seshunz evreewhere.
        </p>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-dark-border dark:bg-dark-surface2/80">
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-cream-200">
                  Devis
                </th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-cream-200">
                  Locashun
                </th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-cream-200">
                  Creeated
                </th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-cream-200">
                  Updaytd
                </th>
                <th className="w-12 px-2 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sessionsLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    loadin seshunz…
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    no seshunz rekordid yet. opin da app in dis browzer 2
                    creat wun.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-3 text-neutral-800 dark:text-cream-100">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {s.device_label}
                        {s.is_current ? (
                          <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-dark-surface3 dark:text-cream-200">
                            Curent
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-cream-300">
                      {s.location_label}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-cream-300">
                      {formatSessionTime(s.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-cream-300">
                      {formatSessionTime(s.last_seen_at)}
                    </td>
                    <td className="relative px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuSessionId((id) =>
                            id === s.id ? null : s.id
                          )
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surface2"
                        aria-label="seshun akshunz"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuSessionId === s.id ? (
                        <>
                          <button
                            type="button"
                            className="fixed inset-0 z-40 cursor-default"
                            aria-label="cloes menoo"
                            onClick={() => setMenuSessionId(null)}
                          />
                          <div className="absolute right-2 top-full z-50 mt-1 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                            <button
                              type="button"
                              onClick={() => handleRemoveSessionRow(s.id)}
                              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-cream-200 dark:hover:bg-dark-surface2"
                            >
                              remuv frum list
                            </button>
                          </div>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConfirmText("");
        }}
        title="deleet akount"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600 dark:text-cream-400">
            dis iz permunent. all ur conversashunz, projektz, and data wil
            b permunently deleetd. dis akshun cant b undun.
          </p>
          <Input
            label='taip "DELETE" 2 konfirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setConfirmText("");
              }}
            >
              Kancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "DELETE" || deleting}
              onClick={handleDelete}
            >
              {deleting ? "deleeting..." : "deleet permunently"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
