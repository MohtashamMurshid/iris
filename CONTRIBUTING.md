# Contributing to Iris

Thanks for helping build Iris. This guide keeps contributions focused, reviewable, and aligned with the product.

## Before you start

1. Read the [README](README.md) and [product requirements](docs/PRD.md).
2. Skim the [Code of Conduct](CODE_OF_CONDUCT.md).
3. For non-trivial work, open an issue first so we can agree on scope.

Iris v1 is **iPhone still photography**. Please do not submit Android ports, video capture, social features, or Leica/Halide-style trademarked look names unless the PRD explicitly expands scope.

## Development setup

```bash
git clone https://github.com/MohtashamMurshid/iris.git
cd iris
npm install
```

Useful commands from the repository root:

```bash
npm run mobile        # start the Expo app
npm run web           # start the Astro site
npm run lint
npm run typecheck
npm run build
```

Camera work needs a physical iPhone and a custom Expo development build. See [apps/mobile/README.md](apps/mobile/README.md) and the [Expo SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/).

## Project map

```text
apps/mobile/   Expo Router camera app (primary product)
apps/web/      Marketing site
docs/          Product and contributor docs
```

Prefer small, intentional changes inside the workspace that owns the feature.

## How to contribute

### Bugs

Open an issue with:

- Device and iOS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recordings when useful

### Features

Open an issue describing:

- The photographer problem
- How it fits the Iris principles in the PRD
- A minimal UX proposal

### Pull requests

1. Create a branch from `main`
2. Keep the PR focused on one concern
3. Match existing naming, theme tokens, and file structure
4. Run `npm run lint` and `npm run typecheck`
5. Update docs when behavior or setup changes
6. Fill out the PR template if one is present

### Commit style

Write short commit messages that explain **why** the change exists:

```text
Persist last selected Look across launches
```

Avoid noisy commits like `fix stuff` or `update`.

## Design and product guardrails

- Keep the viewfinder uncluttered; the frame comes first.
- Manual controls must stay locked once the user sets them.
- Live Looks must remain original Iris recipes—never copy proprietary profiles or trademarked look names.
- Prefer hardware-reported capability ranges over hard-coded device assumptions.
- Core capture should remain usable offline and without an account.

## Code guidelines

- TypeScript strict mode; avoid `any`
- Put imports at the top of the file
- Prefer existing Iris color and font tokens in `apps/mobile/src/constants/theme.ts`
- For Expo APIs, use the versioned docs for SDK 57
- Do not commit secrets, credentials, or local env files

## Reporting security issues

Do not open a public issue for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
