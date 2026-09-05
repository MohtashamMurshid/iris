import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CaptureRecord } from "../camera/model";
const KEY = "iris.captures.v1";
export async function readRecords(): Promise<CaptureRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const records: unknown = JSON.parse(raw);
  if (!Array.isArray(records))
    throw new Error(
      "The photo index could not be read. Your photo files are still on this device.",
    );
  return records.filter(
    (r): r is CaptureRecord =>
      r &&
      typeof r.id === "string" &&
      typeof r.uri === "string" &&
      typeof r.sourceUri === "string",
  );
}
export async function writeRecords(records: CaptureRecord[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(records));
}
