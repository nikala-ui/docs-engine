import type {
  FolioBuildResult,
  FolioPage,
  FolioPlugin,
  FolioPluginContext,
  FolioPluginLogger,
} from "../plugin.js";
import { validateFolioPlugins } from "../plugin.js";
import type { DocsConfig } from "../types.js";

type LifecycleHook =
  | "configResolved"
  | "buildStart"
  | "pageCollected"
  | "pageTransformed"
  | "generate"
  | "buildEnd";
type ContextHook = "configResolved" | "buildStart" | "generate";

export interface FolioPluginLifecycleOptions {
  plugins?: readonly FolioPlugin[];
  config: DocsConfig;
  rootDir: string;
  contentDir: string;
  mode: FolioPluginContext["mode"];
  logger: FolioPluginLogger;
  pages?: readonly FolioPage[];
}

export class FolioPluginHookError extends Error {
  readonly pluginName: string;
  readonly hook: LifecycleHook;
  override readonly cause: unknown;

  constructor(pluginName: string, hook: LifecycleHook, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`[folio] Plugin "${pluginName}" hook "${hook}" failed: ${detail}`, { cause });
    this.name = "FolioPluginHookError";
    this.pluginName = pluginName;
    this.hook = hook;
    this.cause = cause;
  }
}

function clone(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value);

  const copy = Array.isArray(value) ? [] as unknown[] : {} as Record<string, unknown>;
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    const child = clone((value as Record<string, unknown>)[key], seen);
    if (Array.isArray(copy)) copy[Number(key)] = child;
    else copy[key] = child;
  }
  return copy;
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freeze(child, seen);
  return Object.freeze(value);
}

function snapshot<T>(value: T): Readonly<T> {
  return freeze(clone(value) as T);
}

function routeIdentity(page: FolioPage): string {
  return `${page.slug}\u0000${page.url}`;
}

export class FolioPluginLifecycleManager {
  private readonly plugins: readonly FolioPlugin[];
  private readonly options: FolioPluginLifecycleOptions;
  private pages: FolioPage[];

  constructor(options: FolioPluginLifecycleOptions) {
    validateFolioPlugins(options.plugins);
    this.plugins = options.plugins ? [...options.plugins] : [];
    this.options = options;
    this.pages = [...(options.pages ?? [])].map((page) => snapshot(page));
  }

  getPages(): readonly FolioPage[] {
    return snapshot(this.pages);
  }

  async configResolved(): Promise<void> {
    await this.runContextHook("configResolved");
  }

  async buildStart(): Promise<void> {
    await this.runContextHook("buildStart");
  }

  async pageCollected(page: FolioPage): Promise<void> {
    const collected = snapshot(page);
    this.pages = [...this.pages, collected];
    for (const plugin of this.plugins) {
      try {
        await plugin.pageCollected?.(collected, this.context());
      } catch (error) {
        throw this.wrap(plugin, "pageCollected", error);
      }
    }
  }

  async pageTransformed(page: FolioPage): Promise<FolioPage> {
    let transformed = snapshot(page);
    for (const plugin of this.plugins) {
      if (!plugin.pageTransformed) continue;
      const before = transformed;
      try {
        const result = await plugin.pageTransformed(before, this.context());
        if (!result || typeof result !== "object") throw new Error("must return a page object");
        if (routeIdentity(result) !== routeIdentity(before)) {
          throw new Error("must preserve the page route identity (slug and url)");
        }
        transformed = snapshot(result);
      } catch (error) {
        throw this.wrap(plugin, "pageTransformed", error);
      }
    }

    const index = this.pages.findIndex((candidate) => routeIdentity(candidate) === routeIdentity(page));
    if (index >= 0) this.pages[index] = transformed;
    return snapshot(transformed);
  }

  async generate(): Promise<void> {
    await this.runContextHook("generate");
  }

  async buildEnd(result: FolioBuildResult): Promise<void> {
    for (const plugin of this.plugins) {
      try {
        await plugin.buildEnd?.(snapshot(result), this.context());
      } catch (error) {
        throw this.wrap(plugin, "buildEnd", error);
      }
    }
  }

  private context(): FolioPluginContext {
    return snapshot({
      config: this.options.config,
      rootDir: this.options.rootDir,
      contentDir: this.options.contentDir,
      pages: this.pages,
      mode: this.options.mode,
      logger: this.options.logger,
    }) as FolioPluginContext;
  }

  private async runContextHook(hook: ContextHook): Promise<void> {
    for (const plugin of this.plugins) {
      try {
        await plugin[hook]?.(this.context());
      } catch (error) {
        throw this.wrap(plugin, hook, error);
      }
    }
  }

  private wrap(plugin: FolioPlugin, hook: LifecycleHook, error: unknown): FolioPluginHookError {
    return error instanceof FolioPluginHookError ? error : new FolioPluginHookError(plugin.name, hook, error);
  }
}

export function createFolioPluginLifecycleManager(
  options: FolioPluginLifecycleOptions,
): FolioPluginLifecycleManager {
  return new FolioPluginLifecycleManager(options);
}
