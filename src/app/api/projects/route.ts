import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";

  let query = supabase
    .from("projects")
    .select("*, conversations:conversations(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (archived) {
    query = query.eq("archived", true);
  } else {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projects: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: body.name || "Untitled Project",
      description: body.description || "",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
