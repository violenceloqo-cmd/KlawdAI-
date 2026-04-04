"use client";

import { use, useEffect, useState } from "react";
import { ProjectIde } from "@/components/ide/ProjectIde";
import { useGithubOAuthReturnToast } from "@/hooks/use-github-oauth-return";

export default function ProjectIdePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [name, setName] = useState<string | null>(null);

  useGithubOAuthReturnToast();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!cancelled && res.ok && data.name) setName(data.name);
      else if (!cancelled) setName("projek");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (name === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream-100 text-sm text-ink-500 dark:bg-dark-bg">
        loadin IDE…
      </div>
    );
  }

  return <ProjectIde projectId={id} projectName={name} />;
}
