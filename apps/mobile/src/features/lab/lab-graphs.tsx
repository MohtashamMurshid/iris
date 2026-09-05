import { StyleSheet, View } from 'react-native';

import { CameraChrome } from '@/features/camera/chrome';

const RED = [12, 20, 34, 52, 70, 62, 48, 36, 28, 22, 18, 16, 14, 12, 10, 8, 7, 6];
const GREEN = [8, 14, 24, 40, 58, 72, 64, 50, 38, 30, 26, 22, 18, 14, 12, 10, 8, 7];
const BLUE = [6, 10, 16, 26, 38, 50, 60, 68, 58, 44, 32, 24, 20, 16, 14, 12, 10, 8];
const CURVE = [8, 10, 13, 18, 24, 32, 42, 52, 60, 66, 70, 72, 73, 74, 74, 75];

export function RgbHistogram() {
  return (
    <View accessibilityLabel="RGB histogram" style={styles.chart}>
      <Channel bars={RED} color="rgba(255,80,70,0.72)" />
      <Channel bars={GREEN} color="rgba(90,220,120,0.55)" />
      <Channel bars={BLUE} color="rgba(80,160,255,0.5)" />
    </View>
  );
}

function Channel({ bars, color }: { bars: number[]; color: string }) {
  return (
    <View style={styles.channel}>
      {bars.map((height, index) => (
        <View key={index} style={{ backgroundColor: color, flex: 1, height: `${height}%` }} />
      ))}
    </View>
  );
}

export function ToneCurve() {
  return (
    <View accessibilityLabel="Tone curve" style={styles.curveBox}>
      {CURVE.map((height, index) => (
        <View key={index} style={styles.curveCol}>
          <View style={[styles.curveDot, { bottom: `${height}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 72,
    overflow: 'hidden',
  },
  channel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  curveBox: {
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 8,
  },
  curveCol: {
    flex: 1,
  },
  curveDot: {
    backgroundColor: CameraChrome.white,
    borderRadius: 1,
    height: 3,
    position: 'absolute',
    width: 3,
  },
});
