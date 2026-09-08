import type { DocsConfig } from "./types.js";

export type DocsThemeMode = "light" | "dark" | "system";

export function resolveDefaultThemeMode(config?: DocsConfig): DocsThemeMode {
  const mode = config?.theme?.defaultMode;
  return mode === "light" || mode === "dark" || mode === "system" ? mode : "system";
}
