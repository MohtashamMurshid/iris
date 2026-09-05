import { StyleSheet, View } from 'react-native';

import { CameraChrome, type LookSwatch } from '@/features/camera/chrome';

type LookArtworkProps = {
  look: LookSwatch;
  size: number;
  selected?: boolean;
};

export function LookArtwork({ look, size, selected = false }: LookArtworkProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          height: size,
          width: size,
        },
        selected && styles.selected,
      ]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: look.bands[0] }]} />
      <View
        style={{
          backgroundColor: look.bands[1],
          height: '48%',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <View
        style={{
          backgroundColor: look.accent,
          borderRadius: size,
          height: size * 0.42,
          opacity: 0.55,
          position: 'absolute',
          right: -size * 0.18,
          top: -size * 0.12,
          width: size * 0.42,
        }}
      />
      <View
        style={{
          backgroundColor: look.bands[2],
          bottom: 0,
          height: '30%',
          left: 0,
          position: 'absolute',
          right: 0,
        }}
      />
      {look.id === 'noir' && (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            height: 2,
            left: '18%',
            position: 'absolute',
            right: '18%',
            top: '42%',
          }}
        />
      )}
    </View>
  );
}

export function FilmWindow({ look, size, selected = false }: LookArtworkProps) {
  const hole = Math.max(3, Math.round(size * 0.09));

  return (
    <View style={{ height: size, width: size }}>
      <LookArtwork look={look} selected={selected} size={size} />
      <View style={styles.sprockets}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{
              backgroundColor: 'rgba(8,8,10,0.55)',
              borderRadius: 1,
              height: hole,
              width: hole * 0.7,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  selected: {
    borderColor: CameraChrome.amber,
    borderWidth: 3,
  },
  sprockets: {
    bottom: 5,
    justifyContent: 'space-between',
    left: 4,
    pointerEvents: 'none',
    position: 'absolute',
    top: 5,
  },
});
