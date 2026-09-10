import { describe, expect, test } from "bun:test";
import { renderSeoMetadata } from "../src/server/seo.js";
import type { PageData } from "../src/types.js";

const page: PageData = {
  slug: "guide/intro",
  url: "/guide/intro",
  filePath: "/tmp/docs/guide/intro.mdx",
  frontmatter: {},
  toc: [],
  title: "Introduction",
  description: "Learn how to use Folio.",
};

describe("renderSeoMetadata", () => {
  test("renders social metadata and structured data with a site URL", () => {
    const html = renderSeoMetadata({
      title: "Folio",
      description: "Documentation engine",
      siteUrl: "https://folio.example",
      seo: {
        image: "/social-card.png",
        imageAlt: "Folio documentation",
      },
    }, page);

    expect(html).toContain("<title>Introduction - Folio</title>");
    expect(html).toContain('property="og:url" content="https://folio.example/guide/intro"');
    expect(html).toContain('property="og:image" content="https://folio.example/social-card.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"TechArticle"');
  });

  test("does not invent absolute URLs without siteUrl", () => {
    const html = renderSeoMetadata({ title: "Folio" }, page);

    expect(html).not.toContain("canonical");
    expect(html).not.toContain("og:url");
    expect(html).not.toContain("application/ld+json");
    expect(html).toContain('property="og:title" content="Introduction - Folio"');
  });

  test("marks noindex pages for crawlers", () => {
    const html = renderSeoMetadata(
      { title: "Folio" },
      { ...page, frontmatter: { noindex: true } },
    );

    expect(html).toContain('name="robots" content="noindex, follow"');
  });
});
