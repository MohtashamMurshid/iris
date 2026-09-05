import { requireOptionalNativeModule } from "expo-modules-core";
import { lazy, Suspense, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { CameraBackendProps } from "./backend.types";
import { ui } from "./panels";
const hasNativeCamera = !!requireOptionalNativeModule("IrisProcessing");
const NativeBackend = lazy(async () => ({
  default: (await import("./native-backend")).CameraBackend,
}));
export function CameraBackend(props: CameraBackendProps) {
  const { onError } = props;
  useEffect(() => {
    if (!hasNativeCamera)
      onError(
        "Manual capture requires the Iris iPhone development build. Expo Go does not contain the native camera and Look processor.",
      );
  }, [onError]);
  if (!hasNativeCamera)
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { padding: 28, justifyContent: "center", gap: 12 },
        ]}
      >
        <Text style={ui.title}>Open the Iris development build</Text>
        <Text style={ui.copy}>
          This camera uses native iPhone controls. Install the Iris development
          build to start shooting. Your library and settings remain available
          here.
        </Text>
      </View>
    );
  return (
    <Suspense fallback={<ActivityIndicator color="#F4F2ED" />}>
      <NativeBackend {...props} />
    </Suspense>
  );
}
