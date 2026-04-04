import { createClient } from "@/lib/supabase/server";
import { getModelById, calculateCost } from "@/lib/models";
import { sanitizeCodePath } from "@/lib/code-path";
import { MODE_PROMPTS, FENCE } from "@/lib/chat-prompts";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Parse code-mode file blocks (filepath:path format) from assistant output. */
function extractFileBlocks(
  text: string
): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  const regex = new RegExp(FENCE + "filepath:([^\\n]+)\\n([\\s\\S]*?)" + FENCE, "g");
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawPath = match[1].trim();
    const content = match[2];
    try {
      const path = sanitizeCodePath(rawPath);
      results.push({ path, content });
    } catch {
      // skip invalid paths
    }
  }
  return results;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return new Response(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      { status: 500 }
    );
  }

  const {
    messages,
    model: modelId,
    conversationId,
    extendedThinking,
    skillContext,
    chatMode = "code",
    projectId,
  } = await req.json();

  const modelDef = getModelById(modelId);

  let convId = conversationId;
  if (!convId) {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "noo chat",
        model: modelId,
        project_id: projectId || null,
      })
      .select("id")
      .single();

    if (error || !conv) {
      return new Response("Failed to create conversation", { status: 500 });
    }
    convId = conv.id;
  }

  const lastUserMessage = messages[messages.length - 1];
  await supabase.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: lastUserMessage.content,
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const apiMessages = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  let existingFilesContext = "";
  if (projectId) {
    try {
      const { data: codeFiles } = await supabase
        .from("project_code_files")
        .select("path, content")
        .eq("project_id", projectId)
        .order("path");

      if (codeFiles && codeFiles.length > 0) {
        const fileList = codeFiles.map((f: { path: string; content: string }) => f.path).join("\n");
        const fileSummary = codeFiles
          .map((f: { path: string; content: string }) => `--- ${f.path} ---\n${f.content.slice(0, 800)}${f.content.length > 800 ? "\n... (truncated)" : ""}`)
          .join("\n\n");

        existingFilesContext = `The project already has these files:\n${fileList}\n\nFile contents (may be truncated):\n${fileSummary}\n\nWhen building new features, work with the existing codebase. When modifying files, output the FULL updated content.`;
      }
    } catch {
      // table may not exist; skip
    }
  }

  const systemPrompt = [
    MODE_PROMPTS[chatMode] ?? MODE_PROMPTS.code,
    ...(typeof skillContext === "string" && skillContext.trim()
      ? [skillContext.trim()]
      : []),
    ...(projectId && chatMode === "code"
      ? [
          "The user has an active project workspace. Files you create using the " + FENCE + "filepath:path" + FENCE + " format will be automatically saved to their project IDE. Create complete, working files.",
        ]
      : []),
    ...(existingFilesContext ? [existingFilesContext] : []),
  ].join("\n\n");

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "x-conversation-id": convId,
  });

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Kick off the streaming work in the background so the Response
  // (and its headers, including x-conversation-id) is returned immediately.
  (async () => {
    let fullContent = "";
    let thinkingContent = "";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      // Send an immediate ping so the browser receives the first byte
      // and starts processing the event stream without waiting.
      await writer.write(encoder.encode(": ping\n\n"));

      const streamParams: Record<string, unknown> = {
        model: modelDef.apiModel,
        max_tokens: extendedThinking ? 16000 : 8192,
        messages: apiMessages,
        system: systemPrompt,
      };

      if (extendedThinking && modelDef.supportsThinking) {
        streamParams.thinking = {
          type: "enabled",
          budget_tokens: 10000,
        };
        streamParams.temperature = 1;
      }

      const response = anthropic.messages.stream(
        streamParams as unknown as Anthropic.MessageCreateParamsNonStreaming
      );

      for await (const event of response) {
        if (event.type === "message_start") {
          inputTokens = event.message.usage?.input_tokens ?? 0;
        } else if (event.type === "content_block_start") {
          if (event.content_block.type === "thinking") {
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ type: "thinking_start" })}\n\n`
              )
            );
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "thinking_delta") {
            thinkingContent += event.delta.thinking;
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "thinking",
                  content: event.delta.thinking,
                })}\n\n`
              )
            );
          } else if (event.delta.type === "text_delta") {
            fullContent += event.delta.text;
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "content",
                  content: event.delta.text,
                })}\n\n`
              )
            );
          }
        } else if (event.type === "message_delta") {
          outputTokens = event.usage?.output_tokens ?? 0;
        }
      }

      const cost = calculateCost(modelDef, inputTokens, outputTokens);

      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: fullContent,
        thinking_content: thinkingContent || null,
        model: modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      });

      await supabase.from("usage_logs").insert({
        user_id: user.id,
        conversation_id: convId,
        model: modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
      });

      if (chatMode === "code" && projectId) {
        const fileBlocks = extractFileBlocks(fullContent);
        for (const { path, content } of fileBlocks) {
          try {
            const { data: existing } = await supabase
              .from("project_code_files")
              .select("id")
              .eq("project_id", projectId)
              .eq("path", path)
              .single();

            if (existing) {
              await supabase
                .from("project_code_files")
                .update({
                  content,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
            } else {
              await supabase.from("project_code_files").insert({
                project_id: projectId,
                path,
                content,
                updated_at: new Date().toISOString(),
              });
            }
          } catch {
            // table may not exist yet; skip file writes silently
          }
        }

        if (fileBlocks.length > 0) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "files_written",
                count: fileBlocks.length,
                paths: fileBlocks.map((f) => f.path),
              })}\n\n`
            )
          );
        }
      }

      await writer.write(encoder.encode(`data: [DONE]\n\n`));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error";
      try {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              content: msg,
            })}\n\n`
          )
        );
      } catch {
        // writer already closed
      }
    } finally {
      try { await writer.close(); } catch { /* already closed */ }
    }
  })();

  return new Response(readable, { headers });
}
