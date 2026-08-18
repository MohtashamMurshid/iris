import { useCameraPermissions } from 'expo-camera';
import { useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { IrisMark } from '@/components/iris-mark';
import { IrisColors } from '@/constants/theme';

export function CameraPermissionGate({ children }: PropsWithChildren) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  async function askForCameraAccess() {
    if (isRequesting) return;

    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  }

  if (!permission) {
    return (
      <View
        accessibilityLabel="Checking camera permission"
        style={{
          alignItems: 'center',
          backgroundColor: IrisColors.opticalBlack,
          flex: 1,
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={IrisColors.chalk} />
      </View>
    );
  }

  if (permission.granted) return children;

  const hasAnswered = permission.status === 'denied';
  const mustUseSettings = hasAnswered && !permission.canAskAgain;

  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: 'center',
        flexGrow: 1,
        gap: 28,
        justifyContent: 'center',
        padding: 28,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: IrisColors.opticalBlack }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <IrisMark size={72} />
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text
            selectable
            style={{
              color: IrisColors.chalk,
              fontSize: 30,
              fontWeight: '700',
              letterSpacing: -0.7,
              textAlign: 'center',
            }}>
            {hasAnswered ? 'Camera access is off' : 'Your camera, in focus'}
          </Text>
          <Text
            selectable
            style={{
              color: IrisColors.fog,
              fontSize: 17,
              lineHeight: 24,
              maxWidth: 340,
              textAlign: 'center',
            }}>
            {hasAnswered
              ? 'Iris cannot show the viewfinder until camera access is enabled. Your photos stay on this device.'
              : 'Iris needs camera access to show the live viewfinder and take photos. Nothing is uploaded.'}
          </Text>
        </View>
      </View>

      <View style={{ gap: 12, maxWidth: 360, width: '100%' }}>
        <Pressable
          accessibilityRole="button"
          disabled={isRequesting}
          onPress={mustUseSettings ? Linking.openSettings : askForCameraAccess}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: IrisColors.chalk,
            borderCurve: 'continuous',
            borderRadius: 16,
            minHeight: 54,
            justifyContent: 'center',
            opacity: pressed || isRequesting ? 0.7 : 1,
            paddingHorizontal: 20,
          })}>
          {isRequesting ? (
            <ActivityIndicator color={IrisColors.opticalBlack} />
          ) : (
            <Text
              style={{
                color: IrisColors.opticalBlack,
                fontSize: 17,
                fontWeight: '700',
              }}>
              {mustUseSettings ? 'Open iPhone Settings' : hasAnswered ? 'Try again' : 'Continue'}
            </Text>
          )}
        </Pressable>

        <Text
          selectable
          style={{ color: IrisColors.fog, fontSize: 13, lineHeight: 18, textAlign: 'center' }}>
          Photo Library access will only be requested when you choose to save a photo.
        </Text>
      </View>
    </ScrollView>
  );
}
