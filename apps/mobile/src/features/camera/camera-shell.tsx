import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ASPECTS,
  aspectById,
  fitFrame,
  CameraChrome,
  ChromeFonts,
  lookById,
} from "./chrome";
import {
  AspectRatioIcon,
  GridCellsIcon,
  EllipsisIcon,
  SplitLinesIcon,
} from "./chrome-icons";
import { GlassPanel } from "./glass-panel";
import { FilmWindow } from "./look-artwork";
import {
  AUTO,
  shutterLabel,
  type Capabilities,
  type CameraReading,
  type Preferences,
} from "./model";

export type CameraPanel =
  | "format"
  | "flash"
  | "timer"
  | "grid"
  | "level"
  | "focus"
  | "look"
  | "histogram"
  | "settings"
  | "library"
  | "exposure"
  | "whiteBalance"
  | "ev";
type Props = {
  preferences: Preferences;
  capabilities: Capabilities;
  reading: CameraReading;
  busy: boolean;
  ready: boolean;
  countdown: number;
  reviewing: boolean;
  count: number;
  thumbnail?: string;
  canFlip: boolean;
  onUpdate: (values: Partial<Preferences>) => void;
  onPanel: (panel: CameraPanel) => void;
  onCapture: () => void;
  onReview: () => void;
  onSwitch: () => void;
  preview: ReactNode;
  feedback: ReactNode;
  reviewControls: ReactNode;
};

export function CameraShell({
  preferences: p,
  capabilities: c,
  reading,
  busy,
  ready,
  countdown,
  reviewing,
  count,
  thumbnail,
  canFlip,
  onUpdate,
  onPanel,
  onCapture,
  onReview,
  onSwitch,
  preview,
  feedback,
  reviewControls,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [menu, setMenu] = useState<"exposure" | "more" | "aspect" | null>(null);
  const open = (panel: CameraPanel) => {
    setMenu(null);
    onPanel(panel);
  };
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const aspect = aspectById(p.framing);
  const frame = fitFrame(aspect.widthOverHeight, stage.width, stage.height);
  const manual = p.mode === "MANUAL";
  const shutterDisabled = (!ready || busy) && !countdown;
  const selectedState = (selected: boolean) => ({
    accessibilityState: { selected },
    ...(Platform.OS === "web" ? { "aria-pressed": selected } : {}),
  });
  const menuButton = (label: string, panel: CameraPanel, value?: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${value ? `, ${value}` : ""}`}
      disabled={busy}
      onPress={() => open(panel)}
      style={styles.menuRow}
    >
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuCaption}>{value}</Text>
    </Pressable>
  );
  return (
    <View style={styles.page} testID="camera-chrome">
      <View
        style={[
          styles.phone,
          {
            paddingTop: Math.max(insets.top, 10),
            paddingBottom: Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
          landscape && { maxWidth: 1100 },
        ]}
      >
        <View style={styles.topChrome}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open library, ${count} photos`}
            disabled={busy}
            onPress={() => open("library")}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={styles.statusChip}>
              {reviewing ? "PHOTO LAB" : `${count} FRAMES`}
            </Text>
            {p.timer > 0 && (
              <Text style={styles.statusChip}>{p.timer}s TIMER</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exposure mode"
            disabled={busy || reviewing}
            onPress={() => setMenu(menu === "exposure" ? null : "exposure")}
            testID="exposure-mode"
          >
            <GlassPanel style={manual ? styles.readoutPill : styles.autoPill}>
              {manual ? (
                <>
                  <Text style={styles.readoutValue}>
                    {Math.round(p.manual.iso ?? reading.iso ?? 0) || "AUTO"}
                  </Text>
                  <Text style={styles.readoutSub}>
                    {shutterLabel(p.manual.shutter ?? reading.shutter)}
                  </Text>
                </>
              ) : (
                <Text style={styles.autoText}>AUTO</Text>
              )}
            </GlassPanel>
          </Pressable>
        </View>
        <View
          style={{
            flex: 1,
            minHeight: 0,
            flexDirection: landscape ? "row" : "column",
            gap: landscape ? 16 : 0,
          }}
        >
          <View
            style={styles.stage}
            onLayout={(event) => setStage(event.nativeEvent.layout)}
          >
            <View
              style={
                frame.width > 0 && !reviewing
                  ? { width: frame.width, height: frame.height }
                  : { width: "100%", flex: 1 }
              }
            >
              {preview}
              {!reviewing && (
                <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Exposure compensation ${p.manual.ev.toFixed(1)}`}
                    disabled={busy}
                    onPress={() => open("ev")}
                    style={[
                      styles.evStrip,
                      { padding: 8, minWidth: 44, minHeight: 44 },
                    ]}
                  >
                    <Text style={styles.evValue}>
                      {p.manual.ev > 0 ? "+" : ""}
                      {p.manual.ev.toFixed(1)}
                    </Text>
                    {[-2, -1, 0, 1, 2].map((value) => (
                      <View
                        key={value}
                        style={[
                          styles.evTick,
                          styles.evTickMajor,
                          Math.abs(value - p.manual.ev) < 0.5 &&
                            styles.evTickOn,
                        ]}
                      />
                    ))}
                  </Pressable>
                  <View style={styles.innerToolbar}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`FORMAT, ${p.format.toUpperCase()}`}
                      disabled={busy}
                      onPress={() => open("format")}
                      style={styles.flexButton}
                    >
                      <GlassPanel
                        style={[
                          styles.toolButton,
                          p.format === "dng" && styles.toolButtonOn,
                        ]}
                      >
                        <Text style={styles.rawText}>
                          {p.format === "dng" ? "RAW" : p.format.toUpperCase()}
                        </Text>
                      </GlassPanel>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Aspect ratio ${aspect.label}`}
                      disabled={busy}
                      onPress={() => setMenu("aspect")}
                      style={styles.flexButton}
                      testID="aspect-button"
                    >
                      <GlassPanel style={styles.toolButton}>
                        <AspectRatioIcon />
                      </GlassPanel>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`GRID, ${p.grid.toUpperCase()}`}
                      disabled={busy}
                      onPress={() => open("grid")}
                      style={styles.flexButton}
                      testID="overlay-button"
                    >
                      <GlassPanel
                        style={[
                          styles.toolButton,
                          p.grid !== "off" && styles.toolButtonOn,
                        ]}
                      >
                        <GridCellsIcon />
                      </GlassPanel>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={[{ minHeight: 0 }, landscape && { width: 310 }]}>
            <ScrollView
              style={{
                maxHeight: reviewing
                  ? landscape
                    ? height - 80
                    : height * 0.38
                  : landscape
                    ? height - 240
                    : height * 0.2,
              }}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {feedback}
              {reviewControls}
            </ScrollView>
            {!reviewing && (
              <>
                <View style={styles.focusRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`LEVEL, ${p.level ? "ON" : "OFF"}`}
                    disabled={busy}
                    onPress={() => open("level")}
                  >
                    <GlassPanel
                      style={[
                        styles.circleButton,
                        p.level && styles.circleButtonOn,
                      ]}
                    >
                      <SplitLinesIcon
                        color={p.level ? CameraChrome.ink : CameraChrome.white}
                      />
                    </GlassPanel>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`FOCUS, ${p.manual.focus === null ? "AUTO" : "MANUAL"}`}
                    disabled={busy}
                    onPress={() => open("focus")}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <View
                      style={[
                        styles.afButton,
                        p.manual.focus !== null && styles.afButtonOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.afText,
                          p.manual.focus !== null && styles.afTextOff,
                        ]}
                      >
                        {p.manual.focus === null ? "AF" : "MF"}
                      </Text>
                    </View>
                  </Pressable>
                  <GlassPanel style={styles.zoomPill}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ alignItems: "center" }}
                    >
                      {c.zoomStops.map((stop) => (
                        <Pressable
                          key={stop}
                          accessibilityRole="button"
                          accessibilityLabel={`Zoom ${stop} times`}
                          {...selectedState(Math.abs(p.zoom - stop) < 0.05)}
                          disabled={busy || !ready}
                          onPress={() => onUpdate({ zoom: stop })}
                          style={[
                            styles.zoomStop,
                            { minHeight: 44, minWidth: 44 },
                            Math.abs(p.zoom - stop) < 0.05 &&
                              styles.zoomStopSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.zoomText,
                              Math.abs(p.zoom - stop) < 0.05 &&
                                styles.zoomTextSelected,
                            ]}
                          >
                            {stop}×
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </GlassPanel>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="More controls"
                    disabled={busy}
                    onPress={() => setMenu(menu === "more" ? null : "more")}
                    testID="more-button"
                  >
                    <GlassPanel style={styles.circleButton}>
                      <EllipsisIcon />
                    </GlassPanel>
                  </Pressable>
                </View>
                <View style={styles.bottomBar}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      thumbnail ? "Review latest photo" : "Open empty library"
                    }
                    disabled={busy}
                    onPress={onReview}
                    style={styles.thumbWell}
                    testID="recents-thumb"
                  >
                    <View style={styles.recentsThumb}>
                      {thumbnail ? (
                        <Image
                          source={thumbnail}
                          contentFit="cover"
                          style={StyleSheet.absoluteFill}
                        />
                      ) : (
                        <Text style={[styles.autoText, { marginTop: 16 }]}>
                          0
                        </Text>
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      countdown ? "Cancel timer" : "Take photo"
                    }
                    accessibilityState={{ disabled: !!shutterDisabled, busy }}
                    disabled={!!shutterDisabled}
                    onPress={onCapture}
                    style={({ pressed }) => [
                      styles.shutterWell,
                      shutterDisabled && { opacity: 0.4 },
                      pressed && styles.shutterPressed,
                    ]}
                  >
                    <View style={styles.shutterRing}>
                      {busy && !countdown ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <View
                          style={[
                            styles.shutterInner,
                            countdown > 0 && {
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                            },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`LOOK, ${p.look.toUpperCase()}`}
                    disabled={busy}
                    onPress={() => open("look")}
                    style={styles.thumbWell}
                    testID="look-tile"
                  >
                    {p.look === "none" ? (
                      <GlassPanel style={styles.circleButton}>
                        <Text style={styles.autoText}>OFF</Text>
                      </GlassPanel>
                    ) : (
                      <FilmWindow
                        look={lookById(p.look)}
                        selected={false}
                        size={56}
                      />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      {menu && (
        <View style={styles.overlayLayer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera menu"
            onPress={() => setMenu(null)}
            style={StyleSheet.absoluteFill}
          />
          <GlassPanel
            style={[
              styles.menu,
              menu === "exposure" ? styles.exposureMenu : styles.moreMenu,
              {
                top: Math.max(insets.top, 10) + 48,
                bottom: Math.max(insets.bottom, 10) + 110,
                maxWidth: width - 24,
              },
            ]}
          >
            <ScrollView>
              {menu === "aspect" ? (
                <>
                  {ASPECTS.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      {...selectedState(item.id === p.framing)}
                      disabled={busy}
                      onPress={() => {
                        onUpdate({ framing: item.id });
                        setMenu(null);
                      }}
                      style={styles.menuRow}
                    >
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuCaption}>{item.caption}</Text>
                    </Pressable>
                  ))}
                  <Text style={styles.menuHint}>
                    Preview framing only. Iris retains the full captured image.
                  </Text>
                </>
              ) : menu === "exposure" ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    {...selectedState(!manual)}
                    disabled={busy}
                    onPress={() => {
                      onUpdate({ mode: "PHOTO", manual: AUTO });
                      setMenu(null);
                    }}
                    style={styles.menuRow}
                  >
                    <Text style={styles.menuLabel}>Auto</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    {...selectedState(manual)}
                    disabled={busy}
                    onPress={() => {
                      onUpdate({ mode: "MANUAL" });
                      open("exposure");
                    }}
                    style={styles.menuRow}
                  >
                    <Text style={styles.menuLabel}>Manual</Text>
                  </Pressable>
                  <Text style={styles.menuHint}>
                    ISO and shutter lock together on supported cameras.
                  </Text>
                </>
              ) : (
                <>
                  {menuButton("Photo Lab", "library")}
                  {menuButton(
                    "FLASH",
                    "flash",
                    c.flash ? p.flash.toUpperCase() : "N/A",
                  )}
                  {menuButton(
                    "TIMER",
                    "timer",
                    p.timer ? `${p.timer}s` : "OFF",
                  )}
                  {menuButton("HIST.", "histogram", p.histogram ? "ON" : "OFF")}
                  {menuButton("White balance", "whiteBalance")}
                  {menuButton("Exposure", "exposure")}
                  {menuButton("Settings", "settings")}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${p.facing === "back" ? "front" : "back"} camera`}
                    disabled={busy || !canFlip}
                    onPress={() => {
                      setMenu(null);
                      onSwitch();
                    }}
                    style={[styles.menuRow, !canFlip && { opacity: 0.4 }]}
                  >
                    <Text style={styles.menuLabel}>Switch camera</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </GlassPanel>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    backgroundColor: CameraChrome.ink,
    flex: 1,
  },
  phone: {
    backgroundColor: CameraChrome.ink,
    flex: 1,
    maxWidth: 430,
    paddingHorizontal: 12,
    width: "100%",
  },
  topChrome: {
    alignItems: "flex-start",
    flexDirection: "row",
    height: 52,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  meterCluster: {
    alignItems: "center",
    flexDirection: "row",
    paddingTop: 2,
  },
  meterValue: {
    color: CameraChrome.meterRed,
    fontFamily: ChromeFonts.mono,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 20,
  },
  meterLabel: {
    color: CameraChrome.meterRed,
    fontFamily: ChromeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 13,
  },
  statusCluster: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
  },
  statusChip: {
    color: CameraChrome.amber,
    fontFamily: ChromeFonts.sans,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  autoPill: {
    borderCurve: "continuous",
    borderRadius: CameraChrome.radiusPill,
    minHeight: 34,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  autoText: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  readoutPill: {
    alignItems: "flex-end",
    borderCurve: "continuous",
    borderRadius: 18,
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  readoutValue: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 18,
  },
  readoutSub: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.mono,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 14,
  },
  stage: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 60,
  },
  innerToolbar: {
    bottom: 10,
    flexDirection: "row",
    gap: 8,
    left: 10,
    position: "absolute",
    right: 10,
  },
  flexButton: {
    flex: 1,
  },
  toolButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: CameraChrome.radiusButton,
    height: 52,
    justifyContent: "center",
  },
  toolButtonOn: {
    borderColor: "rgba(245, 196, 0, 0.35)",
  },
  rawText: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  rawTextOff: {
    color: CameraChrome.muted,
  },
  focusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  circleButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  circleButtonOn: {
    backgroundColor: CameraChrome.amber,
  },
  afButton: {
    alignItems: "center",
    backgroundColor: CameraChrome.amber,
    borderCurve: "continuous",
    borderRadius: 20,
    height: 36,
    justifyContent: "center",
    minWidth: 62,
    paddingHorizontal: 18,
  },
  afButtonOff: {
    backgroundColor: "transparent",
    borderColor: CameraChrome.muted,
    borderWidth: 1.5,
  },
  afText: {
    color: CameraChrome.ink,
    fontFamily: ChromeFonts.sans,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  afTextOff: {
    color: CameraChrome.white,
  },
  zoomPill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: CameraChrome.radiusPill,
    flex: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "space-evenly",
    paddingHorizontal: 6,
  },
  zoomStop: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
  },
  zoomStopSelected: {
    backgroundColor: CameraChrome.amber,
  },
  zoomText: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 14,
    fontWeight: "600",
  },
  zoomTextSelected: {
    color: CameraChrome.ink,
  },
  bottomBar: {
    alignItems: "center",
    flexDirection: "row",
    height: 104,
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  thumbWell: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  recentsThumb: {
    backgroundColor: "#2A241E",
    borderCurve: "continuous",
    borderRadius: 14,
    height: 52,
    overflow: "hidden",
    width: 52,
  },
  recentsSky: {
    backgroundColor: "#C56A32",
    height: "55%",
  },
  recentsGround: {
    backgroundColor: "#1A1410",
    flex: 1,
  },
  shutterWell: {
    alignItems: "center",
    backgroundColor: CameraChrome.shutterWell,
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  shutterRing: {
    alignItems: "center",
    borderColor: "rgba(10,10,12,0.28)",
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  shutterInner: {
    backgroundColor: CameraChrome.shutter,
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  overlayLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  passThrough: {
    pointerEvents: "box-none",
  },
  lookDim: {
    backgroundColor: CameraChrome.dim,
  },
  menu: {
    borderCurve: "continuous",
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: "absolute",
  },
  exposureMenu: {
    minWidth: 230,
    right: 16,
  },
  centerMenu: {
    alignSelf: "center",
    bottom: 250,
    minWidth: 200,
  },
  moreMenu: {
    bottom: 250,
    minWidth: 200,
    right: 16,
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
    paddingVertical: 6,
  },
  menuGlyph: {
    alignItems: "center",
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  menuLabel: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 17,
    fontWeight: "500",
  },
  menuLabelOn: {
    color: CameraChrome.amber,
  },
  menuCaption: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    marginLeft: "auto",
    paddingVertical: 8,
  },
  menuHint: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    paddingBottom: 6,
    paddingTop: 4,
  },
  evStrip: {
    alignItems: "center",
    gap: 6,
    position: "absolute",
    right: 10,
    top: "18%",
  },
  evValue: {
    color: CameraChrome.amber,
    fontFamily: ChromeFonts.mono,
    fontSize: 11,
    marginBottom: 4,
  },
  evTickHit: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
    width: 22,
  },
  evTick: {
    backgroundColor: "rgba(245,196,0,0.28)",
    borderRadius: 1,
    height: 2,
    width: 10,
  },
  evTickMajor: {
    width: 14,
  },
  evTickOn: {
    backgroundColor: CameraChrome.amber,
    width: 18,
  },
  focusScale: {
    alignItems: "center",
    gap: 7,
    left: 10,
    position: "absolute",
    top: "20%",
  },
  focusMark: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 11,
  },
  focusTick: {
    backgroundColor: "rgba(255,255,255,0.35)",
    height: 1.5,
    width: 10,
  },
  focusTickOn: {
    backgroundColor: CameraChrome.white,
    width: 16,
  },
  lookSheetWrap: {
    bottom: 0,
    left: 12,
    position: "absolute",
    right: 12,
  },
  pressed: {
    opacity: 0.72,
  },
});
