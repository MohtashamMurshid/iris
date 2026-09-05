import type { CaptureRecord } from "../camera/model";
let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("iris", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("library");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = undefined;
      reject(
        new Error(
          "Photo storage is unavailable. Allow this site to store data and try again.",
        ),
      );
    };
  });
  return dbPromise;
}
export async function readRecords(): Promise<CaptureRecord[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("library")
      .objectStore("library")
      .get("captures");
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}
export async function writeRecords(records: CaptureRecord[]) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("library", "readwrite");
    transaction.objectStore("library").put(records, "captures");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new Error(
          "Photo storage is full or unavailable. Export photos before freeing space.",
        ),
      );
    transaction.onabort = () =>
      reject(new Error("The photo could not be stored. Try again."));
  });
}
