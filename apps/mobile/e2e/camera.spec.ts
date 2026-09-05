import { expect, test, type Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start shooting", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeEnabled();
}
async function capture(page: Page, count = 1) {
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: `Open library, ${count} photos`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeEnabled();
}
async function openTool(page: Page, name: string) {
  const button = page.getByRole("button", { name: new RegExp(`^${name},`) });
  if (!(await button.isVisible()))
    await page
      .getByRole("button", { name: "More controls", exact: true })
      .click();
  await button.click();
}
async function done(page: Page) {
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

test("capture, favorite, restyle, download, reload, original export, and confirmed deletion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await capture(page);
  await page
    .getByRole("button", { name: "Review latest photo", exact: true })
    .click();
  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Favorited", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit Look", exact: true }).click();
  await page.getByRole("button", { name: "Noir", exact: true }).click();
  await page.getByRole("button", { name: "Apply Look", exact: true }).click();
  await expect(
    page.getByText("Look applied. Your original is retained.", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/iris-.*\.jpg/);
  await expect(
    page.getByRole("button", { name: "Download", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open library, 1 photos", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review latest photo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Favorited", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Info", exact: true }).click();
  await expect(page.getByText(/Look: noir, 100%/)).toBeVisible();
  const original = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Share original", exact: true })
    .click();
  await original;
  await done(page);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Keep photograph", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Back to camera", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete from Iris", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Open library, 0 photos", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("timer cancels without a capture, then completes exactly once", async ({
  page,
}) => {
  await start(page);
  await openTool(page, "TIMER");
  await page.getByRole("button", { name: "3 seconds", exact: true }).click();
  await done(page);
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cancel timer", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Cancel timer", exact: true }).click();
  await page.waitForTimeout(3300);
  await expect(
    page.getByRole("button", { name: "Open library, 0 photos", exact: true }),
  ).toBeVisible();
  await capture(page);
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole("button", { name: "Open library, 1 photos", exact: true }),
  ).toBeVisible();
});

test("supported tools work and preferences survive restart", async ({
  page,
}) => {
  await start(page);
  await openTool(page, "GRID");
  await page.getByRole("button", { name: "Golden ratio", exact: true }).click();
  await done(page);
  await openTool(page, "LOOK");
  await page.getByRole("button", { name: "Chrome", exact: true }).click();
  await done(page);
  await page.getByRole("button", { name: "Zoom 2 times", exact: true }).click();
  await openTool(page, "HIST.");
  await page.getByRole("button", { name: "Off", exact: true }).click();
  await done(page);
  await expect(
    page.getByLabel("Live luminance histogram", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "GRID, GOLDEN", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "LOOK, CHROME", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zoom 2 times", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Exposure mode", exact: true })
    .click();
  await page.getByRole("button", { name: "Manual", exact: true }).click();
  await expect(
    page.getByText("ISO is automatic on this camera.", { exact: true }),
  ).toBeVisible();
  await done(page);
  await capture(page);
});

test("a burst of shutter events creates only one photo while capture is busy", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Take photo", exact: true })
    .evaluate((element) => {
      for (let i = 0; i < 15; i++) (element as HTMLElement).click();
    });
  await expect(
    page.getByRole("button", { name: "Open library, 1 photos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeEnabled();
  await page.waitForTimeout(500);
  await expect(
    page.getByRole("button", { name: "Open library, 1 photos", exact: true }),
  ).toBeVisible();
});

test("small phone and landscape layouts keep the shutter and settings reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await start(page);
  await capture(page);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    const shutter = page.getByRole("button", {
      name: "Take photo",
      exact: true,
    });
    await expect(shutter).toBeVisible();
    const box = await shutter.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: "test-results/camera-desktop.png" });
});

test("camera failure exposes retry while the library remains available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException(
        "Camera is busy in another application.",
        "NotReadableError",
      );
    };
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Retry camera", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Open library, 0 photos", exact: true })
    .click();
  await expect(
    page.getByText(
      "Your photographs will appear here after your first capture.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("Noir export contains monochrome pixels and retains an unedited color original", async ({
  page,
}) => {
  await start(page);
  await openTool(page, "LOOK");
  await page.getByRole("button", { name: "Noir", exact: true }).click();
  await done(page);
  await capture(page);
  const colors = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("iris", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const records = await new Promise<{ uri: string; sourceUri: string }[]>(
      (resolve, reject) => {
        const r = db
          .transaction("library")
          .objectStore("library")
          .get("captures");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      },
    );
    const channels = async (uri: string) => {
      const img = new Image();
      img.src = uri;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0, 64, 64);
      const pixels = context.getImageData(0, 0, 64, 64).data;
      let maxDifference = 0;
      for (let i = 0; i < pixels.length; i += 4)
        maxDifference = Math.max(
          maxDifference,
          Math.abs(pixels[i] - pixels[i + 1]),
          Math.abs(pixels[i + 1] - pixels[i + 2]),
        );
      return maxDifference;
    };
    return {
      edited: await channels(records[0].uri),
      original: await channels(records[0].sourceUri),
      distinctFiles: records[0].uri !== records[0].sourceUri,
    };
  });
  expect(colors.edited).toBeLessThanOrEqual(3);
  expect(colors.original).toBeGreaterThan(20);
  expect(colors.distinctFiles).toBe(true);
});

test("100 browser captures leave 100 distinct recoverable records", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.addInitScript(() => {
    const getMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = (options) =>
      getMedia({
        ...options,
        video: {
          ...(typeof options?.video === "object" ? options.video : {}),
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
  });
  await start(page);
  await openTool(page, "LOOK");
  await page.getByRole("button", { name: "None", exact: true }).click();
  await done(page);
  for (let count = 1; count <= 100; count++) await capture(page, count);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open library, 100 photos", exact: true }),
  ).toBeVisible();
  const index = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("iris", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const records = await new Promise<
      { id: string; sourceUri: string; width: number; height: number }[]
    >((resolve, reject) => {
      const r = db
        .transaction("library")
        .objectStore("library")
        .get("captures");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return {
      unique: new Set(records.map((r) => r.id)).size,
      recoverable: records.every(
        (r) =>
          r.sourceUri.startsWith("data:image/jpeg") &&
          r.width > 0 &&
          r.height > 0,
      ),
    };
  });
  expect(index).toEqual({ unique: 100, recoverable: true });
});

test("storage failure keeps the captured original available for retry", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    let failed = false;
    IDBObjectStore.prototype.put = function (...args) {
      if (!failed) {
        failed = true;
        throw new DOMException("Storage is full.", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry keeping photo", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Share captured original", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry keeping photo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Open library, 1 photos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to camera", exact: true }),
  ).toBeVisible();
});

test("new camera chrome persists aspect framing and exposes the real library", async ({
  page,
}) => {
  await start(page);
  await expect(page.getByTestId("camera-chrome")).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "MANUAL", exact: true }),
  ).toHaveCount(0);
  await page.getByTestId("aspect-button").click();
  await expect(
    page.getByText(
      "Preview framing only. Iris retains the full captured image.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "1:1 Square", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Aspect ratio 1:1", exact: true }),
  ).toBeVisible();
  await capture(page);
  await page.goto("/lab");
  await expect(
    page.getByText("Your photographs", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Your photographs will appear here after your first capture.",
      { exact: true },
    ),
  ).toHaveCount(0);
});

test("blocked downloads remain retryable", async ({ page }) => {
  await start(page);
  await capture(page);
  await page
    .getByRole("button", { name: "Review latest photo", exact: true })
    .click();
  await page.evaluate(() => {
    HTMLAnchorElement.prototype.click = () => {};
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole("button", { name: "Download", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Download", exact: true }),
    ).toBeEnabled();
  }
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toHaveCount(0);
});

test("invalid stored capture data opens recovery without overwriting the index", async ({
  page,
}) => {
  await start(page);
  await capture(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("iris", 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("library", "readwrite");
      const store = tx.objectStore("library");
      const request = store.get("captures");
      request.onsuccess = () => {
        const records = request.result;
        delete records[0].format;
        store.put(records, "captures");
      };
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(
    page.getByText(/The photo index could not be read/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry storage", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toHaveCount(0);
});
