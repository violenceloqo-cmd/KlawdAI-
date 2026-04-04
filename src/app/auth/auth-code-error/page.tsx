import Link from "next/link";
import { AppLogo, AUTH_PAGE_LOGO_CLASS } from "@/components/brand/AppLogo";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-4 dark:bg-dark-bg">
      <AppLogo size={96} className={`mb-6 ${AUTH_PAGE_LOGO_CLASS}`} />
      <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-cream-100">
        sine-in didnt compleete
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-ink-500 dark:text-cream-400">
        sumthing went rong wif Google sine-in. trai agen, or uze usrnaym and
        passwerd.
      </p>
      <Link
        href="/login"
        className="mt-6 text-sm font-medium text-terracotta-500 hover:text-terracotta-600"
      >
        bak 2 log inn
      </Link>
    </div>
  );
}
