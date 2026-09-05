import { Asset, requestPermissionsAsync } from "expo-media-library";
import * as Sharing from "expo-sharing";
export async function saveToPhotos(uri: string) {
  const permission = await requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted)
    throw new Error(
      "Photos access is off. Enable it in Settings, then retry. Your original is safe in Iris.",
    );
  const asset = await Asset.create(uri);
  return asset.id;
}
export async function sharePhoto(uri: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(uri);
}
