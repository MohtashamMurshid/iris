import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CameraChrome, ChromeFonts, LOOKS, lookById, type LookId } from '@/features/camera/chrome';
import { CheckIcon } from '@/features/camera/chrome-icons';
import { GlassPanel } from '@/features/camera/glass-panel';
import { LookArtwork } from '@/features/camera/look-artwork';

type LookPickerProps = {
  selectedId: LookId;
  onSelect: (id: LookId) => void;
  onConfirm: () => void;
};

export function LookPicker({ selectedId, onSelect, onConfirm }: LookPickerProps) {
  const selected = lookById(selectedId);

  return (
    <GlassPanel style={styles.sheet}>
      <ScrollView
        contentContainerStyle={styles.carousel}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {LOOKS.map((look) => {
          const selectedLook = look.id === selectedId;
          return (
            <Pressable
              accessibilityLabel={`${look.name} look`}
              accessibilityState={{ selected: selectedLook }}
              key={look.id}
              onPress={() => onSelect(look.id)}
              style={({ pressed }) => [styles.lookItem, pressed && styles.pressed]}
              testID={`look-${look.id}`}>
              <LookArtwork look={look} selected={selectedLook} size={56} />
              <Text numberOfLines={1} style={[styles.lookName, selectedLook && styles.lookNameSelected]}>
                {look.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.detail}>
        <Text style={styles.title}>{selected.name}</Text>
        <Text style={styles.description}>{selected.description}</Text>
      </View>

      <Pressable
        accessibilityLabel="Confirm look"
        onPress={onConfirm}
        style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
        testID="look-confirm">
        <CheckIcon color={CameraChrome.ink} size={26} />
      </Pressable>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderCurve: 'continuous',
    borderRadius: CameraChrome.radiusSheet,
    minHeight: 268,
    overflow: 'hidden',
    paddingBottom: 22,
    paddingTop: 22,
  },
  carousel: {
    gap: 8,
    paddingHorizontal: 16,
  },
  lookItem: {
    alignItems: 'center',
    gap: 7,
    width: 64,
  },
  lookName: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: '500',
  },
  lookNameSelected: {
    color: CameraChrome.white,
  },
  detail: {
    paddingHorizontal: 24,
    paddingRight: 108,
    paddingTop: 22,
  },
  title: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  description: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    opacity: 0.92,
  },
  confirm: {
    alignItems: 'center',
    backgroundColor: CameraChrome.amber,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 36,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 16,
    bottom: 14,
    height: 64,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    width: 72,
  },
  confirmPressed: {
    opacity: 0.82,
  },
  pressed: {
    opacity: 0.7,
  },
});
