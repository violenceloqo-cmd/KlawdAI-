"use client";

import { forwardRef, type TextareaHTMLAttributes, useRef, useEffect } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, autoResize = false, className = "", onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRef = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    const resize = () => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    };

    useEffect(resize, [autoResize]);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-ink-700 dark:text-cream-300">
            {label}
          </label>
        )}
        <textarea
          ref={setRef}
          onChange={(e) => {
            resize();
            onChange?.(e);
          }}
          className={`rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder-ink-400 outline-none transition-colors resize-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 dark:border-dark-border dark:bg-dark-surface dark:text-cream-100 dark:placeholder-ink-400 ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
