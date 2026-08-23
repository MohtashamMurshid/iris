import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CameraChrome, ChromeFonts } from '@/features/camera/chrome';

type AnalogDialProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  icon?: string;
  iconNode?: ReactNode;
  accessibilityLabel: string;
};

const TICKS = 51;
const MID = (TICKS - 1) / 2;

export function AnalogDial({
  value,
  min,
  max,
  step = 0.1,
  onChange,
  format,
  icon,
  iconNode,
  accessibilityLabel,
}: AnalogDialProps) {
  const [width, setWidth] = useState(1);
  const span = max - min;

  function setFromX(x: number) {
    if (width <= 0) return;
    const t = Math.min(1, Math.max(0, x / width));
    const raw = min + t * span;
    const snapped = Math.round(raw / step) * step;
    onChange(Number(Math.min(max, Math.max(min, snapped)).toFixed(2)));
  }

  const shiftTicks = ((value - min) / span - 0.5) * -18;

  return (
    <View style={styles.block}>
      <View style={styles.readout}>
        {iconNode ? iconNode : icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.value}>{format ? format(value) : String(value)}</Text>
      </View>
      <View
        accessibilityLabel={`${accessibilityLabel} ${format ? format(value) : value}`}
        accessibilityRole="adjustable"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setFromX(event.nativeEvent.locationX)}
        onResponderMove={(event) => setFromX(event.nativeEvent.locationX)}
        onStartShouldSetResponder={() => true}
        style={styles.hit}>
        <View style={[styles.tickRow, { transform: [{ translateX: shiftTicks }] }]}>
          {Array.from({ length: TICKS }, (_, index) => {
            const offset = Math.abs(index - MID);
            const major = (index - MID) % 5 === 0;
            return (
              <View
                key={index}
                style={[
                  styles.tick,
                  major && styles.tickMajor,
                  { opacity: Math.max(0.18, 1 - offset / MID) },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.needle} />
      </View>
    </View>
  );
}

type VerticalDialProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  glyph: string;
  label: string;
};

export function VerticalDial({
  value,
  min,
  max,
  step = 0.1,
  onChange,
  format,
  glyph,
  label,
}: VerticalDialProps) {
  const [height, setHeight] = useState(1);
  const span = max - min;

  function setFromY(y: number) {
    if (height <= 0) return;
    const t = 1 - Math.min(1, Math.max(0, y / height));
    const raw = min + t * span;
    const snapped = Math.round(raw / step) * step;
    onChange(Number(Math.min(max, Math.max(min, snapped)).toFixed(2)));
  }

  const shift = ((value - min) / span - 0.5) * 20;

  return (
    <View style={styles.column}>
      <Text style={styles.glyph}>{glyph}</Text>
      <Text style={styles.colValue}>{format ? format(value) : String(value)}</Text>
      <View
        accessibilityLabel={`${label} ${format ? format(value) : value}`}
        accessibilityRole="adjustable"
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setFromY(event.nativeEvent.locationY)}
        onResponderMove={(event) => setFromY(event.nativeEvent.locationY)}
        onStartShouldSetResponder={() => true}
        style={styles.colHit}>
        <View style={[styles.colTicks, { transform: [{ translateY: shift }] }]}>
          {Array.from({ length: 21 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.colTick,
                index === 10 && styles.colTickGhost,
                { opacity: Math.max(0.2, 1 - Math.abs(index - 10) / 10) },
              ]}
            />
          ))}
        </View>
        <View style={styles.colNeedle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  readout: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  icon: {
    color: CameraChrome.white,
    fontSize: 14,
  },
  value: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  hit: {
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  tick: {
    backgroundColor: CameraChrome.white,
    height: 10,
    width: 1.5,
  },
  tickMajor: {
    height: 16,
  },
  needle: {
    alignSelf: 'center',
    backgroundColor: CameraChrome.amber,
    height: 22,
    position: 'absolute',
    width: 2,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  glyph: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  colValue: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.mono,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  colHit: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  colTicks: {
    alignItems: 'center',
    gap: 5,
  },
  colTick: {
    backgroundColor: CameraChrome.white,
    height: 1.5,
    width: 14,
  },
  colTickGhost: {
    opacity: 0,
  },
  colNeedle: {
    backgroundColor: CameraChrome.amber,
    height: 2,
    position: 'absolute',
    width: 18,
  },
});
