import { createEffect, createSignal, type Component } from "solid-js";
import { defaultMdxComponents } from "../components/mdx-components.jsx";
import { DocsLayoutShell } from "./components/docs-layout-shell.jsx";
import { DocsPageContent } from "./components/docs-page-content.jsx";
import type { AppProps } from "./app-types.js";
import { createPageNavigation } from "./navigation/page-navigation.js";
import { createDocsRouter } from "./routing/use-docs-router.js";

// @ts-ignore
import rawConfig from "virtual:nikala-docs-config";
// @ts-ignore
import { tree as sidebarTree, pages as allPages } from "virtual:nikala-docs-tree";
// @ts-ignore
import { routes as pageRoutes } from "virtual:nikala-docs-routes";
// @ts-ignore
import { sources as pageSources } from "virtual:nikala-docs-sources";

export type { AppProps } from "./app-types.js";

export const App: Component<AppProps> = (props) => {
  const config = rawConfig || { title: "Nikala Docs" };

  const router = createDocsRouter({
    initialPath: props.initialPath,
    initialPageModule: props.initialPageModule,
    pages: allPages,
    loaders: pageRoutes,
  });

  const [sourceContent, setSourceContent] = createSignal<string>();
  let sourceRequest = 0;
  createEffect(() => {
    const url = router.currentPage()?.url;
    const loader = url ? pageSources[url] : undefined;
    const request = ++sourceRequest;
    setSourceContent(undefined);
    if (typeof window === "undefined" || !loader) return;
    loader().then((module: { default: string }) => {
      if (request === sourceRequest) setSourceContent(module.default);
    });
  });

  if (typeof document !== "undefined") {
    createEffect(() => {
      const siteTitle = config.title || "Documentation";
      const pageTitle = router.currentPage()?.title;
      document.title = pageTitle && pageTitle !== siteTitle
        ? `${pageTitle} - ${siteTitle}`
        : siteTitle;
    });
  }
  const navigation = createPageNavigation(router.currentPage, allPages, sidebarTree);

  return (
    <DocsLayoutShell
      config={config}
      tree={sidebarTree}
      pages={allPages}
      currentPage={router.currentPage()}
      breadcrumbs={navigation.breadcrumbs()}
      toc={router.activePageModule() ? navigation.toc() : []}
      prev={navigation.prevPage()}
      next={navigation.nextPage()}
      sourceContent={sourceContent()}
    >
      <DocsPageContent
        pageModule={router.activePageModule}
        mdxComponents={props.mdxComponents || defaultMdxComponents}
      />
    </DocsLayoutShell>
  );
};
