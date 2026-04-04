"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-ink-700 dark:text-cream-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`h-10 rounded-lg border border-cream-300 bg-white px-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 dark:border-dark-border dark:bg-dark-surface dark:text-cream-100 dark:placeholder-ink-400 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
