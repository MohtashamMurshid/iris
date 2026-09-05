# Camera implementation and validation

The existing Iris screen now connects to a native camera pipeline on iPhone and a browser camera adapter for web testing. It keeps the aperture mark, dark instrument tray, eight tools, mode tabs, lens rail and shutter layout.

## Implemented

- Camera permission explanation, denial recovery and rechecking when returning from Settings.
- One capture per shutter action, cancellable 3/10-second timer, interruption handling and front/rear switching.
- Native VisionCamera 5.2.3 with physical camera selection, runtime zoom ranges, tap metering and supported focus/exposure locks.
- Manual exposure, focus, white balance, tint and EV trays. Shutter and ISO are explicitly coupled because the controller locks them together. Unsupported controls explain why they are unavailable.
- None, Natural, Daylight, Noir, Chrome and Faded with intensity. One versioned sRGB matrix is used by Skia preview, Core Image export and the browser renderer.
- HEIC/JPEG processing at the captured resolution with orientation and metadata handling. RAW DNG stays unbaked. Formats are probed for the selected iPhone camera with photo and video outputs attached; actual format combinations still need hardware QA.
- Thirds, square and golden-ratio guides, motion-sensor level and a sampled live luminance histogram. Overlays are separate from saved pixels.
- Persistent preferences and a private capture library. Native files live in the app’s documents directory; the browser uses IndexedDB for photo data.
- Original retention, non-destructive Look edits, favorites, format/Look filters, metadata, sharing, Photos save and confirmed deletion from Iris. Deletion does not remove exported copies from Photos.
- Add-only Photos permission on saving. Concurrent save taps share one request. An interrupted save is marked uncertain so a restart cannot silently create duplicates.
- Capture-storage recovery with retry and share-original actions. Processing failures retain the original and offer another edit attempt.
- Portrait/landscape layouts, a pinned shutter rail, accessible names and button state, visible feedback, and no essential animated transitions.
- Iris app icon and splash assets, EAS build profiles, JavaScript build scripts and CI checks.

## Automated validation

On September 5, 2026, lint, type checking, 17 logic tests, both web builds, the iOS JavaScript export, iOS project generation and Expo dependency checks passed. All 9 browser tests also passed against the exported production app, including the 100-capture test. Native Swift compilation and physical-iPhone QA were not run.

Run from the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run build:ios:bundle --workspace=@iris/mobile
npx playwright install chromium
npm run test:e2e
```

The logic suite covers invalid persisted settings, capability changes, original color recipes, concurrent capture records, duplicate saves, failed saves, interrupted saves, RAW protection and deletion failures.

Browser tests use Chromium’s fake camera, not a physical iPhone. They cover capture and review, original export, download, favorite, restyle, delete confirmation, storage failures, restart recovery, timer cancellation, duplicate shutter events, pixel-level Noir verification and small/landscape layouts. The 100-capture browser test uses a 640 × 480 test stream and verifies 100 unique, recoverable records after reload. This is not an iPhone stress-test result.

The native iOS project can be generated with:

```bash
cd apps/mobile
npx expo prebuild --platform ios --no-install
```

The local IrisProcessing module is discovered by Expo autolinking. An iOS JavaScript export validates bundling, not Swift compilation, signing or camera hardware behavior.

## Required physical-device release checks

This workspace runs on Linux. It cannot compile Apple frameworks, install a signed iOS app, or exercise an iPhone camera. Do not label a public iPhone release verified until these checks pass on the intended device matrix:

1. Compile the native modules with Xcode and install the development build on an iPhone. Verify both first launch and restart.
2. Capture 100 consecutive photographs, including manual exposure, Look processing and Photos saving. Check for duplicate, black, missing or wrongly oriented files.
3. Compare live Looks and exports on the same display in portrait and landscape, including HEIC, JPEG and the front camera.
4. Check actual EXIF shutter/ISO against locked values across captures and camera changes. Verify focus and white-balance locks and the reported ranges.
5. Test DNG on every supported physical camera/output combination. Ensure the DNG is unbaked and the review thumbnail is usable. Iris does not currently create a full-resolution processed RAW companion.
6. Deny/revoke camera, Photos and motion access; interrupt capture; background the app; disconnect cameras; test low storage and interrupted saves.
7. Check VoiceOver, Dynamic Type, thermal behavior, memory use, shutter response and preview frame rate. The live histogram samples twice per second; no 60fps or thermal benchmark is claimed here.
8. Complete signing, device/OS support decisions, TestFlight beta and App Store submission materials.

Focus peaking, zebras, simulated aperture, geotagging, video and Android camera support are outside this implementation. Peaking/zebras were P1 in the PRD; the current eight-tool UI has no controls for them. Simulated aperture, video and Android were outside v1 scope.

## Dependency audit

Compatible dependency updates were applied, and `xcode` uses an explicit `uuid@11.1.1` override to address its old UUID dependency while preserving its CommonJS `v4()` API. Native project generation is checked with that override.

The remaining npm audit reports are `image-size` (and Metro dependents) and `decode-uri-component` through Expo Router’s `query-string`. The former is used by the build tool to inspect repository image assets; it is not the camera’s photo processor. The latter remains an upstream router dependency. A forced audit fix would downgrade Expo packages to incompatible SDKs. Track these advisories before public distribution; the audit is not clean. No incompatible downgrade or hidden audit exclusion is applied.
