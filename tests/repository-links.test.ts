import { describe, expect, test } from "bun:test";
import { getRepositorySourceUrl } from "../src/navigation/repository-links.js";

describe("repository-links", () => {
  test("builds a GitHub source URL with branch and content root", () => {
    expect(getRepositorySourceUrl(
      {
        url: "https://github.com/example/docs.git",
        branch: "develop",
        rootDir: "website",
      },
      "themes/colors.mdx",
      "docs",
    )).toBe("https://github.com/example/docs/blob/develop/website/docs/themes/colors.mdx");
  });

  test("uses the GitLab blob URL format", () => {
    expect(getRepositorySourceUrl(
      { url: "https://gitlab.com/example/docs", branch: "main" },
      "index.mdx",
    )).toBe("https://gitlab.com/example/docs/-/blob/main/docs/index.mdx");
  });

  test("rejects unsafe repository paths", () => {
    expect(getRepositorySourceUrl(
      { url: "https://github.com/example/docs", rootDir: "../private" },
      "index.mdx",
    )).toBeUndefined();
  });
});
