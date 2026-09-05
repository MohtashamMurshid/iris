import type { CaptureRecord } from "../camera/model";
const formats = ["jpeg", "heic", "dng"];
const looks = ["none", "natural", "daylight", "noir", "chrome", "faded"];
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const intensity = (value: unknown) =>
  finite(value) && value >= 0 && value <= 100;
const optionalBoolean = (value: unknown) =>
  value === undefined || typeof value === "boolean";
const text = (value: unknown) => typeof value === "string" && value.length > 0;
function record(value: unknown): value is CaptureRecord {
  if (!object(value)) return false;
  return (
    [value.id, value.uri, value.sourceUri, value.thumbnailUri].every(text) &&
    formats.includes(value.format as string) &&
    looks.includes(value.look as string) &&
    looks.includes(value.requestedLook as string) &&
    intensity(value.intensity) &&
    intensity(value.requestedIntensity) &&
    value.recipeVersion === 1 &&
    finite(value.createdAt) &&
    value.createdAt > 0 &&
    finite(value.width) &&
    Number.isInteger(value.width) &&
    value.width > 0 &&
    finite(value.height) &&
    Number.isInteger(value.height) &&
    value.height > 0 &&
    typeof value.favorite === "boolean" &&
    typeof value.saved === "boolean" &&
    optionalBoolean(value.savePending) &&
    optionalBoolean(value.deletionPending) &&
    (value.assetId === undefined || text(value.assetId)) &&
    object(value.metadata) &&
    Object.values(value.metadata).every(
      (v) => typeof v === "string" || finite(v),
    )
  );
}
/** Reject a damaged index without silently dropping photos or overwriting its stored value. */
export function decodeRecords(value: unknown): CaptureRecord[] {
  if (
    !Array.isArray(value) ||
    !value.every(record) ||
    new Set(value.map((item) => item.id)).size !== value.length
  )
    throw new Error(
      "The photo index could not be read. Your original photo data has not been changed. Retry opening storage.",
    );
  return value;
}
