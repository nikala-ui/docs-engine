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

const HOOKS = [
  "configResolved",
  "buildStart",
  "pageCollected",
  "pageTransformed",
  "generate",
  "buildEnd",
] as const;

export function validateFolioPlugin(plugin: unknown, label = "Plugin"): asserts plugin is FolioPlugin {
  if (!plugin || typeof plugin !== "object") {
    throw new Error(`[folio] ${label} must be an object`);
  }

  const candidate = plugin as Record<string, unknown>;
  if (typeof candidate.name !== "string" || !candidate.name.trim()) {
    throw new Error(`[folio] ${label} must have a non-empty name`);
  }

  for (const hook of HOOKS) {
    if (candidate[hook] !== undefined && typeof candidate[hook] !== "function") {
      throw new Error(`[folio] Plugin "${candidate.name}" hook "${hook}" must be a function`);
    }
  }
}

export function validateFolioPlugins(plugins: unknown): asserts plugins is FolioPluginConfig | undefined {
  if (plugins === undefined) return;
  if (!Array.isArray(plugins)) {
    throw new Error("[folio] DocsConfig.plugins must be an array");
  }

  const names = new Set<string>();
  for (const [index, plugin] of plugins.entries()) {
    validateFolioPlugin(plugin, `Plugin at index ${index}`);
    if (names.has(plugin.name)) {
      throw new Error(`[folio] Plugin name "${plugin.name}" is registered more than once`);
    }
    names.add(plugin.name);
  }
}

export function defineFolioPlugin(plugin: FolioPlugin): FolioPlugin {
  validateFolioPlugin(plugin, "Plugin registration");
  return plugin;
}

export function createFolioPlugin(factory: () => FolioPlugin): FolioPlugin;
export function createFolioPlugin<Options>(factory: FolioPluginFactory<Options>, options: Options): FolioPlugin;
export function createFolioPlugin<Options>(
  factory: ((options?: Options) => FolioPlugin),
  options?: Options,
): FolioPlugin {
  if (typeof factory !== "function") {
    throw new Error("[folio] Plugin factory must be a function");
  }
  const plugin = options === undefined ? factory() : factory(options);
  validateFolioPlugin(plugin, "Plugin factory result");
  return plugin;
}
