# Design Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Git policy for this session:** the user is handling all git operations themselves at the end. Implementers should NOT run `git add`, `git commit`, or any other git operation. Just write code, run tests, run the build, and report results.

**Goal:** A focused tightening pass on the sidebar (open/closed legibility), global spacing (less generous-by-default), and tool page headers (real h1 + description inside the tool surface).

**Architecture:** Three mostly-independent areas. Sidebar gets a chevron, a left-rail container around expanded contents, and tighter row padding. Spacing tightens by editing shared SCSS tokens/mixins so every consumer ripples. ToolLayout finally renders the `title` and `description` props it's been silently accepting; TopBar's h1 is demoted to a span; every tool route page passes title+description.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 + SCSS modules, Heroicons, Vitest + RTL + jest-axe, pnpm.

**Spec:** [docs/superpowers/specs/2026-05-22-design-tweaks-design.md](../specs/2026-05-22-design-tweaks-design.md)

---

## Conventions in this codebase

- Shared SCSS lives in `src/styles/_variables.scss`, `_mixins.scss`, `_utilities.scss`. Import via `@use '@/styles/variables' as *;`.
- Component modules: `src/components/<Name>/<Name>.tsx` + `<Name>.module.scss`.
- Tools registry: `src/config/tools-registry.ts` exports `TOOLS_REGISTRY: Tool[]` and `getToolById(id)`.
- Tests: `src/__tests__/*.test.ts` for utils, `src/__tests__/components/*.test.tsx` for components. Vitest globals enabled (no need to import `describe`/`it`/`expect`).
- Mock `next/navigation` and `next/link` in component tests (see `src/__tests__/components/smoke.test.tsx` for the pattern).
- Use dynamic `await import("@/components/...")` for component-under-test inside each `it` (project convention).
- Package manager: `pnpm`.

---

## File Structure

**New files:**
- `src/__tests__/components/ToolLayout.test.tsx` — TDD coverage for the new ToolLayout behavior

**Modified files:**
- `src/components/Sidebar/Sidebar.tsx` — chevron icon, left-rail container, tighter row padding
- `src/components/Sidebar/Sidebar.module.scss` — chevron rotation, left-rail styling, reduced-motion guard
- `src/styles/_mixins.scss` — `@mixin glass-card` padding, `@mixin two-column-grid` default gap
- `src/styles/_utilities.scss` — `.glass-card` utility padding
- `src/app/tools/page.module.scss` — landing page vertical rhythm
- `src/components/ToolLayout/ToolLayout.tsx` — render `title` + `description`
- `src/components/ToolLayout/ToolLayout.module.scss` — header + title + description styles
- `src/components/TopBar/TopBar.tsx` — `<h1>` → `<span>`
- `src/components/TopBar/TopBar.module.scss` — `.pageTitle` shrinks
- `src/app/tools/<every-tool>/page.tsx` — pass `title` + `description` to ToolLayout (~80 files, mechanical)
- `src/__tests__/components/a11y.test.tsx` — update ToolLayout test fixture if needed

---

## Task 1: Sidebar chevron — expanded/collapsed affordance

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.module.scss`

- [ ] **Step 1: Read the current Sidebar.tsx to confirm the category header structure**

Read `src/components/Sidebar/Sidebar.tsx`. The category header is a `<button>` that calls `toggleCategory(category.id)` and currently contains: a `CategoryIcon`, a `<span>` with the category name. We're adding a chevron after the span.

- [ ] **Step 2: Add the chevron import**

In `src/components/Sidebar/Sidebar.tsx`, add to the existing import from `@heroicons/react/24/outline`:

```tsx
import {
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    SwatchIcon,
    PhotoIcon,
    CodeBracketIcon,
    CalculatorIcon,
    ArrowsRightLeftIcon,
    LockClosedIcon,
    ClockIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
```

- [ ] **Step 3: Render the chevron in each category header button**

Find the category header button. Currently:

```tsx
<button className={`w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide cursor-pointer ${styles.categoryHeader}`} onClick={() => toggleCategory(category.id)}>
    <CategoryIcon className={`w-4.5 h-4.5 shrink-0 ${styles.categoryIcon}`} />
    <span className="flex-1 text-left whitespace-nowrap">{category.name}</span>
</button>
```

Add the chevron after the span:

```tsx
<button className={`w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide cursor-pointer ${styles.categoryHeader}`} onClick={() => toggleCategory(category.id)} aria-expanded={isExpanded}>
    <CategoryIcon className={`w-4.5 h-4.5 shrink-0 ${styles.categoryIcon}`} />
    <span className="flex-1 text-left whitespace-nowrap">{category.name}</span>
    <ChevronRightIcon className={`w-4 h-4 shrink-0 ${styles.chevron} ${isExpanded ? styles.chevronExpanded : ""}`} />
</button>
```

Note: also added `aria-expanded={isExpanded}` to the button so screen readers announce the collapse state.

- [ ] **Step 4: Add chevron rotation styles**

In `src/components/Sidebar/Sidebar.module.scss`, append:

```scss
.chevron {
    color: $text-muted;
    transition: transform $transition-fast;

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}

.chevronExpanded {
    transform: rotate(90deg);
}
```

- [ ] **Step 5: Run tests + build to verify nothing breaks**

Run: `pnpm test`
Expected: 109/109 passing (no regressions).

Run: `pnpm run build`
Expected: clean build.

- [ ] **Step 6: Self-check the change**

Visually scan the diff:
- Chevron import added once, no duplicates.
- `aria-expanded` attribute is on the button.
- Rotation transition respects `prefers-reduced-motion`.

Report DONE. The user handles git.

---

## Task 2: Sidebar left rail + indent on expanded contents

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.module.scss`

- [ ] **Step 1: Wrap the expanded tool list in a styled container**

In `src/components/Sidebar/Sidebar.tsx`, find this block (it renders after each category header when `isExpanded`):

```tsx
{isExpanded && (
    <div className="flex flex-col gap-0.5 px-2">
        {tools.map((tool) => { ... })}
    </div>
)}
```

Change the className to use a SCSS module class for the rail + indent. Replace with:

```tsx
{isExpanded && (
    <div className={`flex flex-col gap-0.5 ${styles.categoryItems}`}>
        {tools.map((tool) => { ... })}
    </div>
)}
```

(`px-2` is removed — the new SCSS class will handle horizontal padding.)

- [ ] **Step 2: Add the rail + indent styles**

In `src/components/Sidebar/Sidebar.module.scss`, append:

```scss
.categoryItems {
    margin-left: 1.25rem;
    padding-left: 0.75rem;
    border-left: 1px solid $border-subtle;
}
```

This puts the rail flush with the start of the category icon column (which is at `px-5` = 1.25rem from the sidebar edge) and indents the items so they sit clearly inside the rail.

- [ ] **Step 3: Run tests + build**

Run: `pnpm test`
Expected: 109/109 passing.

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 4: Report DONE**

---

## Task 3: Sidebar row padding — tighter

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`

- [ ] **Step 1: Update the tool row Tailwind classes**

In `src/components/Sidebar/Sidebar.tsx`, find the `<Link>` element rendered for each tool. Its className currently includes `px-4 py-3`. Change to `px-3 py-1.5`.

Specifically, find this line:

```tsx
className={`flex items-center justify-between gap-2 px-4 py-3 no-underline text-[0.9rem] relative ${styles.toolLink} ${isActive ? styles.active : ""} ${!tool.implemented ? styles.disabled : ""}`}
```

Change to:

```tsx
className={`flex items-center justify-between gap-2 px-3 py-1.5 no-underline text-[0.9rem] relative ${styles.toolLink} ${isActive ? styles.active : ""} ${!tool.implemented ? styles.disabled : ""}`}
```

- [ ] **Step 2: Run tests + build**

Run: `pnpm test`
Expected: 109/109 passing.

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 3: Report DONE**

---

## Task 4: Global spacing — glass-card mixin + utility + two-column gap

**Files:**
- Modify: `src/styles/_mixins.scss`
- Modify: `src/styles/_utilities.scss`

- [ ] **Step 1: Tighten the glass-card mixin padding**

In `src/styles/_mixins.scss`, find the `@mixin glass-card` block:

```scss
@mixin glass-card {
  background: $bg-glass;
  border: 1px solid $border-subtle;
  border-radius: $radius-xl;
  padding: $spacing-xl;
}
```

Change `padding: $spacing-xl;` to `padding: $spacing-lg;`.

- [ ] **Step 2: Tighten the .glass-card utility class padding**

In `src/styles/_utilities.scss`, find:

```scss
.glass-card {
  background: $bg-glass;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  padding: 1.5rem;
  transition: all 0.3s ease;
}
```

Change `padding: 1.5rem;` to `padding: 1rem;`.

- [ ] **Step 3: Tighten the two-column-grid mixin default gap**

In `src/styles/_mixins.scss`, find:

```scss
@mixin two-column-grid($breakpoint: 1024px, $gap: 1.5rem) {
```

Change the default `$gap: 1.5rem` to `$gap: 1rem`.

- [ ] **Step 4: Run tests + build**

Run: `pnpm test`
Expected: 109/109 passing (these are style-only changes; no test should fail).

Run: `pnpm run build` (with `rm -rf .next` first to be safe)
Expected: clean.

- [ ] **Step 5: Report DONE_WITH_CONCERNS noting that Task 8 (manual smoke test) is required to catch any tool layouts that visibly regress from the smaller padding.**

---

## Task 5: /tools landing page vertical rhythm

**Files:**
- Modify: `src/app/tools/page.module.scss`

- [ ] **Step 1: Apply the spacing reductions**

In `src/app/tools/page.module.scss`, make these changes:

`.header` block — change `margin-bottom`:

```scss
.header {
    margin-bottom: 1.25rem;  // was 2rem
}
```

`.categorySection` block — change `margin-bottom`:

```scss
.categorySection {
    margin-bottom: 1.5rem;  // was 2.5rem
}
```

`.categoryHeader` block — change `margin-bottom` and `padding-bottom`:

```scss
.categoryHeader {
    margin-bottom: 0.75rem;  // was 1.25rem
    padding-bottom: 0.5rem;  // was 0.75rem
    border-bottom: 1px solid $border-subtle;
}
```

`.toolsGrid` block — change `gap`:

```scss
.toolsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;  // was 1.25rem

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 2: Run tests + build**

Run: `pnpm test`
Expected: 109/109 passing.

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 3: Report DONE**

---

## Task 6: ToolLayout renders title + description

**Files:**
- Modify: `src/components/ToolLayout/ToolLayout.tsx`
- Modify: `src/components/ToolLayout/ToolLayout.module.scss`
- Create: `src/__tests__/components/ToolLayout.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ToolLayout.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
    usePathname: () => "/",
    useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

beforeAll(() => {
    Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
});

describe("ToolLayout", () => {
    it("renders a header with title and description when both props are passed", async () => {
        const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
        render(
            <ToolLayout title="Test Tool" description="Does test things">
                <p>Body</p>
            </ToolLayout>
        );
        expect(screen.getByRole("heading", { level: 1, name: "Test Tool" })).toBeInTheDocument();
        expect(screen.getByText("Does test things")).toBeInTheDocument();
        expect(screen.getByText("Body")).toBeInTheDocument();
    });

    it("renders only the title when description is omitted", async () => {
        const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
        render(
            <ToolLayout title="Test Tool">
                <p>Body</p>
            </ToolLayout>
        );
        expect(screen.getByRole("heading", { level: 1, name: "Test Tool" })).toBeInTheDocument();
        expect(screen.getByText("Body")).toBeInTheDocument();
    });

    it("renders no header when neither title nor description is passed", async () => {
        const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
        render(
            <ToolLayout>
                <p>Body</p>
            </ToolLayout>
        );
        expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
        expect(screen.getByText("Body")).toBeInTheDocument();
    });

    it("has no a11y violations", async () => {
        const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
        const { container } = render(
            <ToolLayout title="Test Tool" description="Does test things">
                <p>Body</p>
            </ToolLayout>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/components/ToolLayout.test.tsx`
Expected: FAIL — the existing ToolLayout doesn't render title/description.

- [ ] **Step 3: Update ToolLayout to render the props**

Replace `src/components/ToolLayout/ToolLayout.tsx` with:

```tsx
import { ReactNode } from "react";
import styles from "./ToolLayout.module.scss";

interface ToolLayoutProps {
    title?: string;
    description?: string;
    children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
    const hasHeader = Boolean(title || description);

    return (
        <div className={styles.container}>
            {hasHeader && (
                <header className={styles.header}>
                    {title && <h1 className={styles.title}>{title}</h1>}
                    {description && <p className={styles.description}>{description}</p>}
                </header>
            )}
            <div className={styles.content}>{children}</div>
        </div>
    );
}
```

Notes:
- The `icon` prop is dropped (per spec — no existing call site uses it).
- `title` and `description` are both optional; if both are absent, no `<header>` is rendered, preserving the old behavior.

- [ ] **Step 4: Add the header styles**

Read `src/components/ToolLayout/ToolLayout.module.scss` first. Append (or update if the file is mostly empty) so the file contains:

```scss
@use '@/styles/variables' as *;

.container {
    width: 100%;
}

.content {
    width: 100%;
}

.header {
    margin-bottom: 1.25rem;
}

.title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 0.25rem 0;
}

.description {
    font-size: 0.9rem;
    color: $text-secondary;
    line-height: 1.5;
    margin: 0;
    max-width: 70ch;
}
```

If `.container` / `.content` rules already exist with other properties, leave them alone and only add the new `.header`, `.title`, `.description` rules.

- [ ] **Step 5: Run the new test to verify it passes**

Run: `pnpm test src/__tests__/components/ToolLayout.test.tsx`
Expected: PASS (4/4 tests).

Run full suite: `pnpm test`
Expected: 113/113 passing (was 109; +4 from this task).

Note: the existing `src/__tests__/components/a11y.test.tsx` already has a "ToolLayout has no a11y violations" test that passes `title` and `description` props. With the new behavior those props now render real content — the test should still pass (it just exercises real rendered output now). If jest-axe flags anything, address inline before reporting DONE.

- [ ] **Step 6: Build**

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 7: Report DONE**

---

## Task 7: TopBar h1 demotion

**Files:**
- Modify: `src/components/TopBar/TopBar.tsx`
- Modify: `src/components/TopBar/TopBar.module.scss`

- [ ] **Step 1: Change the h1 to a span in TopBar.tsx**

In `src/components/TopBar/TopBar.tsx`, find the `leftSection`:

```tsx
<div className={styles.leftSection}>
    {currentTool && (
        <>
            <h1 className={styles.pageTitle}>{currentTool.name}</h1>
            <StarButton toolId={currentTool.id} variant="topbar" size="md" />
        </>
    )}
</div>
```

Change `<h1>` to `<span>`:

```tsx
<div className={styles.leftSection}>
    {currentTool && (
        <>
            <span className={styles.pageTitle}>{currentTool.name}</span>
            <StarButton toolId={currentTool.id} variant="topbar" size="md" />
        </>
    )}
</div>
```

- [ ] **Step 2: Shrink the .pageTitle visual treatment**

In `src/components/TopBar/TopBar.module.scss`, find the `.pageTitle` rule:

```scss
.pageTitle {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: $font-family-display;
    // ...commented-out gradient code (leave commented)...
}
```

Update to:

```scss
.pageTitle {
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-tertiary;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

(Removed `font-family: $font-family-display` so the span inherits the body sans. Kept the truncation rules.)

- [ ] **Step 3: Run tests + build**

Run: `pnpm test`
Expected: 113/113 passing.

Run: `pnpm run build`
Expected: clean.

Note: there's no test specifically targeting the TopBar element type; existing tests will continue to pass. If you discover one that asserted `<h1>` semantics, update it to `<span>`.

- [ ] **Step 4: Report DONE**

---

## Task 8: Wire all tool route pages to pass title + description

**Files:**
- Modify: every `src/app/tools/<tool-slug>/page.tsx` that wraps a feature in `<ToolLayout>` (~80 files)

- [ ] **Step 1: List every tool route page**

Run: `find src/app/tools -name "page.tsx" | sort`

Expected output: roughly 80 file paths, one per tool route.

- [ ] **Step 2: Read one representative tool page to confirm the current pattern**

Read `src/app/tools/text-case-converter/page.tsx`. It should look approximately like:

```tsx
import TextCaseConverter from "@/features/text-case-converter/TextCaseConverter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";

export default function Page() {
    return (
        <ToolLayout>
            <TextCaseConverter />
        </ToolLayout>
    );
}
```

(The exact import lines or feature-component name may differ per tool. The structural pattern — a `Page` function returning `<ToolLayout><FeatureComponent /></ToolLayout>` — is consistent.)

- [ ] **Step 3: Update the representative tool page first to confirm the new pattern works**

Edit `src/app/tools/text-case-converter/page.tsx` to:

```tsx
import TextCaseConverter from "@/features/text-case-converter/TextCaseConverter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { getToolById } from "@/config/tools-registry";

export default function Page() {
    const tool = getToolById("text-case-converter")!;
    return (
        <ToolLayout title={tool.name} description={tool.description}>
            <TextCaseConverter />
        </ToolLayout>
    );
}
```

The tool id (`"text-case-converter"`) matches the route slug — for every tool, the slug from the file path equals the id in the registry.

- [ ] **Step 4: Run the dev server briefly to visually confirm the header renders on /tools/text-case-converter**

Run: `pnpm run dev` in the background. Hit `http://localhost:3000/tools/text-case-converter` and confirm a real "Text Case Converter" h1 + description appears above the tool. Stop the dev server.

- [ ] **Step 5: Apply the same edit to every other tool page**

For each remaining `src/app/tools/<slug>/page.tsx`:
1. Read the file. Confirm it follows the pattern from Step 2.
2. Add `import { getToolById } from "@/config/tools-registry";` to the imports.
3. Inside the `Page` function, add `const tool = getToolById("<slug>")!;` before the return.
4. Change `<ToolLayout>` to `<ToolLayout title={tool.name} description={tool.description}>`.
5. Leave everything else (feature import, file structure) untouched.

The slug for each tool is the directory name. Use it literally as the id arg to `getToolById`.

If you discover a page that doesn't follow the standard pattern (e.g., it does extra work before rendering, or doesn't use ToolLayout), STOP and report it. Don't force the change.

- [ ] **Step 6: Run tests + build to catch any typos**

Run: `pnpm test`
Expected: 113/113 passing.

Run: `rm -rf .next && pnpm run build`
Expected: clean. If any tool page has a typo in its slug (mismatch between directory and registry id), the build will fail at type-checking on `tool.name` because `getToolById` returns `Tool | undefined` and we asserted non-null with `!`. Fix the typo and rebuild.

- [ ] **Step 7: Report DONE_WITH_CONCERNS listing any tool pages that didn't fit the standard pattern (if any)**

---

## Task 9: Manual smoke test of representative tools

**Files:** none modified.

- [ ] **Step 1: Start the dev server**

Run: `pnpm run dev`

- [ ] **Step 2: Visually inspect the six representative tools listed in the spec**

Open each in a browser at `http://localhost:3000`:

1. `/tools/text-case-converter` — simple text tool
2. `/tools/color-picker` — complex layout tool
3. `/tools/jwt-decoder` — tool with internal info section
4. `/tools/image-resizer` — image tool
5. `/tools/distance-converter` — unit converter
6. `/tools/regex-tester` — wide-data tool

For each:
- ToolLayout header (h1 + description) renders cleanly at the top of the page.
- Glass-card padding tightening hasn't visibly broken the layout.
- Two-column gap (where applicable) feels appropriate, not cramped.
- No obvious overflow, no broken alignment.

- [ ] **Step 3: Check the /tools landing page**

Open `http://localhost:3000/tools`. Verify the vertical rhythm tightened (categories closer, header tighter, grid gap smaller). Card grid should still feel balanced, not cramped.

- [ ] **Step 4: Check the sidebar**

- Chevrons appear on each category header.
- Clicking a category collapses/expands, chevron rotates.
- When expanded, the tool list has a visible left rail.
- Tool rows are more compact than before.
- Hover/active states still work.
- The favorites pinned section (built earlier) still renders correctly.

- [ ] **Step 5: Spot-check the TopBar**

Navigate to any tool page. The TopBar's tool name should be visibly smaller and less prominent than before (chrome indicator, not heading).

- [ ] **Step 6: Stop the dev server**

Press `Ctrl+C`.

- [ ] **Step 7: Apply per-tool overrides if anything visibly broke**

If any individual tool's layout looks broken due to the glass-card padding change, override padding in that tool's own SCSS module rather than reverting the global. Example pattern:

```scss
// In src/features/<tool-name>/<ToolName>.module.scss
.panel {
    @extend .glass-card;
    padding: 1.5rem; // restore previous, only if needed
}
```

Note any such overrides in the final report.

- [ ] **Step 8: Report DONE with a list of any per-tool overrides applied (or "no overrides needed")**

---

## Task 10: Final test suite + build

**Files:** none.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: 113/113 passing (Task 6 added 4 tests on top of the previous 109).

- [ ] **Step 2: Run the production build**

Run: `rm -rf .next && pnpm run build`
Expected: clean.

- [ ] **Step 3: Report DONE.**

---

## Done

Definition of done from the spec:

- [x] Sidebar shows a chevron next to each category header that rotates on expand.
- [x] Expanded sidebar tool lists have a left rail + indent anchoring them to the parent header.
- [x] Sidebar tool rows are tighter (`px-3 py-1.5`).
- [x] Glass-card mixin padding reduced; utility-class padding reduced.
- [x] Two-column grid mixin default gap reduced.
- [x] /tools landing page vertical rhythm tightened.
- [x] ToolLayout renders title + description inside a real header.
- [x] TopBar's tool name is a span, not an h1.
- [x] Every tool route passes `title` and `description` to ToolLayout.
- [x] Six representative tools manually inspected.
- [x] All tests passing; new ToolLayout render test added.
- [x] `pnpm run build` succeeds clean.
