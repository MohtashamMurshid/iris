import { beforeEach, expect, it, vi } from "vitest";
import { loadPreferences } from "../src/features/settings/storage";
import { DEFAULTS } from "../src/features/camera/model";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: mocks.get },
}));
beforeEach(() => vi.resetAllMocks());
it("recovers malformed preferences to validated defaults", async () => {
  mocks.get.mockResolvedValue("{broken");
  expect(await loadPreferences()).toEqual(DEFAULTS);
});
it("propagates a storage read failure instead of overwriting saved preferences", async () => {
  mocks.get.mockRejectedValue(new Error("Storage unavailable"));
  await expect(loadPreferences()).rejects.toThrow("Storage unavailable");
});
