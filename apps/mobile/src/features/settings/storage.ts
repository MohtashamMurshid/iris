import AsyncStorage from "@react-native-async-storage/async-storage";
import { validatePreferences, type Preferences } from "../camera/model";
export async function loadPreferences() {
  const raw = await AsyncStorage.getItem("iris.preferences.v1");
  if (!raw) return validatePreferences(null);
  try {
    return validatePreferences(JSON.parse(raw));
  } catch {
    return validatePreferences(null);
  }
}
let pending = Promise.resolve();
export function savePreferences(value: Preferences) {
  const next = pending
    .catch(() => undefined)
    .then(() =>
      AsyncStorage.setItem("iris.preferences.v1", JSON.stringify(value)),
    );
  pending = next;
  return next;
}
