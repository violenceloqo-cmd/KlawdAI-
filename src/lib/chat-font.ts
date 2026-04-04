import type { ChatFont } from "@/lib/store";

const VALID: ChatFont[] = ["default", "sans", "system", "dyslexic"];

export function isChatFont(value: unknown): value is ChatFont {
  return typeof value === "string" && VALID.includes(value as ChatFont);
}

/** Tailwind / CSS classes for the chat transcript + input area. */
export function chatFontClassName(font: ChatFont): string {
  switch (font) {
    case "sans":
      return "font-chat-sans";
    case "system":
      return "font-chat-system";
    case "dyslexic":
      return "font-dyslexic";
    default:
      return "";
  }
}
