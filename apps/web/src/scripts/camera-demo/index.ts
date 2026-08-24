import { renderCapture, canvasToBlob } from './capture';
import {
  formats,
  isoBrightness,
  isoSteps,
  lensScales,
  shutterBlur,
  shutterSteps,
} from './constants';
import { applyLook, buildLookFilter, looks } from './looks';
import { downloadBlob, readCssNumber, restartAnimation } from './utils';

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

  const currentLook = () => {
    const look = looks[lookIndex] ?? looks[0];
    if (!look) {
      throw new Error('No Iris Looks configured');
    }
    return look;
  };
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
      if (focusLabel) focusLabel.textContent = 'AF';
    }, 900);
  });

  const lookButton = demo.querySelector<HTMLButtonElement>('[data-look]');
  const lookLabel = lookButton?.querySelector<HTMLElement>('b span');
  const lookThumb = demo.querySelector<HTMLImageElement>('[data-look-thumb]');
  const floatingLook = document.querySelector<HTMLElement>('[data-floating-look]');
  lookButton?.addEventListener('click', () => {
    lookIndex = (lookIndex + 1) % looks.length;
    const look = looks[lookIndex];
    if (!look) return;
    applyLook(viewfinder, demo, look);
    if (cameraImage) cameraImage.src = look.image;
    if (lookThumb) lookThumb.src = look.image;
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
