# professional-info

Personal portfolio site built with Astro 7, featuring a risograph-inspired visual system.

## Tech Stack

- [Astro 7](https://astro.build/) — static site generator
- [Tailwind CSS 4](https://tailwindcss.com/) — utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Playwright](https://playwright.dev/) — end-to-end testing

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Preview

```bash
npm run preview
```

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## Project Structure

```
src/
├── components/     # Astro components
├── content/        # Markdown content (blog, projects)
├── data/           # TypeScript data modules
├── layouts/        # Page layouts
├── lib/            # Utility functions
├── pages/          # Route pages
├── scripts/        # Build scripts
└── styles/         # Global styles
```

## Deployment

Deploys to [GitHub Pages](https://pages.github.com/). See `.github/workflows/deploy.yml` for the CI pipeline.
