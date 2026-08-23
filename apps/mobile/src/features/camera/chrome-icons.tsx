import { StyleSheet, Text, View } from 'react-native';

import { CameraChrome } from '@/features/camera/chrome';

type IconProps = {
  color?: string;
  size?: number;
};

export function AspectRatioIcon({ color = CameraChrome.white, size = 22 }: IconProps) {
  const height = Math.round(size * 0.72);
  return (
    <View
      style={{
        alignItems: 'center',
        borderColor: color,
        borderRadius: 3,
        borderWidth: 1.6,
        height,
        justifyContent: 'center',
        width: size,
      }}>
      <View style={{ backgroundColor: color, flex: 1, width: 1.6 }} />
    </View>
  );
}

export function GridCellsIcon({ color = CameraChrome.white, size = 20 }: IconProps) {
  const cell = size * 0.22;
  return (
    <View style={{ height: size, justifyContent: 'space-between', width: size }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2].map((col) => (
            <View
              key={col}
              style={{
                backgroundColor: color,
                borderRadius: 1.2,
                height: cell,
                width: cell,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function SplitLinesIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5, height: size, justifyContent: 'center' }}>
      <View style={{ backgroundColor: color, borderRadius: 1, height: size, width: 2 }} />
      <View style={{ backgroundColor: color, borderRadius: 1, height: size, width: 2 }} />
    </View>
  );
}

export function CheckIcon({ color = CameraChrome.ink, size = 22 }: IconProps) {
  return (
    <Text
      style={{
        color,
        fontSize: size,
        fontWeight: '800',
        lineHeight: size,
        textAlign: 'center',
      }}>
      ✓
    </Text>
  );
}

export function CircledLetterIcon({
  letter,
  color = CameraChrome.white,
  size = 22,
}: IconProps & { letter: 'A' | 'M' }) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderColor: color,
        borderRadius: size / 2,
        borderWidth: 1.5,
        height: size,
        justifyContent: 'center',
        width: size,
      }}>
      <Text
        style={{
          color,
          fontSize: size * 0.46,
          fontWeight: '700',
          lineHeight: size * 0.5,
        }}>
        {letter}
      </Text>
    </View>
  );
}

export function MotionPriorityIcon({ color = CameraChrome.white, size = 22 }: IconProps) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View style={{ gap: 2, left: 1, position: 'absolute' }}>
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, width: 7 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, width: 5 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, width: 7 }} />
      </View>
      <View
        style={{
          backgroundColor: color,
          borderRadius: 3,
          height: size * 0.42,
          marginLeft: 5,
          width: size * 0.34,
        }}
      />
    </View>
  );
}

export function IsoMeshIcon({ color = CameraChrome.white, size = 22 }: IconProps) {
  const cell = Math.max(2, Math.round(size / 6));
  return (
    <View
      style={{
        borderColor: color,
        borderRadius: size / 2,
        borderWidth: 1.4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        height: size,
        overflow: 'hidden',
        width: size,
      }}>
      {Array.from({ length: 16 }, (_, index) => (
        <View
          key={index}
          style={{
            backgroundColor: index % 2 === 0 ? color : 'transparent',
            height: cell,
            opacity: 0.85,
            width: cell,
          }}
        />
      ))}
    </View>
  );
}

export function EllipsisIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3, height: size, justifyContent: 'center' }}>
      {[0, 1, 2].map((dot) => (
        <View
          key={dot}
          style={{
            backgroundColor: color,
            borderRadius: 2,
            height: 4,
            width: 4,
          }}
        />
      ))}
    </View>
  );
}

export function ExposureModeGlyph({ mode }: { mode: 'auto' | 'manual' | 'shutter' | 'iso' }) {
  switch (mode) {
    case 'auto':
      return <CircledLetterIcon letter="A" />;
    case 'manual':
      return <CircledLetterIcon letter="M" />;
    case 'shutter':
      return <MotionPriorityIcon />;
    case 'iso':
      return <IsoMeshIcon />;
    default: {
      const _never: never = mode;
      return _never;
    }
  }
}

export function MeterTicks() {
  return (
    <View style={styles.ticks}>
      {[-3, -2, -1, 0, 1, 2, 3].map((stop) => (
        <View
          key={stop}
          style={[
            styles.tick,
            stop === 0 && styles.tickZero,
            stop === 1 && styles.tickActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ticks: {
    alignItems: 'flex-end',
    gap: 3,
    marginRight: 8,
  },
  tick: {
    backgroundColor: CameraChrome.meterRed,
    borderRadius: 1,
    height: 1.5,
    opacity: 0.45,
    width: 8,
  },
  tickZero: {
    opacity: 1,
    width: 12,
  },
  tickActive: {
    opacity: 1,
    width: 16,
  },
});
