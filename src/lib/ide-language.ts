/** Monaco language id from file path. */
export function guessLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    mts: "typescript",
    cts: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    md: "markdown",
    mdx: "markdown",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",
    html: "html",
    htm: "html",
    vue: "html",
    svelte: "html",
    py: "python",
    rs: "rust",
    go: "go",
    mod: "go",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    dockerfile: "dockerfile",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    cs: "csharp",
  };
  if (path.toLowerCase().endsWith("dockerfile") || path.split("/").pop() === "Dockerfile") {
    return "dockerfile";
  }
  return map[ext] ?? "plaintext";
}
