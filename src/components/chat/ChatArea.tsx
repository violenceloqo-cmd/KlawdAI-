"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList, type Message } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "@/components/chat-header/ChatHeader";
import { MoveToProjectModal } from "@/components/projects/MoveToProjectModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { chatFontClassName } from "@/lib/chat-font";
import {
  buildSkillSystemPrompt,
  useUserSkillsStore,
} from "@/lib/user-skills-store";

interface ChatAreaProps {
  user: { id: string; username: string; display_name: string };
}

export function ChatArea({ user }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const loadedConvRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const setActiveConversationId = useAppStore((s) => s.setActiveConversationId);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const extendedThinking = useAppStore((s) => s.extendedThinking);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const setIsStreaming = useAppStore((s) => s.setIsStreaming);
  const conversations = useAppStore((s) => s.conversations);
  const addConversation = useAppStore((s) => s.addConversation);
  const updateConversation = useAppStore((s) => s.updateConversation);
  const removeConversation = useAppStore((s) => s.removeConversation);
  const chatFont = useAppStore((s) => s.chatFont);
  const pendingChatPrefill = useAppStore((s) => s.pendingChatPrefill);
  const setPendingChatPrefill = useAppStore((s) => s.setPendingChatPrefill);
  

  const [inputFocusTick, setInputFocusTick] = useState(0);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

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
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    if (activeConversationId && activeConversationId !== loadedConvRef.current) {
      if (isStreamingRef.current) {
        loadedConvRef.current = activeConversationId;
        return;
      }
      loadedConvRef.current = activeConversationId;
      loadMessages(activeConversationId);
    } else if (!activeConversationId) {
      loadedConvRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!pendingChatPrefill) return;
    setInput(pendingChatPrefill);
    setPendingChatPrefill(null);
    setMessages([]);
    loadedConvRef.current = null;
    setInputFocusTick((t) => t + 1);
  }, [pendingChatPrefill, setPendingChatPrefill]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
  }, [setActiveConversationId]);

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
          chatMode: "ask",
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
        const newConv = {
          id: newConvId,
          title,
          model: selectedModel,
          starred: false,
          shared: false,
          share_id: null,
          project_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addConversation(newConv);

        fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: newConvId,
            firstMessage: trimmed,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.title) {
              updateConversation(newConvId, { title: data.title });
            }
          })
          .catch(() => {});
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let accContent = "";
      let accThinking = "";
      let thinkingDone = false;
      let thinkingStartTime = Date.now();
      let lineBuf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuf += decoder.decode(value, { stream: true });
        const parts = lineBuf.split("\n");
        lineBuf = parts.pop() ?? "";

        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
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
                        thinking_duration: Math.round(
                          (Date.now() - thinkingStartTime) / 1000
                        ),
                      }
                    : m
                )
              );
            } else if (parsed.type === "content") {
              if (!thinkingDone && extendedThinking) {
                thinkingDone = true;
              }
              accContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accContent,
                        is_thinking: false,
                        thinking_duration: extendedThinking
                          ? Math.round(
                              (Date.now() - thinkingStartTime) / 1000
                            )
                          : undefined,
                      }
                    : m
                )
              );
            } else if (parsed.type === "files_written") {
              // file writes only happen in project workspace
            } else if (parsed.type === "error") {
              const msg =
                typeof parsed.content === "string"
                  ? parsed.content
                  : "Request failed";
              throw new Error(msg);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // incomplete JSON chunk, skip
            } else {
              throw e;
            }
          }
        }
      }

      // Sync from DB in the background so we get server-assigned IDs / feedback,
      // but delay slightly so the streamed content stays visible first.
      if (convId) {
        setTimeout(() => loadMessages(convId), 1500);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // user stopped
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        toast(errorMessage, "error");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Error: ${errorMessage}` }
              : m
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

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleRename = async (newTitle: string) => {
    if (!activeConversationId) return;
    try {
      await fetch(`/api/conversations/${activeConversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      updateConversation(activeConversationId, { title: newTitle });
    } catch {
      toast("fayld 2 reenaym", "error");
    }
  };

  const handleDelete = async () => {
    if (!activeConversationId) return;
    try {
      await fetch(`/api/conversations/${activeConversationId}`, {
        method: "DELETE",
      });
      removeConversation(activeConversationId);
      handleNewChat();
      toast("conversashun deleetd", "success");
    } catch {
      toast("fayld 2 deleet", "error");
    }
    setShowDeleteConfirm(false);
  };

  const handleRetry = async (messageId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 1) return;

    const previousMessages = messages.slice(0, msgIndex);
    setMessages(previousMessages);

    const lastUserMsg = previousMessages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-dark-bg ${chatFontClassName(chatFont)}`}
    >
      {activeConversationId && activeConv ? (
        <>
          <ChatHeader
            conversationId={activeConversationId}
            title={activeConv.title}
            shared={activeConv.shared}
            shareId={activeConv.share_id}
            onRename={handleRename}
            onDelete={() => setShowDeleteConfirm(true)}
            onMoveToProject={() => setShowMoveModal(true)}
          />
          <MessageList
            messages={messages}
            userName={user.display_name || user.username}
            isStreaming={isStreaming}
            onRetry={handleRetry}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            placeholder="repli 2 Klawd..."
            focusRequestId={inputFocusTick}
            hideModeSelector
            hideProjectPicker
          />
        </>
      ) : isStreaming || messages.length > 0 ? (
        <>
          <MessageList
            messages={messages}
            userName={user.display_name || user.username}
            isStreaming={isStreaming}
            onRetry={handleRetry}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            placeholder="repli 2 Klawd..."
            focusRequestId={inputFocusTick}
            hideModeSelector
            hideProjectPicker
          />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-4 py-10">
          <WelcomeScreen
            userName={user.display_name || user.username}
            onPromptSelect={handlePromptSelect}
          >
            <ChatInput
              variant="welcome"
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              onStop={handleStop}
              placeholder="how ken ai halp u todey?"
              focusRequestId={inputFocusTick}
              hideModeSelector
              hideProjectPicker
            />
          </WelcomeScreen>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="deleet conversashun"
        message="r u shur u wanna deleet dis conversashun? dis akshun cant b undun."
        confirmLabel="Deleet"
        danger
      />

      {showMoveModal && activeConversationId && (
        <MoveToProjectModal
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          conversationId={activeConversationId}
        />
      )}
    </div>
  );
}
