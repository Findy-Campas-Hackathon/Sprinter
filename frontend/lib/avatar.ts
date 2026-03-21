const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const BACKEND_BASE = API_BASE.replace(/\/v1$/, "");

export function getAvatarFullUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${BACKEND_BASE}${path}`;
}
