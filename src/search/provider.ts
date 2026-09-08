import type { DocsConfig } from "../types.js";

export type BuiltInSearchProvider = "local";

export interface ResolvedSearchProvider {
  requested: NonNullable<DocsConfig["search"]>["provider"];
  active: BuiltInSearchProvider;
  fallback: boolean;
}

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
  };
}
