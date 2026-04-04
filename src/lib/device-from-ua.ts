/** Human-readable device string from User-Agent (best-effort, no extra deps). */
export function deviceLabelFromUserAgent(ua: string): string {
  if (!ua?.trim()) return "Unknown device";

  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  let os = "";
  if (ua.includes("Mac OS X")) os = "Mac OS X";
  else if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return os ? `${browser} (${os})` : browser;
}

export function locationLabelFromRequest(req: Request): string {
  const city = req.headers.get("x-vercel-ip-city");
  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");

  const cityDecoded = city ? decodeURIComponent(city.replace(/\+/g, " ")) : "";
  const parts = [cityDecoded, region, country].filter(Boolean);
  if (parts.length === 0) return "Unknown";
  return parts.join(", ");
}

export function clientIpFromRequest(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  return real?.trim() || null;
}
