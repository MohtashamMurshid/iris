import { describe, expect, it } from "vitest";
import { decodeRecords } from "../src/features/library/decode";
const valid = {
  id: "photo-1",
  uri: "file:///photo.jpg",
  sourceUri: "file:///original.jpg",
  thumbnailUri: "file:///thumb.jpg",
  format: "jpeg",
  width: 4000,
  height: 3000,
  metadata: { iso: 100 },
  createdAt: 1000,
  look: "natural",
  intensity: 50,
  recipeVersion: 1,
  requestedLook: "natural",
  requestedIntensity: 50,
  favorite: false,
  saved: false,
};
describe("persisted capture decoding", () => {
  it("preserves complete records including interrupted deletion state", () => {
    expect(decodeRecords([{ ...valid, deletionPending: true }])).toEqual([
      { ...valid, deletionPending: true },
    ]);
  });
  it.each([
    "id",
    "uri",
    "sourceUri",
    "thumbnailUri",
    "format",
    "width",
    "height",
    "metadata",
    "createdAt",
    "look",
    "intensity",
    "recipeVersion",
    "requestedLook",
    "requestedIntensity",
    "favorite",
    "saved",
  ])("rejects a record missing %s without dropping other records", (key) => {
    const broken: Record<string, unknown> = { ...valid, id: "photo-2" };
    delete broken[key];
    expect(() => decodeRecords([valid, broken])).toThrow("index");
  });
  it("rejects invalid enums, duplicate ids and malformed optional state", () => {
    for (const patch of [
      { format: "exe" },
      { look: "invalid" },
      { width: NaN },
      { height: 0 },
      { intensity: 101 },
      { metadata: null },
      { saved: 1 },
      { savePending: "true" },
      { deletionPending: "true" },
      { assetId: 100 },
    ])
      expect(() => decodeRecords([{ ...valid, ...patch }])).toThrow("index");
    expect(() => decodeRecords([valid, valid])).toThrow("index");
    expect(() => decodeRecords(null)).toThrow("index");
  });
});
