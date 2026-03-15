# Web Tools Roadmap

Project improvement plan covering security hardening, open source governance, quality assurance, and new features.

82 tools are currently implemented across 7 categories (CSS & Design, Image & Media, Text & Data, Encoding & Data, Web Dev Tools, Unit Converters, Calculators & Time). See the [tools registry](src/config/tools-registry.ts) for the full list.

---

## P1 — CI/CD Foundation

- [ ] **Branch protection** — Enable in GitHub repo settings: require CI pass before merge (optional)

---

## P3 — Testing Foundation

- [ ] **Test framework setup** — Vitest + React Testing Library + jsdom
- [ ] **Critical path tests** — Unit tests for encoding/decoding, sanitization, and conversion utilities in `src/lib/`
- [ ] **Component smoke tests** — Basic render tests for high-risk tools (Markdown Preview, SVG Optimizer, HTML Tag Remover)
- [ ] **Accessibility tests** — Add jest-axe for automated a11y checking on shared components
- [ ] **CI integration** — Run tests in GitHub Actions workflow

---

## P4 — Quality & Performance

- [ ] **CHANGELOG.md** — Start tracking changes with semantic versioning
- [ ] **Bundle size monitoring** — Add `@next/bundle-analyzer` and document baseline
- [ ] **Error boundary** — Add a global React error boundary component
- [ ] **Automated a11y audit** — Integrate axe-core or Lighthouse CI for accessibility scoring

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
