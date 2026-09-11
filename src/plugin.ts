import type { DocsConfig, PageData } from "./types.js";

export type FolioPage = PageData;

export interface FolioPluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface FolioPluginContext {
  config: DocsConfig;
  rootDir: string;
  contentDir: string;
  pages: readonly FolioPage[];
  mode: "development" | "production";
  logger: FolioPluginLogger;
}

export interface FolioBuildResult {
  success: boolean;
  outputDir: string;
  pages: readonly FolioPage[];
}

export interface FolioPlugin {
  name: string;
  configResolved?: (context: FolioPluginContext) => void | Promise<void>;
  buildStart?: (context: FolioPluginContext) => void | Promise<void>;
  pageCollected?: (
    page: FolioPage,
    context: FolioPluginContext,
  ) => void | Promise<void>;
  pageTransformed?: (
    page: FolioPage,
    context: FolioPluginContext,
  ) => FolioPage | Promise<FolioPage>;
  generate?: (context: FolioPluginContext) => void | Promise<void>;
  buildEnd?: (
    result: FolioBuildResult,
    context: FolioPluginContext,
  ) => void | Promise<void>;
}

export type FolioPluginFactory<Options = void> = [Options] extends [void]
  ? () => FolioPlugin
  : (options: Options) => FolioPlugin;

export type FolioPluginConfig = readonly FolioPlugin[];

export function validateFolioPlugins(plugins: FolioPluginConfig | undefined): void {
  if (!plugins) return;

  for (const [index, plugin] of plugins.entries()) {
    if (!plugin || typeof plugin.name !== "string" || !plugin.name.trim()) {
      throw new Error(`[folio] Plugin at index ${index} must have a non-empty name`);
    }
  }
}
