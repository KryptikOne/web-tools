# Product

## Register

product

## Users

Developers and designers, split roughly between two modes:

- **Casual one-off users** who arrive to do one small task (convert a unit, decode a JWT, generate a palette) and leave. Speed and zero friction are the win.
- **Power users** who return regularly with favorited tools, expect cross-tool polish, and treat this like Raycast or DevToys in the browser.

The design has to work for both. Casual visitors should be able to start typing within a second of arriving. Power users should find the shell as trustworthy as the tools.

## Product Purpose

A collection of small, focused, browser-based tools for developers and designers. Every tool runs entirely client-side; nothing is sent to a server, no registration, no tracking. Success is when a senior engineer instinctively trusts the site enough to bookmark it and return without thinking about it.

## Brand Personality

Precise, opinionated, terminal-adjacent. Quiet confidence over loud marketing. Information-dense rather than padded, but not cramped.

Closest reference points: Linear (typographic rigor, opinionated defaults, dark-mode-native polish) and Vercel / shadcn (restrained, neutral, type-driven, designer-default). The interface should feel like it was made by someone who reads JetBrains release notes and cares about kerning.

## Anti-references

- **Bootstrap admin dashboards.** Card-on-card layouts, every section in its own rounded box, no hierarchy beyond "put it in a card."
- **Generic "free online tools" SEO sites.** Cluttered, ad-driven, design as afterthought.
- **Generic SaaS gradient hero + glass cards.** Purple-pink gradients, decorative blur, hero-metric templates, glassmorphism for its own sake. The boilerplate AI-frontend look.
- **Loud, brand-shouting marketing pages.** Animated headlines, illustration-heavy, scroll-driven everything. Wrong register entirely for an app shell.

## Design Principles

1. **Trust through restraint.** Confidence comes from precise type, deliberate spacing, and a small palette used with intent. Not from gradients or decorative flourish.
2. **Density without clutter.** Pack information at a rate that respects the user's time. Avoid generous-by-default padding that makes the site feel slow or unserious.
3. **Tool first, chrome second.** The tool's working surface gets the real estate. App shell (nav, headers, badges) is supporting, never the headline.
4. **Hierarchy by type, not by box.** Visual structure comes from typographic scale, weight, and rhythm, not from wrapping every group in a card.
5. **Same intent in light and dark.** Both themes must read with the same confidence. Neither is "the real one."

## Accessibility & Inclusion

- **WCAG 2.1 AA** target across all surfaces.
- **Respect `prefers-reduced-motion`.** Disable transforms and animations when the user opts out.
- **Color-blindness safe.** Never use color alone to convey state (active, error, success, favorited). Always pair color with icon, label, or position.
- **Both themes must hold.** Every design choice has to work in light and dark; choices that look great in one but mediocre in the other are not acceptable.
