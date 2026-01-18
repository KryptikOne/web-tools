# Requirements for Web Tools (BittBott.dev)

## Project Vision

A comprehensive, privacy-focused collection of free browser-based utilities. All tools run entirely client-side with no registration, tracking, or usage limits.

---

## 1. Functional Requirements

### 1.1 Tool Development

#### 1.1.1 New Tool Implementation

-   Each new tool must be registered in `config/tools-registry.ts`
-   Tools must follow the feature-based structure: `features/[tool-name]/`
-   Each tool requires:
    -   Dedicated route in `app/tools/[tool-name]/`
    -   Feature component in `features/[tool-name]/`
    -   Module-scoped SCSS file (if needed)
    -   Entry in appropriate category

#### 1.1.2 Planned Tools

See [ROADMAP.md](./ROADMAP.md) for the complete list of planned tools organized by category.

### 1.2 Core Features

#### 1.2.1 Privacy & Local Processing

-   ALL tool processing must happen client-side
-   NO data transmission to external servers (except explicit API tools like Currency Converter)
-   NO user tracking or analytics beyond anonymous usage stats
-   NO registration or authentication required

#### 1.2.2 User Experience

-   All tools must be accessible without scrolling on standard desktop viewports (1920x1080)
-   Mobile-responsive design required for all tools
-   Tools must provide instant visual feedback
-   Error states must be handled gracefully with user-friendly messages
-   Copy-to-clipboard functionality where applicable

#### 1.2.3 Data Persistence

-   User preferences should persist across sessions (localStorage)
-   Tool-specific settings should be saveable (color palettes, saved conversions, etc.)
-   Optional: Import/Export user data feature

---

## 2. Technical Requirements

### 2.1 Architecture

#### 2.1.1 Framework & Build

-   Next.js 15+ (App Router)
-   React 19+
-   TypeScript with strict mode enabled
-   Turbopack for development builds
-   pnpm as package manager

#### 2.1.2 State Management

-   Redux Toolkit for complex tool state
-   React state for simple component-local state
-   Typed hooks (useAppDispatch, useAppSelector)

#### 2.1.3 Styling

**Hybrid Tailwind + SCSS Approach:**

Use a balanced combination of Tailwind utility classes in markup and SCSS modules for complex/custom styles:

1. **Tailwind First** - Use Tailwind classes for:
   - Layout (flex, grid, spacing, positioning)
   - Typography (font sizes, weights, colors)
   - Common utilities (rounded, shadow, opacity)
   - Responsive breakpoints
   - State variants (hover, focus, active)

2. **SCSS Modules When** - Use `[Component].module.scss` for:
   - Complex animations/transitions
   - Pseudo-elements (::before, ::after)
   - Multi-property hover states
   - Component-specific custom styles
   - Styles requiring SCSS variables/mixins

3. **Utility Classes** - Extend via `@extend` from `_utilities.scss`:
   - `.glass-card` - Glassmorphism card style
   - `.container` - Standard content container
   - `.copy-btn`, `.copy-icon` - Clipboard button patterns
   - `.section-title` - Consistent section headers

**Core Principles:**
- OKLCH color space for all color definitions
- CSS custom properties for theming
- No inline styles in components
- Keep styles D.R.Y. - centralize in utilities, use `@extend` or `@include`
- Tailwind for structure, SCSS for polish

#### 2.1.4 Code Organization

```
src/
├── app/
│   ├── tools/[tool-name]/page.tsx     # Route definition
│   └── styleguide/page.tsx            # Component/pattern documentation
├── components/                         # Reusable UI components
│   ├── ColorPickerPanel/              # HSV color picker with multi-format input
│   ├── ColorPickerPopover/            # Viewport-aware popover wrapper
│   └── [Component]/                   # Pattern: Component.tsx + Component.module.scss
├── features/[tool-name]/              # Tool implementation
│   ├── ToolName.tsx                   # Main component
│   └── ToolName.module.scss           # Styles (if needed)
├── hooks/                             # Custom React hooks
│   ├── useIsMobile.ts                 # SSR-safe mobile detection
│   └── useClipboard.ts                # Clipboard operations with feedback
├── lib/                               # Pure utility functions
│   └── colorUtils.ts                  # Color parsing/conversion (hex, RGB, HSL, HSV, OKLCH)
├── store/slices/[tool]Slice.ts        # Redux state (if needed)
└── styles/                            # Global styles and utilities
    ├── _variables.scss                # Design tokens
    ├── _mixins.scss                   # Reusable SCSS mixins
    └── _utilities.scss                # Extendable utility classes
```

#### 2.1.5 Reusable Components & Utilities

**Components** (`src/components/`):
- `ColorPickerPanel` - Canvas-based HSV picker with multi-format input (hex, RGB, HSL, OKLCH)
- `ColorPickerPopover` - Viewport-aware popover with mobile fallback to native input

**Hooks** (`src/hooks/`):
- `useIsMobile` - SSR-safe mobile detection with hydration handling
- `useClipboard` - Clipboard write with success/error feedback state

**Utilities** (`src/lib/`):
- `colorUtils.ts` - Color space conversions and parsing:
  - `parseColor()` - Parse any format to RGB
  - `hexToRgb()`, `rgbToHex()` - Hex conversions
  - `rgbToHsl()`, `hslToRgb()` - HSL conversions
  - `rgbToHsv()`, `hsvToRgb()` - HSV conversions
  - `rgbToOklch()`, `oklchToRgb()` - OKLCH conversions

**Principle:** Always check existing utilities before implementing new functionality. Extend rather than duplicate.

### 2.2 Performance

#### 2.2.1 Loading & Rendering

-   Initial page load < 3 seconds on 3G connection
-   Time to Interactive (TTI) < 5 seconds
-   Route-based code splitting for all tools
-   Lazy load heavy dependencies (image processing, charting libraries)

#### 2.2.2 Runtime Performance

-   Tools must handle large inputs efficiently (e.g., 10MB+ files for compression)
-   Debounce expensive operations (live previews, conversions)
-   Use Web Workers for CPU-intensive tasks
-   Virtualization for long lists (>100 items)

### 2.3 Browser Compatibility

-   Latest 2 versions of Chrome, Firefox, Safari, Edge
-   Mobile Safari (iOS 15+)
-   Chrome Mobile (Android 10+)
-   Graceful degradation for older browsers
-   Feature detection for modern APIs (File API, Clipboard API, etc.)

### 2.4 Accessibility (WCAG 2.1 AA)

-   All interactive elements keyboard accessible
-   Proper semantic HTML structure
-   ARIA labels where needed
-   Color contrast ratios meet WCAG AA standards
-   Screen reader friendly
-   Focus indicators visible on all interactive elements
-   Skip navigation links

### 2.5 SEO & Metadata

-   Unique meta title and description for each tool
-   Open Graph tags for social sharing
-   JSON-LD structured data for tool pages
-   Sitemap generation
-   robots.txt configuration

---

## 3. Design Requirements

### 3.1 Visual Design

#### 3.1.1 Color System

-   OKLCH color space for perceptual uniformity
-   Dark theme as default
-   Light theme support (future)
-   Consistent use of CSS custom properties from `globals.css`
-   Brand colors: primary (blue), secondary (purple), accent (pink)
-   Semantic colors: success (green), warning (orange), error (red), info (blue)

#### 3.1.2 Typography

-   Primary: Geist Sans
-   Display: Michroma (headings, tool names)
-   Monospace: Ubuntu Mono (code, technical values)
-   Responsive font sizes using Tailwind scale

#### 3.1.3 Component Consistency

-   All tools use consistent layout patterns via utility classes:
    - `.container` for page-level content wrapper
    - `.glass-card` for elevated content sections
    - `.section-title` for consistent headings
-   Consistent input styles via Tailwind + SCSS modules
-   Standardized button variants (primary, secondary, tertiary)
-   Glass morphism effects for elevated surfaces
-   Editable state pattern: readonly → editable (hover) → editing (active)
-   Viewport-aware popovers that adjust positioning automatically

**Styleguide:** Reference `/styleguide` for live examples of all patterns and components.

### 3.2 Layout & Navigation

-   Persistent sidebar navigation (categories + tools)
-   Collapsible sidebar on mobile
-   Top bar with breadcrumbs and quick actions
-   Footer with links and attribution
-   Category-based tool grouping in navigation

### 3.3 Interaction Patterns

-   Hover states on all interactive elements
-   Loading states for async operations
-   Success/error toast notifications
-   Confirmation dialogs for destructive actions
-   Drag-and-drop where applicable (file uploads, palette reordering)

---

## 4. Quality Requirements

### 4.1 Code Quality

#### 4.1.1 TypeScript

-   Strict type checking enabled
-   No `any` types except where absolutely necessary
-   Proper interface definitions for all tool configs
-   Shared types in `src/types/`

#### 4.1.2 Linting & Formatting

-   ESLint configuration enforced
-   Consistent code style across all files
-   No console.log statements in production builds
-   No unused imports or variables

#### 4.1.3 Code Review Standards

-   Component reusability prioritized
-   DRY principle for shared logic
-   Meaningful variable and function names
-   Comments for complex logic only (code should be self-documenting)

### 4.2 Testing (Future)

-   Unit tests for utility functions
-   Integration tests for complex tools
-   E2E tests for critical user flows
-   Visual regression testing for UI components
-   Target: 80% code coverage

### 4.3 Error Handling

-   Try-catch blocks for all async operations
-   User-friendly error messages
-   Error boundaries for React components
-   Fallback UI for component failures
-   Console warnings for development debugging

---

## 5. Deployment & Operations

### 5.1 Hosting

-   Deployed on Vercel (or similar static host)
-   Automatic deployments from `master` branch
-   Preview deployments for pull requests
-   Custom domain configuration

### 5.2 Environment Configuration

-   Environment variables for analytics keys
-   Separate configs for development/production
-   No sensitive data in client-side code

### 5.3 Monitoring

-   Vercel Analytics for basic usage metrics
-   Error tracking (optional: Sentry)
-   Core Web Vitals monitoring
-   Lighthouse CI in build pipeline (future)

### 5.4 Version Control

-   Git flow: `develop` → `master`
-   Feature branches for new tools
-   Semantic versioning for releases
-   Meaningful commit messages
-   Pull request reviews required

---

## 6. Documentation Requirements

### 6.1 Code Documentation

-   JSDoc comments for exported functions
-   README in each feature directory explaining tool logic
-   Type definitions serve as inline documentation

### 6.2 User Documentation

-   Help text within each tool interface
-   Tooltips for advanced options
-   Example use cases where applicable
-   FAQ section on homepage (future)

### 6.3 Developer Documentation

-   README.md with setup instructions
-   Contributing guide (CONTRIBUTING.md)
-   Tool development guide
-   Architecture decision records (future)

---

## 7. Future Considerations

### 7.1 Advanced Features

-   PWA support (offline functionality, install prompt)
-   Export tool collections as shareable links
-   Custom tool workspace/dashboard
-   Tool favorites/bookmarks
-   Recent tools history
-   Keyboard shortcuts

### 7.2 Theming

-   Light/dark mode toggle
-   Custom theme builder
-   Seasonal font switcher (from TODO.md)
-   High contrast mode for accessibility

### 7.3 Integrations

-   Browser extension for quick access
-   API endpoints for tool functionality (optional)
-   Figma plugin integration
-   VS Code extension

### 7.4 Community Features

-   User-submitted tool requests
-   Open source contributions
-   Tool usage statistics (public dashboard)
-   Changelog/Release notes

---

## 8. Non-Functional Requirements

### 8.1 Security

-   Content Security Policy (CSP) headers
-   No XSS vulnerabilities
-   No injection attacks (SQL, Command, etc.)
-   Secure handling of file uploads
-   No sensitive data storage

### 8.2 Maintainability

-   Modular architecture for easy updates
-   Dependency updates quarterly
-   Deprecated dependency removal
-   Code refactoring as needed
-   Technical debt tracking

### 8.3 Scalability

-   Architecture supports 100+ tools
-   Performance degrades gracefully with large inputs
-   Navigation remains usable with all categories populated
-   Bundle size optimization with code splitting

---

## Success Metrics

### Completion Metrics

-   **Phase 1 (MVP)**: 20 tools across all categories
-   **Phase 2 (Growth)**: 35 tools with theming support
-   **Phase 3 (Mature)**: 50+ tools with PWA support

### Performance Metrics

-   Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
-   Core Web Vitals: Green across all metrics
-   Bundle size < 500KB (per route)

### User Metrics

-   Time to complete task < 30 seconds per tool
-   Zero data breaches
-   100% client-side processing
-   Mobile usage > 30% of traffic

---

## Revision History

-   **v1.1** - Added reusable components, hybrid Tailwind+SCSS approach, styleguide reference (2026-01-18)
-   **v1.0** - Initial requirements document (2026-01-10)
