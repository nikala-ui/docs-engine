import type { DocsConfig } from "../types.js";

function normalizeRepositoryPath(...parts: string[]): string | undefined {
  const segments = parts
    .flatMap((part) => part.replace(/\\/g, "/").split("/"))
    .filter((segment) => segment && segment !== ".");

  if (segments.some((segment) => segment === "..")) return undefined;
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function repositoryBaseUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return undefined;
    return parsed.toString().replace(/\/$/, "").replace(/\.git$/, "");
  } catch {
    return undefined;
  }
}

export function getRepositorySourceUrl(
  repository: NonNullable<DocsConfig["repository"]>,
  sourcePath: string,
  contentDir = "docs",
): string | undefined {
  const baseUrl = repositoryBaseUrl(repository.url);
  const filePath = normalizeRepositoryPath(repository.rootDir || "", contentDir, sourcePath);
  if (!baseUrl || !filePath) return undefined;

  const branch = encodeURIComponent(repository.branch || "main");
  const hostname = new URL(baseUrl).hostname.toLowerCase();

  if (hostname === "gitlab.com" || hostname.endsWith(".gitlab.com")) {
    return `${baseUrl}/-/blob/${branch}/${filePath}`;
  }

  if (hostname === "bitbucket.org" || hostname.endsWith(".bitbucket.org")) {
    return `${baseUrl}/src/${branch}/${filePath}`;
  }

  return `${baseUrl}/blob/${branch}/${filePath}`;
}
