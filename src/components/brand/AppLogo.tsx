import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO = "/klawd.jpg";

/** Prominent mark for login / signup / auth error pages */
export const AUTH_PAGE_LOGO_CLASS =
  "h-24 w-24 rounded-3xl shadow-xl ring-2 ring-terracotta-500/35 ring-offset-2 ring-offset-cream-100 dark:ring-terracotta-400/40 dark:ring-offset-dark-bg dark:shadow-black/50";

export function AppLogo({
  size = 48,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO}
      alt="Klawd"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority={priority}
      unoptimized
    />
  );
}
