import type { DocsConfig } from "./src/types.js";

const config: DocsConfig = {
  title: "Nikala Docs Engine",
  description: "A fast, elegant, and customizable documentation engine for SolidJS.",
  favicon: "/favicon.ico",
  contentDir: "docs",
  repository: {
    url: "https://github.com/nikala-ui/docs-engine",
    branch: "main",
    rootDir: "",
  },
  pageActions: {
    ai: [
      {
        name: "ChatGPT",
        url: "https://chatgpt.com/?q={prompt}",
        prompt: "You are my documentation companion. I’m reading ‘{title}’ at {url}. Teach me how to use this page in a practical way: explain the core idea, show an idiomatic example, point out common mistakes, and help debug problems using the documented APIs and conventions.",
      },
      {
        name: "Claude",
        url: "https://claude.ai/new?q={prompt}",
        prompt: "You are my documentation companion. I’m reading ‘{title}’ at {url}. Teach me how to use this page in a practical way: explain the core idea, show an idiomatic example, point out common mistakes, and help debug problems using the documented APIs and conventions.",
      },
      {
        name: "v0",
        url: "https://v0.dev/chat?q={prompt}",
        prompt: "You are my documentation companion. I’m reading ‘{title}’ at {url}. Teach me how to use this page in a practical way: explain the core idea, show an idiomatic example, point out common mistakes, and help debug problems using the documented APIs and conventions.",
      },
    ],
  },
  navigation: {
    layout: "sidebar",
    navbar: [
      { title: "Home", href: "/" },
      { title: "Getting Started", href: "/getting-started" },
      { title: "Configuration", href: "/configuration" },
      { title: "Contributing", href: "/contributing" },
    ],
    sidebar: {
      nav: "auto",
      header: true,
      footer: false,
      headerSubtitle: "Documentation Engine",
      footerText: "Nikala Docs Engine",
    },
  },
  search: {
    enabled: true,
    provider: "local",
  },
  shiki: {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  },
  theme: {
    path: "./src/themes/default",
    defaultMode: "system",
  },
};

export default config;
