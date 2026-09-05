import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { IrisColors } from "@/constants/theme";
import type { Preferences } from "./model";
export function Grid({ type }: { type: Preferences["grid"] }) {
  if (type === "off") return null;
  const divisions = type === "golden" ? [38.2, 61.8] : [100 / 3, 200 / 3];
  if (type === "square")
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <View
          style={{
            width: "90%",
            aspectRatio: 1,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.4)",
          }}
        />
      </View>
    );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {divisions.map((v) => (
        <View
          key={`v${v}`}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${v}%`,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        />
      ))}
      {divisions.map((v) => (
        <View
          key={`h${v}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${v}%`,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </View>
  );
}
export function Level() {
  const [angle, setAngle] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    let smoothed = 0;
    void Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(150);
        subscription = Accelerometer.addListener(({ x, y }) => {
          const degrees = (Math.atan2(x, -y) * 180) / Math.PI;
          const relative = ((degrees + 225) % 90) - 45;
          smoothed = smoothed * 0.75 + relative * 0.25;
          setAngle(Math.round(smoothed * 10) / 10);
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
  return (
    <View
      pointerEvents="none"
      accessibilityLabel={
        angle === null
          ? "Level unavailable"
          : `Level ${Math.abs(angle).toFixed(1)} degrees`
      }
      style={{
        position: "absolute",
        top: "50%",
        alignSelf: "center",
        width: 100,
        alignItems: "center",
      }}
    >
      {angle === null ? (
        <Text style={{ color: IrisColors.fog, fontSize: 10 }}>
          LEVEL UNAVAILABLE
        </Text>
      ) : (
        <>
          <View
            style={{ height: 1, width: 100, backgroundColor: "#ffffff55" }}
          />
          <View
            style={{
              height: 2,
              width: 64,
              backgroundColor: Math.abs(angle) < 1.5 ? "#fff" : "#ffffff88",
              transform: [{ rotate: `${-angle}deg` }],
            }}
          />
          <Text style={{ color: "white", fontSize: 10, marginTop: 8 }}>
            {Math.abs(angle).toFixed(1)}°
          </Text>
        </>
      )}
    </View>
  );
}
export function Histogram({ bins }: { bins?: number[] }) {
  return (
    <View
      accessibilityLabel="Live luminance histogram"
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 14,
        bottom: 70,
        backgroundColor: "#050506aa",
        padding: 8,
        borderRadius: 8,
        width: 112,
        height: 56,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      {bins ? (
        bins.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: Math.max(1, v * 38),
              backgroundColor: "#f4f2ed",
            }}
          />
        ))
      ) : (
        <Text style={{ fontSize: 10, color: IrisColors.fog }}>
          Waiting for frame
        </Text>
      )}
    </View>
  );
}
