import { createClient } from "@/lib/supabase/server";
import { sanitizeCodePath } from "@/lib/code-path";

const MAX_CONTENT_CHARS = 2_000_000;

async function assertOwnProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
) {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function GET(
  _req: Request,
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

  if (!(await assertOwnProject(supabase, user.id, projectId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: files, error } = await supabase
    .from("project_code_files")
    .select("id, path, content, updated_at")
    .eq("project_id", projectId)
    .order("path", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ files: files ?? [] });
}

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

  if (!(await assertOwnProject(supabase, user.id, projectId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: { path?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let path: string;
  try {
    path = sanitizeCodePath(body.path ?? "");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bad path" },
      { status: 400 }
    );
  }

  const content = typeof body.content === "string" ? body.content : "";
  if (content.length > MAX_CONTENT_CHARS) {
    return Response.json({ error: "File too large" }, { status: 413 });
  }

  const { data, error } = await supabase
    .from("project_code_files")
    .insert({
      project_id: projectId,
      path,
      content,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "File already exists" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(
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

  if (!(await assertOwnProject(supabase, user.id, projectId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: { path?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let path: string;
  try {
    path = sanitizeCodePath(body.path ?? "");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bad path" },
      { status: 400 }
    );
  }

  const content = typeof body.content === "string" ? body.content : "";
  if (content.length > MAX_CONTENT_CHARS) {
    return Response.json({ error: "File too large" }, { status: 413 });
  }

  const { data, error } = await supabase
    .from("project_code_files")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("path", path)
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  return Response.json(data);
}

export async function DELETE(
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

  if (!(await assertOwnProject(supabase, user.id, projectId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rawPath = new URL(req.url).searchParams.get("path");
  if (!rawPath) {
    return Response.json({ error: "Missing path" }, { status: 400 });
  }

  let path: string;
  try {
    path = sanitizeCodePath(decodeURIComponent(rawPath));
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Bad path" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("project_code_files")
    .delete()
    .eq("project_id", projectId)
    .eq("path", path);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
