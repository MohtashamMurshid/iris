import Slider from "@react-native-community/slider";
import type { PropsWithChildren } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { IrisColors, IrisFonts } from "@/constants/theme";
import type { Range } from "./model";
export function Sheet({
  title,
  onClose,
  children,
  busy = false,
}: PropsWithChildren<{ title: string; onClose: () => void; busy?: boolean }>) {
  return (
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <View style={ui.backdrop}>
        <Pressable
          accessibilityLabel={`Close ${title}`}
          disabled={busy}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={ui.sheet}>
          <View style={ui.heading}>
            <Text accessibilityRole="header" style={ui.title}>
              {title}
            </Text>
            <Button label="Done" disabled={busy} onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={ui.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Button({
  label,
  onPress,
  selected,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      {...(Platform.OS === "web" && selected !== undefined
        ? { "aria-pressed": selected }
        : {})}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        selected && ui.selected,
        disabled && { opacity: 0.38 },
        pressed && { opacity: 0.65 },
      ]}
    >
      <Text
        style={[
          ui.buttonText,
          selected && { color: IrisColors.opticalBlack },
          danger && { color: "#ff6c7f" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Options<T extends string | number>({
  values,
  value,
  onChange,
}: {
  values: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={ui.row}>
      {values.map((option) => (
        <Button
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={ui.heading}>
      <Text style={ui.label}>{label}</Text>
      <Button
        label={value ? "On" : "Off"}
        selected={value}
        disabled={disabled}
        onPress={() => onChange(!value)}
      />
    </View>
  );
}
export function Dial({
  label,
  value,
  range,
  onChange,
  onAuto,
  format = (v) => String(Math.round(v)),
  logarithmic = false,
  autoLabel = "Auto",
}: {
  autoLabel?: string;
  label: string;
  value: number | null;
  range?: Range;
  onChange: (v: number) => void;
  onAuto?: () => void;
  format?: (v: number) => string;
  logarithmic?: boolean;
}) {
  if (!range || range.max <= range.min)
    return <Text style={ui.copy}>{label} is automatic on this camera.</Text>;
  const min = logarithmic ? Math.log(range.min) : range.min;
  const max = logarithmic ? Math.log(range.max) : range.max;
  const current = value ?? range.min;
  return (
    <View style={{ gap: 12 }}>
      <View style={ui.heading}>
        <Text style={ui.label}>
          {label} ·{" "}
          {value === null
            ? "AUTO"
            : `${format(value)}${onAuto && autoLabel === "Auto" ? " · LOCKED" : ""}`}
        </Text>
        {onAuto && (
          <Button
            label={autoLabel}
            selected={value === null}
            onPress={onAuto}
          />
        )}
      </View>
      <Slider
        accessibilityLabel={label}
        accessibilityValue={{
          min: range.min,
          max: range.max,
          now: current,
          text: value === null ? "Auto" : format(current),
        }}
        minimumValue={min}
        maximumValue={max}
        value={logarithmic ? Math.log(current) : current}
        step={logarithmic ? 0 : (range.step ?? 0)}
        onSlidingComplete={(v) => onChange(logarithmic ? Math.exp(v) : v)}
        minimumTrackTintColor={IrisColors.chalk}
        maximumTrackTintColor={IrisColors.graphite}
        thumbTintColor={IrisColors.chalk}
        style={{ height: 44, width: "100%" }}
      />
      <View style={ui.heading}>
        <Button
          label={`Decrease ${label}`}
          onPress={() =>
            onChange(
              Math.max(
                range.min,
                logarithmic
                  ? current / Math.pow(2, 1 / 3)
                  : current - (range.step ?? (range.max - range.min) / 20),
              ),
            )
          }
        />
        <Button
          label={`Increase ${label}`}
          onPress={() =>
            onChange(
              Math.min(
                range.max,
                logarithmic
                  ? current * Math.pow(2, 1 / 3)
                  : current + (range.step ?? (range.max - range.min) / 20),
              ),
            )
          }
        />
      </View>
    </View>
  );
}
export const ui = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    maxHeight: "85%",
    width: "100%",
    maxWidth: 560,
    backgroundColor: IrisColors.carbon,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: IrisColors.line,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 26,
  },
  content: { gap: 20, paddingTop: 18, paddingBottom: 20 },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IrisColors.line,
    backgroundColor: IrisColors.graphite,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: IrisColors.chalk },
  buttonText: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 15,
  },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  label: {
    color: IrisColors.chalk,
    fontFamily: IrisFonts.displaySemiBold,
    fontSize: 16,
    flexShrink: 1,
  },
  copy: { color: IrisColors.fog, fontSize: 14, lineHeight: 21 },
});
