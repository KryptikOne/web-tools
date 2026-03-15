# Web Tools

A collection of free, browser-based tools for developers and designers. All tools run entirely client-side — no data is sent to any server, no registration required.

Built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, and SCSS Modules.

## Features

- **80+ tools** across 7 categories
- **100% client-side** — all processing happens in the browser
- **No tracking** — no registration, no usage limits
- **Responsive** — works on desktop and mobile

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

Open [http://localhost:3000](http://localhost:3000) to view the application.

```bash
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # Run ESLint
pnpm test      # Run tests
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── tools/                # Individual tool routes
│
├── components/               # Shared components
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

| Technology    | Version | Purpose                            |
| ------------- | ------- | ---------------------------------- |
| Next.js       | 15.x    | Framework (App Router + Turbopack) |
| React         | 19.x    | UI library                         |
| TypeScript    | 5.x     | Type safety                        |
| Tailwind CSS  | 4.x     | Utility-first styling              |
| SCSS Modules  | —       | Component-specific styles          |
| Redux Toolkit | 2.x     | State management                   |
| Vitest        | 4.x     | Testing                            |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding tools, code style, and the PR process.

See [ROADMAP.md](./ROADMAP.md) for planned improvements and feature ideas.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE). You're free to use, modify, and distribute this software, but any modified version — including one hosted as a web service — must also be made available under the same license with full source code.
