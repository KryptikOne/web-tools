# BittBott - Web Developer Tools

A collection of free, browser-based tools for developers and designers. All tools run entirely client-side — no data is sent to any server, no registration required.

Built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and SCSS Modules.

## Features

- **25 Implemented Tools** across 6 categories
- **100% Client-Side** — all processing happens in the browser
- **No Tracking** — no registration, no usage limits
- **Modular Architecture** — easy to add new tools
- **Responsive Design** — works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) — `npm install -g pnpm`

### Installation

```bash
# Clone the repository
git clone https://github.com/KryptikOne/web-tools.git
cd web-tools

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Implemented Tools

### Color & Design

- **Color Picker** — OKLCH-based color picker with multi-format conversion and WCAG contrast checking
- **CSS Gradient Generator** — Create linear and radial CSS gradients visually
- **Box Shadow Generator** — Generate CSS box shadows with live preview
- **Border Radius Generator** — Create custom border radius values
- **Cubic Bezier Generator** — Interactive cubic bezier curve editor for CSS animations
- **Color Palette Generator** — Generate color palettes with harmony rules

### Image & Visual

- **Dummy Image Generator** — Generate placeholder images with custom dimensions and colors

### Text & Data

- **Invisible Character Remover** — Strip invisible and problematic Unicode characters
- **HTML Entities Reference** — Comprehensive HTML entities reference
- **Text/Binary Converter** — Convert text to binary and vice versa with encoding options

### Utility & Conversion

- **Epoch Converter** — Convert Unix timestamps to human-readable dates
- **PX/REM Calculator** — Convert between pixels and rem units
- **Percentage Calculator** — Calculate percentages, parts, or wholes from any two values
- **Tip Calculator** — Calculate tips with presets and bill splitting
- **Kitchen Converter** — Convert cooking measurements with reference charts
- **Timezone Converter** — Convert times between timezones with visual timeline
- **Distance / Length Converter** — Miles, km, meters, feet, yards, inches, and more
- **Weight / Mass Converter** — Pounds, kg, ounces, grams, stones, and tons
- **Temperature Converter** — Fahrenheit, Celsius, and Kelvin
- **Area Converter** — Square feet, square meters, acres, hectares, and more
- **Volume Converter** — Gallons, liters, cubic feet, and more
- **Aspect Ratio Calculator** — Calculate aspect ratios and dimensions for video/images
- **Data Storage Converter** — Bytes, KB, MB, GB, TB with binary/decimal modes
- **Bandwidth Calculator** — Convert bandwidth units and calculate download times

### Fun & Random

- **Dice Roller** — Roll virtual dice (D4, D6, D8, D10, D12, D20, D100)

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── tools/                # Individual tool routes
│
├── components/               # Shared components
│   ├── Navigation/           # Category-based navigation
│   ├── Sidebar/              # Collapsible sidebar
│   ├── ToolCard/             # Tool display cards
│   ├── ToolLayout/           # Tool page wrapper
│   ├── ColorPickerPanel/     # Reusable HSV color picker
│   └── ColorPickerPopover/   # Viewport-aware color picker popover
│
├── features/                 # Feature modules (one per tool)
│   └── [tool-name]/          # ToolName.tsx + ToolName.module.scss
│
├── config/                   # Configuration
│   └── tools-registry.ts     # Central tool registry
│
├── hooks/                    # Custom React hooks
├── lib/                      # Pure utility functions
├── store/                    # Redux store and slices
├── styles/                   # Global SCSS styles and variables
├── types/                    # TypeScript types
└── providers/                # React providers
```

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.5.9 | Framework (App Router + Turbopack) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| SCSS Modules | — | Component-specific styles |
| Redux Toolkit | 2.10.x | State management |
| Heroicons | 2.x | Icons |

## Contributing

Contributions are welcome! Here's how to get started:

### Adding a New Tool

1. **Register the tool** in `src/config/tools-registry.ts`
2. **Create the route** at `src/app/tools/[tool-name]/page.tsx`
3. **Create the feature** at `src/features/[tool-name]/ToolName.tsx`
4. **Create styles** at `src/features/[tool-name]/ToolName.module.scss`
5. **Set `implemented: true`** in the registry
6. **Run `pnpm build`** to verify everything compiles

### Guidelines

- Follow the existing feature-based file structure
- Use Tailwind for layout, SCSS modules for custom/complex styles
- Keep all processing client-side — no external API calls unless explicitly needed
- Use TypeScript strict mode — no `any` types
- Use functional React components and hooks
- Test on both desktop and mobile viewports

### Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-new-tool`)
3. Make your changes
4. Run `pnpm build` and `pnpm lint` to verify
5. Submit a pull request

See [ROADMAP.md](./ROADMAP.md) for planned tools and ideas.

## Development

### Commands

```bash
pnpm dev      # Start dev server with Turbopack
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Browser Support

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE). In short: you're free to use, modify, and distribute this software, but any modified version — including one hosted as a web service — must also be made available under the same license with full source code.

---

**This is a work in progress.** New tools are being added regularly. Check the [ROADMAP](./ROADMAP.md) for what's planned.
