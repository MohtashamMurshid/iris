export type PhotoFormat = "jpeg" | "heic" | "dng";
export type LookId =
  "none" | "natural" | "daylight" | "noir" | "chrome" | "faded";
export type ManualSettings = {
  iso: number | null;
  shutter: number | null;
  focus: number | null;
  temperature: number | null;
  tint: number;
  ev: number;
};
export type Preferences = {
  version: 1;
  mode: "PHOTO" | "MANUAL";
  facing: "back" | "front";
  deviceId: string | null;
  zoom: number;
  format: PhotoFormat;
  flash: "off" | "auto" | "on";
  timer: 0 | 3 | 10;
  framing: "3-2" | "1-1" | "65-24" | "ig";
  grid: "off" | "thirds" | "square" | "golden";
  level: boolean;
  histogram: boolean;
  look: LookId;
  intensity: number;
  sound: boolean;
  autoSave: boolean;
  guideSeen: boolean;
  manual: ManualSettings;
};
export const AUTO: ManualSettings = {
  iso: null,
  shutter: null,
  focus: null,
  temperature: null,
  tint: 0,
  ev: 0,
};
export const DEFAULTS: Preferences = {
  version: 1,
  mode: "PHOTO",
  facing: "back",
  deviceId: null,
  zoom: 1,
  format: "heic",
  flash: "off",
  timer: 0,
  framing: "3-2",
  grid: "thirds",
  level: false,
  histogram: false,
  look: "natural",
  intensity: 100,
  sound: true,
  autoSave: false,
  guideSeen: false,
  manual: AUTO,
};
export type Range = { min: number; max: number; step?: number };
export type Capabilities = {
  id: string;
  name: string;
  formats: PhotoFormat[];
  devices: { id: string; name: string; facing: "front" | "back" }[];
  zoom: Range;
  zoomStops: number[];
  iso?: Range;
  shutter?: Range;
  focus?: Range;
  temperature?: Range;
  ev?: Range;
  flash: boolean;
  metering: boolean;
  histogram: boolean;
  resolutions: { width: number; height: number }[];
};
export const EMPTY_CAPABILITIES: Capabilities = {
  id: "",
  name: "Camera",
  formats: ["jpeg"],
  devices: [],
  zoom: { min: 1, max: 1 },
  zoomStops: [1],
  flash: false,
  metering: false,
  histogram: false,
  resolutions: [],
};
export type CameraReading = {
  iso?: number;
  shutter?: number;
  focus?: number;
  histogram?: number[];
};
export type CaptureResult = {
  uri: string;
  sourceUri: string;
  thumbnailUri: string;
  format: PhotoFormat;
  width: number;
  height: number;
  metadata: Record<string, string | number>;
};
export type CaptureRecord = CaptureResult & {
  id: string;
  createdAt: number;
  look: LookId;
  intensity: number;
  recipeVersion: 1;
  favorite: boolean;
  saved: boolean;
  assetId?: string;
  savePending?: boolean;
  requestedLook: LookId;
  requestedIntensity: number;
};
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
export function shutterLabel(value?: number | null) {
  if (!value || value <= 0) return "AUTO";
  return value >= 1
    ? `${Number(value.toFixed(1))}s`
    : `1/${Math.round(1 / value)}`;
}
export function validatePreferences(value: unknown): Preferences {
  const p =
    value && typeof value === "object" ? (value as Partial<Preferences>) : {};
  const choose = <T>(v: unknown, options: readonly T[], fallback: T): T =>
    options.includes(v as T) ? (v as T) : fallback;
  const m = p.manual && typeof p.manual === "object" ? p.manual : AUTO;
  const nullable = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? clamp(v, min, max) : null;
  return {
    ...DEFAULTS,
    mode: choose(p.mode, ["PHOTO", "MANUAL"], DEFAULTS.mode),
    facing: choose(p.facing, ["back", "front"], "back"),
    deviceId: typeof p.deviceId === "string" ? p.deviceId : null,
    zoom: clamp(Number(p.zoom ?? 1), 0.1, 100),
    format: choose(p.format, ["jpeg", "heic", "dng"], "heic"),
    flash: choose(p.flash, ["off", "auto", "on"], "off"),
    timer: choose(p.timer, [0, 3, 10], 0),
    framing: choose(p.framing, ["3-2", "1-1", "65-24", "ig"], "3-2"),
    grid: choose(p.grid, ["off", "thirds", "square", "golden"], "thirds"),
    level: p.level === true,
    histogram: p.histogram === true,
    sound: p.sound !== false,
    autoSave: p.autoSave === true,
    guideSeen: p.guideSeen === true,
    look: choose(
      p.look,
      ["none", "natural", "daylight", "noir", "chrome", "faded"],
      "natural",
    ),
    intensity: clamp(Number(p.intensity ?? 100), 0, 100),
    manual: {
      iso: nullable(m.iso, 1, 1e6),
      shutter: nullable(m.shutter, 1e-6, 60),
      focus: nullable(m.focus, 0, 1),
      temperature: nullable(m.temperature, 2500, 8000),
      tint: clamp(Number(m.tint ?? 0), -150, 150),
      ev: clamp(Number(m.ev ?? 0), -20, 20),
    },
  };
}
export function constrainPreferences(
  p: Preferences,
  c: Capabilities,
): Preferences {
  const bounded = (v: number | null, r?: Range) =>
    v === null || !r ? null : clamp(v, r.min, r.max);
  return {
    ...p,
    deviceId: c.id,
    format: c.formats.includes(p.format) ? p.format : c.formats[0],
    zoom: clamp(p.zoom, c.zoom.min, c.zoom.max),
    flash: c.flash ? p.flash : "off",
    histogram: c.histogram && p.histogram,
    manual: {
      ...p.manual,
      iso: bounded(p.manual.iso, c.iso),
      shutter: bounded(p.manual.shutter, c.shutter),
      focus: bounded(p.manual.focus, c.focus),
      temperature: bounded(p.manual.temperature, c.temperature),
      ev: c.ev ? clamp(p.manual.ev, c.ev.min, c.ev.max) : 0,
    },
  };
}
export function histogramFromPixels(
  pixels: ArrayLike<number>,
  bins = 32,
): number[] {
  const counts = Array<number>(bins).fill(0);
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const luma =
      0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    counts[Math.min(bins - 1, Math.floor((luma * bins) / 256))]++;
  }
  const max = Math.max(1, ...counts);
  return counts.map((v) => v / max);
}
