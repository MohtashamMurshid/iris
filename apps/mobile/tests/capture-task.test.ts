import { afterEach, expect, it, vi } from "vitest";
import { awaitCapture } from "../src/features/camera/capture-task";
afterEach(() => vi.useRealTimers());
it("restarts a stalled capture and cleans up a late result without creating another record", async () => {
  vi.useFakeTimers();
  let complete!: (value: string) => void;
  const task = new Promise<string>((resolve) => {
    complete = resolve;
  });
  const restart = vi.fn(),
    cleanup = vi.fn().mockResolvedValue(undefined);
  const result = awaitCapture(task, 30000, restart, cleanup);
  const assertion = expect(result).rejects.toThrow("Capture took too long");
  await vi.advanceTimersByTimeAsync(30000);
  await assertion;
  expect(restart).toHaveBeenCalledTimes(1);
  complete("late-photo.jpg");
  await vi.advanceTimersByTimeAsync(1);
  expect(cleanup).toHaveBeenCalledWith("late-photo.jpg");
});
it("does not restart or delete a successfully captured photograph", async () => {
  vi.useFakeTimers();
  const restart = vi.fn(),
    cleanup = vi.fn();
  expect(
    await awaitCapture(Promise.resolve("photo.jpg"), 30000, restart, cleanup),
  ).toBe("photo.jpg");
  await vi.advanceTimersByTimeAsync(30001);
  expect(restart).not.toHaveBeenCalled();
  expect(cleanup).not.toHaveBeenCalled();
});
