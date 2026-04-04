import { createClient } from "@/lib/supabase/server";
import {
  clientIpFromRequest,
  deviceLabelFromUserAgent,
  locationLabelFromRequest,
} from "@/lib/device-from-ua";

/** Record or refresh this browser session (called from the app shell). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { client_key?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client_key =
    typeof body.client_key === "string" && body.client_key.length > 0
      ? body.client_key
      : null;

  if (!client_key) {
    return Response.json({ error: "client_key required" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") || "";
  const device_label = deviceLabelFromUserAgent(ua);
  const location_label = locationLabelFromRequest(req);
  const ip_address = clientIpFromRequest(req);
  const now = new Date().toISOString();

  const { error } = await supabase.from("user_sessions").upsert(
    {
      user_id: user.id,
      client_key,
      device_label,
      location_label,
      ip_address,
      user_agent: ua,
      last_seen_at: now,
    },
    { onConflict: "user_id,client_key" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

/** List sessions for the signed-in user. Pass ?client_key= to mark the current row. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const currentKey = url.searchParams.get("client_key") || "";

  const { data, error } = await supabase
    .from("user_sessions")
    .select(
      "id, client_key, device_label, location_label, created_at, last_seen_at"
    )
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const sessions = (data || []).map((row) => ({
    id: row.id,
    device_label: row.device_label,
    location_label: row.location_label,
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
    is_current: currentKey.length > 0 && row.client_key === currentKey,
  }));

  return Response.json({ sessions });
}

/** Remove all stored session rows for this user (call before global sign-out). */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_sessions")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
