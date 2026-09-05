import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { IrisMark } from "@/components/iris-mark";
import { IrisColors } from "@/constants/theme";

export function CameraPermissionGate({ children }: PropsWithChildren) {
  const [permission, requestPermission, refreshPermission] =
    useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const requesting = useRef(false);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active")
        void refreshPermission().catch(() =>
          setError("Camera access could not be checked. Try again."),
        );
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  async function askForCameraAccess() {
    if (requesting.current) return;
    requesting.current = true;
    setError(null);

    setIsRequesting(true);
    try {
      await requestPermission();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Camera access could not be requested. Try again.",
      );
    } finally {
      requesting.current = false;
      setIsRequesting(false);
    }
  }

  if (!permission) {
    return (
      <View
        accessibilityLabel="Checking camera permission"
        style={{
          alignItems: "center",
          backgroundColor: IrisColors.opticalBlack,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={IrisColors.chalk} />
      </View>
    );
  }

  if (permission.granted) return children;

  const hasAnswered = permission.status === "denied";
  const mustUseSettings = hasAnswered && !permission.canAskAgain;

  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: "center",
        flexGrow: 1,
        gap: 28,
        justifyContent: "center",
        padding: 28,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: IrisColors.opticalBlack }}
    >
      <View style={{ alignItems: "center", gap: 16 }}>
        <IrisMark size={72} />
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text
            selectable
            style={{
              color: IrisColors.chalk,
              fontSize: 30,
              fontWeight: "700",
              letterSpacing: -0.7,
              textAlign: "center",
            }}
          >
            {hasAnswered ? "Camera access is off" : "Your camera, in focus"}
          </Text>
          <Text
            selectable
            style={{
              color: IrisColors.fog,
              fontSize: 17,
              lineHeight: 24,
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            {hasAnswered
              ? "Iris cannot show the viewfinder until camera access is enabled. Your photos stay on this device."
              : "Iris needs camera access to show the live viewfinder and take photos. Nothing is uploaded."}
          </Text>
        </View>
      </View>

      {error && (
        <Text
          accessibilityRole="alert"
          style={{ color: IrisColors.chalk, textAlign: "center" }}
        >
          {error}
        </Text>
      )}
      {mustUseSettings && Platform.OS === "web" && (
        <Text style={{ color: IrisColors.fog, textAlign: "center" }}>
          Allow camera access in this site’s browser settings, then try again.
        </Text>
      )}
      <View style={{ gap: 12, maxWidth: 360, width: "100%" }}>
        <Pressable
          accessibilityRole="button"
          disabled={isRequesting}
          onPress={
            mustUseSettings && Platform.OS !== "web"
              ? () => {
                  void Linking.openSettings().catch(() =>
                    setError(
                      "Open your device Settings and allow camera access for Iris.",
                    ),
                  );
                }
              : askForCameraAccess
          }
          style={({ pressed }) => ({
            alignItems: "center",
            backgroundColor: IrisColors.chalk,
            borderCurve: "continuous",
            borderRadius: 16,
            minHeight: 54,
            justifyContent: "center",
            opacity: pressed || isRequesting ? 0.7 : 1,
            paddingHorizontal: 20,
          })}
        >
          {isRequesting ? (
            <ActivityIndicator color={IrisColors.opticalBlack} />
          ) : (
            <Text
              style={{
                color: IrisColors.opticalBlack,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              {mustUseSettings && Platform.OS !== "web"
                ? "Open Settings"
                : hasAnswered
                  ? "Try again"
                  : "Continue"}
            </Text>
          )}
        </Pressable>

        <Text
          selectable
          style={{
            color: IrisColors.fog,
            fontSize: 13,
            lineHeight: 18,
            textAlign: "center",
          }}
        >
          Photo Library access will only be requested when you choose to save a
          photo.
        </Text>
      </View>
    </ScrollView>
  );
}
