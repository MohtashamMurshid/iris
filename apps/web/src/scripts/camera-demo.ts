/** Approximate full-frame equivalents relative to a 24mm wide base. */
const lensScales: Record<string, string> = {
  '24': '1',
  '28': '1.17',
  '35': '1.46',
  '50': '2.1',
};

const isoSteps = [64, 100, 200, 400, 800] as const;
const isoBrightness: Record<(typeof isoSteps)[number], string> = {
  64: '1',
  100: '1.035',
  200: '1.075',
  400: '1.13',
  800: '1.2',
};

const shutterSteps = ['1/125', '1/250', '1/500', '1/60'] as const;
const shutterBlur: Record<(typeof shutterSteps)[number], string> = {
  '1/500': '0px',
  '1/250': '0px',
  '1/125': '0.35px',
  '1/60': '1.1px',
};

const formats = ['HEIC', 'RAW + HEIC', 'RAW'] as const;

type Look = {
  name: string;
  swatch: string;
  saturation: string;
  contrast: string;
  sepia: string;
  grayscale: string;
  brightness: string;
  hue: string;
};

const looks: readonly Look[] = [
  {
    name: 'NATURAL',
    swatch: '#8e8d88',
    saturation: '.88',
    contrast: '1.04',
    sepia: '0',
    grayscale: '0',
    brightness: '1',
    hue: '0deg',
  },
  {
    name: 'DAYLIGHT',
    swatch: '#d29d67',
    saturation: '1.08',
    contrast: '1.08',
    sepia: '.12',
    grayscale: '0',
    brightness: '1.04',
    hue: '0deg',
  },
  {
    name: 'VIVID',
    swatch: '#e85d4c',
    saturation: '1.38',
    contrast: '1.2',
    sepia: '0',
    grayscale: '0',
    brightness: '1.05',
    hue: '0deg',
  },
  {
    name: 'GOLD',
    swatch: '#c9a45c',
    saturation: '1.06',
    contrast: '1.12',
    sepia: '.38',
    grayscale: '0',
    brightness: '1.06',
    hue: '-10deg',
  },
  {
    name: 'FADE',
    swatch: '#b8b0a4',
    saturation: '.52',
    contrast: '.86',
    sepia: '.1',
    grayscale: '0',
    brightness: '1.14',
    hue: '0deg',
  },
  {
    name: 'CINEMA',
    swatch: '#4a6b6e',
    saturation: '.9',
    contrast: '1.24',
    sepia: '.2',
    grayscale: '0',
    brightness: '.96',
    hue: '-14deg',
  },
  {
    name: 'SILVER',
    swatch: '#9a9a9c',
    saturation: '0',
    contrast: '1.1',
    sepia: '0',
    grayscale: '1',
    brightness: '1.06',
    hue: '0deg',
  },
  {
    name: 'NOIR',
    swatch: '#3b3b3d',
    saturation: '0',
    contrast: '1.32',
    sepia: '0',
    grayscale: '1',
    brightness: '.92',
    hue: '0deg',
  },
];

const OBJECT_POSITION_X = 0.5;
const OBJECT_POSITION_Y = 0.61;
const CAPTURE_WIDTH = 1080;
const CAPTURE_HEIGHT = 1620;

const restartAnimation = (element: HTMLElement, className: string) => {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
};

const readCssNumber = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildLookFilter = (
  look: Look,
  iso: string,
  extraBlur = '0px'
) =>
  [
    `brightness(${iso})`,
    `brightness(${look.brightness})`,
    `saturate(${look.saturation})`,
    `contrast(${look.contrast})`,
    `sepia(${look.sepia})`,
    `grayscale(${look.grayscale})`,
    `hue-rotate(${look.hue})`,
    `blur(${extraBlur})`,
  ].join(' ');

const applyLook = (viewfinder: HTMLElement, demo: HTMLElement, look: Look) => {
  viewfinder.style.setProperty('--look-saturation', look.saturation);
  viewfinder.style.setProperty('--look-contrast', look.contrast);
  viewfinder.style.setProperty('--look-sepia', look.sepia);
  viewfinder.style.setProperty('--look-grayscale', look.grayscale);
  viewfinder.style.setProperty('--look-brightness', look.brightness);
  viewfinder.style.setProperty('--look-hue', look.hue);
  demo.style.setProperty('--look-swatch', look.swatch);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
};

const renderCapture = (
  image: HTMLImageElement,
  options: {
    lensScale: number;
    focusX: number;
    focusY: number;
    mirror: boolean;
    filter: string;
  }
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

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });

export const initCameraDemo = () => {
  const demo = document.querySelector<HTMLElement>('[data-camera-demo]');
  if (!demo) return;

  const viewfinder = demo.querySelector<HTMLElement>('[data-viewfinder]');
  const reticle = demo.querySelector<HTMLElement>('.focus-reticle');
  const announcer = demo.querySelector<HTMLElement>('[data-camera-announcer]');
  const frameCount = demo.querySelector<HTMLElement>('.frame-count strong');
  const cameraImage = demo.querySelector<HTMLImageElement>('[data-camera-image]');
  const lastShotButton = demo.querySelector<HTMLButtonElement>('[data-last-shot]');
  const lastShotImage = lastShotButton?.querySelector('img');
  if (!viewfinder || !reticle) return;

  let lookIndex = 0;
  let isoIndex = 0;
  let shutterIndex = 0;
  let formatIndex = 0;
  let flashEnabled = false;
  let gridEnabled = true;
  let frontFacing = false;
  let frames = Number(frameCount?.textContent ?? 36);
  let capturing = false;
  let lastShotUrl: string | null = null;
  let lastShotBlob: Blob | null = null;
  let lastShotName = 'iris-photo.jpg';

  const announce = (message: string) => {
    if (announcer) announcer.textContent = message;
  };

  const currentLook = () => looks[lookIndex];
  const currentIso = () => isoBrightness[isoSteps[isoIndex]];
  const currentShutter = () => shutterSteps[shutterIndex];

  const focusAt = (x: number, y: number) => {
    const safeX = Math.max(10, Math.min(90, x));
    const safeY = Math.max(14, Math.min(84, y));
    reticle.style.left = `${safeX}%`;
    reticle.style.top = `${safeY}%`;
    viewfinder.style.setProperty('--focus-x', `${safeX}%`);
    viewfinder.style.setProperty('--focus-y', `${safeY}%`);
    restartAnimation(reticle, 'is-focusing');
    window.setTimeout(() => reticle.classList.remove('is-focusing'), 560);
  };

  const readFocus = () => {
    const styles = getComputedStyle(viewfinder);
    return {
      x: readCssNumber(styles.getPropertyValue('--focus-x'), 50) / 100,
      y: readCssNumber(styles.getPropertyValue('--focus-y'), 50) / 100,
    };
  };

  const readLensScale = () => {
    const styles = getComputedStyle(viewfinder);
    return readCssNumber(styles.getPropertyValue('--lens-scale'), 1.46);
  };

  const setLastShot = (blob: Blob, filename: string) => {
    if (lastShotUrl) URL.revokeObjectURL(lastShotUrl);
    lastShotBlob = blob;
    lastShotUrl = URL.createObjectURL(blob);
    lastShotName = filename;
    if (lastShotImage) lastShotImage.src = lastShotUrl;
    lastShotButton?.classList.add('has-photo');
    lastShotButton?.removeAttribute('hidden');
  };

  const capturePhoto = async () => {
    if (!cameraImage?.complete || !cameraImage.naturalWidth) return null;

    const focus = readFocus();
    const format = formats[formatIndex];
    const mimeType = format === 'RAW' ? 'image/png' : 'image/jpeg';
    const extension = format === 'RAW' ? 'png' : 'jpg';
    const filename = `iris-${currentLook().name.toLowerCase()}-${Date.now()}.${extension}`;
    const canvas = renderCapture(cameraImage, {
      lensScale: readLensScale(),
      focusX: focus.x,
      focusY: focus.y,
      mirror: frontFacing,
      filter: buildLookFilter(currentLook(), currentIso()),
    });
    if (!canvas) return null;

    const blob = await canvasToBlob(
      canvas,
      mimeType,
      mimeType === 'image/jpeg' ? 0.92 : undefined
    );
    if (!blob) return null;

    setLastShot(blob, filename);
    downloadBlob(blob, filename);
    return filename;
  };

  viewfinder.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    const bounds = viewfinder.getBoundingClientRect();
    focusAt(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100
    );
    announce('Focus point moved');
  });

  demo.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode ?? 'photo';
      demo.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((option) => {
        const active = option === button;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      viewfinder.classList.toggle('manual-mode', mode === 'manual');
      announce(`${mode} mode selected`);
    });
  });

  demo.querySelectorAll<HTMLButtonElement>('[data-lens]').forEach((button) => {
    button.addEventListener('click', () => {
      const lens = button.dataset.lens ?? '35';
      demo.querySelectorAll<HTMLButtonElement>('[data-lens]').forEach((option) => {
        const active = option === button;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      restartAnimation(viewfinder, 'is-zooming');
      viewfinder.style.setProperty('--lens-scale', lensScales[lens] ?? lensScales['35']);
      focusAt(50, 43);
      window.setTimeout(() => viewfinder.classList.remove('is-zooming'), 520);
      announce(`${lens} millimeter lens selected`);
    });
  });

  const isoButton = demo.querySelector<HTMLButtonElement>('[data-iso]');
  isoButton?.addEventListener('click', () => {
    isoIndex = (isoIndex + 1) % isoSteps.length;
    const iso = isoSteps[isoIndex];
    isoButton.textContent = `ISO ${iso}`;
    viewfinder.style.setProperty('--iso-brightness', isoBrightness[iso]);
    viewfinder.style.setProperty('--iso-grain', String(isoIndex / 10));
    announce(`ISO ${iso}`);
  });

  const shutterButton = demo.querySelector<HTMLButtonElement>('[data-shutter-speed]');
  shutterButton?.addEventListener('click', () => {
    shutterIndex = (shutterIndex + 1) % shutterSteps.length;
    const speed = shutterSteps[shutterIndex];
    shutterButton.textContent = speed;
    announce(`Shutter speed ${speed}`);
  });

  const formatButton = demo.querySelector<HTMLButtonElement>('[data-format]');
  const formatLabel = formatButton?.querySelector('strong');
  const floatingFormat = document.querySelector<HTMLElement>('[data-floating-format]');
  formatButton?.addEventListener('click', () => {
    formatIndex = (formatIndex + 1) % formats.length;
    const format = formats[formatIndex];
    if (formatLabel) formatLabel.textContent = format;
    if (floatingFormat) floatingFormat.textContent = format;
    formatButton.classList.toggle('active', formatIndex !== 0);
    announce(`${format} format selected`);
  });

  const flashButton = demo.querySelector<HTMLButtonElement>('[data-flash]');
  const flashLabel = flashButton?.querySelector('strong');
  flashButton?.addEventListener('click', () => {
    flashEnabled = !flashEnabled;
    flashButton.classList.toggle('active', flashEnabled);
    flashButton.setAttribute('aria-pressed', String(flashEnabled));
    viewfinder.classList.toggle('flash-on', flashEnabled);
    if (flashLabel) flashLabel.textContent = flashEnabled ? 'ON' : 'OFF';
    announce(`Flash ${flashEnabled ? 'on' : 'off'}`);
  });

  const gridButton = demo.querySelector<HTMLButtonElement>('[data-grid]');
  const gridLabel = gridButton?.querySelector('strong');
  gridButton?.addEventListener('click', () => {
    gridEnabled = !gridEnabled;
    gridButton.classList.toggle('active', gridEnabled);
    gridButton.setAttribute('aria-pressed', String(gridEnabled));
    viewfinder.classList.toggle('grid-off', !gridEnabled);
    if (gridLabel) gridLabel.textContent = gridEnabled ? '3 × 3' : 'OFF';
    announce(`Grid ${gridEnabled ? 'on' : 'off'}`);
  });

  const focusButton = demo.querySelector<HTMLButtonElement>('[data-focus]');
  const focusLabel = focusButton?.querySelector('strong');
  focusButton?.addEventListener('click', () => {
    focusAt(50, 43);
    focusButton.classList.add('active');
    if (focusLabel) focusLabel.textContent = 'LOCK';
    announce('Focus locked');
    window.setTimeout(() => {
      focusButton.classList.remove('active');
      if (focusLabel) focusLabel.textContent = 'AUTO';
    }, 900);
  });

  const lookButton = demo.querySelector<HTMLButtonElement>('[data-look]');
  const lookLabel = lookButton?.querySelector<HTMLElement>('b span');
  const floatingLook = document.querySelector<HTMLElement>('[data-floating-look]');
  lookButton?.addEventListener('click', () => {
    lookIndex = (lookIndex + 1) % looks.length;
    const look = looks[lookIndex];
    applyLook(viewfinder, demo, look);
    if (lookLabel) lookLabel.textContent = look.name;
    if (floatingLook) floatingLook.textContent = look.name;
    announce(`${look.name.toLowerCase()} Iris Look selected`);
  });

  const captureButton = demo.querySelector<HTMLButtonElement>('[data-capture]');
  captureButton?.addEventListener('click', () => {
    if (capturing) return;
    capturing = true;

    const blur = shutterBlur[currentShutter()];
    viewfinder.style.setProperty('--capture-blur', blur);
    restartAnimation(viewfinder, 'is-capturing');
    frames = frames > 1 ? frames - 1 : 36;
    if (frameCount) {
      frameCount.textContent = String(frames);
      restartAnimation(frameCount, 'is-updating');
    }

    void capturePhoto()
      .then((filename) => {
        announce(
          filename
            ? `Photo saved as ${filename}. ${frames} frames remaining`
            : `Photo captured. ${frames} frames remaining`
        );
      })
      .finally(() => {
        window.setTimeout(() => {
          viewfinder.classList.remove('is-capturing');
          viewfinder.style.setProperty('--capture-blur', '0px');
          capturing = false;
        }, 440);
      });
  });

  lastShotButton?.addEventListener('click', () => {
    if (!lastShotBlob) return;
    downloadBlob(lastShotBlob, lastShotName);
    announce('Photo downloaded again');
  });

  const flipButton = demo.querySelector<HTMLButtonElement>('[data-camera-flip]');
  const cameraLabel = demo.querySelector<HTMLElement>('[data-camera-label]');
  flipButton?.addEventListener('click', () => {
    frontFacing = !frontFacing;
    viewfinder.style.setProperty('--camera-direction', frontFacing ? '-1' : '1');
    if (cameraLabel) cameraLabel.textContent = frontFacing ? 'FRONT' : 'BACK';
    announce(`${frontFacing ? 'Front' : 'Back'} camera selected`);
  });
};
