// Browser captures are already encoded data URLs. IndexedDB owns their lifetime.
export async function retainFile(uri: string, _id: string, _role: string) {
  return uri;
}
export async function removeFile(_uri: string) {}
export async function releaseTemporary(_uri: string) {}
