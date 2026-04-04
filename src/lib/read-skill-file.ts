/**
 * Read skill markdown from .md, .zip, or .skill (zip) uploads.
 */
export async function readSkillFileText(file: File): Promise<{
  text: string;
  sourceLabel: string;
}> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".md")) {
    return { text: await file.text(), sourceLabel: file.name };
  }

  if (lower.endsWith(".zip") || lower.endsWith(".skill")) {
    const JSZip = (await import("jszip")).default;
    const z = await JSZip.loadAsync(await file.arrayBuffer());
    const paths: string[] = [];
    z.forEach((relPath, entry) => {
      if (entry.dir) return;
      const base = relPath.split("/").pop() ?? "";
      if (base.toLowerCase() === "skill.md") paths.push(relPath);
    });
    if (!paths.length) {
      throw new Error(
        "No SKILL.md found in this archive. Add SKILL.md at the root or in a folder."
      );
    }
    paths.sort((a, b) => a.length - b.length);
    const entry = z.file(paths[0]);
    if (!entry) {
      throw new Error("Could not read SKILL.md from archive.");
    }
    const text = await entry.async("string");
    return { text, sourceLabel: `${file.name} (${paths[0]})` };
  }

  throw new Error("Use a .md, .zip, or .skill file.");
}
