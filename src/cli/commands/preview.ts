// packages/docs/src/cli/commands/preview.ts
import pc from "picocolors";
import { previewDocs } from "../../server/index.js";
import { FOLIO_VERSION } from "../../version.js";

export interface PreviewCommandOptions {
  port?: string;
  host?: string;
  outDir?: string;
}

export async function runPreviewCommand(dir = "docs", options: PreviewCommandOptions = {}) {
  const port = options.port ? parseInt(options.port, 10) : 1862;
  const host = options.host || "localhost";
  const outDir = options.outDir || "dist";

  console.log();
  console.log(pc.bold(pc.cyan("  Folio ")) + pc.dim(`v${FOLIO_VERSION}`));
  console.log(pc.dim(`  Previewing production build from ${pc.bold(outDir)}...`));
  console.log();

  try {
    await previewDocs({
      outDir,
      port,
      host,
    });
  } catch (err: any) {
    console.error(pc.red(`  ✗ Preview failed: ${err.message}`));
    process.exit(1);
  }
}
