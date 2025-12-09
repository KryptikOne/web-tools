# Web Tools - Developer Utilities Platform

A comprehensive collection of free, browser-based tools for developers and designers. Built with Next.js 15, TypeScript, Redux Toolkit, and Tailwind CSS v4.

## Features

- **50+ Tools** across 5 categories (Color, Text/Data, Image, Code/Web, Utilities)
- **Category Navigation** with dropdown menus for easy tool discovery
- **Modular Architecture** for easy addition of new tools
- **Redux State Management** for complex tool state
- **SASS Module System** with centralized theming
- **Fully Responsive** design that works on all devices
- **Zero Vulnerabilities** - all packages updated to latest secure versions

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) - `npm install -g pnpm`

### Installation

```bash
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

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with Redux & Navigation
│   ├── page.tsx             # Home page
│   └── tools/               # Individual tool pages
│       ├── color-picker/
│       ├── json-formatter/
│       └── ...
│
├── components/              # Shared components
│   ├── Navigation/         # Category-based navigation
│   ├── ToolCard/          # Tool display cards
│   ├── ToolLayout/        # Tool page wrapper
│   └── PlaceholderTool/   # "Coming Soon" component
│
├── features/               # Feature modules
│   └── color-picker/      # Color picker feature
│
├── store/                  # Redux store
│   ├── index.ts           # Store config
│   ├── hooks.ts           # Typed hooks
│   └── slices/            # Redux slices
│
├── config/                 # Configuration
│   └── tools-registry.ts  # Central tool registry
│
├── types/                  # TypeScript types
├── styles/                 # SASS styles
├── providers/              # React providers
└── lib/                    # Utilities
```

## Adding a New Tool

### 1. Register the Tool

Add your tool to `src/config/tools-registry.ts`:

```typescript
{
  id: 'my-tool',
  name: 'My Tool Name',
  description: 'What your tool does',
  category: ToolCategory.UTILITY_CONVERSION,
  route: '/tools/my-tool',
  implemented: false, // Change to true when ready
}
```

### 2. Create the Page

Create `src/app/tools/my-tool/page.tsx`:

```typescript
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import PlaceholderTool from '@/components/PlaceholderTool/PlaceholderTool';

export default function MyToolPage() {
  return (
    <ToolLayout title="My Tool" description="Description">
      <PlaceholderTool toolName="My Tool" />
    </ToolLayout>
  );
}
```

### 3. Implement the Tool

When ready to implement:

1. Create `src/features/my-tool/MyTool.tsx`
2. Create `src/features/my-tool/MyTool.module.scss`
3. Replace `PlaceholderTool` with your component
4. Update `implemented: true` in registry

The tool will automatically appear in:
- Home page grid
- Navigation dropdown
- Category listings

## Tool Categories

- **Text & Data Tools**: JSON formatting, CSV conversion, character counting, etc.
- **Color & Design Tools**: Color pickers, palette generators, CSS utilities
- **Image & Visual Tools**: Image processing, QR codes, format conversion
- **Code & Web Development**: JWT decoder, OGP generators, validators
- **Utility & Conversion**: Password generation, epoch conversion, calculators

## Technology Stack

- **Framework**: Next.js 15 (App Router) with Turbopack
- **Language**: TypeScript 5
- **State**: Redux Toolkit 2.10
- **Styling**: Tailwind CSS v4 + SASS Modules
- **Icons**: Heroicons
- **Fonts**: Geist Sans & Geist Mono

## Design System

### Colors
Uses OKLCH color space for perceptual uniformity. Variables defined in `src/styles/_variables.scss`.

### Spacing
8px grid system from `$spacing-xs` (0.25rem) to `$spacing-2xl` (3rem).

### Components
- Glass morphism effects for modern UI
- Consistent hover states
- Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

## Implemented Tools

### Color Picker ✅
Advanced OKLCH-based color picker with:
- Multi-format conversion (HEX, RGB, HSL, OKLCH)
- WCAG contrast checking
- Color palette saving
- CSS variable generation

### Coming Soon
49+ additional tools currently in planning/development.

## Performance

- Server-side rendering where applicable
- Route-based code splitting
- Lazy loading for components
- Optimized for Core Web Vitals

## Security

✅ Zero vulnerabilities
✅ Latest package versions
✅ Next.js 15.5.7 (patched critical vulnerabilities)
✅ Client-side only (no backend security concerns)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Development

### Key Commands

```bash
pnpm dev      # Start dev server with Turbopack
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Modular SASS with BEM-like naming
- Functional React components

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

When adding new tools:
1. Use the tool registry system
2. Follow the feature-based structure
3. Use SASS modules for styling
4. Add Redux slices if state is needed
5. Include TypeScript types
6. Test on multiple devices

## License

MIT

## Author

BittBott - Web Developer Tools

---

**Note**: This is a work in progress. New tools are being added regularly. Check back often for updates!
