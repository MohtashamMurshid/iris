# Iris

Iris is an iPhone camera for photographers who want fast automatic capture, direct manual control, and distinctive photographic looks.

## Repository

This repository uses npm workspaces with Turborepo:

```text
apps/
  mobile/    Expo iOS application
  web/       Astro marketing site
packages/    Shared packages
docs/        Product documentation
```

## Setup

Install all workspace dependencies from the repository root:

```bash
npm install
```

Start all development servers through Turbo:

```bash
npm run dev
```

Or start one app:

```bash
npm run mobile
npm run web
```

Other mobile commands:

```bash
npm run mobile:ios
npm run mobile:android
npm run mobile:web
```

Run repository checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

- [Product requirements](docs/PRD.md)
- [Mobile app instructions](apps/mobile/README.md)
