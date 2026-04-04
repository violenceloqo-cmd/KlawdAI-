import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase.from("usage_logs").delete().eq("user_id", user.id);
  await supabase.from("messages").delete().in(
    "conversation_id",
    (
      await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
    ).data?.map((c) => c.id) || []
  );
  await supabase.from("conversations").delete().eq("user_id", user.id);
  await supabase.from("project_documents").delete().in(
    "project_id",
    (
      await supabase.from("projects").select("id").eq("user_id", user.id)
    ).data?.map((p) => p.id) || []
  );
  await supabase.from("projects").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  return Response.json({ success: true });
}
