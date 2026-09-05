import { Directory, File, Paths } from "expo-file-system";
import { requireOptionalNativeModule } from "expo-modules-core";
const processor = requireOptionalNativeModule<{
  releaseTemporary?: (uri: string) => Promise<void>;
}>("IrisProcessing");
const root = new Directory(Paths.document, "iris-captures");
export async function retainFile(uri: string, id: string, role: string) {
  root.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(root, `${id}-${role}${extension}`);
  if (source.uri === destination.uri) return source.uri;
  try {
    await source.copy(destination);
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }
  return destination.uri;
}
export async function removeFile(uri: string) {
  if (!uri.startsWith(root.uri.replace(/\/$/, "") + "/")) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
export async function releaseTemporary(uri: string) {
  if (uri.startsWith(Paths.cache.uri.replace(/\/$/, "") + "/")) {
    const file = new File(uri);
    if (file.exists) file.delete();
  } else {
    // The native method only deletes regular files inside this app's tmp directory.
    await processor?.releaseTemporary?.(uri);
  }
}
