import { describe, expect, test } from "bun:test";
import {
  createFolioPluginLifecycleManager,
  FolioPluginHookError,
} from "../src/core/plugin-lifecycle.js";
import type { FolioPage, FolioPlugin } from "../src/plugin.js";

const page: FolioPage = {
  slug: "guide/start",
  url: "/guide/start",
  filePath: "/docs/guide/start.mdx",
  frontmatter: { title: "Start", metadata: { source: "docs" } },
  toc: [],
  title: "Start",
};

function manager(plugins: readonly FolioPlugin[] = [], pages: readonly FolioPage[] = []) {
  return createFolioPluginLifecycleManager({
    plugins,
    config: { title: "Docs", navigation: { sidebar: { nav: "auto" } } },
    rootDir: "/project",
    contentDir: "/project/docs",
    mode: "production",
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    pages,
  });
}

describe("plugin lifecycle manager", () => {
  test("runs every lifecycle hook sequentially in registration order", async () => {
    const calls: string[] = [];
    const plugin = (name: string): FolioPlugin => ({
      name,
      async configResolved() {
        calls.push(`${name}:configResolved:start`);
        await Promise.resolve();
        calls.push(`${name}:configResolved:end`);
      },
      buildStart: () => { calls.push(`${name}:buildStart`); },
      pageCollected: () => { calls.push(`${name}:pageCollected`); },
      pageTransformed: (current) => {
        calls.push(`${name}:pageTransformed`);
        return current;
      },
      generate: () => { calls.push(`${name}:generate`); },
      buildEnd: () => { calls.push(`${name}:buildEnd`); },
    });
    const lifecycle = manager([plugin("first"), plugin("second")]);

    await lifecycle.configResolved();
    await lifecycle.buildStart();
    await lifecycle.pageCollected(page);
    await lifecycle.pageTransformed(page);
    await lifecycle.generate();
    await lifecycle.buildEnd({ success: true, outputDir: "/out", pages: [page] });

    expect(calls).toEqual([
      "first:configResolved:start", "first:configResolved:end", "second:configResolved:start", "second:configResolved:end",
      "first:buildStart", "second:buildStart",
      "first:pageCollected", "second:pageCollected",
      "first:pageTransformed", "second:pageTransformed",
      "first:generate", "second:generate",
      "first:buildEnd", "second:buildEnd",
    ]);
  });

  test("chains transformed pages and preserves the route identity", async () => {
    const lifecycle = manager([
      { name: "title", pageTransformed: (current) => ({ ...current, title: `${current.title}!` }) },
      { name: "description", pageTransformed: (current) => ({ ...current, description: current.title }) },
    ]);

    const transformed = await lifecycle.pageTransformed(page);
    expect(transformed.title).toBe("Start!");
    expect(transformed.description).toBe("Start!");

    const invalid = manager([{ name: "bad-route", pageTransformed: (current) => ({ ...current, url: "/other" }) }]);
    await expect(invalid.pageTransformed(page)).rejects.toMatchObject({
      name: "FolioPluginHookError",
      pluginName: "bad-route",
      hook: "pageTransformed",
    });
  });

  test("adds plugin and hook metadata to failures while retaining the cause", async () => {
    const cause = new Error("cannot generate");
    const lifecycle = manager([{ name: "search-index", generate: () => Promise.reject(cause) }]);

    try {
      await lifecycle.generate();
      throw new Error("expected generate to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FolioPluginHookError);
      expect(error).toMatchObject({ pluginName: "search-index", hook: "generate", cause });
      expect((error as Error).message).toContain('Plugin "search-index" hook "generate"');
    }
  });

  test("gives hooks immutable snapshots of context and pages", async () => {
    let context!: Parameters<NonNullable<FolioPlugin["buildStart"]>>[0];
    const lifecycle = manager([{
      name: "observer",
      buildStart: (received) => { context = received; },
    }], [page]);

    await lifecycle.buildStart();
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.config)).toBe(true);
    expect(Object.isFrozen(context.pages)).toBe(true);
    expect(() => (context.pages as FolioPage[]).push(page)).toThrow();
    expect(() => (context.config.navigation!.sidebar!.nav as string) = "changed").toThrow();

    const exposed = lifecycle.getPages();
    expect(() => (exposed as FolioPage[])[0].title = "changed").toThrow();
    expect(lifecycle.getPages()[0].title).toBe("Start");
  });
});
