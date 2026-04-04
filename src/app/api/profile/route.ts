import { createClient } from "@/lib/supabase/server";
import { getUsernameFromAuthUser } from "@/lib/auth-username";

export async function GET() {
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

  return Response.json({
    ...profile,
    username: getUsernameFromAuthUser(user),
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) updates.display_name = body.display_name;
  if (body.theme !== undefined) {
    if (body.theme !== "light" && body.theme !== "dark") {
      return Response.json({ error: "Invalid theme" }, { status: 400 });
    }
    updates.theme = body.theme;
  }
  if (body.chat_font !== undefined) {
    const allowed = ["default", "sans", "system", "dyslexic"];
    if (!allowed.includes(body.chat_font)) {
      return Response.json({ error: "Invalid chat_font" }, { status: 400 });
    }
    updates.chat_font = body.chat_font;
  }
  if (body.allow_model_improvement !== undefined)
    updates.allow_model_improvement = body.allow_model_improvement;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
