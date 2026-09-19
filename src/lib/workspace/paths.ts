const MAX_PATH = 180;

export function sanitizePath(input: string): string | null {
  if (typeof input !== "string") return null;
  let path = input.trim().replaceAll("\\", "/");
  if (path.startsWith("./")) path = path.slice(2);
  if (path.startsWith("/")) path = path.slice(1);
  if (!path || path.includes("..") || path.startsWith(".git/")) return null;
  if (path.includes("\0")) return null;
  if (path.length > MAX_PATH) return null;
  if (!/^[a-zA-Z0-9._\- /]+$/.test(path)) return null;
  return path.replace(/\/{2,}/g, "/");
}

export function resolveRelative(fromFile: string, href: string): string | null {
  const raw = href.trim();
  if (
    !raw ||
    raw.startsWith("data:") ||
    raw.startsWith("http:") ||
    raw.startsWith("https:") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("#") ||
    raw.startsWith("javascript:")
  ) {
    return null;
  }
  const cleaned = raw.split("?")[0]?.split("#")[0] ?? raw;
  if (cleaned.startsWith("/")) return sanitizePath(cleaned);
  const fromDir = fromFile.includes("/")
    ? fromFile.slice(0, fromFile.lastIndexOf("/"))
    : "";
  const joined = fromDir ? `${fromDir}/${cleaned}` : cleaned;
  const parts: string[] = [];
  for (const part of joined.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return sanitizePath(parts.join("/"));
}

export function fileExt(path: string): string {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i + 1).toLowerCase() : "";
}

export function parentDir(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(0, i) : "";
}

export function fileName(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}
