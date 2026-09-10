import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { describe, expect, test } from "bun:test";
import { buildDocs } from "../src/server/index.js";

async function createFixture(siteUrl?: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "folio-crawl-files-"));
  await writeFile(path.join(root, "docs.config.ts"), "export default {};");
  await mkdir(path.join(root, "docs"));
  await writeFile(
    path.join(root, "docs", "index.mdx"),
    "---\ntitle: Home\ndescription: Welcome home.\n---\n\n# Home\n",
  );
  await writeFile(
    path.join(root, "docs", "guide.mdx"),
    "---\ntitle: Guide\ndescription: A guide.\nupdatedAt: 2026-09-11\n---\n\n# Guide\n",
  );
  await writeFile(
    path.join(root, "docs", "internal.mdx"),
    "---\ntitle: Internal\nnoindex: true\n---\n\n# Internal\n",
  );

  const output = path.join(root, "out");
  await buildDocs({
    root,
    outDir: "out",
    config: { title: "Test Docs", description: "Test documentation", siteUrl },
  });
  return { root, output };
}

describe("generated crawl files", () => {
  test("generates sitemap and robots for a configured site URL", async () => {
    const fixture = await createFixture("https://docs.example.test");
    try {
      const sitemap = await readFile(path.join(fixture.output, "sitemap.xml"), "utf8");
      const robots = await readFile(path.join(fixture.output, "robots.txt"), "utf8");

      expect(sitemap).toContain("https://docs.example.test/");
      expect(sitemap).toContain("https://docs.example.test/guide");
      expect(sitemap).toContain("<lastmod>2026-09-11</lastmod>");
      expect(sitemap).not.toContain("https://docs.example.test/internal");
      expect(robots).toContain("User-agent: *");
      expect(robots).toContain("Allow: /");
      expect(robots).toContain("Sitemap: https://docs.example.test/sitemap.xml");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  }, 30_000);

  test("does not generate absolute crawl files without a site URL", async () => {
    const fixture = await createFixture();
    try {
      await assert.rejects(readFile(path.join(fixture.output, "sitemap.xml"), "utf8"));
      await assert.rejects(readFile(path.join(fixture.output, "robots.txt"), "utf8"));
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  }, 30_000);
});
