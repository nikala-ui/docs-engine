import { icons } from "virtual:nikala-docs-icons";
import type { DocsIcon } from "../../types.js";

function toComponentName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function resolveDefaultIcon(name?: string): DocsIcon | undefined {
  if (!name) return undefined;
  const icon = icons[toComponentName(name)];
  return icon;
}
