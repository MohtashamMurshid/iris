import { StyleSheet, Text, View } from 'react-native';

import { CameraChrome } from '@/features/camera/chrome';

type IconProps = {
  color?: string;
  size?: number;
};

export function AspectRatioIcon({ color = CameraChrome.white, size = 22 }: IconProps) {
  const inner = Math.round(size * 0.46);
  return (
    <View
      style={{
        alignItems: 'center',
        borderColor: color,
        borderRadius: 3,
        borderWidth: 1.5,
        height: Math.round(size * 0.76),
        justifyContent: 'center',
        width: size,
      }}>
      <View
        style={{
          borderColor: color,
          borderRadius: 2,
          borderWidth: 1.2,
          height: Math.round(inner * 0.72),
          width: inner,
        }}
      />
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

export function FitIcon({ color = CameraChrome.white, size = 20 }: IconProps) {
  const arm = Math.max(5, Math.round(size * 0.3));
  const thick = 1.6;
  const corners: { top?: number; bottom?: number; left?: number; right?: number }[] = [
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, right: 0 },
    { bottom: 0, left: 0 },
  ];
  return (
    <View style={{ height: size, width: size }}>
      {corners.map((corner, index) => (
        <View key={index} style={{ height: arm, position: 'absolute', width: arm, ...corner }}>
          <View
            style={{
              backgroundColor: color,
              height: thick,
              position: 'absolute',
              top: corner.top === 0 ? 0 : undefined,
              bottom: corner.bottom === 0 ? 0 : undefined,
              left: corner.left === 0 ? 0 : undefined,
              right: corner.right === 0 ? 0 : undefined,
              width: arm,
            }}
          />
          <View
            style={{
              backgroundColor: color,
              height: arm,
              position: 'absolute',
              top: corner.top === 0 ? 0 : undefined,
              bottom: corner.bottom === 0 ? 0 : undefined,
              left: corner.left === 0 ? 0 : undefined,
              right: corner.right === 0 ? 0 : undefined,
              width: thick,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function SparkleIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          backgroundColor: color,
          borderRadius: 1,
          height: size * 0.7,
          left: size * 0.42,
          position: 'absolute',
          top: 0,
          width: 1.5,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 1,
          height: 1.5,
          left: size * 0.18,
          position: 'absolute',
          top: size * 0.28,
          width: size * 0.55,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 1,
          height: size * 0.32,
          position: 'absolute',
          right: 1,
          top: size * 0.58,
          width: 1.4,
        }}
      />
    </View>
  );
}

export function FilmStripIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View
      style={{
        borderColor: color,
        borderRadius: 3,
        borderWidth: 1.3,
        flexDirection: 'row',
        height: size * 0.78,
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        paddingVertical: 2,
        width: size,
      }}>
      {[0, 1, 2].map((hole) => (
        <View key={hole} style={{ justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: color, borderRadius: 1, height: 3, width: 2 }} />
          <View style={{ backgroundColor: color, borderRadius: 1, height: 3, width: 2 }} />
        </View>
      ))}
    </View>
  );
}

export function LevelIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <View style={{ backgroundColor: color, height: 1.5, width: size }} />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 4,
          height: 8,
          position: 'absolute',
          width: 8,
        }}
      />
    </View>
  );
}

export function ContrastIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  return (
    <View
      style={{
        borderColor: color,
        borderRadius: size / 2,
        borderWidth: 1.4,
        flexDirection: 'row',
        height: size,
        overflow: 'hidden',
        width: size,
      }}>
      <View style={{ flex: 1 }} />
      <View style={{ backgroundColor: color, flex: 1 }} />
    </View>
  );
}

export function HistogramMiniIcon({ color = CameraChrome.white, size = 16 }: IconProps) {
  const bars = [0.35, 0.7, 1, 0.55, 0.3];
  return (
    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 1.5, height: size, width: size }}>
      {bars.map((amount, index) => (
        <View
          key={index}
          style={{
            backgroundColor: color,
            flex: 1,
            height: `${Math.round(amount * 100)}%` as `${number}%`,
          }}
        />
      ))}
    </View>
  );
}

export function DropletIcon({ color = CameraChrome.white, size = 14 }: IconProps) {
  return (
    <View
      style={{
        borderColor: color,
        borderRadius: size / 2,
        borderTopLeftRadius: size * 0.15,
        borderWidth: 1.4,
        height: size,
        transform: [{ rotate: '45deg' }],
        width: size * 0.78,
      }}
    />
  );
}

export function ThermometerIcon({ color = CameraChrome.white, size = 14 }: IconProps) {
  return (
    <View style={{ alignItems: 'center', height: size, width: 10 }}>
      <View style={{ backgroundColor: color, borderRadius: 2, flex: 1, width: 3 }} />
      <View
        style={{
          backgroundColor: color,
          borderRadius: 5,
          height: 8,
          marginTop: -2,
          width: 8,
        }}
      />
    </View>
  );
}

export function SunIcon({ color = CameraChrome.white, size = 14 }: IconProps) {
  const core = Math.max(5, Math.round(size * 0.42));
  const inset = (size - core) / 2;
  const ray = Math.max(2, Math.round(size * 0.18));
  return (
    <View style={{ height: size, width: size }}>
      <View
        style={{
          borderColor: color,
          borderRadius: core,
          borderWidth: 1.4,
          height: core,
          left: inset,
          position: 'absolute',
          top: inset,
          width: core,
        }}
      />
      <View style={{ backgroundColor: color, height: ray, left: (size - 1.3) / 2, position: 'absolute', top: 0, width: 1.3 }} />
      <View style={{ backgroundColor: color, bottom: 0, height: ray, left: (size - 1.3) / 2, position: 'absolute', width: 1.3 }} />
      <View style={{ backgroundColor: color, height: 1.3, left: 0, position: 'absolute', top: (size - 1.3) / 2, width: ray }} />
      <View style={{ backgroundColor: color, height: 1.3, position: 'absolute', right: 0, top: (size - 1.3) / 2, width: ray }} />
    </View>
  );
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
