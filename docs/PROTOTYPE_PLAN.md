# Iris prototype plan

This plan turns the existing camera concept into a phone-testable prototype without pretending the first camera library is the final production pipeline.

## Slice 1 — permission and basic capture

**Goal:** prove the first-run flow and take a real photo on a physical phone.

- Explain camera access before showing the system prompt.
- Handle loading, granted, denied, retry, and Settings recovery states.
- Show a live rear-camera preview.
- Capture exactly one temporary photo per shutter tap.
- Prevent capture until the camera is ready and while a capture is in progress.
- Switch between front and rear cameras.
- Show the latest capture as a thumbnail and let the user review it.
- Do not request Photo Library access yet.

**Exit check:** a first-time user can grant access, take several photos, flip cameras, deny and recover permission, and review the latest temporary photo without a crash.

## Slice 2 — save and recovery

**Goal:** make a captured photo durable.

- Add a Keep/Save action to the review state.
- Request add-only Photo Library access on the first save.
- Keep the temporary file if saving fails or permission is denied.
- Add retry and share fallbacks.
- Persist and display the latest successful Iris capture.

**Exit check:** a capture appears in Photos exactly once, and every denied or failed save has a recovery path.

## Slice 3 — native camera foundation

**Goal:** validate the production camera stack needed for manual controls and live Looks.

- Configure an Expo development client and physical-iPhone signing.
- Spike VisionCamera v5 against Expo SDK 57 / React Native 0.86.
- Record available cameras, formats, focal lengths, zoom, ISO, exposure duration, focus, white balance, and RAW support on the reference iPhone.
- Decide whether to keep the basic Expo Camera path as a fallback or replace it after the spike.

**Exit check:** a signed development build opens a stable native preview and produces a device capability report.

## Slice 4 — dependable automatic camera

**Goal:** establish a trustworthy P0 capture loop before manual controls or Looks.

- Tap focus/exposure, EV compensation, zoom, lens switching, orientation, and recent thumbnail.
- Add capture/save state instrumentation and a 100-capture stress test.
- Verify no duplicate, black, rotated, or lost photos.

## Slice 5 — manual controls and Iris Looks

**Goal:** add depth only after capture is reliable.

- Build capability-aware manual locks for shutter, ISO, focus, and white balance.
- Prototype the shared GPU recipe for live preview and full-resolution output.
- Start with None and Natural, then add the remaining original Iris Looks.

## Phone-testing path

1. Try the basic Slice 1 prototype in Expo Go first because `expo-camera` is included there.
2. If the App Store version of Expo Go does not accept this SDK 57 project during the SDK transition, use the custom development-client path from Slice 3.
3. Camera behavior must be tested on a physical phone; the iOS Simulator is useful only for non-camera UI.
