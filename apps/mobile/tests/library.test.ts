import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureRecord } from "../src/features/camera/model";
import {
  addCapture,
  deleteCapture,
  loadCaptures,
  restyleCapture,
  saveCapture,
  updateCapture,
} from "../src/features/library/repository";
import { DEFAULTS } from "../src/features/camera/model";
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  save: vi.fn(),
  render: vi.fn(),
  remove: vi.fn(),
  retain: vi.fn(),
  release: vi.fn(),
}));
vi.mock("../src/features/library/database", () => ({
  readRecords: mocks.read,
  writeRecords: mocks.write,
}));
vi.mock("../src/features/library/files", () => ({
  retainFile: mocks.retain,
  removeFile: mocks.remove,
  releaseTemporary: mocks.release,
}));
vi.mock("../src/features/library/platform", () => ({
  saveToPhotos: mocks.save,
}));
vi.mock("../src/features/looks/render", () => ({ renderLook: mocks.render }));
const photo = {
  uri: "file:///tmp/photo.jpg",
  sourceUri: "file:///tmp/photo.jpg",
  thumbnailUri: "file:///tmp/photo.jpg",
  width: 4000,
  height: 3000,
  format: "jpeg" as const,
  metadata: {},
};
let db: CaptureRecord[];
beforeEach(() => {
  vi.resetAllMocks();
  db = [];
  mocks.read.mockImplementation(async () => structuredClone(db));
  mocks.write.mockImplementation(async (records) => {
    db = structuredClone(records);
  });
  mocks.retain.mockImplementation(
    async (uri, id, role) => `file:///documents/${id}-${role}.jpg`,
  );
  mocks.save.mockResolvedValue("asset-1");
  mocks.release.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  mocks.render.mockResolvedValue({
    uri: "file:///tmp/edit.jpg",
    width: 4000,
    height: 3000,
  });
});
describe("durable capture flow", () => {
  it("retains 100 concurrent capture records without lost or duplicate index entries", async () => {
    const records = await Promise.all(
      Array.from({ length: 100 }, () => addCapture(photo, DEFAULTS)),
    );
    expect(await loadCaptures()).toHaveLength(100);
    expect(new Set(records.map((r) => r.id)).size).toBe(100);
    expect(
      records.every((r) => r.sourceUri.startsWith("file:///documents/")),
    ).toBe(true);
  });
  it("coalesces repeated save taps into one platform save", async () => {
    const record = await addCapture(photo, DEFAULTS);
    await Promise.all(Array.from({ length: 20 }, () => saveCapture(record)));
    await saveCapture(record);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(db[0]).toMatchObject({
      saved: true,
      savePending: false,
      assetId: "asset-1",
    });
  });
  it("preserves the original and allows retry after Photos permission denial", async () => {
    const record = await addCapture(photo, DEFAULTS);
    mocks.save.mockRejectedValueOnce(new Error("Permission denied"));
    await expect(saveCapture(record)).rejects.toThrow("Permission denied");
    expect(db[0]).toMatchObject({
      saved: false,
      savePending: false,
      sourceUri: record.sourceUri,
    });
    await saveCapture(record);
    expect(db[0].saved).toBe(true);
  });
  it("requires an explicit retry after interruption to avoid silently duplicating a save", async () => {
    const record = await addCapture(photo, DEFAULTS);
    await updateCapture(record.id, { savePending: true });
    await expect(saveCapture(record)).rejects.toThrow("interrupted");
    expect(mocks.save).not.toHaveBeenCalled();
    await saveCapture(record, true);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it("retains an uncertain save marker when the photo saves but the index write fails", async () => {
    const record = await addCapture(photo, DEFAULTS);
    mocks.save.mockImplementation(async () => {
      mocks.write.mockRejectedValueOnce(new Error("Disk full"));
      return "asset-1";
    });
    await expect(saveCapture(record)).rejects.toThrow("Disk full");
    expect(db[0].savePending).toBe(true);
    await expect(saveCapture(record)).rejects.toThrow("interrupted");
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it("edits from the original, never from a previously filtered export", async () => {
    const original = await addCapture(photo, DEFAULTS);
    const first = await restyleCapture(original, "noir", 100);
    await restyleCapture(first, "daylight", 50);
    expect(mocks.render.mock.calls.map((args) => args[0])).toEqual([
      original.sourceUri,
      original.sourceUri,
    ]);
    expect(db[0].sourceUri).toBe(original.sourceUri);
    expect(db[0].look).toBe("daylight");
  });
  it("never bakes a Look into RAW data", async () => {
    const record = await addCapture({ ...photo, format: "dng" }, DEFAULTS);
    await expect(restyleCapture(record, "noir", 100)).rejects.toThrow("RAW");
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("does not remove files if deleting the index entry fails", async () => {
    const record = await addCapture(photo, DEFAULTS);
    mocks.write.mockRejectedValueOnce(new Error("Disk full"));
    await expect(deleteCapture(record)).rejects.toThrow("Disk full");
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(await loadCaptures()).toHaveLength(1);
  });
});
