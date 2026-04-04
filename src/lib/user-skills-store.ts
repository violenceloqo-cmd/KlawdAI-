import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export type UserSkill = {
  id: string;
  name: string;
  description: string;
  content: string;
  fileName: string;
  createdAt: string;
};

type UserSkillsState = {
  skills: UserSkill[];
  addSkill: (skill: Omit<UserSkill, "id" | "createdAt">) => void;
  removeSkill: (id: string) => void;
};

export const useUserSkillsStore = create<UserSkillsState>()(
  persist(
    (set) => ({
      skills: [],
      addSkill: (skill) =>
        set((s) => ({
          skills: [
            {
              ...skill,
              id: nanoid(),
              createdAt: new Date().toISOString(),
            },
            ...s.skills,
          ],
        })),
      removeSkill: (id) =>
        set((s) => ({ skills: s.skills.filter((x) => x.id !== id) })),
    }),
    { name: "klawd-user-skills" }
  )
);

const MAX_SKILL_CONTEXT_CHARS = 100_000;

/** System prompt segment for Anthropic when user skills are loaded. */
export function buildSkillSystemPrompt(skills: UserSkill[]): string | undefined {
  if (!skills.length) return undefined;
  const parts = skills.map(
    (sk) =>
      `### Skill: ${sk.name}\n${sk.description ? `Description: ${sk.description}\n\n` : ""}${sk.content.trim()}`
  );
  let text = `The user has loaded the following skill definitions. Apply them when relevant to requests (workflows, formatting, domain rules, etc.):\n\n${parts.join("\n\n---\n\n")}`;
  if (text.length > MAX_SKILL_CONTEXT_CHARS) {
    text =
      text.slice(0, MAX_SKILL_CONTEXT_CHARS) +
      "\n\n[Skill context truncated for size.]";
  }
  return text;
}
