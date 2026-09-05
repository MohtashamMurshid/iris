import { decodeRecords } from "./decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CaptureRecord } from "../camera/model";
const KEY = "iris.captures.v1";
export async function readRecords(): Promise<CaptureRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return decodeRecords(JSON.parse(raw));
  } catch {
    throw new Error(
      "The photo index could not be read. Your original photo data has not been changed. Retry opening storage.",
    );
  }
}
export async function writeRecords(records: CaptureRecord[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(records));
}
