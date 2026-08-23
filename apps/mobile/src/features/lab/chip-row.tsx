import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CameraChrome, ChromeFonts } from '@/features/camera/chrome';

type Chip<Id extends string> = {
  id: Id;
  label: string;
  caption?: string;
};

type ChipRowProps<Id extends string> = {
  items: readonly Chip<Id>[];
  selectedId: Id;
  onSelect: (id: Id) => void;
};

export function ChipRow<Id extends string>({ items, selectedId, onSelect }: ChipRowProps<Id>) {
  return (
    <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            accessibilityState={{ selected }}
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}>
            <Text style={[styles.label, selected && styles.labelOn]}>{item.label}</Text>
            {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}>
      <View style={[styles.dot, selected && styles.dotOn]} />
      <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: CameraChrome.glassBorder,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  chipOn: {
    backgroundColor: CameraChrome.amber,
    borderColor: CameraChrome.amber,
  },
  label: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  labelOn: {
    color: CameraChrome.ink,
  },
  caption: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 11,
    marginLeft: 4,
  },
  dot: {
    backgroundColor: CameraChrome.muted,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotOn: {
    backgroundColor: CameraChrome.ink,
  },
  pressed: {
    opacity: 0.72,
  },
});
