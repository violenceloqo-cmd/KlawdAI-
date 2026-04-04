/** Parse optional YAML frontmatter from Claude-style skill markdown. */
export function parseSkillMarkdown(raw: string): {
  name: string;
  description: string;
  body: string;
} {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return {
      name: "Untitled skill",
      description: "",
      body: raw.trim(),
    };
  }

  const end = trimmed.indexOf("\n---", 4);
  if (end === -1) {
    return {
      name: "Untitled skill",
      description: "",
      body: raw.trim(),
    };
  }

  const fmBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).trim();

  const nameMatch = fmBlock.match(/^name:\s*(.+)$/m);
  const descMatch = fmBlock.match(/^description:\s*(.+)$/m);

  const name = nameMatch?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "Untitled skill";
  const description =
    descMatch?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";

  return { name, description, body };
}
