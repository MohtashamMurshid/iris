import { CameraView, type CameraType, type FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IrisMark } from '@/components/iris-mark';
import { IrisColors, IrisFonts } from '@/constants/theme';
import { CameraPermissionGate } from '@/features/camera/camera-permission-gate';

type Mode = 'PHOTO' | 'MANUAL';
type ToolId = 'format' | 'flash' | 'timer' | 'grid' | 'level' | 'focus' | 'look' | 'histogram';

type Tool = {
  id: ToolId;
  label: string;
  symbol: SymbolViewProps['name'];
  value: string;
};

const LENSES = ['24', '28', '35', '50'];

const INITIAL_TOOLS: Tool[] = [
  {
    id: 'format',
    label: 'FORMAT',
    symbol: { ios: 'rectangle.compress.vertical', android: 'crop_5_4', web: 'crop_5_4' },
    value: 'HEIF',
  },
  {
    id: 'flash',
    label: 'FLASH',
    symbol: { ios: 'bolt.slash', android: 'flash_off', web: 'flash_off' },
    value: 'OFF',
  },
  {
    id: 'timer',
    label: 'TIMER',
    symbol: { ios: 'timer', android: 'timer', web: 'timer' },
    value: 'OFF',
  },
  {
    id: 'grid',
    label: 'GRID',
    symbol: { ios: 'grid', android: 'grid_3x3', web: 'grid_3x3' },
    value: '3 × 3',
  },
  {
    id: 'level',
    label: 'LEVEL',
    symbol: { ios: 'level', android: 'straighten', web: 'straighten' },
    value: 'ON',
  },
  {
    id: 'focus',
    label: 'FOCUS',
    symbol: { ios: 'viewfinder', android: 'center_focus_strong', web: 'center_focus_strong' },
    value: 'AUTO',
  },
  {
    id: 'look',
    label: 'LOOK',
    symbol: { ios: 'camera.filters', android: 'filter_vintage', web: 'filter_vintage' },
    value: 'NATURAL',
  },
  {
    id: 'histogram',
    label: 'HIST.',
    symbol: { ios: 'waveform.path.ecg', android: 'monitoring', web: 'monitoring' },
    value: 'ON',
  },
];

const TOOL_ALTERNATES: Record<ToolId, [string, string]> = {
  format: ['HEIF', 'RAW'],
  flash: ['OFF', 'AUTO'],
  timer: ['OFF', '3 SEC'],
  grid: ['3 × 3', 'OFF'],
  level: ['ON', 'OFF'],
  focus: ['AUTO', 'LOCK'],
  look: ['NATURAL', 'NOIR'],
  histogram: ['ON', 'OFF'],
};

export default function CameraScreen() {
  return (
    <CameraPermissionGate>
      <CameraExperience />
    </CameraPermissionGate>
  );
}

function CameraExperience() {
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<Mode>('PHOTO');
  const [lens, setLens] = useState('35');
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [capturedCount, setCapturedCount] = useState(0);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [latestPhotoUri, setLatestPhotoUri] = useState<string | null>(null);
  const [showLatestPhoto, setShowLatestPhoto] = useState(false);
  const [focusPoint, setFocusPoint] = useState({ x: 50, y: 45 });
  const [viewfinderSize, setViewfinderSize] = useState({ width: 1, height: 1 });

  const activeLook = tools.find((tool) => tool.id === 'look')?.value ?? 'NATURAL';
  const gridEnabled = tools.find((tool) => tool.id === 'grid')?.value !== 'OFF';
  const flashMode: FlashMode =
    tools.find((tool) => tool.id === 'flash')?.value === 'AUTO' ? 'auto' : 'off';

  useEffect(() => {
    if (!captureFlash) return;
    const timeout = setTimeout(() => setCaptureFlash(false), 140);
    return () => clearTimeout(timeout);
  }, [captureFlash]);

  const shotCounter = useMemo(
    () => String(36 - (capturedCount % 36)).padStart(2, '0'),
    [capturedCount],
  );

  function toggleTool(id: ToolId) {
    setTools((current) =>
      current.map((tool) => {
        if (tool.id !== id) return tool;
        const [first, second] = TOOL_ALTERNATES[id];
        return { ...tool, value: tool.value === first ? second : first };
      }),
    );
  }

  function setFocus(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;

    // Native press coordinates are pixels. The broad clamp keeps the reticle clear of edge chrome.
    setFocusPoint({
      x: Math.min(90, Math.max(10, (locationX / viewfinderSize.width) * 100)),
      y: Math.min(84, Math.max(16, (locationY / viewfinderSize.height) * 100)),
    });
  }

  async function capture() {
    if (!cameraRef.current || !cameraReady || isCapturing || showLatestPhoto) return;

    setCaptureError(null);
    setCaptureFlash(true);
    setIsCapturing(true);

    if (process.env.EXPO_OS === 'ios') {
      void Haptics.selectionAsync().catch(() => undefined);
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setLatestPhotoUri(photo.uri);
      setCapturedCount((count) => count + 1);
    } catch {
      setCaptureError('That photo was not captured. The camera is ready for another try.');
    } finally {
      setIsCapturing(false);
    }
  }

  function toggleFacing() {
    if (isCapturing) return;
    setCameraReady(false);
    setCameraFacing((value) => (value === 'back' ? 'front' : 'back'));
  }

  function reviewLatestPhoto() {
    if (!latestPhotoUri || isCapturing) return;
    setCameraReady(false);
    setShowLatestPhoto(true);
  }

  function returnToCamera() {
    setCameraReady(false);
    setShowLatestPhoto(false);
  }

  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.appShell}>
          <View style={styles.topRail}>
            <View accessibilityLabel="Iris" style={styles.brandLockup}>
              <IrisMark size={27} />
              <Text style={styles.wordmark}>IRIS</Text>
            </View>

            <View style={styles.sessionState}>
              <View style={styles.liveDot} />
              <Text style={styles.sessionText}>{showLatestPhoto ? 'REVIEW' : cameraFacing.toUpperCase()}</Text>
            </View>

            <View style={styles.counterPill}>
              <Text style={styles.counterText}>{shotCounter}</Text>
              <Text style={styles.counterLabel}>FRAMES</Text>
            </View>
          </View>

          <Pressable
            accessibilityHint="Moves the focus indicator"
            accessibilityLabel={showLatestPhoto ? 'Latest captured photo' : 'Live camera preview'}
            onLayout={(event) => setViewfinderSize(event.nativeEvent.layout)}
            onPress={showLatestPhoto ? undefined : setFocus}
            style={styles.viewfinder}>
            {showLatestPhoto && latestPhotoUri ? (
              <Image contentFit="cover" source={latestPhotoUri} style={StyleSheet.absoluteFill} />
            ) : (
              <CameraView
                active={!showLatestPhoto}
                autofocus="on"
                facing={cameraFacing}
                flash={flashMode}
                mirror={cameraFacing === 'front'}
                mode="picture"
                onCameraReady={() => {
                  setCameraReady(true);
                  setCaptureError(null);
                }}
                onMountError={(event) => {
                  setCameraReady(false);
                  setCaptureError(event.message);
                }}
                pointerEvents="none"
                ref={cameraRef}
                responsiveOrientationWhenOrientationLocked
                style={StyleSheet.absoluteFill}
              />
            )}

            {!showLatestPhoto && gridEnabled && (
              <View style={[StyleSheet.absoluteFill, styles.nonInteractive]}>
                <View style={[styles.gridLineVertical, { left: '33.333%' }]} />
                <View style={[styles.gridLineVertical, { left: '66.666%' }]} />
                <View style={[styles.gridLineHorizontal, { top: '33.333%' }]} />
                <View style={[styles.gridLineHorizontal, { top: '66.666%' }]} />
              </View>
            )}

            {!showLatestPhoto && (
              <View style={styles.exposureChip}>
                <Text style={styles.exposureText}>1/125</Text>
                <View style={styles.exposureDivider} />
                <Text style={styles.exposureText}>ISO 64</Text>
              </View>
            )}

            {!showLatestPhoto && (
              <View
                style={[
                  styles.focusReticle,
                  styles.nonInteractive,
                  { left: `${focusPoint.x}%`, top: `${focusPoint.y}%` },
                ]}>
                <View style={styles.focusDot} />
              </View>
            )}

            <View style={styles.previewLabel}>
              <View style={styles.previewLabelDot} />
              <Text style={styles.previewLabelText}>
                {showLatestPhoto ? 'LAST CAPTURE' : cameraReady ? 'LIVE CAMERA' : 'STARTING CAMERA'}
              </Text>
            </View>

            {showLatestPhoto && (
              <Pressable
                accessibilityLabel="Return to live camera"
                onPress={returnToCamera}
                style={({ pressed }) => [styles.reviewCloseButton, pressed && styles.pressed]}>
                <Text style={styles.reviewCloseText}>BACK TO CAMERA</Text>
              </Pressable>
            )}

            {!showLatestPhoto && (
              <View style={styles.lensRail}>
                {LENSES.map((value) => {
                  const selected = lens === value;
                  return (
                    <Pressable
                      accessibilityLabel={`${value} millimeter lens`}
                      accessibilityState={{ selected }}
                      key={value}
                      onPress={() => setLens(value)}
                      style={({ pressed }) => [
                        styles.lensButton,
                        selected && styles.lensButtonSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.lensText, selected && styles.lensTextSelected]}>
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.millimeterLabel}>MM</Text>
              </View>
            )}

            {captureFlash && (
              <View style={[styles.captureFlash, styles.nonInteractive]} />
            )}
          </Pressable>

          <View style={styles.controlDeck}>
            {captureError && (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Text selectable style={styles.errorText}>{captureError}</Text>
              </View>
            )}
            <View style={styles.modeTabs}>
              {(['PHOTO', 'MANUAL'] as const).map((value) => {
                const selected = mode === value;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={value}
                    onPress={() => setMode(value)}
                    style={({ pressed }) => [styles.modeTab, pressed && styles.pressed]}>
                    <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
                      {value}
                    </Text>
                    {selected && <View style={styles.modeRule} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.toolGrid}>
              {tools.map((tool) => {
                const active = tool.value !== 'OFF';
                return (
                  <Pressable
                    accessibilityLabel={`${tool.label}, ${tool.value}`}
                    accessibilityState={{ selected: active }}
                    key={tool.id}
                    onPress={() => toggleTool(tool.id)}
                    style={({ pressed }) => [
                      styles.tool,
                      active && styles.toolActive,
                      pressed && styles.toolPressed,
                    ]}>
                    <SymbolView
                      fallback={<Text style={styles.symbolFallback}>+</Text>}
                      name={tool.symbol}
                      size={19}
                      tintColor={active ? IrisColors.chalk : IrisColors.fog}
                      weight="light"
                    />
                    <Text numberOfLines={1} style={styles.toolValue}>
                      {tool.value}
                    </Text>
                    <Text numberOfLines={1} style={styles.toolLabel}>
                      {tool.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.captureRail}>
              <Pressable
                accessibilityLabel={latestPhotoUri ? 'Review latest photo' : `Current look: ${activeLook}`}
                disabled={!latestPhotoUri || isCapturing}
                onPress={reviewLatestPhoto}
                style={({ pressed }) => [styles.lookControl, pressed && styles.pressed]}>
                <View style={styles.lookSwatch}>
                  {latestPhotoUri && (
                    <Image contentFit="cover" source={latestPhotoUri} style={StyleSheet.absoluteFill} />
                  )}
                </View>
                <View>
                  <Text style={styles.lookLabel}>{latestPhotoUri ? 'LAST SHOT' : 'IRIS LOOK'}</Text>
                  <Text style={styles.lookValue}>{latestPhotoUri ? 'REVIEW' : activeLook}</Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Take photo"
                accessibilityRole="button"
                accessibilityState={{ busy: isCapturing, disabled: !cameraReady || showLatestPhoto }}
                disabled={!cameraReady || isCapturing || showLatestPhoto}
                onPress={capture}
                style={({ pressed }) => [
                  styles.shutterOuter,
                  (!cameraReady || isCapturing || showLatestPhoto) && styles.shutterDisabled,
                  pressed && styles.shutterPressed,
                ]}>
                <View style={styles.shutterInner} />
              </Pressable>

              <Pressable
                accessibilityLabel={`Switch to ${cameraFacing === 'back' ? 'front' : 'back'} camera`}
                disabled={isCapturing || showLatestPhoto}
                onPress={toggleFacing}
                style={({ pressed }) => [styles.flipButton, pressed && styles.pressed]}>
                <SymbolView
                  fallback={<Text style={styles.symbolFallback}>↻</Text>}
                  name={{
                    ios: 'arrow.triangle.2.circlepath.camera',
                    android: 'cameraswitch',
                    web: 'cameraswitch',
                  }}
                  size={23}
                  tintColor={IrisColors.chalk}
                  weight="light"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: IrisColors.opticalBlack,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  appShell: {
    alignSelf: 'center',
    backgroundColor: IrisColors.opticalBlack,
    flex: 1,
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  nonInteractive: {
    pointerEvents: 'none',
  },
  topRail: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  brandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  wordmark: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 22,
    letterSpacing: 4,
  },
  sessionState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -25 }],
  },
  liveDot: {
    backgroundColor: IrisColors.chalk,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  sessionText: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  counterPill: {
    alignItems: 'flex-end',
  },
  counterText: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 18,
    lineHeight: 18,
  },
  counterLabel: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 8,
    letterSpacing: 1.4,
  },
  viewfinder: {
    backgroundColor: '#24201E',
    flex: 1,
    minHeight: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  sceneGlow: {
    backgroundColor: '#96938C',
    borderRadius: 180,
    height: 360,
    opacity: 0.46,
    position: 'absolute',
    right: -100,
    top: -95,
    width: 360,
  },
  sceneOrb: {
    backgroundColor: '#6F6E6A',
    borderColor: '#AEACA5',
    borderRadius: 90,
    borderWidth: 2,
    height: 180,
    opacity: 0.72,
    position: 'absolute',
    right: 38,
    top: 70,
    width: 180,
  },
  sceneColumn: {
    backgroundColor: '#151517',
    bottom: -34,
    height: '86%',
    left: 26,
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    width: '24%',
  },
  scenePlane: {
    backgroundColor: '#65635D',
    bottom: 22,
    height: '37%',
    left: '23%',
    opacity: 0.9,
    position: 'absolute',
    transform: [{ rotate: '7deg' }],
    width: '88%',
  },
  sceneShadow: {
    backgroundColor: '#0A0A0B',
    bottom: -105,
    borderRadius: 240,
    height: 250,
    left: -30,
    opacity: 0.64,
    position: 'absolute',
    width: '120%',
  },
  gridLineVertical: {
    backgroundColor: 'rgba(244,242,237,0.2)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridLineHorizontal: {
    backgroundColor: 'rgba(244,242,237,0.2)',
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  exposureChip: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(5,5,6,0.72)',
    borderColor: 'rgba(244,242,237,0.14)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 7,
    position: 'absolute',
    top: 14,
  },
  exposureText: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  exposureDivider: {
    backgroundColor: IrisColors.fog,
    height: 10,
    width: 1,
  },
  focusReticle: {
    alignItems: 'center',
    borderColor: IrisColors.chalk,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 46,
    justifyContent: 'center',
    marginLeft: -23,
    marginTop: -23,
    position: 'absolute',
    width: 46,
  },
  focusDot: {
    backgroundColor: IrisColors.chalk,
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  previewLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    left: 13,
    position: 'absolute',
    top: 14,
  },
  previewLabelDot: {
    backgroundColor: IrisColors.chalk,
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  previewLabelText: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  reviewCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,5,6,0.82)',
    borderColor: 'rgba(244,242,237,0.2)',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 15,
    position: 'absolute',
    right: 13,
    top: 9,
    justifyContent: 'center',
  },
  reviewCloseText: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  lensRail: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(5,5,6,0.78)',
    borderColor: 'rgba(244,242,237,0.13)',
    borderRadius: 22,
    borderWidth: 1,
    bottom: 14,
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    position: 'absolute',
  },
  lensButton: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 40,
  },
  lensButtonSelected: {
    backgroundColor: IrisColors.chalk,
  },
  lensText: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 14,
  },
  lensTextSelected: {
    color: IrisColors.opticalBlack,
  },
  millimeterLabel: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 8,
    marginHorizontal: 7,
  },
  captureFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: IrisColors.chalk,
    opacity: 0.78,
  },
  controlDeck: {
    backgroundColor: IrisColors.carbon,
    borderColor: IrisColors.line,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    marginTop: -1,
    paddingBottom: 4,
    paddingHorizontal: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(242,13,47,0.14)',
    borderColor: 'rgba(242,13,47,0.4)',
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    color: IrisColors.chalk,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  modeTabs: {
    alignItems: 'stretch',
    backgroundColor: IrisColors.ink,
    borderRadius: 22,
    flexDirection: 'row',
    height: 54,
    marginTop: 8,
  },
  modeTab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  modeText: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 1.8,
  },
  modeTextSelected: {
    color: IrisColors.chalk,
  },
  modeRule: {
    backgroundColor: IrisColors.signalRed,
    borderRadius: 1,
    bottom: 7,
    height: 2,
    position: 'absolute',
    width: 34,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tool: {
    alignItems: 'center',
    borderColor: IrisColors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '22%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 6,
  },
  toolActive: {
    backgroundColor: IrisColors.graphite,
    borderColor: 'rgba(244,242,237,0.2)',
  },
  toolPressed: {
    backgroundColor: '#303034',
    transform: [{ scale: 0.97 }],
  },
  toolValue: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 12,
    marginTop: 5,
  },
  toolLabel: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 8,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  symbolFallback: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 18,
  },
  captureRail: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 72,
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    position: 'relative',
  },
  lookControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    minWidth: 104,
  },
  lookSwatch: {
    backgroundColor: '#8E8D88',
    borderColor: IrisColors.chalk,
    borderRadius: 11,
    borderWidth: 1,
    height: 30,
    overflow: 'hidden',
    width: 24,
  },
  lookLabel: {
    color: IrisColors.fog,
    fontFamily: IrisFonts.displayMedium,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  lookValue: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 13,
  },
  shutterOuter: {
    alignItems: 'center',
    borderColor: IrisColors.chalk,
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -30,
    position: 'absolute',
    width: 60,
  },
  shutterInner: {
    backgroundColor: IrisColors.chalk,
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  shutterPressed: {
    borderColor: IrisColors.fog,
    transform: [{ scale: 0.94 }],
  },
  shutterDisabled: {
    opacity: 0.38,
  },
  flipButton: {
    alignItems: 'center',
    backgroundColor: IrisColors.graphite,
    borderColor: IrisColors.line,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pressed: {
    opacity: 0.64,
  },
});
