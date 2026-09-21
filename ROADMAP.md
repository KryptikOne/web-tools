# Web Tools Roadmap

Project improvement plan covering security hardening, open source governance, quality assurance, and new features.

131 tools are currently implemented across 9 categories (CSS & Design, Image & Media, Text & Data, Encoding & Data, Web Dev Tools, Unit Converters, Calculators & Time, Security & Crypto, Network). See the [tools registry](src/config/tools-registry.ts) for the full list.

---

## Quality & Performance

- [ ] **CHANGELOG.md** — Start tracking changes with semantic versioning
- [ ] **Bundle size monitoring** — Add `@next/bundle-analyzer` and document baseline

---

## Scheduled — Dedicated Sessions

- [ ] **Recipe Table** — Write a recipe in a small text DSL and render it as a Cooking-for-Engineers style action table (ingredients down the left, steps merging across columns), with serving scaling, metric/imperial switching, copy-as-HTML and print/PDF. Inspired by delphi.tools' Recipe Table. Needs its own design + build session: the parser is small, the table layout algorithm (nested column spans) is the real work. Design our own DSL rather than copying ClaraScript.

---

## Backlog — New Tools (Requires APIs)

These tools are on hold — they require external API integrations.

- [ ] **OGP Checker** — Check Open Graph meta tags on websites (requires server-side URL fetching)
- [ ] **IP Address Checker** — Check your IP address and location (requires geolocation API)
- [ ] **Currency Converter** — Convert between world currencies (requires live exchange rate API)

---

## Backlog — Potential Feature Enhancements

Improvements for existing tools:

### Text/Binary Converter

- [ ] File upload support (.txt files)
- [ ] File download (save as .txt or .bin)
- [ ] Custom delimiter input

### Site-Wide

- [ ] Seasonal font switch/theme switch — load themed fonts/styles based on time of year (e.g., Halloween in October, Christmas in December)
- [ ] Internationalization (i18n) — language translations and a language switcher so the app is accessible to non-English speakers
- [ ] Keyboard accessibility audit — Replace non-semantic `onClick` handlers on `<div>`/`<td>` elements with proper `<button>` or ARIA keyboard patterns (TimezoneConverter, KitchenConverter, GradientGenerator)
