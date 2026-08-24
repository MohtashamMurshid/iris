import { looks as lookCatalog } from '../../data/content';

export type Look = {
  name: string;
  image: string;
  swatch: string;
  saturation: string;
  contrast: string;
  sepia: string;
  grayscale: string;
  brightness: string;
  hue: string;
};

const swatches: Record<(typeof lookCatalog)[number]['id'], string> = {
  natural: '#7A9A6A',
  daylight: '#F2C14E',
  noir: '#D0D0D0',
  chrome: '#9FD2E0',
  faded: '#C9A090',
};

export const looks: readonly Look[] = lookCatalog.map((look) => ({
  name: look.name.toUpperCase(),
  image: look.image,
  swatch: swatches[look.id],
  saturation: '1',
  contrast: '1',
  sepia: '0',
  grayscale: '0',
  brightness: '1',
  hue: '0deg',
}));

export const buildLookFilter = (
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

export const applyLook = (
  viewfinder: HTMLElement,
  demo: HTMLElement,
  look: Look
) => {
  viewfinder.style.setProperty('--look-saturation', look.saturation);
  viewfinder.style.setProperty('--look-contrast', look.contrast);
  viewfinder.style.setProperty('--look-sepia', look.sepia);
  viewfinder.style.setProperty('--look-grayscale', look.grayscale);
  viewfinder.style.setProperty('--look-brightness', look.brightness);
  viewfinder.style.setProperty('--look-hue', look.hue);
  demo.style.setProperty('--look-swatch', look.swatch);
};
