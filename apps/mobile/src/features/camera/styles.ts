import { StyleSheet } from "react-native";
import { IrisColors } from "@/constants/theme";
export const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    backgroundColor: IrisColors.opticalBlack,
    flex: 1,
  },
  focusReticle: {
    alignItems: "center",
    borderColor: IrisColors.chalk,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 46,
    justifyContent: "center",
    marginLeft: -23,
    marginTop: -23,
    position: "absolute",
    width: 46,
  },
  focusDot: {
    backgroundColor: IrisColors.chalk,
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  captureFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: IrisColors.chalk,
    opacity: 0.78,
  },
  errorBanner: {
    backgroundColor: "rgba(242,13,47,0.14)",
    borderColor: "rgba(242,13,47,0.4)",
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    color: IrisColors.chalk,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
