import { Directory, File, Paths } from "expo-file-system";
const root = new Directory(Paths.document, "iris-captures");
export async function retainFile(uri: string, id: string, role: string) {
  root.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(root, `${id}-${role}${extension}`);
  if (source.uri === destination.uri) return source.uri;
  try {
    source.copy(destination);
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
  if (!uri.startsWith(Paths.cache.uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
