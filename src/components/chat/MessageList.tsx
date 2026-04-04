"use client";

import { useRef, useEffect } from "react";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking_content?: string | null;
  thinking_duration?: number;
  is_thinking?: boolean;
  feedback?: "up" | "down" | null;
  chat_mode?: string;
}

interface MessageListProps {
  messages: Message[];
  userName: string;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
}

export function MessageList({
  messages,
  userName,
  isStreaming,
  onRetry,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messages.length > 0 ? messages[messages.length - 1].content : ""]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          if (msg.role === "user") {
            return (
              <UserMessage
                key={msg.id}
                content={msg.content}
                userName={userName}
              />
            );
          }
          return (
            <AssistantMessage
              key={msg.id}
              id={msg.id}
              content={msg.content}
              thinkingContent={msg.thinking_content}
              thinkingDuration={msg.thinking_duration}
              isThinking={msg.is_thinking}
              isStreaming={isLast && isStreaming}
              feedback={msg.feedback}
              onRetry={onRetry ? () => onRetry(msg.id) : undefined}
              chatMode={msg.chat_mode}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
