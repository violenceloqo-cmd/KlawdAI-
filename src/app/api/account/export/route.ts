import { createClient } from "@/lib/supabase/server";
import { getUsernameFromAuthUser } from "@/lib/auth-username";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id);

  const convIds = conversations?.map((c) => c.id) || [];

  const { data: messages } = convIds.length
    ? await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      username: getUsernameFromAuthUser(user),
      ...profile,
    },
    conversations: conversations?.map((conv) => ({
      ...conv,
      messages: messages?.filter((m) => m.conversation_id === conv.id) || [],
    })),
    projects,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="klawd-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
