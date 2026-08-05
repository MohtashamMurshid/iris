# Iris mobile

Expo workspace for the Iris iPhone camera app (`@iris/mobile`).

> **In development.** This is not a released consumer app. There is no App Store or TestFlight build yet—only the open-source Expo workspace used while Iris is being built.

## Requirements

- Repository root install (`npm install` from `/`)
- Expo SDK 57
- macOS + Xcode for iOS
- A physical iPhone for camera development and QA

Full camera capture needs a **custom development build**. Expo Go is fine for UI work, but not for the complete hardware control surface.

Use the versioned Expo docs: [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/)

## Get started

From the repository root:

```bash
npm install
npm run mobile
```

Then open the app in:

- a [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- the [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/) (UI-only without a device camera)
- a physical iPhone on the same network as Metro

Edit screens and routes under `src/app`. This project uses [Expo Router](https://docs.expo.dev/router/introduction/).

## Useful paths

```text
src/app/                 File-based routes
src/components/          Shared UI
src/constants/theme.ts   Iris colors, fonts, spacing
assets/images/           Icons, splash, aperture mark
```

## Scripts

Run from the repository root when possible:

```bash
npm run mobile
npm run mobile:ios
npm run mobile:android
npm run mobile:web
```

Inside this workspace:

```bash
npm run lint
npm run typecheck
```

## Product context

Iris aims to feel like an optical instrument: calm, precise, and out of the way of the photograph. Read the [product requirements](../../docs/PRD.md) before changing capture UX, Looks, or control behavior.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) at the repository root.
