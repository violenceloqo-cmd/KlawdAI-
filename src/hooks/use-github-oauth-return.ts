"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/Toast";

/** After /api/auth/github/callback redirects with ?github_oauth=… — toast and strip query. */
export function useGithubOAuthReturnToast(onSuccess?: () => void) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const go = params.get("github_oauth");
    if (!go) return;

    const reason = params.get("reason");
    if (go === "success") {
      toast("GitHub konekted!", "success");
      onSuccessRef.current?.();
    } else if (go === "error") {
      const msg = reason
        ? decodeURIComponent(reason.replace(/\+/g, " "))
        : "GitHub OAuth fayld";
      toast(msg, "error");
    }

    params.delete("github_oauth");
    params.delete("reason");
    const q = params.toString();
    const url =
      window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
    window.history.replaceState({}, "", url);
  }, []);
}
