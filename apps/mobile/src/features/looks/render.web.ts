import { applyMatrix, lookMatrix } from "./recipes";
import type { LookId } from "../camera/model";
export async function renderLook(
  source: string,
  look: LookId,
  intensity: number,
) {
  const image = new window.Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Image processing is unavailable in this browser.");
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  applyMatrix(data.data, lookMatrix(look, intensity));
  context.putImageData(data, 0, 0);
  return {
    uri: canvas.toDataURL("image/jpeg", 0.95),
    width: canvas.width,
    height: canvas.height,
  };
}
