import { IrisMark } from "@/components/iris-mark";
import { LookPicker } from "@/features/camera/look-picker";
import { CameraShell } from "@/features/camera/camera-shell";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { Image } from "expo-image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { IrisColors } from "@/constants/theme";
import { CameraPermissionGate } from "@/features/camera/camera-permission-gate";
import { awaitCapture } from "@/features/camera/capture-task";
import { releaseTemporary } from "@/features/library/files";
import { CameraBackend } from "@/features/camera/backend";
import type { CameraHandle } from "@/features/camera/backend.types";
import {
  AUTO,
  DEFAULTS,
  EMPTY_CAPABILITIES,
  clamp,
  constrainPreferences,
  shutterLabel,
  type CameraReading,
  type Capabilities,
  type CaptureRecord,
  type CaptureResult,
  type LookId,
  type ManualSettings,
  type Preferences,
} from "@/features/camera/model";
import { Grid, Histogram, Level } from "@/features/camera/overlays";
import {
  Button,
  Dial,
  Options,
  Sheet,
  Toggle,
  ui,
} from "@/features/camera/panels";
import { styles } from "@/features/camera/styles";
import {
  addCapture,
  deleteCapture,
  loadCaptures,
  restyleCapture,
  saveCapture,
  updateCapture,
} from "@/features/library/repository";
import { sharePhoto } from "@/features/library/platform";
import { LOOKS } from "@/features/looks/recipes";
import { loadPreferences, savePreferences } from "@/features/settings/storage";

type ToolId =
  | "format"
  | "flash"
  | "timer"
  | "grid"
  | "level"
  | "focus"
  | "look"
  | "histogram";
type Panel =
  | ToolId
  | "settings"
  | "guide"
  | "library"
  | "metadata"
  | "delete"
  | "editLook"
  | "exposure"
  | "whiteBalance"
  | "ev"
  | "saveAgain"
  | null;
const errorText = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "That action did not complete. Please try again.";

export default function CameraScreen({
  initialLibrary = false,
}: { initialLibrary?: boolean } = {}) {
  const camera = useRef<CameraHandle>(null);
  const [p, setP] = useState<Preferences>(DEFAULTS);
  const pref = useRef(p);
  useLayoutEffect(() => {
    pref.current = p;
  }, [p]);
  const [hydrated, setHydrated] = useState(false);
  const [records, setRecords] = useState<CaptureRecord[]>([]);
  const [capabilities, setCapabilities] =
    useState<Capabilities>(EMPTY_CAPABILITIES);
  const [reading, setReading] = useState<CameraReading>({});
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background",
  );
  const [cameraKey, setCameraKey] = useState(0);
  const [panel, setPanel] = useState<Panel>(initialLibrary ? "library" : null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    photo: CaptureResult;
    settings: Preferences;
  } | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [focus, setFocus] = useState<{
    x: number;
    y: number;
    locked: boolean;
  } | null>(null);
  const [editLook, setEditLook] = useState<LookId>("none");
  const [editIntensity, setEditIntensity] = useState(100);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [libraryFormat, setLibraryFormat] = useState("all");
  const [libraryLook, setLibraryLook] = useState("all");
  const operation = useRef(false);
  const shutterToken = useRef(0);
  const countdownRef = useRef(0);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveCountdown = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const selected = records.find((r) => r.id === selectedId);
  const newest = records[0];

  const shootingActive = foreground && !selected;
  const canFlip = capabilities.devices.some(
    (device) => device.facing !== p.facing,
  );

  const refresh = useCallback(async () => {
    const photos = await loadCaptures();
    if (mounted.current) setRecords(photos);
    return photos;
  }, []);
  const cancelTimer = useCallback(() => {
    if (!countdownRef.current) return;
    shutterToken.current++;
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    resolveCountdown.current?.();
    countdownRef.current = 0;
    setCountdown(0);
    operation.current = false;
    setBusy(false);
  }, []);
  useEffect(() => {
    mounted.current = true;
    void Promise.all([loadPreferences(), loadCaptures()])
      .then(([preferences, photos]) => {
        if (mounted.current) {
          setP(preferences);
          setRecords(photos);
          setHydrated(true);
        }
      })
      .catch((error) => {
        if (mounted.current)
          setNotice(`Storage could not be opened. ${errorText(error)}`);
      });
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") {
        setReady(false);
        cancelTimer();
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      cancelTimer();
    };
  }, [cancelTimer]);
  useEffect(() => {
    if (hydrated)
      void savePreferences(p).catch((error) =>
        setNotice(`Settings were not saved. ${errorText(error)}`),
      );
  }, [p, hydrated]);
  useEffect(() => {
    if (!captureFlash) return;
    const timer = setTimeout(() => setCaptureFlash(false), 140);
    return () => clearTimeout(timer);
  }, [captureFlash]);
  const onCapabilities = useCallback((c: Capabilities) => {
    setCapabilities(c);
    const previous = pref.current;
    const constrained = constrainPreferences(previous, c);
    if (
      previous.deviceId === c.id &&
      (constrained.format !== previous.format ||
        JSON.stringify(constrained.manual) !== JSON.stringify(previous.manual))
    )
      setNotice(
        "Settings were adjusted to the active camera’s supported ranges.",
      );
    setP((current) => {
      const next = constrainPreferences(current, c);
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      return next;
    });
  }, []);
  const onReady = useCallback((value: boolean) => {
    setReady(value);
    if (value) {
      setCameraError(false);
      if (!pref.current.guideSeen) setPanel((current) => current ?? "guide");
    }
  }, []);
  const onCameraError = useCallback((message: string) => {
    setReady(false);
    setCameraError(true);
    setNotice(message);
  }, []);
  function update(values: Partial<Preferences>) {
    setP((current) => ({ ...current, ...values }));
  }
  function manual(values: Partial<ManualSettings>) {
    setP((current) => ({
      ...current,
      manual: { ...current.manual, ...values },
    }));
  }
  function closePanel() {
    if (panel === "guide") update({ guideSeen: true });
    setPanel(null);
  }
  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice(errorText(error));
      await refresh().catch(() => undefined);
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function capture() {
    if (countdownRef.current) {
      cancelTimer();
      return;
    }
    if (
      operation.current ||
      !ready ||
      !camera.current ||
      selected ||
      panel ||
      pendingPhoto
    )
      return;
    operation.current = true;
    setBusy(true);
    setNotice(null);
    const token = ++shutterToken.current;
    const settings = pref.current;
    try {
      for (let remaining = settings.timer; remaining > 0; remaining--) {
        countdownRef.current = remaining;
        setCountdown(remaining);
        await new Promise<void>((resolve) => {
          resolveCountdown.current = resolve;
          countdownTimer.current = setTimeout(resolve, 1000);
        });
        if (token !== shutterToken.current) return;
      }
      countdownRef.current = 0;
      setCountdown(0);
      if (!camera.current)
        throw new Error("The camera stopped before capture.");
      setCaptureFlash(true);
      if (Platform.OS === "ios")
        void Haptics.selectionAsync().catch(() => undefined);
      const photo = await awaitCapture(
        camera.current.capture(),
        Math.max(30000, (settings.manual.shutter ?? 0) * 1000 + 15000),
        () => {
          setReady(false);
          setCameraKey((value) => value + 1);
        },
        async (late) => {
          await releaseTemporary(late.sourceUri);
          if (late.thumbnailUri !== late.sourceUri)
            await releaseTemporary(late.thumbnailUri);
        },
      );
      let record: CaptureRecord;
      try {
        record = await addCapture(photo, settings);
      } catch (error) {
        setPendingPhoto({ photo, settings });
        throw new Error(
          `The photo was captured but could not be kept in your library. Retry keeping it or share the original now. ${errorText(error)}`,
        );
      }
      await refresh();
      if (
        record.format !== "dng" &&
        settings.look !== "none" &&
        settings.intensity > 0
      ) {
        try {
          record = await restyleCapture(
            record,
            settings.look,
            settings.intensity,
          );
          await refresh();
        } catch (error) {
          setNotice(
            `Original kept in Iris. Look processing failed: ${errorText(error)} Open the photo to retry.`,
          );
          return;
        }
      }
      if (settings.autoSave) {
        try {
          await saveCapture(record);
          await refresh();
          setNotice(
            Platform.OS === "web" ? "Photo downloaded." : "Saved to Photos.",
          );
        } catch (error) {
          setNotice(`Photo kept in Iris. ${errorText(error)}`);
          await refresh();
        }
      } else
        setNotice("Photo kept in Iris. Open the thumbnail to save or share.");
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      if (token === shutterToken.current) {
        operation.current = false;
        setBusy(false);
        countdownRef.current = 0;
        setCountdown(0);
      }
    }
  }
  function review(record: CaptureRecord) {
    if (busy) return;
    setSelectedId(record.id);
    setPanel(null);
    setReady(false);
    setNotice(null);
  }
  function returnToCamera() {
    setSelectedId(null);
    setReady(false);
    setNotice(null);
    setFocus(null);
  }
  function switchFacing() {
    if (busy || !canFlip) return;
    setReady(false);
    setFocus(null);
    update({
      facing: p.facing === "back" ? "front" : "back",
      deviceId: null,
      zoom: 1,
      manual: AUTO,
      mode: "PHOTO",
    });
  }
  function focusFrame(event: GestureResponderEvent, locked = false) {
    if (!ready || busy || selected || pinch.current) return;
    if (!capabilities.metering) {
      setNotice(
        "This camera handles focus automatically. Manual options are listed in the Focus tray.",
      );
      return;
    }
    const { locationX: x, locationY: y } = event.nativeEvent;
    void camera.current
      ?.focus(x, y, locked)
      .then(() => setFocus({ x, y, locked }))
      .catch((error) => setNotice(errorText(error)));
  }
  function saveReview(retryUncertain = false) {
    if (!selected) return;
    if (selected.savePending && !retryUncertain) {
      setPanel("saveAgain");
      return;
    }
    void run(async () => {
      await saveCapture(selected, retryUncertain);
      await refresh();
      setPanel(null);
      setNotice(
        Platform.OS === "web" ? "Download started." : "Saved to Photos.",
      );
    });
  }
  if (!hydrated)
    return (
      <View
        style={[
          styles.page,
          { justifyContent: "center", padding: 30, gap: 20 },
        ]}
      >
        <IrisMark size={64} />
        {notice ? (
          <>
            <Text style={ui.copy}>{notice}</Text>
            <Button
              label="Retry storage"
              onPress={() => {
                void Promise.all([loadPreferences(), loadCaptures()])
                  .then(([preferences, photos]) => {
                    setP(preferences);
                    setRecords(photos);
                    setNotice(null);
                    setHydrated(true);
                  })
                  .catch((error) => setNotice(errorText(error)));
              }}
            />
          </>
        ) : (
          <ActivityIndicator color={IrisColors.chalk} />
        )}
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#050506" }}>
      <CameraShell
        preferences={p}
        capabilities={capabilities}
        reading={reading}
        busy={busy}
        ready={ready && !pendingPhoto}
        countdown={countdown}
        reviewing={!!selected}
        count={records.length}
        thumbnail={newest?.thumbnailUri}
        onUpdate={update}
        onPanel={setPanel}
        onCapture={() => {
          void capture();
        }}
        onReview={() => (newest ? review(newest) : setPanel("library"))}
        onSwitch={switchFacing}
        canFlip={canFlip}
        preview={
          <Pressable
            accessibilityLabel={
              selected ? "Captured photo" : "Live camera preview"
            }
            accessibilityHint="Tap to meter, hold to lock, or pinch to zoom"
            onPress={(event) => focusFrame(event)}
            onLongPress={(event) => focusFrame(event, true)}
            onTouchStart={(event) => {
              const touches = event.nativeEvent.touches;
              if (touches.length === 2 && !busy && !selected)
                pinch.current = {
                  distance: Math.hypot(
                    touches[0].pageX - touches[1].pageX,
                    touches[0].pageY - touches[1].pageY,
                  ),
                  zoom: p.zoom,
                };
            }}
            onTouchMove={(event) => {
              const touches = event.nativeEvent.touches;
              if (pinch.current && touches.length === 2 && !busy) {
                const distance = Math.hypot(
                  touches[0].pageX - touches[1].pageX,
                  touches[0].pageY - touches[1].pageY,
                );
                update({
                  zoom: clamp(
                    (pinch.current.zoom * distance) /
                      Math.max(1, pinch.current.distance),
                    capabilities.zoom.min,
                    capabilities.zoom.max,
                  ),
                });
              }
            }}
            onTouchEnd={() => {
              pinch.current = null;
            }}
            style={{
              flex: 1,
              overflow: "hidden",
              borderRadius: 36,
              backgroundColor: "#101012",
            }}
          >
            <CameraPermissionGate>
              <CameraBackend
                key={cameraKey}
                ref={camera}
                preferences={p}
                active={shootingActive}
                onReady={onReady}
                onCapabilities={onCapabilities}
                onReading={setReading}
                onError={onCameraError}
              />
            </CameraPermissionGate>
            {selected ? (
              <Image
                contentFit="contain"
                source={
                  selected.format === "dng"
                    ? selected.thumbnailUri
                    : selected.uri
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: IrisColors.opticalBlack,
                }}
              />
            ) : (
              <>
                {!!capabilities.id && !cameraError && foreground && (
                  <>
                    <Grid type={p.grid} />
                    {p.level && <Level />}
                    {p.histogram && <Histogram bins={reading.histogram} />}
                    {focus && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.focusReticle,
                          { left: focus.x, top: focus.y },
                        ]}
                      >
                        <View style={styles.focusDot} />
                        {focus.locked && (
                          <Text
                            style={{
                              color: "white",
                              fontSize: 9,
                              position: "absolute",
                              top: 49,
                            }}
                          >
                            LOCKED
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
            {countdown > 0 && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  accessibilityLiveRegion="assertive"
                  style={{ color: "white", fontSize: 88, fontWeight: "300" }}
                >
                  {countdown}
                </Text>
                <Text style={ui.copy}>Tap the shutter to cancel</Text>
              </View>
            )}
            {captureFlash && (
              <View pointerEvents="none" style={styles.captureFlash} />
            )}
          </Pressable>
        }
        feedback={
          <>
            {pendingPhoto && (
              <View style={[ui.row, { marginTop: 10 }]}>
                <Button
                  label="Retry keeping photo"
                  disabled={busy}
                  onPress={() => {
                    void run(async () => {
                      const record = await addCapture(
                        pendingPhoto.photo,
                        pendingPhoto.settings,
                      );
                      setPendingPhoto(null);
                      await refresh();
                      setSelectedId(record.id);
                      setNotice(
                        "Original kept. Open Edit Look to apply your selected Look.",
                      );
                    });
                  }}
                />
                <Button
                  label="Share captured original"
                  disabled={busy}
                  onPress={() => {
                    void run(() => sharePhoto(pendingPhoto.photo.sourceUri));
                  }}
                />
              </View>
            )}
            {!!notice && (
              <View
                accessibilityRole="alert"
                style={[
                  styles.errorBanner,
                  !cameraError &&
                    !pendingPhoto && {
                      backgroundColor: IrisColors.ink,
                      borderColor: IrisColors.line,
                    },
                ]}
              >
                <Text selectable style={styles.errorText}>
                  {notice}
                </Text>
                <View
                  style={[ui.row, { justifyContent: "center", marginTop: 5 }]}
                >
                  {cameraError && (
                    <Button
                      label="Retry camera"
                      disabled={busy}
                      onPress={() => {
                        setNotice(null);
                        setReady(false);
                        setCameraError(false);
                        setCameraKey((v) => v + 1);
                      }}
                    />
                  )}
                  <Button label="Dismiss" onPress={() => setNotice(null)} />
                </View>
              </View>
            )}
          </>
        }
        reviewControls={
          selected ? (
            <>
              <View style={[ui.heading, { paddingVertical: 12 }]}>
                <Button
                  label="Back to camera"
                  onPress={returnToCamera}
                  disabled={busy}
                />
                <Text style={ui.label}>
                  {selected.format === "dng"
                    ? "DNG · ORIGINAL"
                    : selected.look.toUpperCase()}
                </Text>
              </View>
              <View style={ui.row}>
                <Button
                  label={
                    selected.saved
                      ? "Saved"
                      : Platform.OS === "web"
                        ? "Download"
                        : "Save to Photos"
                  }
                  disabled={busy || selected.saved}
                  onPress={() => saveReview()}
                />
                <Button
                  label="Share"
                  disabled={busy}
                  onPress={() => {
                    void run(() => sharePhoto(selected.uri));
                  }}
                />
                <Button
                  label={selected.favorite ? "Favorited" : "Favorite"}
                  selected={selected.favorite}
                  disabled={busy}
                  onPress={() => {
                    void run(async () => {
                      await updateCapture(selected.id, {
                        favorite: !selected.favorite,
                      });
                      await refresh();
                    });
                  }}
                />
                <Button
                  label="Edit Look"
                  disabled={busy || selected.format === "dng"}
                  onPress={() => {
                    setEditLook(selected.requestedLook);
                    setEditIntensity(selected.requestedIntensity);
                    setPanel("editLook");
                  }}
                />
                <Button
                  label="Info"
                  disabled={busy}
                  onPress={() => setPanel("metadata")}
                />
                <Button
                  label="Delete"
                  danger
                  disabled={busy}
                  onPress={() => setPanel("delete")}
                />
              </View>
              {selected.requestedLook !== selected.look &&
                selected.format !== "dng" && (
                  <Text style={[ui.copy, { marginTop: 10 }]}>
                    The original is safe. Open Edit Look to retry{" "}
                    {selected.requestedLook}.
                  </Text>
                )}
              <View style={[ui.heading, { marginVertical: 10 }]}>
                <Button
                  label="Previous photo"
                  disabled={
                    busy || records.indexOf(selected) >= records.length - 1
                  }
                  onPress={() => review(records[records.indexOf(selected) + 1])}
                />
                <Button
                  label="Next photo"
                  disabled={busy || records.indexOf(selected) === 0}
                  onPress={() => review(records[records.indexOf(selected) - 1])}
                />
              </View>
            </>
          ) : null
        }
      />

      {panel && (
        <Sheet
          busy={busy}
          title={
            {
              format: "Photo format",
              flash: "Flash",
              timer: "Self-timer",
              grid: "Framing grid",
              level: "Level",
              focus: "Focus",
              look: "Iris Looks",
              histogram: "Histogram",
              settings: "Settings",
              guide: "A quick guide",
              library: "Your photographs",
              metadata: "Photo details",
              delete: "Delete photograph?",
              editLook: "Edit Look",
              exposure: "Manual exposure",
              whiteBalance: "White balance",
              ev: "Exposure compensation",
              saveAgain: "Check your previous save",
            }[panel]
          }
          onClose={busy ? () => undefined : closePanel}
        >
          {panel === "format" && (
            <>
              <Options
                value={p.format}
                values={capabilities.formats.map((value) => ({
                  value,
                  label: value === "dng" ? "RAW · DNG" : value.toUpperCase(),
                }))}
                onChange={(format) => {
                  setReady(false);
                  update({ format });
                }}
              />
              <Text style={ui.copy}>
                {p.format === "dng"
                  ? "Iris keeps the original DNG without adding a Look. On supported iPhones this may be Apple ProRAW, which includes Apple processing."
                  : "The selected Look is applied at full resolution. Iris retains the original for later edits."}
              </Text>
              <Text style={ui.copy}>
                Only formats reported by this camera are available. Browser
                capture uses JPEG.
              </Text>
            </>
          )}
          {panel === "flash" &&
            (capabilities.flash ? (
              <Options
                value={p.flash}
                values={(["off", "auto", "on"] as const).map((value) => ({
                  value,
                  label: value.toUpperCase(),
                }))}
                onChange={(flash) => update({ flash })}
              />
            ) : (
              <Text style={ui.copy}>
                This camera does not expose a photo flash.
              </Text>
            ))}
          {panel === "timer" && (
            <>
              <Options
                value={p.timer}
                values={[
                  { value: 0, label: "Off" },
                  { value: 3, label: "3 seconds" },
                  { value: 10, label: "10 seconds" },
                ]}
                onChange={(timer) => update({ timer: timer as 0 | 3 | 10 })}
              />
              <Text style={ui.copy}>
                Tap the shutter again to cancel. Leaving Iris cancels a
                countdown.
              </Text>
            </>
          )}
          {panel === "grid" && (
            <Options
              value={p.grid}
              values={[
                { value: "off", label: "Off" },
                { value: "thirds", label: "Thirds" },
                { value: "square", label: "Square guide" },
                { value: "golden", label: "Golden ratio" },
              ]}
              onChange={(grid) => update({ grid })}
            />
          )}
          {panel === "level" && (
            <>
              <Toggle
                label="Show level"
                value={p.level}
                onChange={(level) => {
                  if (!level) {
                    update({ level: false });
                    return;
                  }
                  void Accelerometer.requestPermissionsAsync()
                    .then((permission) => {
                      if (permission.granted) update({ level: true });
                      else
                        setNotice(
                          "Motion access is off. Enable it in device or browser settings to use the level.",
                        );
                    })
                    .catch((error) => setNotice(errorText(error)));
                }}
              />
              <Text style={ui.copy}>
                Uses the device’s motion sensor. Align the center line to 0°. If
                no motion reading is available, the viewfinder says so.
              </Text>
            </>
          )}
          {panel === "histogram" && (
            <>
              <Toggle
                label="Live luminance histogram"
                disabled={!capabilities.histogram}
                value={p.histogram}
                onChange={(histogram) => update({ histogram })}
              />
              <Text style={ui.copy}>
                Shadows are on the left, highlights on the right. Readings are
                sampled from the Look preview twice per second.
              </Text>
            </>
          )}
          {(panel === "look" || panel === "editLook") && (
            <>
              <LookPicker
                selectedId={panel === "look" ? p.look : editLook}
                onSelect={(look) =>
                  panel === "look" ? update({ look }) : setEditLook(look)
                }
              />
              <Dial
                label="Intensity"
                range={{ min: 0, max: 100, step: 1 }}
                value={panel === "look" ? p.intensity : editIntensity}
                onChange={(intensity) =>
                  panel === "look"
                    ? update({ intensity })
                    : setEditIntensity(intensity)
                }
                format={(v) => `${Math.round(v)}%`}
              />
              {panel === "editLook" && selected && (
                <>
                  <Text style={ui.copy}>
                    Edits always start from your original. Saving a new edit
                    creates a new copy in Photos.
                  </Text>
                  <Button
                    label={busy ? "Applying…" : "Apply Look"}
                    disabled={busy}
                    onPress={() => {
                      void run(async () => {
                        await restyleCapture(selected, editLook, editIntensity);
                        await refresh();
                        setPanel(null);
                        setNotice("Look applied. Your original is retained.");
                      });
                    }}
                  />
                </>
              )}
            </>
          )}
          {panel === "focus" && (
            <>
              <Dial
                label="Focus"
                range={capabilities.focus}
                value={p.manual.focus}
                onAuto={() => {
                  manual({ focus: null });
                  setFocus(null);
                }}
                onChange={(focus) => {
                  update({ mode: "MANUAL" });
                  manual({ focus });
                }}
                format={(v) => `${Math.round(v * 100)}% · near to far`}
              />
              <Text style={ui.copy}>
                Tap the frame to meter. Hold to lock supported focus and
                exposure. Manual focus stays locked across captures.
              </Text>
              <Button
                label="Reset focus and exposure to Auto"
                onPress={() => {
                  update({ manual: AUTO });
                  setFocus(null);
                  void camera.current
                    ?.reset()
                    .catch((error) => setNotice(errorText(error)));
                }}
              />
            </>
          )}
          {panel === "exposure" && (
            <>
              <Text style={ui.copy}>
                Shutter and ISO lock together. Changing either keeps the other
                at its current value.
              </Text>
              <Dial
                label="ISO"
                range={capabilities.iso}
                value={p.manual.iso}
                logarithmic
                onAuto={() => manual({ iso: null, shutter: null })}
                onChange={(iso) =>
                  manual({
                    iso: Math.round(iso),
                    shutter:
                      p.manual.shutter ??
                      reading.shutter ??
                      capabilities.shutter?.min ??
                      null,
                  })
                }
              />
              {capabilities.iso && (
                <Options
                  value={p.manual.iso ?? 0}
                  values={[
                    25, 50, 64, 100, 125, 200, 400, 800, 1600, 3200, 6400,
                  ]
                    .filter(
                      (value) =>
                        value >= capabilities.iso!.min &&
                        value <= capabilities.iso!.max,
                    )
                    .map((value) => ({ value, label: `ISO ${value}` }))}
                  onChange={(iso) =>
                    manual({
                      iso,
                      shutter:
                        p.manual.shutter ??
                        reading.shutter ??
                        capabilities.shutter?.min ??
                        null,
                    })
                  }
                />
              )}
              <Dial
                label="Shutter"
                range={capabilities.shutter}
                value={p.manual.shutter}
                logarithmic
                format={shutterLabel}
                onAuto={() => manual({ iso: null, shutter: null })}
                onChange={(shutter) =>
                  manual({
                    shutter,
                    iso:
                      p.manual.iso ??
                      reading.iso ??
                      capabilities.iso?.min ??
                      null,
                  })
                }
              />
              {capabilities.shutter && (
                <Options
                  value={p.manual.shutter ?? 0}
                  values={[
                    1 / 8000,
                    1 / 4000,
                    1 / 2000,
                    1 / 1000,
                    1 / 500,
                    1 / 250,
                    1 / 125,
                    1 / 60,
                    1 / 30,
                    1 / 15,
                    1 / 8,
                    1 / 4,
                    1 / 2,
                    1,
                    2,
                  ]
                    .filter(
                      (value) =>
                        value >= capabilities.shutter!.min &&
                        value <= capabilities.shutter!.max,
                    )
                    .map((value) => ({ value, label: shutterLabel(value) }))}
                  onChange={(shutter) =>
                    manual({
                      shutter,
                      iso:
                        p.manual.iso ??
                        reading.iso ??
                        capabilities.iso?.min ??
                        null,
                    })
                  }
                />
              )}
              {p.manual.shutter !== null && p.manual.shutter > 1 / 30 && (
                <Text style={ui.copy}>
                  Slow shutter: hold still or use a tripod.
                </Text>
              )}
            </>
          )}
          {panel === "whiteBalance" && (
            <>
              <Dial
                label="Temperature"
                range={capabilities.temperature}
                value={p.manual.temperature}
                format={(v) => `${Math.round(v)}K`}
                onAuto={() => manual({ temperature: null, tint: 0 })}
                onChange={(temperature) => manual({ temperature })}
              />
              {capabilities.temperature && (
                <>
                  <Options
                    value={p.manual.temperature ?? 0}
                    values={[
                      { value: 3200, label: "Tungsten" },
                      { value: 4000, label: "Fluorescent" },
                      { value: 5500, label: "Daylight" },
                      { value: 6500, label: "Cloudy" },
                      { value: 7500, label: "Shade" },
                    ].filter(
                      (v) =>
                        v.value >= capabilities.temperature!.min &&
                        v.value <= capabilities.temperature!.max,
                    )}
                    onChange={(temperature) => manual({ temperature })}
                  />
                  {Platform.OS === "ios" && (
                    <Dial
                      label="Tint"
                      range={{ min: -150, max: 150, step: 1 }}
                      value={p.manual.tint}
                      onChange={(tint) =>
                        manual({
                          tint,
                          temperature: p.manual.temperature ?? 5500,
                        })
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
          {panel === "ev" &&
            (p.manual.iso !== null || p.manual.shutter !== null ? (
              <>
                <Text style={ui.copy}>
                  Exposure compensation is available with automatic exposure.
                </Text>
                <Button
                  label="Use automatic exposure"
                  onPress={() => manual({ iso: null, shutter: null })}
                />
              </>
            ) : (
              <Dial
                label="EV"
                autoLabel="Reset"
                range={capabilities.ev}
                value={p.manual.ev}
                format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} EV`}
                onAuto={() => manual({ ev: 0 })}
                onChange={(ev) => manual({ ev })}
              />
            ))}
          {panel === "settings" && (
            <>
              <Toggle
                label={
                  Platform.OS === "web"
                    ? "Download after each capture"
                    : "Save to Photos after capture"
                }
                value={p.autoSave}
                onChange={(autoSave) => update({ autoSave })}
              />
              {Platform.OS !== "web" && (
                <Toggle
                  label="Shutter sound"
                  value={p.sound}
                  onChange={(sound) => update({ sound })}
                />
              )}
              <Button
                label="Exposure compensation"
                onPress={() => setPanel("ev")}
              />
              <Dial
                label="Zoom"
                range={capabilities.zoom}
                value={p.zoom}
                onChange={(zoom) => update({ zoom })}
                format={(v) => `${v.toFixed(1)}×`}
              />
              <Text style={ui.copy}>
                Zoom shortcuts are magnification values. Digital zoom crops the
                image. Select a physical camera below for an optical change.
              </Text>
              <View style={ui.row}>
                {capabilities.devices.map((device) => (
                  <Button
                    key={device.id}
                    label={device.name}
                    selected={capabilities.id === device.id}
                    onPress={() => {
                      setReady(false);
                      update({
                        deviceId: device.id,
                        facing: device.facing,
                        zoom: 1,
                        manual: AUTO,
                        mode: "PHOTO",
                      });
                    }}
                  />
                ))}
              </View>
              <Text selectable style={ui.copy}>
                {capabilities.name}
                {capabilities.resolutions.length
                  ? `\nReported photo sizes: ${capabilities.resolutions.map((r) => `${r.width} × ${r.height}`).join(", ")}`
                  : ""}
              </Text>
              <Button
                label="Show gesture guide"
                onPress={() => setPanel("guide")}
              />
              <Button
                label="Reset camera preferences"
                onPress={() => {
                  setP({ ...DEFAULTS, guideSeen: true });
                  setFocus(null);
                  setNotice(
                    "Camera preferences reset. Your photographs are unchanged.",
                  );
                }}
              />
              {Platform.OS !== "web" && (
                <Button
                  label="Open system permissions"
                  onPress={() => {
                    void Linking.openSettings().catch((error) =>
                      setNotice(errorText(error)),
                    );
                  }}
                />
              )}
              <Text style={ui.copy}>
                Iris works on this device. Photos and metadata are not uploaded.
                Originals remain in Iris until you delete them. Deleting the app
                also removes its private photos; save or share photographs you
                want to keep.
              </Text>
            </>
          )}
          {panel === "guide" && (
            <>
              <Text style={ui.copy}>
                Tap the shutter to take one photo. Your original is kept in
                Iris; open its thumbnail to save to Photos or share.
              </Text>
              <Text style={ui.copy}>
                Tap the frame to meter. Hold to lock supported automatic
                controls. Pinch or use the zoom buttons to frame your shot.
              </Text>
              <Text style={ui.copy}>
                Choose Manual for shutter, ISO, focus and white balance. Auto
                resumes automatic control. Each camera exposes the settings it
                supports.
              </Text>
              <Text style={ui.copy}>
                Choose a Look before capture, or change it later from the photo
                viewer. Iris adds no Look to DNG files. Apple processing may
                still be present.
              </Text>
              <Button label="Start shooting" onPress={closePanel} />
            </>
          )}
          {panel === "library" && (
            <>
              <Toggle
                label="Favorites only"
                value={onlyFavorites}
                onChange={setOnlyFavorites}
              />
              <Options
                value={libraryFormat}
                values={["all", "jpeg", "heic", "dng"].map((value) => ({
                  value,
                  label: value.toUpperCase(),
                }))}
                onChange={setLibraryFormat}
              />
              <Options
                value={libraryLook}
                values={[
                  { value: "all", label: "All Looks" },
                  ...LOOKS.map((look) => ({
                    value: look.id,
                    label: look.name,
                  })),
                ]}
                onChange={setLibraryLook}
              />
              <View style={ui.row}>
                {records
                  .filter(
                    (r) =>
                      (!onlyFavorites || r.favorite) &&
                      (libraryFormat === "all" || r.format === libraryFormat) &&
                      (libraryLook === "all" || r.look === libraryLook),
                  )
                  .map((record) => (
                    <Pressable
                      key={record.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open photo ${new Date(record.createdAt).toLocaleString()}${record.favorite ? ", favorite" : ""}`}
                      onPress={() => review(record)}
                      style={{ width: "30%", gap: 6, paddingBottom: 10 }}
                    >
                      <Image
                        source={record.thumbnailUri}
                        contentFit="cover"
                        style={{
                          width: "100%",
                          aspectRatio: 0.85,
                          borderRadius: 12,
                        }}
                      />
                      <Text style={ui.copy}>
                        {record.favorite ? "★ " : ""}
                        {record.format.toUpperCase()} · {record.look}
                      </Text>
                    </Pressable>
                  ))}
              </View>
              {!records.some(
                (r) =>
                  (!onlyFavorites || r.favorite) &&
                  (libraryFormat === "all" || r.format === libraryFormat) &&
                  (libraryLook === "all" || r.look === libraryLook),
              ) && (
                <Text style={ui.copy}>
                  {records.length
                    ? "No photos match these filters."
                    : "Your photographs will appear here after your first capture."}
                </Text>
              )}
            </>
          )}
          {panel === "metadata" && selected && (
            <>
              <Text selectable style={ui.copy}>
                {new Date(selected.createdAt).toLocaleString()}
                <Text>{`\n${selected.width} × ${selected.height}\n${selected.format.toUpperCase()}\nLook: ${selected.format === "dng" ? "Not baked into RAW" : `${selected.look}, ${selected.intensity}%`}\nRecipe version: ${selected.recipeVersion}\n${selected.saved ? "Saved to Photos / downloaded" : "Kept in Iris"}\n\n${Object.entries(
                  selected.metadata,
                )
                  .map(
                    ([key, value]) =>
                      `${key}: ${key === "shutter" && typeof value === "number" ? shutterLabel(value) : value}`,
                  )
                  .join("\n")}`}</Text>
              </Text>
              <Text style={ui.copy}>
                Camera readings are recorded at capture. The native original
                retains the camera’s EXIF metadata.
              </Text>
              <Button
                label="Share original"
                onPress={() => {
                  void run(() => sharePhoto(selected.sourceUri));
                }}
              />
            </>
          )}
          {panel === "delete" && selected && (
            <>
              <Text style={ui.copy}>
                Delete this photograph and its original from Iris? This cannot
                be undone. Copies already saved to Photos or downloaded remain
                there.
              </Text>
              <Button
                label={busy ? "Deleting…" : "Delete from Iris"}
                danger
                disabled={busy}
                onPress={() => {
                  void run(async () => {
                    await deleteCapture(selected);
                    await refresh();
                    setSelectedId(null);
                    setPanel(null);
                    setNotice("Photograph deleted from Iris.");
                  });
                }}
              />
              <Button
                label="Keep photograph"
                disabled={busy}
                onPress={closePanel}
              />
            </>
          )}
          {panel === "saveAgain" && (
            <>
              <Text style={ui.copy}>
                Iris was interrupted during a previous save. Check Photos before
                saving again to avoid creating a duplicate.
              </Text>
              <Button
                label="I checked, save again"
                disabled={busy}
                onPress={() => saveReview(true)}
              />
              <Button
                label="Already in Photos"
                disabled={busy}
                onPress={() => {
                  if (selected)
                    void run(async () => {
                      await updateCapture(selected.id, {
                        saved: true,
                        savePending: false,
                      });
                      await refresh();
                      setPanel(null);
                    });
                }}
              />
            </>
          )}
          {busy && <ActivityIndicator color={IrisColors.chalk} />}
        </Sheet>
      )}
    </View>
  );
}
