"use client";

import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-terracotta-500 font-medium text-white shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
