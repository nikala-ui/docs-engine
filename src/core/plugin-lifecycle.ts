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

export interface FolioPluginHookMetadata {
  pluginName: string;
  hook: LifecycleHook;
  mode: FolioPluginContext["mode"];
  pageRoute?: string;
  sourcePath?: string;
}

export class FolioPluginHookError extends Error {
  readonly pluginName: string;
  readonly hook: LifecycleHook;
  readonly mode: FolioPluginContext["mode"];
  readonly pageRoute?: string;
  readonly sourcePath?: string;
  readonly metadata: FolioPluginHookMetadata;
  override readonly cause: unknown;

  constructor(
    pluginName: string,
    hook: LifecycleHook,
    cause: unknown,
    mode: FolioPluginContext["mode"] = "production",
    page?: FolioPage,
  ) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    const pageRoute = page?.url;
    const sourcePath = page?.sourcePath ?? page?.filePath;
    const location = [
      pageRoute && `route "${pageRoute}"`,
      sourcePath && `source "${sourcePath}"`,
      `mode "${mode}"`,
    ].join(", ");
    super(`[folio] Plugin "${pluginName}" hook "${hook}" failed (${location}): ${detail}`, { cause });
    this.name = "FolioPluginHookError";
    this.pluginName = pluginName;
    this.hook = hook;
    this.mode = mode;
    this.pageRoute = pageRoute;
    this.sourcePath = sourcePath;
    this.metadata = { pluginName, hook, mode, pageRoute, sourcePath };
    this.cause = cause;
  }
}

class ImmutableMap<K, V> extends Map<K, V> {
  constructor(entries: readonly (readonly [K, V])[]) {
    super();
    for (const [key, value] of entries) Map.prototype.set.call(this, key, value);
  }

  override set(): this {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }

  override delete(): boolean {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }

  override clear(): void {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }
}

class ImmutableSet<T> extends Set<T> {
  constructor(values: readonly T[]) {
    super();
    for (const value of values) Set.prototype.add.call(this, value);
  }

  override add(): this {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }

  override delete(): boolean {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }

  override clear(): void {
    throw new TypeError("Cannot mutate an immutable plugin snapshot");
  }
}

function isPlainObject(value: object): value is Record<PropertyKey, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function clone(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value);
  if (value instanceof Map) {
    const copy = new ImmutableMap<unknown, unknown>([]);
    seen.set(value, copy);
    for (const [key, child] of value) {
      Map.prototype.set.call(copy, clone(key, seen), clone(child, seen));
    }
    return copy;
  }
  if (value instanceof Set) {
    const copy = new ImmutableSet<unknown>([]);
    seen.set(value, copy);
    for (const child of value) Set.prototype.add.call(copy, clone(child, seen));
    return copy;
  }
  if (!Array.isArray(value) && !isPlainObject(value)) return value;

  const copy = Array.isArray(value) ? [] as unknown[] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && "value" in descriptor) {
      Object.defineProperty(copy, key, { ...descriptor, value: clone(descriptor.value, seen) });
    }
  }
  return copy;
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  if (!Array.isArray(value) && !isPlainObject(value) && !(value instanceof Map) && !(value instanceof Set)) {
    return value;
  }
  seen.add(value);
  if (value instanceof Map) {
    for (const [key, child] of value) {
      freeze(key, seen);
      freeze(child, seen);
    }
  } else if (value instanceof Set) {
    for (const child of value) freeze(child, seen);
  } else {
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && "value" in descriptor) freeze(descriptor.value, seen);
    }
  }
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
        throw this.wrap(plugin, "pageCollected", error, page);
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
        throw this.wrap(plugin, "pageTransformed", error, page);
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

  private wrap(plugin: FolioPlugin, hook: LifecycleHook, error: unknown, page?: FolioPage): FolioPluginHookError {
    return error instanceof FolioPluginHookError
      ? error
      : new FolioPluginHookError(plugin.name, hook, error, this.options.mode, page);
  }
}

export function createFolioPluginLifecycleManager(
  options: FolioPluginLifecycleOptions,
): FolioPluginLifecycleManager {
  return new FolioPluginLifecycleManager(options);
}
