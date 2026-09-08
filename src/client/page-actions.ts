function textContent(node: Node): string {
  return node.textContent?.replace(/\s+/g, " ").trim() || "";
}

function renderInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (!(node instanceof HTMLElement)) return "";

  const content = Array.from(node.childNodes).map(renderInline).join("");
  if (node.tagName === "A") {
    const href = node.getAttribute("href");
    return href ? `[${content.trim()}](${href})` : content;
  }
  if (node.tagName === "CODE" && node.parentElement?.tagName !== "PRE") return `\`${content.trim()}\``;
  return content;
}

function renderBlock(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return textContent(node);
  if (!(node instanceof HTMLElement)) return "";

  if (/^H[1-6]$/.test(node.tagName)) {
    const level = Number(node.tagName.slice(1));
    return `${"#".repeat(level)} ${renderInline(node).trim()}`;
  }

  if (node.tagName === "PRE") return `\`\`\`\n${node.textContent?.trim() || ""}\n\`\`\``;
  if (node.tagName === "LI") return `- ${renderInline(node).trim()}`;

  const content = Array.from(node.childNodes).map(renderBlock).filter(Boolean).join("\n\n");
  return content || renderInline(node).trim();
}

export function pageToMarkdown(article: HTMLElement): string {
  return Array.from(article.children)
    .map(renderBlock)
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sourceToMarkdown(source: string): string {
  return source
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "")
    .trim();
}

export function pageToText(article: HTMLElement): string {
  return article.innerText.trim();
}

export function resolvePageActionUrl(
  template: string,
  values: { url: string; content: string; title?: string; prompt?: string },
): string {
  const prompt = values.prompt
    ? values.prompt
        .replaceAll("{url}", values.url)
        .replaceAll("{content}", values.content)
        .replaceAll("{title}", values.title || "")
    : "";

  return template
    .replaceAll("{url}", encodeURIComponent(values.url))
    .replaceAll("{content}", encodeURIComponent(values.content))
    .replaceAll("{title}", encodeURIComponent(values.title || ""))
    .replaceAll("{prompt}", encodeURIComponent(prompt));
}
