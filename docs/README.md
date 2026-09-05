# Iris documentation

Product, contributor, and workspace docs for Iris.

> **Status:** Iris is still in development. There is **no released app** yet—nothing on the App Store, TestFlight, or public download. What exists today is the open-source repo, product docs, and a marketing site. Early access will be announced when a build is ready.

## Start here

| Document | Audience | Description |
| --- | --- | --- |
| [../README.md](../README.md) | Everyone | Project overview, setup, and principles |
| [PRD.md](PRD.md) | Product & engineering | Full product requirements for the iPhone camera |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Contributors | How to propose and land changes |
| [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Community | Contributor Covenant standards |
| [../SECURITY.md](../SECURITY.md) | Security researchers | Private vulnerability reporting |
| [../apps/mobile/README.md](../apps/mobile/README.md) | Mobile developers | Expo workspace notes |

## Brand assets

| File | Use |
| --- | --- |
| [assets/iris-logo.svg](assets/iris-logo.svg) | App-mark badge for README and dark surfaces |
| [assets/iris-mark.svg](assets/iris-mark.svg) | Flat aperture mark for light backgrounds |

App runtime assets live under `apps/mobile/assets/images/`.

## Product snapshot

Iris is an iPhone camera for photographers who want:

- Fast automatic capture
- Direct manual control
- Original live Looks in the viewfinder

v1 scope is **still photography on iPhone**. The product is actively being built; there is no installable consumer app yet. See the [PRD](PRD.md) for goals, non-goals, IA, Looks, formats, and acceptance criteria.

## Suggested reading order for contributors

1. Root [README](../README.md)
2. [Contributing](../CONTRIBUTING.md)
3. PRD sections that match your change (viewfinder, Looks, formats, etc.)
4. Expo [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/) when touching native/camera APIs

- [Camera implementation and validation](IMPLEMENTATION_STATUS.md): implemented functionality, test commands and remaining iPhone release checks.
