import path from "node:path";
import { DEFAULT_DOCS_CONFIG, loadConfig } from "@nikala-ui/folio/config";
import { scanContent } from "@nikala-ui/folio/content";
import {
  createAlgoliaIndexer,
  getAlgoliaIndexerOptions,
} from "@nikala-ui/folio-algolia/indexing";

const projectRoot = process.cwd();
const config = await loadConfig(projectRoot);
const contentDir = path.resolve(
  projectRoot,
  config.contentDir ?? DEFAULT_DOCS_CONFIG.contentDir,
);
const pages = await scanContent(contentDir);
const indexer = createAlgoliaIndexer(getAlgoliaIndexerOptions());
const dryRun = process.argv.includes("--dry-run");

const summary = await indexer.sync(pages, {
  mode: "full",
  dryRun,
});

console.log(JSON.stringify(summary, null, 2));
