import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineDocsConfig, resolveDocsConfig } from "../src/config.js";
import { nikalaDocs } from "../src/index.js";
import type { FolioPlugin } from "../src/index.js";

describe("public Folio plugin contract", () => {
  test("keeps plugin-less configs compatible", () => {
    const config = defineDocsConfig({ title: "Docs" });

    expect(config.title).toBe("Docs");
    expect(config.plugins).toBeUndefined();
  });

  test("rejects invalid or empty plugin names", () => {
    expect(() => defineDocsConfig({ plugins: [{ name: "   " }] })).toThrow(
      "must have a non-empty name",
    );
    expect(() => defineDocsConfig({ plugins: [{ name: 42 } as never] })).toThrow(
      "must have a non-empty name",
    );
  });

  test("rejects invalid plugin names when resolving a config file", async () => {
    const invalidNames = ["", "   ", 42];

    for (const name of invalidNames) {
      const cwd = mkdtempSync(path.join(os.tmpdir(), "folio-plugin-config-"));
      writeFileSync(
        path.join(cwd, "docs.config.mjs"),
        `export default ${JSON.stringify({ plugins: [{ name }] })};\n`,
      );

      try {
        await expect(resolveDocsConfig(cwd)).rejects.toThrow(
          "must have a non-empty name",
        );
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    }
  });

  test("exports the Folio contract without replacing the Vite plugin", () => {
    const plugin = {
      name: "example",
      configResolved: async () => undefined,
    } satisfies FolioPlugin;
    const config = defineDocsConfig({ plugins: [plugin] });

    expect(config.plugins?.[0]).toBe(plugin);
    expect(typeof nikalaDocs).toBe("function");
    expect(nikalaDocs().name).toBe("vite-plugin-folio");
  });
});
