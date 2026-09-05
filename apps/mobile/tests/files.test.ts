import { beforeEach, expect, it, vi } from "vitest";
import { retainFile, releaseTemporary } from "../src/features/library/files";
const mocks = vi.hoisted(() => ({
  copy: vi.fn(),
  remove: vi.fn(),
  release: vi.fn(),
}));
vi.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: () => ({ releaseTemporary: mocks.release }),
}));
vi.mock("expo-file-system", () => ({
  Paths: {
    document: { uri: "file:///app/Documents/" },
    cache: { uri: "file:///app/Library/Caches/" },
  },
  Directory: class {
    uri = "file:///app/Documents/iris-captures/";
    create() {}
  },
  File: class {
    extension = ".jpg";
    exists = true;
    uri: string;
    constructor(root: string | { uri: string }, name?: string) {
      this.uri = typeof root === "string" ? root : root.uri + (name ?? "");
    }
    copy = mocks.copy;
    delete = mocks.remove;
  },
}));
beforeEach(() => vi.resetAllMocks());
it("does not return a retained URI until the asynchronous file copy completes", async () => {
  let finish!: () => void;
  mocks.copy.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  let complete = false;
  const result = retainFile("file:///app/tmp/photo.jpg", "1", "original").then(
    (uri) => {
      complete = true;
      return uri;
    },
  );
  await Promise.resolve();
  expect(complete).toBe(false);
  finish();
  expect(await result).toBe(
    "file:///app/Documents/iris-captures/1-original.jpg",
  );
});
it("catches asynchronous copy failures and removes the partial destination", async () => {
  mocks.copy.mockRejectedValue(new Error("Disk full"));
  await expect(
    retainFile("file:///app/tmp/photo.jpg", "1", "original"),
  ).rejects.toThrow("Disk full");
  expect(mocks.remove).toHaveBeenCalledOnce();
});
it("cleans Expo cache directly and delegates Apple tmp files to the guarded native method", async () => {
  await releaseTemporary("file:///app/Library/Caches/thumb.jpg");
  expect(mocks.remove).toHaveBeenCalledOnce();
  await releaseTemporary("file:///app/tmp/photo.jpg");
  expect(mocks.release).toHaveBeenCalledWith("file:///app/tmp/photo.jpg");
  await releaseTemporary("file:///app/Library/Caches-other/photo.jpg");
  expect(mocks.remove).toHaveBeenCalledOnce();
});
