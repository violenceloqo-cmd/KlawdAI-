import { Octokit } from "@octokit/rest";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: ghConn } = await supabase
    .from("github_connections")
    .select("access_token, github_username")
    .eq("user_id", user.id)
    .single();

  if (!ghConn) {
    return Response.json(
      { error: "GitHub not connected. Link your account first." },
      { status: 400 }
    );
  }

  let body: { repoName?: string; isPrivate?: boolean; description?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const repoName = (body.repoName ?? project.name)
    .trim()
    .replace(/[^\w\-. ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);

  if (!repoName) {
    return Response.json({ error: "Invalid repo name" }, { status: 400 });
  }

  const { data: files } = await supabase
    .from("project_code_files")
    .select("path, content")
    .eq("project_id", projectId);

  if (!files?.length) {
    return Response.json({ error: "No files to push" }, { status: 400 });
  }

  try {
    const octokit = new Octokit({ auth: ghConn.access_token });

    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: body.isPrivate ?? false,
      description: body.description ?? `Created with Klawd`,
      auto_init: true,
    });

    const owner = repo.owner.login;
    const name = repo.name;

    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: name,
      ref: "heads/main",
    });
    const baseSha = ref.object.sha;

    const treeItems = await Promise.all(
      files.map(async (f) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo: name,
          content: Buffer.from(f.content ?? "").toString("base64"),
          encoding: "base64",
        });
        return {
          path: f.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    const { data: tree } = await octokit.git.createTree({
      owner,
      repo: name,
      base_tree: baseSha,
      tree: treeItems,
    });

    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo: name,
      message: "Initial commit from Klawd",
      tree: tree.sha,
      parents: [baseSha],
    });

    await octokit.git.updateRef({
      owner,
      repo: name,
      ref: "heads/main",
      sha: commit.sha,
    });

    return Response.json({
      url: repo.html_url,
      fullName: repo.full_name,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "GitHub API error";
    const status =
      message.includes("already exists") ||
      message.includes("name already exists")
        ? 409
        : 500;
    return Response.json({ error: message }, { status });
  }
}
