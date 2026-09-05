/** A stalled native capture must not leave the shutter permanently busy. */
export async function awaitCapture<T>(
  task: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void,
  onLateResult: (result: T) => Promise<void>,
): Promise<T> {
  let expired = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  void task
    .then((result) => {
      if (expired) return onLateResult(result);
    })
    .catch(() => undefined);
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          expired = true;
          onTimeout();
          reject(
            new Error(
              "Capture took too long. The camera has been restarted; please try again.",
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
