import { requireOptionalNativeModule } from "expo-modules-core";
import { lookMatrix } from "./recipes";
import type { LookId, PhotoFormat } from "../camera/model";
const processor = requireOptionalNativeModule<{
  render(
    source: string,
    matrix: number[],
    format: string,
    recipe: string,
  ): Promise<{ uri: string; width: number; height: number }>;
  formats(deviceId: string): Promise<PhotoFormat[]>;
}>("IrisProcessing");
export const cameraFormats = (id: string) =>
  processor
    ? processor.formats(id)
    : Promise.reject(
        new Error("Install the Iris development build to use camera formats."),
      );
export function renderLook(
  source: string,
  look: LookId,
  intensity: number,
  format: Exclude<PhotoFormat, "dng">,
) {
  if (!processor)
    throw new Error("Install the Iris development build to process Looks.");
  return processor.render(
    source,
    lookMatrix(look, intensity),
    format,
    JSON.stringify({ app: "Iris", look, intensity, version: 1 }),
  );
}
