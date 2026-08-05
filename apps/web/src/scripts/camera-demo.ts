const lensScales: Record<string, string> = {
  '24': '1',
  '28': '1.04',
  '35': '1.08',
  '50': '1.28',
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
const formats = ['HEIC', 'RAW + HEIC', 'RAW'] as const;

const looks = [
  {
    name: 'NATURAL',
    swatch: '#8e8d88',
    saturation: '.88',
    contrast: '1.04',
    sepia: '0',
    grayscale: '0',
  },
  {
    name: 'DAYLIGHT',
    swatch: '#d29d67',
    saturation: '1.08',
    contrast: '1.08',
    sepia: '.12',
    grayscale: '0',
  },
  {
    name: 'NOIR',
    swatch: '#3b3b3d',
    saturation: '0',
    contrast: '1.28',
    sepia: '0',
    grayscale: '1',
  },
] as const;

const restartAnimation = (element: HTMLElement, className: string) => {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
};

export const initCameraDemo = () => {
  const demo = document.querySelector<HTMLElement>('[data-camera-demo]');
  if (!demo) return;

  const viewfinder = demo.querySelector<HTMLElement>('[data-viewfinder]');
  const reticle = demo.querySelector<HTMLElement>('.focus-reticle');
  const announcer = demo.querySelector<HTMLElement>('[data-camera-announcer]');
  const frameCount = demo.querySelector<HTMLElement>('.frame-count strong');
  if (!viewfinder || !reticle) return;

  const announce = (message: string) => {
    if (announcer) announcer.textContent = message;
  };

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
      viewfinder.style.setProperty('--lens-scale', lensScales[lens] ?? lensScales['35']);
      focusAt(50, 43);
      announce(`${lens} millimeter lens selected`);
    });
  });

  const isoButton = demo.querySelector<HTMLButtonElement>('[data-iso]');
  let isoIndex = 0;
  isoButton?.addEventListener('click', () => {
    isoIndex = (isoIndex + 1) % isoSteps.length;
    const iso = isoSteps[isoIndex];
    isoButton.textContent = `ISO ${iso}`;
    viewfinder.style.setProperty('--iso-brightness', isoBrightness[iso]);
    viewfinder.style.setProperty('--iso-grain', String(isoIndex / 10));
    announce(`ISO ${iso}`);
  });

  const shutterButton = demo.querySelector<HTMLButtonElement>('[data-shutter-speed]');
  let shutterIndex = 0;
  shutterButton?.addEventListener('click', () => {
    shutterIndex = (shutterIndex + 1) % shutterSteps.length;
    const speed = shutterSteps[shutterIndex];
    shutterButton.textContent = speed;
    announce(`Shutter speed ${speed}`);
  });

  const formatButton = demo.querySelector<HTMLButtonElement>('[data-format]');
  const formatLabel = formatButton?.querySelector('strong');
  const floatingFormat = document.querySelector<HTMLElement>('[data-floating-format]');
  let formatIndex = 0;
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
  let flashEnabled = false;
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
  let gridEnabled = true;
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
  let lookIndex = 0;
  lookButton?.addEventListener('click', () => {
    lookIndex = (lookIndex + 1) % looks.length;
    const look = looks[lookIndex];
    viewfinder.style.setProperty('--look-saturation', look.saturation);
    viewfinder.style.setProperty('--look-contrast', look.contrast);
    viewfinder.style.setProperty('--look-sepia', look.sepia);
    viewfinder.style.setProperty('--look-grayscale', look.grayscale);
    demo.style.setProperty('--look-swatch', look.swatch);
    if (lookLabel) lookLabel.textContent = look.name;
    if (floatingLook) floatingLook.textContent = look.name;
    announce(`${look.name.toLowerCase()} Iris Look selected`);
  });

  const captureButton = demo.querySelector<HTMLButtonElement>('[data-capture]');
  let frames = Number(frameCount?.textContent ?? 36);
  captureButton?.addEventListener('click', () => {
    restartAnimation(viewfinder, 'is-capturing');
    frames = frames > 1 ? frames - 1 : 36;
    if (frameCount) {
      frameCount.textContent = String(frames);
      restartAnimation(frameCount, 'is-updating');
    }
    window.setTimeout(() => viewfinder.classList.remove('is-capturing'), 440);
    announce(`Photo captured. ${frames} frames remaining`);
  });

  const flipButton = demo.querySelector<HTMLButtonElement>('[data-camera-flip]');
  const cameraLabel = demo.querySelector<HTMLElement>('[data-camera-label]');
  let frontFacing = false;
  flipButton?.addEventListener('click', () => {
    frontFacing = !frontFacing;
    viewfinder.style.setProperty('--camera-direction', frontFacing ? '-1' : '1');
    if (cameraLabel) cameraLabel.textContent = frontFacing ? 'FRONT' : 'BACK';
    announce(`${frontFacing ? 'Front' : 'Back'} camera selected`);
  });
};
