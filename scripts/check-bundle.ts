import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, ".docs-dist/assets");
const warningLimit = 500 * 1024;
const initialChunkLimit = 350 * 1024;
const assets = (await readdir(assetsDir))
  .filter((name) => name.endsWith(".js"))
  .map(async (name) => ({ name, bytes: (await stat(path.join(assetsDir, name))).size }));
const sizes = (await Promise.all(assets)).sort((a, b) => b.bytes - a.bytes);

assert.ok(sizes.length > 0, "docs build must produce JavaScript assets");
const oversized = sizes.filter(({ bytes }) => bytes > warningLimit);
assert.deepEqual(oversized, [], "no JavaScript asset may exceed the 500KB warning limit");

const initialChunks = sizes.filter(({ name }) => /^index-[^/]+\.js$/.test(name));
const oversizedInitial = initialChunks.filter(({ bytes }) => bytes > initialChunkLimit);
assert.deepEqual(oversizedInitial, [], "initial index chunks must stay below 350KB");

console.log("Bundle size report:");
for (const { name, bytes } of sizes.slice(0, 10)) {
  console.log(`  ${(bytes / 1024).toFixed(1).padStart(7)} KB  ${name}`);
}
console.log("Bundle validation passed: no asset exceeds the configured limits.");
