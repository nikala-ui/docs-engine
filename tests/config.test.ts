import { describe, expect, test } from "bun:test";
import { resolveDefaultThemeMode } from "../src/theme-mode.js";

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
});
