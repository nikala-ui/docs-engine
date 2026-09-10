import { describe, expect, test } from "bun:test";
import { resolveDefaultThemeMode } from "../src/theme-mode.js";
import { resolveSearchProvider, searchPages } from "../src/search/provider.js";

describe("docs config", () => {
  test("uses the configured default theme mode", () => {
    expect(resolveDefaultThemeMode({ theme: { defaultMode: "light" } })).toBe("light");
    expect(resolveDefaultThemeMode({ theme: { defaultMode: "dark" } })).toBe("dark");
    expect(resolveDefaultThemeMode({ theme: { defaultMode: "system" } })).toBe("system");
  });

  test("falls back to system for missing or invalid runtime values", () => {
    expect(resolveDefaultThemeMode()).toBe("system");
    expect(resolveDefaultThemeMode({})).toBe("system");
    expect(resolveDefaultThemeMode({ theme: { defaultMode: "sepia" as never } })).toBe("system");
  });

  test("uses local search by default", () => {
    expect(resolveSearchProvider().active).toBe("local");
    expect(resolveSearchProvider({ enabled: true, provider: "local" }).fallback).toBe(false);
  });

  test("falls back unsupported providers to local search", () => {
    const resolved = resolveSearchProvider({ enabled: true, provider: "unavailable" });
    expect(resolved.requested).toBe("unavailable");
    expect(resolved.active).toBe("local");
    expect(resolved.fallback).toBe(true);
  });

  test("uses the resolved provider implementation for local search", () => {
    const pages = [
      { title: "Configuration", url: "/configuration", description: "Configure Folio" },
      { title: "Themes", url: "/themes", description: "Customize styles" },
    ] as never[];

    expect(searchPages(resolveSearchProvider({ provider: "local" }), "folio", pages)).toHaveLength(1);
    expect(searchPages(resolveSearchProvider({ provider: "unavailable" }), "styles", pages)).toHaveLength(1);
  });

  test("accepts an external adapter without provider-specific engine code", async () => {
    const adapter = {
      name: "custom",
      search: async ({ pages }: { pages: typeof pages; query: string }) => pages.slice(0, 1),
    };
    const resolved = resolveSearchProvider({ provider: adapter });

    expect(resolved.active).toBe("custom");
    expect(resolved.fallback).toBe(false);
    expect(await searchPages(resolved, "anything", [{ title: "One" }] as never[])).toHaveLength(1);
  });
});
