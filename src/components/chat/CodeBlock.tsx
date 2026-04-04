"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const appTheme = useAppStore((s) => s.theme);
  const prismStyle = appTheme === "dark" ? oneDark : oneLight;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-cream-300 dark:border-dark-border">
      <div className="flex items-center justify-between bg-cream-200 px-4 py-2 dark:bg-dark-surface2">
        <span className="text-xs font-medium text-ink-500 dark:text-cream-400 uppercase">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-500 hover:bg-cream-300 transition-colors dark:text-cream-400 dark:hover:bg-dark-surface3"
        >
          {copied ? (
            <>
              <Check size={12} /> copeed
            </>
          ) : (
            <>
              <Copy size={12} /> kopy
            </>
          )}
        </button>
      </div>
      <div className="bg-cream-50 dark:bg-dark-surface">
        <SyntaxHighlighter
          language={language || "text"}
          style={prismStyle}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: "1.5",
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
