# Contributing to Nikala Docs Engine

Thanks for contributing. Nikala Docs Engine is a public package, so changes should be reviewable, tested, and documented.

## Development setup

Requirements:

- Bun 1.3 or newer
- Node.js 20 or newer for compatible tooling
- SolidJS knowledge for runtime and theme changes

Clone the repository and install dependencies:

```bash
git clone https://github.com/nikala-ui/docs-engine.git
cd docs-engine
bun install
```

Run the local quality contract before opening a pull request:

```bash
bun run check
bun run test:browser
bun run test:generated
bun run package:check
bun run bundle:check
```

The repository supports Bun as the primary package manager. Node.js is used
only for compatible tooling and deployment integrations; contributors should
not replace the committed Bun lockfile with another lockfile.

## CI and troubleshooting

Pull requests run the same quality contract locally, followed by browser/SSR,
generated-consumer, package, bundle, dependency-review, and optional Netlify
preview checks. Main runs the full quality pipeline and stores build artifacts.

If a check fails locally:

1. Remove only the generated `dist/`, `.docs-dist/`, and temporary test output.
2. Run `bun install --frozen-lockfile`.
3. Re-run the failed command directly from `package.json`.
4. For browser failures, install Chromium with `bunx playwright install chromium`.
5. For generated-project failures, preserve the temporary project path and
   inspect its generated `docs.config.ts`, `src/`, and `dist/` before cleanup.

Do not disable a required check to hide a failure. Fix the contract or update
the test and documentation together.

## Supported release policy

Release tags use the `vMAJOR.MINOR.PATCH` format. A release is published only
from a matching tag after the complete CI pipeline passes. The package is
published with npm provenance, and the release workflow performs a clean
consumer-project smoke test after publication.

## Coding standards

- Use TypeScript and preserve strict type safety.
- Use `splitProps` for reactive SolidJS props; do not destructure props directly.
- Guard browser-only APIs with `typeof window !== "undefined"` or `typeof document !== "undefined"`.
- Keep components compatible with SSR and hydration.
- Prefer existing design tokens over hardcoded colors.
- Keep source files in kebab-case.
- Keep changes focused and avoid unrelated formatting.

## Documentation standard

Public behavior changes must include an MDX documentation update. New configuration fields, CLI behavior, and migration requirements need an example and a short explanation.

## Pull requests

Use a descriptive branch and commit message. A pull request should explain:

1. What behavior changed.
2. Why the change is needed.
3. Which tests and builds were run.
4. Whether users need to change their configuration or generated files.

Do not commit `dist/`, `node_modules/`, or local environment files.
