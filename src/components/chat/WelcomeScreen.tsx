"use client";

import { type ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import {
  Code,
  PenLine,
  GraduationCap,
  Soup,
  Lightbulb,
} from "lucide-react";

interface WelcomeScreenProps {
  userName: string;
  onPromptSelect: (prompt: string) => void;
  children: ReactNode;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Mornin";
  if (h < 18) return "Afturnooon";
  return "Eevning";
}

function displayFirstName(name: string): string {
  const t = name.trim();
  if (!t) return "ther";
  return t.split(/\s+/)[0] ?? t;
}

const categories = [
  { icon: Code, label: "Kode", prompt: "halp me rite kode 4 " },
  { icon: PenLine, label: "Rite", prompt: "halp me rite " },
  { icon: GraduationCap, label: "Lern", prompt: "eksplayn 2 me how " },
  { icon: Soup, label: "Lyfe stuf", prompt: "ai need advise abowt " },
  {
    icon: Lightbulb,
    label: "Klawd's choys",
    prompt: "wat shud ai werk on todey? sugest 1 useful ting and halp me get startd.",
  },
];

export function WelcomeScreen({
  userName,
  onPromptSelect,
  children,
}: WelcomeScreenProps) {
  const [greet, setGreet] = useState("");
  const first = displayFirstName(userName);

  useEffect(() => {
    setGreet(timeGreeting());
  }, []);

  return (
    <div className="flex w-full max-w-2xl flex-col items-stretch">
      <div className="flex flex-col items-center px-2">
        <div className="mb-10 flex items-center justify-center gap-4 sm:gap-5">
          <Image
            src="/favicon.png"
            alt="Klawd"
            width={52}
            height={52}
            className="h-11 w-11 shrink-0 rounded-xl object-contain sm:h-14 sm:w-14"
            unoptimized
            priority
          />
          <h1 className="font-display text-center text-4xl font-normal tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-100">
            {greet ? `${greet}, ` : ""}{first}
          </h1>
        </div>

        <div className="w-full">{children}</div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => onPromptSelect(cat.prompt)}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-transparent px-3.5 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-[#3d3d3d] dark:text-neutral-300 dark:hover:bg-white/5"
            >
              <cat.icon size={16} strokeWidth={1.75} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
