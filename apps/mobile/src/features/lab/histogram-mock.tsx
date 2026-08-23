import { StyleSheet, View } from 'react-native';

import { CameraChrome } from '@/features/camera/chrome';

const BARS = [8, 14, 22, 36, 48, 62, 70, 58, 44, 38, 42, 50, 40, 28, 18, 12, 9, 7, 6, 5];

export function HistogramMock() {
  return (
    <View accessibilityLabel="Histogram" style={styles.frame}>
      {BARS.map((height, index) => (
        <View key={index} style={[styles.bar, { height: `${height}%` }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: CameraChrome.glassBorder,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 3,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bar: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    flex: 1,
  },
});
