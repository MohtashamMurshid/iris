import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

type IrisMarkProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/** The same six-segment aperture mark used by the Iris website. */
export function IrisMark({ size = 32, style }: IrisMarkProps) {
  return (
    <Image
      accessibilityLabel=""
      contentFit="contain"
      source={require('@/assets/images/iris-aperture-mark.svg')}
      style={[{ height: size, width: size }, style]}
    />
  );
}
