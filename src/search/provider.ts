import type { DocsConfig } from "../types.js";
import type { PageData } from "../types.js";

export type BuiltInSearchProvider = "local";
export type ConfiguredSearchProvider = NonNullable<DocsConfig["search"]>["provider"];

export interface SearchProvider {
  id: BuiltInSearchProvider;
  search: (query: string, pages: PageData[]) => PageData[];
}

export interface ResolvedSearchProvider {
  requested: ConfiguredSearchProvider;
  active: BuiltInSearchProvider;
  fallback: boolean;
  implementation: SearchProvider;
}

const localSearchProvider: SearchProvider = {
  id: "local",
  search(query, pages) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return pages;

    return pages.filter((page) =>
      [page.title, page.url, page.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    );
  },
};

/**
 * Resolve the configured search provider to an implementation available in
 * the default theme. External indexes can be added later without changing
 * the configuration contract or leaving the search dialog non-functional.
 */
export function resolveSearchProvider(search?: DocsConfig["search"]): ResolvedSearchProvider {
  const requested = search?.provider || "local";
  return {
    requested,
    active: "local",
    fallback: requested !== "local",
    implementation: localSearchProvider,
  };
}

export function searchPages(
  provider: ResolvedSearchProvider,
  query: string,
  pages: PageData[],
): PageData[] {
  return provider.implementation.search(query, pages);
}
