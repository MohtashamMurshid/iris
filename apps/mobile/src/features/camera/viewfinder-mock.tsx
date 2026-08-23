import { StyleSheet, View } from 'react-native';

import {
  CameraChrome,
  SCENE_BY_LOOK,
  type LookId,
  type OverlayId,
} from '@/features/camera/chrome';

type ViewfinderMockProps = {
  lookId: LookId;
  overlay: OverlayId;
  width: number;
  height: number;
};

export function ViewfinderMock({ lookId, overlay, width, height }: ViewfinderMockProps) {
  const palette = SCENE_BY_LOOK[lookId];

  return (
    <View style={[styles.frame, { borderRadius: CameraChrome.radiusViewfinder, height, width }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.sky }]} />
      <View style={[styles.glow, { backgroundColor: palette.glow }]} />
      <View style={[styles.ground, { backgroundColor: palette.ground }]} />
      <View style={[styles.path, { backgroundColor: palette.path }]} />
      <Gate color={palette.gate} scale={1} top="20%" />
      <Gate color={palette.gateFar} scale={0.74} top="29%" />
      <Gate color={palette.gateFar} scale={0.52} top="36%" />
      {palette.veil !== 'transparent' && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.veil }]} />
      )}
      <CompositionOverlay height={height} overlay={overlay} width={width} />
    </View>
  );
}

function Gate({ color, scale, top }: { color: string; scale: number; top: `${number}%` }) {
  const width = `${Math.round(72 * scale)}%` as const;
  const post = Math.max(8, Math.round(16 * scale));
  const bar = Math.max(8, Math.round(12 * scale));

  return (
    <View
      pointerEvents="none"
      style={{
        alignItems: 'center',
        alignSelf: 'center',
        height: `${Math.round(28 * scale)}%`,
        position: 'absolute',
        top,
        width,
      }}>
      <View style={{ backgroundColor: color, height: bar, width: '100%' }} />
      <View style={{ backgroundColor: color, height: Math.max(4, bar - 4), marginTop: 3, width: '86%' }} />
      <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', width: '88%' }}>
        <View style={{ backgroundColor: color, width: post }} />
        <View style={{ backgroundColor: color, width: post }} />
      </View>
    </View>
  );
}

function CompositionOverlay({
  overlay,
  width,
  height,
}: {
  overlay: OverlayId;
  width: number;
  height: number;
}) {
  if (overlay === 'off') return null;

  const lines = overlayLines(overlay, width, height);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines.vertical.map((left, index) => (
        <View key={`v-${index}`} style={[styles.vLine, { left }]} />
      ))}
      {lines.horizontal.map((top, index) => (
        <View key={`h-${index}`} style={[styles.hLine, { top }]} />
      ))}
    </View>
  );
}

function overlayLines(
  overlay: Exclude<OverlayId, 'off'>,
  width: number,
  height: number,
): { vertical: number[]; horizontal: number[] } {
  switch (overlay) {
    case 'thirds':
      return {
        vertical: [width / 3, (width * 2) / 3],
        horizontal: [height / 3, (height * 2) / 3],
      };
    case 'grid':
      return {
        vertical: [width / 4, width / 2, (width * 3) / 4],
        horizontal: [height / 4, height / 2, (height * 3) / 4],
      };
    case 'golden':
      return {
        vertical: [width * 0.382, width * 0.618],
        horizontal: [height * 0.382, height * 0.618],
      };
    case 'rabatment': {
      const short = Math.min(width, height);
      if (width >= height) {
        return { vertical: [short, width - short], horizontal: [] };
      }
      return { vertical: [], horizontal: [short, height - short] };
    }
    default: {
      const _never: never = overlay;
      return _never;
    }
  }
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#1A120E',
    overflow: 'hidden',
  },
  glow: {
    height: '42%',
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ground: {
    bottom: 0,
    height: '46%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  path: {
    alignSelf: 'center',
    bottom: 0,
    height: '52%',
    position: 'absolute',
    width: '28%',
  },
  vLine: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  hLine: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
