import { readRecords, writeRecords } from "./database";
import { removeFile, retainFile, releaseTemporary } from "./files";
import { saveToPhotos, confirmsSave } from "./platform";
import { renderLook } from "../looks/render";
import type {
  CaptureRecord,
  CaptureResult,
  LookId,
  Preferences,
} from "../camera/model";
let queue = Promise.resolve();
function transaction<T>(work: () => Promise<T>): Promise<T> {
  const operation = queue.catch(() => undefined).then(work);
  queue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
export const loadCaptures = () => transaction(readRecords);
export const updateCapture = (id: string, values: Partial<CaptureRecord>) =>
  transaction(async () => {
    const records = await readRecords();
    const current = records.find((r) => r.id === id);
    if (!current) throw new Error("This photo is no longer in Iris.");
    const updated = { ...current, ...values, id: current.id };
    await writeRecords(records.map((r) => (r.id === id ? updated : r)));
    return updated;
  });
export const addCapture = (photo: CaptureResult, p: Preferences) =>
  transaction(async () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const sourceUri = await retainFile(photo.sourceUri, id, "original");
    let thumbnailUri = sourceUri;
    try {
      if (photo.thumbnailUri !== photo.sourceUri)
        thumbnailUri = await retainFile(photo.thumbnailUri, id, "thumbnail");
      const record: CaptureRecord = {
        ...photo,
        id,
        sourceUri,
        uri: sourceUri,
        thumbnailUri,
        createdAt: Date.now(),
        look: "none",
        intensity: 0,
        recipeVersion: 1,
        favorite: false,
        saved: false,
        requestedLook: p.look,
        requestedIntensity: p.intensity,
      };
      const records = await readRecords();
      await writeRecords([record, ...records]);
      await releaseTemporary(photo.sourceUri).catch(() => undefined);
      if (photo.thumbnailUri !== photo.sourceUri)
        await releaseTemporary(photo.thumbnailUri).catch(() => undefined);
      return record;
    } catch (error) {
      // Keep the incoming temporary file available for the recovery action.
      await removeFile(sourceUri).catch(() => undefined);
      if (thumbnailUri !== sourceUri)
        await removeFile(thumbnailUri).catch(() => undefined);
      throw error;
    }
  });
export async function restyleCapture(
  record: CaptureRecord,
  look: LookId,
  intensity: number,
) {
  if (record.deletionPending)
    throw new Error("Deletion is pending. Retry deleting this photograph.");
  if (record.format === "dng")
    throw new Error(
      "Iris keeps the original DNG without baking in a Look. Choose JPEG or HEIC to apply a Look.",
    );
  const result =
    look === "none" || intensity === 0
      ? { uri: record.sourceUri, width: record.width, height: record.height }
      : await renderLook(record.sourceUri, look, intensity, record.format);
  const uri =
    result.uri === record.sourceUri
      ? record.sourceUri
      : await retainFile(result.uri, record.id, `edit-${Date.now()}`);
  const updated = await updateCapture(record.id, {
    ...result,
    uri,
    thumbnailUri: uri,
    look,
    intensity,
    requestedLook: look,
    requestedIntensity: intensity,
    saved: false,
    savePending: false,
    assetId: undefined,
  });
  if (record.uri !== record.sourceUri && record.uri !== uri)
    await removeFile(record.uri).catch(() => undefined);
  if (result.uri !== record.sourceUri)
    await releaseTemporary(result.uri).catch(() => undefined);
  return updated;
}
const saving = new Map<string, Promise<CaptureRecord>>();
export function saveCapture(
  record: CaptureRecord,
  retryUncertain = false,
): Promise<CaptureRecord> {
  const existing = saving.get(record.id);
  if (existing) return existing;
  const work = (async () => {
    const current = (await loadCaptures()).find((r) => r.id === record.id);
    if (!current) throw new Error("This photo is no longer in Iris.");
    if (current.deletionPending)
      throw new Error("Deletion is pending. Retry deleting this photograph.");
    if (!confirmsSave) {
      await saveToPhotos(current.uri);
      return updateCapture(current.id, {
        saved: false,
        savePending: false,
        assetId: undefined,
      });
    }
    if (current.saved) return current;
    if (current.savePending && !retryUncertain)
      throw new Error(
        "A previous save was interrupted. Check Photos before retrying to avoid a duplicate.",
      );
    await updateCapture(record.id, { savePending: true });
    let assetId: string | undefined;
    try {
      assetId = await saveToPhotos(current.uri);
    } catch (error) {
      await updateCapture(record.id, { savePending: false });
      throw error;
    }
    return updateCapture(record.id, {
      saved: true,
      assetId,
      savePending: false,
    });
  })();
  saving.set(record.id, work);
  void work.finally(() => saving.delete(record.id)).catch(() => undefined);
  return work;
}
export const deleteCapture = (record: CaptureRecord) =>
  transaction(async () => {
    const records = await readRecords();
    const current = records.find((item) => item.id === record.id);
    if (!current) return;
    // Persist the intent first. Any partial cleanup remains visible and retryable.
    await writeRecords(
      records.map((item) =>
        item.id === current.id ? { ...item, deletionPending: true } : item,
      ),
    );
    try {
      for (const uri of new Set([
        current.sourceUri,
        current.uri,
        current.thumbnailUri,
      ]))
        await removeFile(uri);
      await writeRecords(records.filter((item) => item.id !== current.id));
    } catch {
      throw new Error(
        "Deletion could not finish. Some files may already be removed. Retry deleting this photograph to finish cleanup.",
      );
    }
  });
