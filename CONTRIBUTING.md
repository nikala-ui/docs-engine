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

Run the quality checks before opening a pull request:

```bash
bun test tests
bun run build
```

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
