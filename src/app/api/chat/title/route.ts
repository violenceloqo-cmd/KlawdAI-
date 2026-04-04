import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { getModelById } from "@/lib/models";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, firstMessage } = await req.json();

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const response = await anthropic.messages.create({
      model: getModelById("haiku-4-5").apiModel,
      max_tokens: 30,
      messages: [
        {
          role: "user",
          content: `Generate a very short title (3-6 words) for a conversation that starts with this message. The title should be written in intentionally misspelled/phonetic style (e.g. "halp me wif kode" instead of "help me with code"). Return ONLY the title, no quotes, no punctuation at the end:\n\n${firstMessage.slice(0, 200)}`,
        },
      ],
    });

    const title =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "noo chat";

    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    return Response.json({ title });
  } catch {
    return Response.json({ title: "noo chat" });
  }
}
