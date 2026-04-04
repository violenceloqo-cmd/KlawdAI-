"use client";

import { useState, useEffect, use } from "react";
import { AppLogo } from "@/components/brand/AppLogo";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { ThinkingBlock } from "@/components/chat/ThinkingBlock";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking_content?: string | null;
}

interface SharedConversation {
  title: string;
  model: string;
  created_at: string;
  messages: Message[];
}

export default function SharedConversationPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = use(params);
  const [conversation, setConversation] = useState<SharedConversation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setConversation)
      .catch(() => setError("dis conversashun iz not avaylabl or haz been unshaird."))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <p className="text-sm text-ink-400">loadin shaird conversashun...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <div className="text-center">
          <AppLogo size={32} className="mx-auto mb-3 rounded-xl opacity-80" />
          <p className="text-sm text-ink-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-bg">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 border-b border-cream-200 pb-4 dark:border-dark-border">
          <div className="flex items-center gap-2 mb-1">
            <AppLogo size={18} className="h-[18px] w-[18px] shrink-0 rounded" />
            <span className="text-xs font-medium text-terracotta-500 uppercase">
              shaird conversashun
            </span>
          </div>
          <h1 className="text-lg font-semibold text-ink-900 dark:text-cream-100">
            {conversation.title}
          </h1>
          <p className="text-xs text-ink-400 dark:text-cream-500">
            {new Date(conversation.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-2">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className="py-3">
              <div className="mb-1 text-xs font-medium text-ink-500 dark:text-cream-400">
                {msg.role === "user" ? "Uzer" : "Klawd"}
              </div>
              {msg.role === "assistant" && msg.thinking_content && (
                <ThinkingBlock content={msg.thinking_content} />
              )}
              {msg.role === "assistant" ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p className="text-sm text-ink-800 whitespace-pre-wrap dark:text-cream-200">
                  {msg.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
