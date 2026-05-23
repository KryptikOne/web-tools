# Design Tweaks — Design

**Status:** Approved, ready for implementation plan
**Date:** 2026-05-22

## Purpose

A focused tightening pass on three areas: sidebar legibility, global spacing, and tool page headers. The goal is to make the app feel more like Linear / Vercel (restrained, type-driven, dense) and less like a Bootstrap admin (card-on-card, generous padding everywhere).

This is intentionally narrow. A broader audit surfaced many more issues (color palette, display font usage, glassmorphism as default, hover-lift, decorative icons, identical card grids). Those are documented for future passes but explicitly out of scope here.

## Goals

- Categories in the sidebar read as clearly open or closed, and the items inside read as belonging to their category.
- Spacing across the app feels deliberate, not generously padded by default.
- Every tool page shows the tool's name and description at the top of the working area, not just buried in a 4rem chrome strip.

## Non-Goals

- Color palette retune.
- Font swap (Michroma stays for now).
- Logo gradient change.
- Active-state simplification in the sidebar.
- Icon library change.
- TopBar structural redesign (it stays; only the h1 is demoted).
- The full "glass-card everywhere" refactor across every tool's SCSS.
- ToolCard content reduction.

## Section 1 — Sidebar refinements

Three changes to [`src/components/Sidebar/Sidebar.tsx`](../../../src/components/Sidebar/Sidebar.tsx) and [`Sidebar.module.scss`](../../../src/components/Sidebar/Sidebar.module.scss).

### 1.1 Open/closed chevron

Add `ChevronRightIcon` (from `@heroicons/react/24/outline`) to each category header row. Position: right side of the row, after the category name (the existing layout already has `flex-1` on the name span, so the chevron sits at the far right).

- Default (collapsed): chevron points right.
- Expanded: rotated 90° to point down.

Implementation: a single `<ChevronRightIcon>` element with a CSS module class that conditionally applies a `rotate(90deg)` transform when the category is in `expandedCategories`. Transition: 150ms ease-out (`$transition-fast`). Respect `prefers-reduced-motion` by disabling the transition.

### 1.2 Left rail + indent on expanded contents

When a category is expanded, its tool list is wrapped in a container that has:

- `border-left: 1px solid $border-subtle` running down the left edge.
- `padding-left: 0.75rem` (extra indent so the rail visually anchors each row).
- The existing `gap-0.5` between rows stays.

The rail starts flush with the start of the rendered chevron column so it visually descends from the parent header.

A11y: the rail is decorative; no `role` or `aria-` attribute needed.

### 1.3 Tighter row padding

Current: `px-4 py-3` (1rem horizontal, 0.75rem vertical).
New: `px-3 py-1.5` (0.75rem horizontal, 0.375rem vertical).

This trims wasted vertical space without crowding the hover background or breaking the right-aligned star button placement. Result: roughly 33% more visible tools per screen on a standard 1080p sidebar.

## Section 2 — Global spacing tightening

Four targeted reductions. All edits live in shared SCSS files so they ripple to every consumer.

### 2.1 Glass-card padding

**File:** [`src/styles/_mixins.scss`](../../../src/styles/_mixins.scss)
- `@mixin glass-card` — change `padding: $spacing-xl` (2rem) to `padding: $spacing-lg` (1.5rem).

**File:** [`src/styles/_utilities.scss`](../../../src/styles/_utilities.scss)
- `.glass-card` utility class — change `padding: 1.5rem` to `padding: 1rem`.

The mixin-vs-utility split (1.5rem vs 1rem) is intentional: tools that `@include glass-card` in a SCSS module get the more generous version; tools that `@extend .glass-card` from utilities get the tighter version. Most tools currently `@extend` so they get the tighter result; tools that need more breathing room can opt into the mixin.

### 2.2 Two-column panel gap

**File:** [`src/styles/_mixins.scss`](../../../src/styles/_mixins.scss)
- `@mixin two-column-grid` — change default `$gap` argument from `1.5rem` to `1rem`.

Tools that explicitly pass their own gap argument are unaffected.

### 2.3 /tools landing page vertical rhythm

**File:** [`src/app/tools/page.module.scss`](../../../src/app/tools/page.module.scss)

| Selector | Current | New |
|---|---|---|
| `.header` `margin-bottom` | `2rem` | `1.25rem` |
| `.categorySection` `margin-bottom` | `2.5rem` | `1.5rem` |
| `.categoryHeader` `margin-bottom` | `1.25rem` | `0.75rem` |
| `.categoryHeader` `padding-bottom` | `0.75rem` | `0.5rem` |
| `.toolsGrid` `gap` | `1.25rem` | `1rem` |

### 2.4 Sidebar row padding

Already covered by Section 1.3.

### 2.5 Smoke-testing the spacing ripple

The glass-card mixin/utility change touches every tool's panels. After the change, visually inspect representative tools to catch any that visibly relied on the bigger padding:

- A simple text tool: `/tools/text-case-converter`
- A complex layout tool: `/tools/color-picker`
- A tool with internal info grid: `/tools/jwt-decoder`
- An image tool: `/tools/image-resizer`
- A unit converter: `/tools/distance-converter`
- A wide-data tool: `/tools/regex-tester`

If any individual tool is visibly broken, override padding in that tool's own SCSS rather than reverting the global change.

## Section 3 — Tool page header

### 3.1 ToolLayout finally renders its props

**File:** [`src/components/ToolLayout/ToolLayout.tsx`](../../../src/components/ToolLayout/ToolLayout.tsx)

Today this component accepts `title`, `description`, and `icon` props and renders none of them. New behavior:

```tsx
interface ToolLayoutProps {
    title?: string;
    description?: string;
    children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
    return (
        <div className={styles.container}>
            {(title || description) && (
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

The `icon` prop is dropped — every existing call site passes nothing for it, and the audit flagged decorative icons as noise.

**File:** [`src/components/ToolLayout/ToolLayout.module.scss`](../../../src/components/ToolLayout/ToolLayout.module.scss)

```scss
@use '@/styles/variables' as *;

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

No display font (no Michroma) on this header. No decorative icon. No gradient. Plain type, restrained.

### 3.2 TopBar h1 demoted

**File:** [`src/components/TopBar/TopBar.tsx`](../../../src/components/TopBar/TopBar.tsx)

Current: `<h1 className={styles.pageTitle}>{currentTool.name}</h1>` inside `leftSection`.

New: `<span className={styles.pageTitle}>{currentTool.name}</span>`.

The element loses its `h1` semantics so each page has one h1 (now owned by `ToolLayout`). The visual treatment also shrinks — it becomes a chrome indicator, not a heading.

**File:** [`src/components/TopBar/TopBar.module.scss`](../../../src/components/TopBar/TopBar.module.scss)

Update `.pageTitle` to match its new role:

| Property | Current | New |
|---|---|---|
| `font-size` | `1.25rem` | `0.875rem` |
| `font-weight` | `600` | `500` |
| `color` | `$text-primary` | `$text-tertiary` |
| `font-family` | `$font-family-display` (Michroma) | (remove — inherit body sans) |

The StarButton next to it stays.

### 3.3 Wire each tool page to pass title + description

Every tool page route (e.g., [`src/app/tools/text-case-converter/page.tsx`](../../../src/app/tools/text-case-converter/page.tsx)) currently looks like:

```tsx
export default function Page() {
    return (
        <ToolLayout>
            <TextCaseConverter />
        </ToolLayout>
    );
}
```

Each needs to look up its registry entry and pass `title` + `description`:

```tsx
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

Roughly 80 tool pages need this update. Mechanical, batchable, low-risk.

**Alternative considered:** have `ToolLayout` itself read the pathname and look up the tool. Rejected because it adds hidden coupling between the layout and the route shape, and harder to override per-tool if needed in future.

## Edge cases

- **Tools without a registry entry (none exist today, but in principle):** the new ToolLayout renders only `<div className={styles.content}>` when no title/description is passed — same as today's behavior.
- **Empty description:** the `<p>` is skipped. Some tools have minimal descriptions; that's fine, the h1 alone is sufficient.
- **Mobile:** ToolLayout header sits above the tool content with the same margin-bottom on all viewports. The TopBar tool name caption truncates with the existing `text-ellipsis` rule.
- **Accessibility:**
  - Single h1 per page (now owned by ToolLayout, removed from TopBar).
  - Chevron is decorative; the category header `<button>` already conveys the toggle action.
  - Left rail is purely visual decoration.
  - `prefers-reduced-motion` disables the chevron rotation transition.

## Testing

- Snapshot tests on shared components are not used in this project today, so no snapshot updates needed.
- A11y tests ([`src/__tests__/components/a11y.test.tsx`](../../../src/__tests__/components/a11y.test.tsx)) for `ToolLayout` already exist — they pass `title` and `description` to the component. Now those props actually render, so the test exercises real behavior. Update the test if jest-axe flags anything; otherwise it should still pass.
- Add one new test: `ToolLayout` renders `<h1>` and description when props are passed; renders nothing when both are undefined.
- Existing Sidebar tests should still pass; if any depended on the lack of a chevron, update them.

## Out of scope (documented for future passes)

These came up in the design audit but were explicitly deferred:

- Rainbow gradient text on the sidebar logo
- Michroma display font on category titles, tool titles, section titles
- Two-saturated-color palette (chartreuse + purple) → one accent, neutrals tinted
- Hover-lift translate on tool cards
- Stacked gradients on the active sidebar state
- ToolCard content reduction (wrench icon, "Ready" badge, category footer)
- /tools landing as a typographic list instead of a card grid
- Glassmorphism on chrome (sidebar + topbar blur)
- Heroicons → Lucide
- TopBar structural simplification or removal on desktop

## Definition of done

- [ ] Sidebar shows a chevron next to each category header that rotates on expand.
- [ ] Expanded sidebar tool lists are visually anchored to their parent header by a left rail + indent.
- [ ] Sidebar tool rows are tighter (`px-3 py-1.5`).
- [ ] Glass-card mixin padding reduced; utility-class padding reduced.
- [ ] Two-column grid mixin default gap reduced.
- [ ] /tools landing page vertical rhythm tightened per the table above.
- [ ] ToolLayout renders title + description inside a real header at the top of each tool.
- [ ] TopBar's tool name is a span, not an h1; visual treatment matches "chrome indicator" not "heading."
- [ ] Every tool route passes `title` and `description` to ToolLayout.
- [ ] Six representative tools manually inspected for any visible regressions from the glass-card padding change.
- [ ] All existing tests still pass; new ToolLayout render test added.
- [ ] `pnpm run build` succeeds clean.
