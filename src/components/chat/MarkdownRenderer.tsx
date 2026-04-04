"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !className;

      if (isInline) {
        return (
          <code className="rounded bg-cream-200 px-1.5 py-0.5 text-sm dark:bg-dark-surface2" {...props}>
            {children}
          </code>
        );
      }

      return (
        <CodeBlock
          language={match ? match[1] : ""}
          code={String(children).replace(/\n$/, "")}
        />
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
  };

  return (
    <div className="prose-klawd">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
