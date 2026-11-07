export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("@") ||
    path.includes("\\")
  ) {
    return "/dashboard";
  }

  return path;
}

export function getRedirectPathFromSearch(search: string): string {
  return sanitizeRedirectPath(new URLSearchParams(search).get("next"));
}
