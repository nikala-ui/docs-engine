import type { DocsConfig, PageData } from "../types.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(siteUrl: string | undefined, value: string): string | undefined {
  try {
    const url = new URL(value, siteUrl || "https://folio.invalid");
    if (!siteUrl && url.origin === "https://folio.invalid") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function renderSeoMetadata(config: DocsConfig, page: PageData): string {
  const siteName = config.seo?.siteName || config.title || "Documentation";
  const title = `${page.title} - ${config.title || "Documentation"}`;
  const description = page.description || config.description || "";
  const pageUrl = absoluteUrl(config.siteUrl, page.url);
  const imageUrl = config.seo?.image
    ? absoluteUrl(config.siteUrl, config.seo.image)
    : undefined;
  const tags: string[] = [
    `<title>${escapeHtml(title)}</title>`,
  ];

  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}">`);
  }
  if (page.frontmatter.noindex === true) {
    tags.push(`<meta name="robots" content="noindex, follow">`);
  }
  if (pageUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(pageUrl)}">`);
    tags.push(`<meta property="og:url" content="${escapeHtml(pageUrl)}">`);
  }

  tags.push(
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
    `<meta property="og:locale" content="${escapeHtml(config.seo?.locale || "en_US")}">`,
    `<meta name="twitter:card" content="${config.seo?.twitterCard || "summary_large_image"}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
  );
  if (description) {
    tags.push(
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    );
  }
  if (imageUrl) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
    );
    if (config.seo?.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(config.seo.imageAlt)}">`);
    }
  }

  if (pageUrl) {
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TechArticle",
          headline: page.title,
          description: description || undefined,
          url: pageUrl,
          image: imageUrl,
          isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl(config.siteUrl, "/") },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: siteName, item: absoluteUrl(config.siteUrl, "/") },
            { "@type": "ListItem", position: 2, name: page.title, item: pageUrl },
          ],
        },
      ],
    };
    tags.push(`<script type="application/ld+json">${jsonLd(structuredData)}</script>`);
  }

  return tags.join("");
}

export function isPageIndexable(page: PageData): boolean {
  return page.frontmatter.noindex !== true;
}

export function getPageLastModified(page: PageData): string | undefined {
  const value = page.frontmatter.updatedAt;
  if (!value || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString().slice(0, 10);
}
