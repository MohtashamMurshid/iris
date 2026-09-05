import type { LookId } from "../camera/model";
export const LOOKS: { id: LookId; name: string; description: string }[] = [
  { id: "none", name: "None", description: "The camera’s original color." },
  {
    id: "natural",
    name: "Natural",
    description: "Quiet contrast, faithful color.",
  },
  {
    id: "daylight",
    name: "Daylight",
    description: "Warm highlights, clear blues.",
  },
  { id: "noir", name: "Noir", description: "Monochrome with soft highlights." },
  {
    id: "chrome",
    name: "Chrome",
    description: "Rich color and stronger separation.",
  },
  {
    id: "faded",
    name: "Faded",
    description: "Lifted shadows and muted color.",
  },
];
export const IDENTITY = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];
const RECIPES: Record<LookId, number[]> = {
  none: IDENTITY,
  natural: [
    1.025, 0, 0, 0, -0.008, 0, 1.02, 0, 0, -0.006, 0, 0, 1.015, 0, -0.005, 0, 0,
    0, 1, 0,
  ],
  daylight: [
    1.06, 0, 0, 0, 0.012, 0, 1.02, 0, 0, 0.004, 0, 0, 0.96, 0, 0.005, 0, 0, 0,
    1, 0,
  ],
  noir: [
    0.224, 0.752, 0.076, 0, -0.025, 0.224, 0.752, 0.076, 0, -0.025, 0.224,
    0.752, 0.076, 0, -0.025, 0, 0, 0, 1, 0,
  ],
  chrome: [
    1.18, -0.09, -0.01, 0, -0.025, -0.03, 1.12, -0.01, 0, -0.02, -0.03, -0.09,
    1.2, 0, -0.02, 0, 0, 0, 1, 0,
  ],
  faded: [
    0.78, 0.07, 0.02, 0, 0.07, 0.02, 0.83, 0.02, 0, 0.06, 0.02, 0.07, 0.76, 0,
    0.075, 0, 0, 0, 1, 0,
  ],
};
// Version 1: row-major, normalized sRGB RGBA. Shared by Skia, Core Image and web.
export function lookMatrix(id: LookId, intensity: number): number[] {
  const amount = Math.min(1, Math.max(0, intensity / 100));
  return RECIPES[id].map((v, i) => IDENTITY[i] + (v - IDENTITY[i]) * amount);
}
export function applyMatrix(pixels: Uint8ClampedArray, matrix: number[]) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255,
      g = pixels[i + 1] / 255,
      b = pixels[i + 2] / 255,
      a = pixels[i + 3] / 255;
    for (let c = 0; c < 4; c++) {
      const j = c * 5;
      pixels[i + c] = Math.round(
        255 *
          (matrix[j] * r +
            matrix[j + 1] * g +
            matrix[j + 2] * b +
            matrix[j + 3] * a +
            matrix[j + 4]),
      );
    }
  }
}
