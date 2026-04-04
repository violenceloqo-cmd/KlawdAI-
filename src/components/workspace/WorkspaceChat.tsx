"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { MessageList, type Message } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { toast } from "@/components/ui/Toast";
import {
  buildSkillSystemPrompt,
  useUserSkillsStore,
} from "@/lib/user-skills-store";
import { chatFontClassName } from "@/lib/chat-font";
import { GitHubMarkIcon } from "@/components/icons/GitHubMarkIcon";

interface WorkspaceChatProps {
  projectId: string;
  projectName: string;
  onFilesWritten?: () => void;
  onGitHubPush?: () => void;
  githubPushDisabled?: boolean;
}

export function WorkspaceChat({
  projectId,
  projectName,
  onFilesWritten,
  onGitHubPush,
  githubPushDisabled = false,
}: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const loadedConvRef = useRef<string | null>(null);

  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const setActiveConversationId = useAppStore((s) => s.setActiveConversationId);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const extendedThinking = useAppStore((s) => s.extendedThinking);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const setIsStreaming = useAppStore((s) => s.setIsStreaming);
  const conversations = useAppStore((s) => s.conversations);
  const addConversation = useAppStore((s) => s.addConversation);
  const updateConversation = useAppStore((s) => s.updateConversation);
  const chatFont = useAppStore((s) => s.chatFont);
  const chatMode = useAppStore((s) => s.chatMode);
  const pendingChatPrefill = useAppStore((s) => s.pendingChatPrefill);
  const setPendingChatPrefill = useAppStore((s) => s.setPendingChatPrefill);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as "user" | "assistant",
            content: m.content as string,
            thinking_content: m.thinking_content as string | null,
            feedback: m.feedback as "up" | "down" | null,
          }))
        );
      }
    } catch {
      toast("fayld 2 lode mesajes", "error");
    }
  }, []);

  useEffect(() => {
    if (activeConversationId && activeConversationId !== loadedConvRef.current) {
      if (isStreaming) {
        loadedConvRef.current = activeConversationId;
        return;
      }
      loadedConvRef.current = activeConversationId;
      loadMessages(activeConversationId);
    } else if (!activeConversationId) {
      loadedConvRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, loadMessages, isStreaming]);

  useEffect(() => {
    if (!pendingChatPrefill) return;
    setInput(pendingChatPrefill);
    setPendingChatPrefill(null);
  }, [pendingChatPrefill, setPendingChatPrefill]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsgId = crypto.randomUUID();
    const userMsg: Message = { id: userMsgId, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thinking_content: extendedThinking ? "" : null,
      is_thinking: extendedThinking,
      chat_mode: chatMode,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    setIsStreaming(true);
    const abort = new AbortController();
    abortRef.current = abort;

    let convId = activeConversationId;

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ];

      const skillContext = buildSkillSystemPrompt(
        useUserSkillsStore.getState().skills
      );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          model: selectedModel,
          conversationId: convId,
          extendedThinking,
          chatMode,
          projectId,
          ...(skillContext ? { skillContext } : {}),
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const newConvId = res.headers.get("x-conversation-id");
      if (newConvId && !convId) {
        convId = newConvId;
        setActiveConversationId(newConvId);

        const title = trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : "");
        addConversation({
          id: newConvId,
          title,
          model: selectedModel,
          starred: false,
          shared: false,
          share_id: null,
          project_id: projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: newConvId, firstMessage: trimmed }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.title) updateConversation(newConvId, { title: data.title });
          })
          .catch(() => {});
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let accContent = "";
      let accThinking = "";
      let thinkingDone = false;
      const thinkingStartTime = Date.now();
      let lineBuf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuf += decoder.decode(value, { stream: true });
        const parts = lineBuf.split("\n");
        lineBuf = parts.pop() ?? "";

        for (const line of parts) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data: ")) continue;
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "thinking") {
              accThinking += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        thinking_content: accThinking,
                        is_thinking: true,
                        thinking_duration: Math.round((Date.now() - thinkingStartTime) / 1000),
                      }
                    : m
                )
              );
            } else if (parsed.type === "content") {
              if (!thinkingDone && extendedThinking) thinkingDone = true;
              accContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accContent,
                        is_thinking: false,
                        thinking_duration: extendedThinking
                          ? Math.round((Date.now() - thinkingStartTime) / 1000)
                          : undefined,
                      }
                    : m
                )
              );
            } else if (parsed.type === "files_written") {
              const count = parsed.count ?? 0;
              toast(`${count} file${count === 1 ? "" : "z"} riten 2 projek`, "success");
              onFilesWritten?.();
            } else if (parsed.type === "error") {
              throw new Error(typeof parsed.content === "string" ? parsed.content : "Request failed");
            }
          } catch (e) {
            if (e instanceof SyntaxError) { /* skip */ } else throw e;
          }
        }
      }

      if (convId) void loadMessages(convId);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        /* user stopped */
      } else {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        toast(errorMessage, "error");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: `Error: ${errorMessage}` } : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleRetry = async (messageId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 1) return;
    const previousMessages = messages.slice(0, msgIndex);
    setMessages(previousMessages);
    const lastUserMsg = previousMessages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) setInput(lastUserMsg.content);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
  };

  const projectConversations = conversations.filter((c) => c.project_id === projectId);

  return (
    <div className={`flex h-full flex-col bg-white dark:bg-dark-bg ${chatFontClassName(chatFont)}`}>
      {/* Header — chat picker left, GitHub push top-right */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {projectConversations.length > 0 && (
            <select
              value={activeConversationId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setActiveConversationId(val);
                else handleNewChat();
              }}
              className="h-7 max-w-[160px] truncate rounded border border-neutral-300 bg-white px-2 text-xs text-ink-700 dark:border-dark-border dark:bg-dark-surface dark:text-cream-300"
            >
              <option value="">noo chat</option>
              {projectConversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
        {onGitHubPush && (
          <button
            type="button"
            onClick={onGitHubPush}
            disabled={githubPushDisabled}
            title="push 2 GitHub"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-neutral-900 text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"
          >
            <GitHubMarkIcon size={17} className="text-white" />
          </button>
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 || isStreaming ? (
        <MessageList
          messages={messages}
          userName="You"
          isStreaming={isStreaming}
          onRetry={handleRetry}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-ink-400 dark:text-cream-500">
            start chattin with Klawd abowt <strong className="text-ink-600 dark:text-cream-300">{projectName}</strong>
          </p>
          <p className="mt-1 text-xs text-ink-300 dark:text-cream-600">
            use Plan mode 2 architekt, Code mode 2 bild, Ask mode 2 get anserz
          </p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={handleStop}
        placeholder={`mesaj Klawd abowt ${projectName}...`}
        hideProjectPicker
      />
    </div>
  );
}
