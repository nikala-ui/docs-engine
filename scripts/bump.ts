import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextVersion = process.argv[2];

if (!nextVersion || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(nextVersion)) {
  console.error("Usage: bun run bump <version>");
  console.error("Example: bun run bump 0.13.0");
  process.exit(1);
}

const packagePath = path.join(root, "package.json");
const versionPath = path.join(root, "src/version.ts");
const issueTemplatePath = path.join(root, ".github/ISSUE_TEMPLATE/bug_report.yml");

const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as { version: string };
const previousVersion = packageJson.version;
packageJson.version = nextVersion;

await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
await writeFile(versionPath, `export const FOLIO_VERSION = "${nextVersion}";\n`);

try {
  const issueTemplate = await readFile(issueTemplatePath, "utf8");
  const updatedTemplate = issueTemplate.replace(
    /placeholder:\s*["']?[^"'\n]+["']?/,
    `placeholder: "${nextVersion}"`,
  );
  if (updatedTemplate !== issueTemplate) await writeFile(issueTemplatePath, updatedTemplate);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

console.log(`Bumped Folio from ${previousVersion} to ${nextVersion}.`);
