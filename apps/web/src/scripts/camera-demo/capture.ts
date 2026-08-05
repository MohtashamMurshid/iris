import {
  CAPTURE_HEIGHT,
  CAPTURE_WIDTH,
  OBJECT_POSITION_X,
  OBJECT_POSITION_Y,
} from './constants';

type CaptureOptions = {
  lensScale: number;
  focusX: number;
  focusY: number;
  mirror: boolean;
  filter: string;
};

export const renderCapture = (
  image: HTMLImageElement,
  options: CaptureOptions
) => {
  const canvas = document.createElement('canvas');
  canvas.width = CAPTURE_WIDTH;
  canvas.height = CAPTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const { naturalWidth: imageWidth, naturalHeight: imageHeight } = image;
  if (!imageWidth || !imageHeight) return null;

  const viewAspect = CAPTURE_WIDTH / CAPTURE_HEIGHT;
  const imageAspect = imageWidth / imageHeight;

  let sourceWidth: number;
  let sourceHeight: number;
  let sourceX: number;
  let sourceY: number;

  if (imageAspect > viewAspect) {
    sourceHeight = imageHeight;
    sourceWidth = imageHeight * viewAspect;
    sourceX = (imageWidth - sourceWidth) * OBJECT_POSITION_X;
    sourceY = 0;
  } else {
    sourceWidth = imageWidth;
    sourceHeight = imageWidth / viewAspect;
    sourceX = 0;
    sourceY = (imageHeight - sourceHeight) * OBJECT_POSITION_Y;
  }

  const cropWidth = sourceWidth / options.lensScale;
  const cropHeight = sourceHeight / options.lensScale;
  const cropX = Math.max(
    0,
    Math.min(
      imageWidth - cropWidth,
      sourceX + options.focusX * sourceWidth - options.focusX * cropWidth
    )
  );
  const cropY = Math.max(
    0,
    Math.min(
      imageHeight - cropHeight,
      sourceY + options.focusY * sourceHeight - options.focusY * cropHeight
    )
  );

  context.filter = options.filter;
  if (options.mirror) {
    context.translate(CAPTURE_WIDTH, 0);
    context.scale(-1, 1);
  }
  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT
  );

  return canvas;
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
