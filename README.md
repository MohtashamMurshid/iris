<p align="center">
  <img src="docs/assets/iris-logo.svg" width="112" height="112" alt="Iris aperture mark" />
</p>

<h1 align="center">Iris</h1>

<p align="center">
  <strong>Photography, in your hands.</strong>
</p>

<p align="center">
  An open-source iPhone camera for photographers who want fast automatic capture,<br />
  direct manual control, and distinctive live looks—without leaving the viewfinder.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#repository">Repository</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#documentation">Docs</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#license">License</a>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-F20D2F?style=flat-square" />
  <img alt="Platform: iPhone" src="https://img.shields.io/badge/platform-iPhone-101012?style=flat-square" />
  <img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-050506?style=flat-square" />
  <img alt="Status: In development" src="https://img.shields.io/badge/status-in%20development-98989F?style=flat-square" />
</p>

---

## Why Iris

The stock iPhone Camera is fast but hides photographic controls. Pro camera apps often bury those controls in dense interfaces. Filter apps usually apply a style only after capture.

Iris combines all three:

1. A dependable automatic camera
2. Understandable manual controls
3. Original Iris Looks previewed live in the viewfinder

> Open Iris, choose a look, and take a finished photograph—or take direct control of exposure, focus, and white balance without leaving the frame.

## Features

| | |
| --- | --- |
| **Auto + Manual** | Capture immediately, or lock shutter, ISO, focus, white balance, and EV |
| **Live Iris Looks** | Natural, Daylight, Noir, Chrome, and Faded—shown before you shoot |
| **Hardware-honest** | Controls and ranges come from the active camera device |
| **Offline by default** | Core capture works without an account or network connection |
| **Photographer formats** | Processed HEIC/JPEG and RAW (DNG) when the device supports it |

v1 targets **still photography on iPhone**. Video and Android are out of scope for the first release.

## Repository

Iris is an npm workspaces + Turborepo monorepo:

```text
apps/
  mobile/     Expo iOS camera app
  web/        Astro marketing site
docs/         Product and contributor documentation
packages/     Shared packages (as they land)
```

## Getting started

### Prerequisites

- Node.js 22+
- npm 11+
- macOS with Xcode (for iOS simulator / device builds)
- A physical iPhone for camera development and QA

Camera features require a **custom Expo development build**. Expo Go is not enough for the full capture stack.

### Install

```bash
git clone https://github.com/MohtashamMurshid/iris.git
cd iris
npm install
```

### Develop

Start everything through Turbo:

```bash
npm run dev
```

Or start one workspace:

```bash
npm run mobile      # Expo mobile app
npm run web         # Astro marketing site
```

Mobile helpers:

```bash
npm run mobile:ios
npm run mobile:android
npm run mobile:web
```

### Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

| Document | Description |
| --- | --- |
| [Product requirements](docs/PRD.md) | Goals, scope, UX, and acceptance criteria |
| [Documentation index](docs/README.md) | Map of all project docs |
| [Contributing guide](CONTRIBUTING.md) | How to propose changes and open PRs |
| [Code of conduct](CODE_OF_CONDUCT.md) | Community standards |
| [Security policy](SECURITY.md) | How to report vulnerabilities |
| [Mobile app notes](apps/mobile/README.md) | Expo workspace specifics |

## Design principles

1. **The frame comes first.** Controls should not obscure the subject longer than necessary.
2. **Manual means locked.** Iris must never silently override a setting the user explicitly locked.
3. **Preview honestly.** The saved processed image should closely match the live Look preview.
4. **Respect the hardware.** Show only controls and ranges the active device supports.
5. **Fast by default, deep on demand.** Auto mode should be immediate; advanced controls one gesture away.
6. **Original, not imitative.** Iris serves a similar need to pro camera apps without copying protected assets or proprietary profiles.

## Contributing

Iris is early and open to thoughtful contributions—especially around capture UX, Look rendering, accessibility, and documentation.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Open an issue to discuss larger changes before coding
3. Keep PRs focused and aligned with the [PRD](docs/PRD.md)

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Iris is released under the [MIT License](LICENSE).

---

<p align="center">
  <img src="docs/assets/iris-mark.svg" width="28" height="28" alt="" />
  <br />
  <sub>Built for photographers who want their phone to feel more like a camera.</sub>
</p>
