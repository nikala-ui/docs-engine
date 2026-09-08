export const TAILWIND_ACCENT_COLORS = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
] as const;

export type DocsAccentColor = (typeof TAILWIND_ACCENT_COLORS)[number];

export function isDocsAccentColor(value: unknown): value is DocsAccentColor {
  return typeof value === "string" && TAILWIND_ACCENT_COLORS.includes(value as DocsAccentColor);
}

export function getAccentCssVariables(accent: DocsAccentColor, dark: boolean) {
  const foreground = accent === "amber" || accent === "yellow" || accent === "lime"
    ? "var(--color-black)"
    : "var(--color-white)";
  return {
    primary: `var(--color-${accent}-${dark ? "400" : "500"})`,
    foreground,
  };
}
