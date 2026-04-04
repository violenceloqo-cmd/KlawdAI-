import Link from "next/link";
import { Briefcase, ScrollText } from "lucide-react";

export default function CustomizeSkillsPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex min-h-full flex-col items-center px-6 py-16 md:py-24">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <div
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 dark:border-dark-border dark:bg-dark-bg dark:text-cream-200"
            aria-hidden
          >
            <Briefcase size={40} strokeWidth={1.25} className="opacity-95" />
          </div>

          <h1 className="font-display text-3xl font-normal tracking-tight text-neutral-900 dark:text-white md:text-4xl">
            Kustomize Klawd
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-cream-400 md:text-base">
            skilz shaep how Klawd werks wif u—ur prosesses, teem normz,
            and eksperteez.
          </p>

          <div className="mt-12 w-full space-y-4">
            <Link
              href="/customize/skills/library"
              className="flex w-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-dark-border dark:bg-dark-surface2 dark:hover:border-dark-surface3 dark:hover:bg-dark-surface3/60"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-dark-border dark:bg-dark-bg dark:text-cream-300">
                <ScrollText size={22} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-base font-medium text-neutral-900 dark:text-cream-100">
                  creat noo skilz
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-cream-500">
                  teech Klawd ur prosesses, teem normz, and eksperteez.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
