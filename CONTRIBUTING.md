# Contributing to BittBott Web Tools

Thanks for your interest in contributing! This project is a collection of free, client-side web tools built with Next.js, React, TypeScript, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm — `npm install -g pnpm`

### Setup

```bash
git clone https://github.com/KryptikOne/web-tools.git
cd web-tools
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Commands

```bash
pnpm dev      # Start dev server with Turbopack
pnpm build    # Build for production
pnpm lint     # Run ESLint
```

## How to Contribute

### Reporting Bugs

Open a [bug report](https://github.com/KryptikOne/web-tools/issues/new?template=bug.md) with:

- Steps to reproduce
- Expected vs. actual behavior
- Browser and OS info
- Screenshots if applicable

### Suggesting Features

Open a [feature request](https://github.com/KryptikOne/web-tools/issues/new?template=feature_request.md). Check the [ROADMAP](./ROADMAP.md) first — it may already be planned.

### Submitting Code

1. Fork the repo
2. Create a branch from `develop`: `git checkout -b feature/my-tool`
3. Make your changes
4. Run `pnpm lint && pnpm build` to verify
5. Commit with a clear message (see below)
6. Push and open a pull request against `develop`

## Adding a New Tool

Every tool follows the same structure:

1. **Create the feature component** — `src/features/[tool-name]/[ToolName].tsx`
2. **Create the SCSS module** — `src/features/[tool-name]/[ToolName].module.scss`
3. **Create the route page** — `src/app/tools/[tool-name]/page.tsx`
4. **Register the tool** in `src/config/tools-registry.ts` with `implemented: true`
5. **Run `pnpm build`** to verify everything compiles

### Conventions

- **Styling:** Tailwind for layout/spacing/typography, SCSS modules for animations/pseudo-elements/complex hover states
- **Processing:** Keep everything client-side — no external API calls unless explicitly required
- **TypeScript:** Strict mode, no `any` types
- **Components:** Functional components and hooks only
- **Utilities:** Check `src/lib/` and `src/hooks/` before writing new helpers

## Commit Messages

Use clear, descriptive commit messages:

```
Add [tool-name] tool with [brief description]
Fix [tool-name] [what was broken]
Update [what changed] for [why]
```

Keep the first line under 72 characters. Add a body for complex changes.

## Branch Naming

- `feature/tool-name` — new tools
- `feature/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation changes

## Pull Request Guidelines

- Target the `develop` branch
- Keep PRs focused — one tool or one fix per PR
- Ensure `pnpm lint` and `pnpm build` pass
- Test on both desktop and mobile viewports
- Fill out the PR template

## Code Review

All PRs are reviewed before merging. Common feedback areas:

- Accessibility (semantic HTML, keyboard navigation, aria attributes)
- Mobile responsiveness
- Consistent styling with existing tools
- TypeScript type safety
- Performance (memoization, avoiding unnecessary re-renders)

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](./LICENSE).
