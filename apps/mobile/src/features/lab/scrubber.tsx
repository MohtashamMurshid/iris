import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CameraChrome, ChromeFonts } from '@/features/camera/chrome';

type ScrubberProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function Scrubber({
  label,
  value,
  min,
  max,
  step = 0.1,
  format,
  onChange,
  disabled = false,
}: ScrubberProps) {
  const [width, setWidth] = useState(1);
  const span = max - min;
  const pct = span === 0 ? 0 : (value - min) / span;

  function setFromX(x: number) {
    if (disabled || width <= 0) return;
    const t = Math.min(1, Math.max(0, x / width));
    const raw = min + t * span;
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, snapped));
    onChange(Number(clamped.toFixed(2)));
  }

  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{format ? format(value) : String(value)}</Text>
      </View>
      <Pressable
        accessibilityLabel={`${label} ${format ? format(value) : value}`}
        disabled={disabled}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={(event) => setFromX(event.nativeEvent.locationX)}
        style={styles.hit}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          <View style={[styles.thumb, { left: `${pct * 100}%` }]} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  disabled: {
    opacity: 0.38,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  hit: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    height: 3,
    overflow: 'visible',
  },
  fill: {
    backgroundColor: CameraChrome.amber,
    height: 3,
  },
  thumb: {
    backgroundColor: CameraChrome.white,
    borderRadius: 8,
    height: 16,
    marginLeft: -8,
    position: 'absolute',
    top: -6.5,
    width: 16,
  },
});
