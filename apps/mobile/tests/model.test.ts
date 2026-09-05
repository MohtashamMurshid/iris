import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  EMPTY_CAPABILITIES,
  constrainPreferences,
  histogramFromPixels,
  shutterLabel,
  validatePreferences,
} from "../src/features/camera/model";
import {
  applyMatrix,
  IDENTITY,
  LOOKS,
  lookMatrix,
} from "../src/features/looks/recipes";

describe("camera settings", () => {
  it("recovers invalid persisted values without allowing invalid camera commands", () => {
    const p = validatePreferences({
      format: "fake-raw",
      zoom: Infinity,
      look: "unknown",
      intensity: 999,
      manual: { iso: NaN, shutter: -4, ev: 200, temperature: 99999 },
    });
    expect(p.format).toBe("heic");
    expect(p.look).toBe("natural");
    expect(p.intensity).toBe(100);
    expect(Number.isFinite(p.zoom)).toBe(true);
    expect(p.manual.iso).toBeNull();
    expect(p.manual.temperature).toBe(8000);
  });
  it("revalidates formats and locks when switching to less capable hardware", () => {
    const p = {
      ...DEFAULTS,
      format: "dng" as const,
      zoom: 20,
      flash: "on" as const,
      manual: { ...DEFAULTS.manual, iso: 6400, shutter: 1, focus: 0.5, ev: 4 },
    };
    const c = {
      ...EMPTY_CAPABILITIES,
      id: "front",
      iso: { min: 40, max: 800 },
      shutter: { min: 1 / 1000, max: 1 / 10 },
      zoom: { min: 1, max: 3 },
    };
    const result = constrainPreferences(p, c);
    expect(result.format).toBe("jpeg");
    expect(result.flash).toBe("off");
    expect(result.zoom).toBe(3);
    expect(result.manual).toMatchObject({
      iso: 800,
      shutter: 0.1,
      focus: null,
      ev: 0,
    });
    expect(p.manual.iso).toBe(6400);
  });
  it("keeps explicit locks unchanged on a compatible camera", () => {
    const p = {
      ...DEFAULTS,
      manual: { ...DEFAULTS.manual, iso: 125, shutter: 1 / 125 },
    };
    const result = constrainPreferences(p, {
      ...EMPTY_CAPABILITIES,
      iso: { min: 20, max: 1600 },
      shutter: { min: 1 / 4000, max: 1 },
    });
    expect(result.manual.iso).toBe(125);
    expect(result.manual.shutter).toBe(1 / 125);
  });
  it("never invents exposure readings", () => {
    expect(shutterLabel(undefined)).toBe("AUTO");
    expect(shutterLabel(1 / 125)).toBe("1/125");
    expect(shutterLabel(2)).toBe("2s");
  });
});
describe("Look rendering", () => {
  it("leaves the original pixels unchanged at zero intensity for every Look", () => {
    for (const look of LOOKS) {
      const pixels = new Uint8ClampedArray([
        12, 100, 250, 255, 200, 20, 140, 128,
      ]);
      const source = [...pixels];
      applyMatrix(pixels, lookMatrix(look.id, 0));
      expect([...pixels]).toEqual(source);
      expect(lookMatrix(look.id, 0)).toEqual(IDENTITY);
    }
  });
  it("produces neutral monochrome and preserves alpha for Noir", () => {
    const pixels = new Uint8ClampedArray([245, 20, 5, 255, 15, 180, 240, 128]);
    applyMatrix(pixels, lookMatrix("noir", 100));
    expect(pixels[0]).toBe(pixels[1]);
    expect(pixels[1]).toBe(pixels[2]);
    expect(pixels[3]).toBe(255);
    expect(pixels[4]).toBe(pixels[5]);
    expect(pixels[7]).toBe(128);
  });
  it("keeps all recipes finite and handles black and white histogram endpoints", () => {
    for (const look of LOOKS)
      expect(lookMatrix(look.id, 100).every(Number.isFinite)).toBe(true);
    const bins = histogramFromPixels([0, 0, 0, 255, 255, 255, 255, 255]);
    expect(bins[0]).toBe(1);
    expect(bins[31]).toBe(1);
    expect(bins.filter((v) => v > 0)).toHaveLength(2);
  });
});
