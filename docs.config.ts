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
  nav: [
    { title: "Home", href: "/" },
    { title: "Getting Started", href: "/getting-started" },
    { title: "Configuration", href: "/configuration" },
    { title: "Contributing", href: "/contributing" },
  ],
  navigation: {
    layout: "sidebar",
    sidebar: {
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
