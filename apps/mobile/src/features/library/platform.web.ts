export async function saveToPhotos(uri: string) {
  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.download = `iris-${Date.now()}.jpg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return "download";
}
export async function sharePhoto(uri: string) {
  const blob = await (await fetch(uri)).blob();
  const file = new File([blob], "iris.jpg", { type: blob.type });
  if (navigator.canShare?.({ files: [file] }))
    await navigator.share({ files: [file] });
  else await saveToPhotos(uri);
}
