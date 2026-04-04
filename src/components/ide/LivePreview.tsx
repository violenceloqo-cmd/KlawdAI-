"use client";

import { useMemo, useRef, useCallback, useState } from "react";
import { RefreshCw, ExternalLink, X } from "lucide-react";

interface LivePreviewProps {
  files: Record<string, { id: string; content: string }>;
  paths: string[];
  onClose: () => void;
}

function resolveFilePath(from: string, href: string): string | null {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//") || href.startsWith("data:")) {
    return null;
  }
  href = href.split("?")[0].split("#")[0];
  if (href.startsWith("/")) {
    return href.slice(1);
  }
  const dir = from.includes("/") ? from.substring(0, from.lastIndexOf("/")) : "";
  const parts = (dir ? dir + "/" + href : href).split("/");
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") { resolved.pop(); continue; }
    resolved.push(p);
  }
  return resolved.join("/");
}

type ProjectType = "html" | "react" | "css-only" | "none";

function detectProjectType(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): ProjectType {
  const hasHtml = paths.some((p) => p === "index.html" || p.endsWith("/index.html"));
  if (hasHtml) return "html";

  const hasJsx = paths.some((p) => /\.(jsx|tsx)$/.test(p));
  const hasReactInPkg = paths.some((p) => p.endsWith("package.json") && files[p]?.content.includes('"react"'));
  if (hasJsx || hasReactInPkg) return "react";

  const hasCss = paths.some((p) => p.endsWith(".css"));
  const hasJs = paths.some((p) => /\.(js|mjs|ts)$/.test(p));
  if (hasCss || hasJs) return "css-only";

  return "none";
}

function buildHtmlPreview(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): string {
  const htmlPath = paths.find(
    (p) => p === "index.html" || p.endsWith("/index.html")
  )!;
  let html = files[htmlPath]?.content ?? "";

  html = html.replace(
    /<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (tag, href) => {
      const resolved = resolveFilePath(htmlPath, href);
      if (!resolved || !files[resolved]) return tag;
      if (
        tag.includes('rel="stylesheet"') ||
        tag.includes("rel='stylesheet'") ||
        resolved.endsWith(".css")
      ) {
        return `<style>/* ${resolved} */\n${files[resolved].content}</style>`;
      }
      return tag;
    }
  );

  // Inline <script src="...">...</script> — allow non-empty bodies (some templates have fallback text)
  html = html.replace(
    /<script\s+([^>]*)src\s*=\s*["']([^"']+)["']([^>]*)>[^]*?<\/script>/gi,
    (tag, before, src, after) => {
      const resolved = resolveFilePath(htmlPath, src);
      if (!resolved || !files[resolved]) return tag;
      const allAttrs = before + after;
      const typeAttr = allAttrs.match(/type\s*=\s*["']([^"']+)["']/i);
      const typeStr = typeAttr ? ` type="${typeAttr[1]}"` : "";
      const dataPres = allAttrs.match(/data-presets\s*=\s*["']([^"']+)["']/i);
      const dataStr = dataPres ? ` data-presets="${dataPres[1]}"` : "";
      const safe = files[resolved].content.replace(/<\/script/gi, "<\\/script");
      return `<script${typeStr}${dataStr}>/* ${resolved} */\n${safe}\n</script>`;
    }
  );

  // If the HTML uses text/babel scripts, ensure Babel standalone is present
  const usesBabel = /type\s*=\s*["']text\/babel["']/i.test(html);
  if (usesBabel && !html.includes("babel") && !html.includes("Babel")) {
    // Inject Babel standalone before the first text/babel script
    html = html.replace(
      /(<script\s[^>]*type\s*=\s*["']text\/babel["'])/i,
      `<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>\n$1`
    );
  }

  // If the HTML uses text/babel scripts with JSX but no React CDN, inject React + ReactDOM
  if (usesBabel) {
    const hasReactCdn =
      html.includes("unpkg.com/react") ||
      html.includes("cdnjs.cloudflare.com/ajax/libs/react") ||
      html.includes("cdn.jsdelivr.net/npm/react");
    if (!hasReactCdn) {
      html = html.replace(
        /(<script\s[^>]*src\s*=\s*["'][^"']*babel[^"']*["'][^>]*>)/i,
        `<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>\n$1`
      );
    }
  }

  return html;
}

function findEntryComponent(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): { path: string; content: string } | null {
  const candidates = [
    "src/app/page.tsx", "src/app/page.jsx",
    "src/App.tsx", "src/App.jsx",
    "src/pages/index.tsx", "src/pages/index.jsx",
    "app/page.tsx", "app/page.jsx",
    "App.tsx", "App.jsx",
    "src/index.tsx", "src/index.jsx",
    "index.tsx", "index.jsx",
  ];
  for (const c of candidates) {
    if (files[c]) return { path: c, content: files[c].content };
  }
  const firstJsx = paths.find((p) => /\.(jsx|tsx)$/.test(p));
  if (firstJsx && files[firstJsx]) return { path: firstJsx, content: files[firstJsx].content };
  return null;
}

function buildReactPreview(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): string {
  const entry = findEntryComponent(files, paths);

  const cssFiles = paths.filter((p) => p.endsWith(".css"));
  const allCss = cssFiles.map((p) => files[p]?.content ?? "").join("\n\n");

  const componentFiles = paths.filter((p) => /\.(jsx|tsx)$/.test(p));

  const componentModules: Record<string, string> = {};
  for (const p of componentFiles) {
    componentModules[p] = files[p]?.content ?? "";
  }

  const entryPath = entry?.path ?? "";
  const rawEntry = entry?.content ?? "export default function App() { return <div>No entry component found</div>; }";
  const entryContent = rawEntry.replace(/<\/script/gi, "<\\/script");

  // Strip TypeScript type annotations, imports, and exports for browser execution
  // Build a simple module registry so components can import each other
  const moduleRegistry: string[] = [];
  for (const [path, content] of Object.entries(componentModules)) {
    const moduleName = path.replace(/[^a-zA-Z0-9]/g, "_");
    moduleRegistry.push(`"${path}": function(exports, require) {
      ${content
        .replace(/import\s+type\s+.*?(?:from\s+['"].*?['"])?;?\n?/g, "")
        .replace(/:\s*\w+(?:\[\])?(?:\s*\|?\s*\w+)*(?=\s*[=,\)\}])/g, "")
        .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
        .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
        .replace(/<(\w+)\s+as\s+\w+>/g, "<$1>")
      }
    }`);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${allCss}
  </style>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  ${paths.some((p) => p.endsWith(".css") && files[p]?.content.includes("@tailwind")) || paths.some((p) => p.endsWith("tailwind.config")) ? '<script src="https://cdn.tailwindcss.com"><\/script>' : ""}
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    // Simple preview renderer
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, Fragment } = React;

    // Stub Next.js modules
    const Link = ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children);
    const Image = ({ src, alt, width, height, ...props }) => React.createElement("img", { src, alt, width, height, style: { maxWidth: "100%" }, ...props });
    const useRouter = () => ({ push: (url) => console.log("navigate:", url), back: () => {}, pathname: "/" });
    const usePathname = () => "/";
    const useSearchParams = () => new URLSearchParams();

    try {
      ${entryContent
        .replace(/^import\s+.*?['"].*?['"];?\s*$/gm, "")
        .replace(/export\s+default\s+/g, "const __EntryComponent__ = ")
        .replace(/export\s+(?:const|function|class)\s+/g, "const ")
        .replace(/:\s*React\.FC(?:<[^>]*>)?/g, "")
      }

      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(React.createElement(typeof __EntryComponent__ !== "undefined" ? __EntryComponent__ : () => React.createElement("div", { style: { padding: 40, textAlign: "center", color: "#666" } }, "could not find default export to render")));
    } catch(err) {
      document.getElementById("root").innerHTML = '<div style="padding:32px;font-family:monospace"><h3 style="color:#c44">Preview Error</h3><pre style="margin-top:12px;white-space:pre-wrap;color:#666">' + err.message + '</pre></div>';
      console.error(err);
    }
  <\/script>
</body>
</html>`;
}

function buildCssOnlyPreview(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): string {
  const cssFiles = paths.filter((p) => p.endsWith(".css"));
  const jsFiles = paths.filter((p) => /\.(js|mjs)$/.test(p));

  let html = "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
  for (const css of cssFiles) {
    html += `<style>/* ${css} */\n${files[css]?.content ?? ""}</style>\n`;
  }
  html += "</head>\n<body>\n";

  const bodyHtml = paths.find((p) => p === "body.html" || p.endsWith("/body.html"));
  if (bodyHtml) {
    html += files[bodyHtml]?.content ?? "";
  }

  for (const js of jsFiles) {
    html += `<script>/* ${js} */\n${files[js]?.content ?? ""}\n</script>\n`;
  }
  html += "</body>\n</html>";
  return html;
}

function buildPreviewHtml(
  files: Record<string, { id: string; content: string }>,
  paths: string[]
): string {
  const type = detectProjectType(files, paths);
  switch (type) {
    case "html": return buildHtmlPreview(files, paths);
    case "react": return buildReactPreview(files, paths);
    case "css-only": return buildCssOnlyPreview(files, paths);
    default: return "";
  }
}

export function LivePreview({ files, paths, onClose }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const projectType = useMemo(() => detectProjectType(files, paths), [files, paths]);

  const previewHtml = useMemo(() => {
    if (projectType === "none") return null;
    return buildPreviewHtml(files, paths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, paths, refreshKey, projectType]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const openExternal = useCallback(() => {
    const html = buildPreviewHtml(files, paths);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, [files, paths]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-dark-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-cream-200 px-3 py-1.5 dark:border-dark-border">
        <span className="rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
          prevyu
        </span>
        {projectType === "react" && (
          <span className="text-[10px] text-ink-400 dark:text-cream-500">React</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={refresh}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
            title="refrech"
          >
            <RefreshCw size={13} />
          </button>
          <button
            type="button"
            onClick={openExternal}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
            title="opin in noo tab"
          >
            <ExternalLink size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-cream-200 dark:hover:bg-dark-surface2"
          >
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {projectType !== "none" && previewHtml ? (
          <iframe
            ref={iframeRef}
            key={refreshKey}
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="absolute inset-0 h-full w-full border-0 bg-white"
            title="liv prevyu"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-400 dark:text-cream-500">
            <div>
              <p className="mb-1 font-medium">no prevyuable filez</p>
              <p className="text-xs">
                add an <code className="rounded bg-cream-200 px-1 py-0.5 dark:bg-dark-surface2">index.html</code> or React component 2 see a prevyu
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
