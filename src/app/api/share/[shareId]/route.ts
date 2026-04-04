import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, model, created_at")
    .eq("share_id", shareId)
    .eq("shared", true)
    .single();

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, thinking_content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return Response.json({
    ...conversation,
    messages: messages || [],
  });
}
