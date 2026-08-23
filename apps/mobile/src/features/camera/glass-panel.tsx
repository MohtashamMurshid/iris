import { isGlassEffectAPIAvailable, isLiquidGlassAvailable, GlassView } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { CameraChrome } from '@/features/camera/chrome';

type GlassPanelProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
};

function canUseNativeGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

export function GlassPanel({ children, style, interactive = true, ...props }: GlassPanelProps) {
  if (canUseNativeGlass()) {
    return (
      <GlassView
        colorScheme="dark"
        glassEffectStyle="regular"
        isInteractive={interactive}
        tintColor="rgba(8, 8, 10, 0.42)"
        style={style}
        {...props}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.fallback, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: CameraChrome.glassFill,
    borderColor: CameraChrome.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
