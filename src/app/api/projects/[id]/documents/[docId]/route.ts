import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id: projectId, docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doc } = await supabase
    .from("project_documents")
    .select("file_path, project_id")
    .eq("id", docId)
    .single();

  if (!doc) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  await supabase.storage.from("project-documents").remove([doc.file_path]);

  const { error } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", docId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
