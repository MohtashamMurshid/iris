import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ASPECTS,
  CameraChrome,
  ChromeFonts,
  EXPOSURE_MODES,
  OVERLAYS,
  ZOOM_STOPS,
  aspectById,
  exposureLabel,
  fitFrame,
  lookById,
  type AspectId,
  type ExposureMode,
  type LookId,
  type OverlayId,
  type ZoomStop,
} from '@/features/camera/chrome';
import {
  AspectRatioIcon,
  CheckIcon,
  EllipsisIcon,
  ExposureModeGlyph,
  GridCellsIcon,
  MeterTicks,
  SplitLinesIcon,
} from '@/features/camera/chrome-icons';
import { GlassPanel } from '@/features/camera/glass-panel';
import { LookArtwork } from '@/features/camera/look-artwork';
import { LookPicker } from '@/features/camera/look-picker';
import { ViewfinderMock } from '@/features/camera/viewfinder-mock';

type OpenMenu = 'exposure' | 'aspect' | 'overlay' | 'more' | null;

export function CameraShell() {
  const insets = useSafeAreaInsets();
  const [exposureMode, setExposureMode] = useState<ExposureMode>('auto');
  const [rawEnabled, setRawEnabled] = useState(true);
  const [aspectId, setAspectId] = useState<AspectId>('3-2');
  const [overlay, setOverlay] = useState<OverlayId>('thirds');
  const [zoom, setZoom] = useState<ZoomStop>('2');
  const [afOn, setAfOn] = useState(true);
  const [focusAssist, setFocusAssist] = useState(false);
  const [lookId, setLookId] = useState<LookId>('natural');
  const [lookPickerOpen, setLookPickerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const look = lookById(lookId);
  const aspect = aspectById(aspectId);
  const manualChrome = exposureMode !== 'auto';

  const frame = useMemo(() => {
    if (stageSize.width < 8 || stageSize.height < 8) {
      return { width: 0, height: 0 };
    }
    return fitFrame(aspect.widthOverHeight, stageSize.width, stageSize.height);
  }, [aspect.widthOverHeight, stageSize.height, stageSize.width]);

  function toggleMenu(menu: Exclude<OpenMenu, null>) {
    setLookPickerOpen(false);
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function closeOverlays() {
    setOpenMenu(null);
    setLookPickerOpen(false);
  }

  function chooseExposure(mode: ExposureMode) {
    setExposureMode(mode);
    setOpenMenu(null);
  }

  const topPad = Math.max(insets.top, 10);
  const bottomPad = Math.max(insets.bottom, 14);

  return (
    <View style={styles.page}>
      <View style={[styles.phone, { paddingBottom: bottomPad, paddingTop: topPad }]}>
        <View style={styles.topChrome}>
          {manualChrome ? (
            <View style={styles.meterCluster}>
              <MeterTicks />
              <View>
                <Text style={styles.meterValue}>+1.1</Text>
                <Text style={styles.meterLabel}>METER</Text>
              </View>
            </View>
          ) : (
            <View />
          )}

          <Pressable
            accessibilityLabel="Exposure mode"
            onPress={() => toggleMenu('exposure')}
            style={({ pressed }) => [pressed && styles.pressed]}
            testID="exposure-mode">
            {manualChrome ? (
              <GlassPanel style={styles.readoutPill}>
                <Text style={styles.readoutValue}>377</Text>
                <Text style={styles.readoutSub}>1/125</Text>
              </GlassPanel>
            ) : (
              <GlassPanel style={styles.autoPill}>
                <Text style={styles.autoText}>{exposureLabel(exposureMode)}</Text>
              </GlassPanel>
            )}
          </Pressable>
        </View>

        <View
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setStageSize({ width, height });
          }}
          style={styles.stage}>
          {frame.width > 0 && (
            <ViewfinderMock
              height={frame.height}
              lookId={lookId}
              overlay={overlay}
              width={frame.width}
            />
          )}
        </View>

        <View style={styles.toolbarRow}>
          <Pressable
            accessibilityLabel={`RAW ${rawEnabled ? 'on' : 'off'}`}
            accessibilityState={{ selected: rawEnabled }}
            onPress={() => setRawEnabled((value) => !value)}
            style={({ pressed }) => [styles.flexButton, pressed && styles.pressed]}>
            <GlassPanel style={[styles.toolButton, rawEnabled && styles.toolButtonOn]}>
              <Text style={[styles.rawText, !rawEnabled && styles.rawTextOff]}>RAW</Text>
            </GlassPanel>
          </Pressable>

          <Pressable
            accessibilityLabel={`Aspect ratio ${aspect.label}`}
            onPress={() => toggleMenu('aspect')}
            style={({ pressed }) => [styles.flexButton, pressed && styles.pressed]}
            testID="aspect-button">
            <GlassPanel style={styles.toolButton}>
              <AspectRatioIcon />
            </GlassPanel>
          </Pressable>

          <Pressable
            accessibilityLabel={`Composition overlay ${overlay}`}
            onPress={() => toggleMenu('overlay')}
            style={({ pressed }) => [styles.flexButton, pressed && styles.pressed]}
            testID="overlay-button">
            <GlassPanel style={[styles.toolButton, overlay !== 'off' && styles.toolButtonOn]}>
              <GridCellsIcon />
            </GlassPanel>
          </Pressable>
        </View>

        <View style={styles.focusRow}>
          <Pressable
            accessibilityLabel="Focus assist"
            accessibilityState={{ selected: focusAssist }}
            onPress={() => setFocusAssist((value) => !value)}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <GlassPanel style={[styles.circleButton, focusAssist && styles.circleButtonOn]}>
              <SplitLinesIcon color={focusAssist ? CameraChrome.ink : CameraChrome.white} />
            </GlassPanel>
          </Pressable>

          <Pressable
            accessibilityLabel={afOn ? 'Autofocus on' : 'Autofocus off'}
            accessibilityState={{ selected: afOn }}
            onPress={() => setAfOn((value) => !value)}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <View style={[styles.afButton, !afOn && styles.afButtonOff]}>
              <Text style={[styles.afText, !afOn && styles.afTextOff]}>{afOn ? 'AF' : 'MF'}</Text>
            </View>
          </Pressable>

          <GlassPanel style={styles.zoomPill}>
            {ZOOM_STOPS.map((stop) => {
              const selected = zoom === stop;
              return (
                <Pressable
                  accessibilityLabel={`${stop} times zoom`}
                  accessibilityState={{ selected }}
                  key={stop}
                  onPress={() => setZoom(stop)}
                  style={({ pressed }) => [
                    styles.zoomStop,
                    selected && styles.zoomStopSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.zoomText, selected && styles.zoomTextSelected]}>
                    {selected ? `${stop}x` : stop}
                  </Text>
                </Pressable>
              );
            })}
          </GlassPanel>

          <Pressable
            accessibilityLabel="More controls"
            onPress={() => toggleMenu('more')}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <GlassPanel style={[styles.circleButton, openMenu === 'more' && styles.circleButtonOn]}>
              <EllipsisIcon color={openMenu === 'more' ? CameraChrome.ink : CameraChrome.white} />
            </GlassPanel>
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.thumbWell}>
            <View accessibilityLabel="Recent photos" style={styles.recentsThumb}>
              <View style={styles.recentsSky} />
              <View style={styles.recentsGround} />
            </View>
          </View>

          <Pressable
            accessibilityLabel="Shutter"
            accessibilityRole="button"
            style={({ pressed }) => [styles.shutterWell, pressed && styles.shutterPressed]}>
            <View style={styles.shutterRing}>
              <View style={styles.shutterInner} />
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={`${look.name} look`}
            onPress={() => {
              setOpenMenu(null);
              setLookPickerOpen((value) => !value);
            }}
            style={({ pressed }) => [styles.thumbWell, pressed && styles.pressed]}
            testID="look-tile">
            <LookArtwork look={look} selected={lookPickerOpen} size={56} />
          </Pressable>
        </View>
      </View>

      {openMenu !== null && (
        <View style={[styles.overlayLayer, styles.passThrough]}>
          <Pressable onPress={closeOverlays} style={StyleSheet.absoluteFill} />
          {openMenu === 'exposure' && (
            <GlassPanel style={[styles.menu, styles.exposureMenu, { top: topPad + 48 }]}>
              {EXPOSURE_MODES.map((mode) => {
                const selected = mode.id === exposureMode;
                return (
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
                    key={mode.id}
                    onPress={() => chooseExposure(mode.id)}
                    style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
                    testID={`exposure-${mode.id}`}>
                    <View style={styles.menuGlyph}>
                      {selected ? <CheckIcon color={CameraChrome.white} size={16} /> : <ExposureModeGlyph mode={mode.id} />}
                    </View>
                    <Text style={styles.menuLabel}>{mode.label}</Text>
                  </Pressable>
                );
              })}
            </GlassPanel>
          )}

          {openMenu === 'aspect' && (
            <GlassPanel style={[styles.menu, styles.centerMenu]}>
              {ASPECTS.map((item) => {
                const selected = item.id === aspectId;
                return (
                  <Pressable
                    accessibilityState={{ selected }}
                    key={item.id}
                    onPress={() => {
                      setAspectId(item.id);
                      setOpenMenu(null);
                    }}
                    style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
                    <Text style={[styles.menuLabel, selected && styles.menuLabelOn]}>
                      {item.label}
                    </Text>
                    <Text style={styles.menuCaption}>{item.caption}</Text>
                  </Pressable>
                );
              })}
            </GlassPanel>
          )}

          {openMenu === 'overlay' && (
            <GlassPanel style={[styles.menu, styles.centerMenu]}>
              {OVERLAYS.map((item) => {
                const selected = item.id === overlay;
                return (
                  <Pressable
                    accessibilityState={{ selected }}
                    key={item.id}
                    onPress={() => {
                      setOverlay(item.id);
                      setOpenMenu(null);
                    }}
                    style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
                    <Text style={[styles.menuLabel, selected && styles.menuLabelOn]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassPanel>
          )}

          {openMenu === 'more' && (
            <GlassPanel style={[styles.menu, styles.moreMenu]}>
              <Pressable
                onPress={() => setFlashOn((value) => !value)}
                style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
                <Text style={[styles.menuLabel, flashOn && styles.menuLabelOn]}>
                  Flash {flashOn ? 'On' : 'Off'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTimerOn((value) => !value)}
                style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
                <Text style={[styles.menuLabel, timerOn && styles.menuLabelOn]}>
                  Timer {timerOn ? '3s' : 'Off'}
                </Text>
              </Pressable>
              <Text style={styles.menuCaption}>White Balance Auto</Text>
            </GlassPanel>
          )}
        </View>
      )}

      {lookPickerOpen && (
        <View style={[styles.overlayLayer, styles.passThrough]}>
          <Pressable onPress={closeOverlays} style={[StyleSheet.absoluteFill, styles.lookDim]} />
          <View style={[styles.lookSheetWrap, { paddingBottom: bottomPad }]}>
            <LookPicker
              onConfirm={() => setLookPickerOpen(false)}
              onSelect={setLookId}
              selectedId={lookId}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: CameraChrome.ink,
    flex: 1,
  },
  phone: {
    backgroundColor: CameraChrome.ink,
    flex: 1,
    maxWidth: 430,
    paddingHorizontal: 12,
    width: '100%',
  },
  topChrome: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  meterCluster: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 2,
  },
  meterValue: {
    color: CameraChrome.meterRed,
    fontFamily: ChromeFonts.mono,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    lineHeight: 20,
  },
  meterLabel: {
    color: CameraChrome.meterRed,
    fontFamily: ChromeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 13,
  },
  autoPill: {
    borderCurve: 'continuous',
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
    fontWeight: '600',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  readoutPill: {
    alignItems: 'flex-end',
    borderCurve: 'continuous',
    borderRadius: 18,
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  readoutValue: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    lineHeight: 18,
  },
  readoutSub: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.mono,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    lineHeight: 14,
  },
  stage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 220,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  flexButton: {
    flex: 1,
  },
  toolButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: CameraChrome.radiusButton,
    height: 52,
    justifyContent: 'center',
  },
  toolButtonOn: {
    borderColor: 'rgba(245, 196, 0, 0.35)',
  },
  rawText: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  rawTextOff: {
    color: CameraChrome.muted,
  },
  focusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  circleButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  circleButtonOn: {
    backgroundColor: CameraChrome.amber,
  },
  afButton: {
    alignItems: 'center',
    backgroundColor: CameraChrome.amber,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  afButtonOff: {
    backgroundColor: 'transparent',
    borderColor: CameraChrome.muted,
    borderWidth: 1.5,
  },
  afText: {
    color: CameraChrome.ink,
    fontFamily: ChromeFonts.sans,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  afTextOff: {
    color: CameraChrome.white,
  },
  zoomPill: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: CameraChrome.radiusPill,
    flex: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
  },
  zoomStop: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
  },
  zoomStopSelected: {
    backgroundColor: CameraChrome.amber,
  },
  zoomText: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  zoomTextSelected: {
    color: CameraChrome.ink,
  },
  bottomBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 104,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  thumbWell: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  recentsThumb: {
    backgroundColor: '#2A241E',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 52,
    overflow: 'hidden',
    width: 52,
  },
  recentsSky: {
    backgroundColor: '#C56A32',
    height: '55%',
  },
  recentsGround: {
    backgroundColor: '#1A1410',
    flex: 1,
  },
  shutterWell: {
    alignItems: 'center',
    backgroundColor: CameraChrome.shutterWell,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  shutterRing: {
    alignItems: 'center',
    borderColor: 'rgba(10,10,12,0.28)',
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    justifyContent: 'center',
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
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  passThrough: {
    pointerEvents: 'box-none',
  },
  lookDim: {
    backgroundColor: CameraChrome.dim,
  },
  menu: {
    borderCurve: 'continuous',
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
  },
  exposureMenu: {
    minWidth: 230,
    right: 16,
  },
  centerMenu: {
    alignSelf: 'center',
    bottom: 250,
    minWidth: 200,
  },
  moreMenu: {
    bottom: 250,
    minWidth: 200,
    right: 16,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
    paddingVertical: 6,
  },
  menuGlyph: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  menuLabel: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 17,
    fontWeight: '500',
  },
  menuLabelOn: {
    color: CameraChrome.amber,
  },
  menuCaption: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    marginLeft: 'auto',
    paddingVertical: 8,
  },
  lookSheetWrap: {
    bottom: 0,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  pressed: {
    opacity: 0.72,
  },
});
