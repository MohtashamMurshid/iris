export type Look = {
  name: string;
  swatch: string;
  saturation: string;
  contrast: string;
  sepia: string;
  grayscale: string;
  brightness: string;
  hue: string;
};

export const looks: readonly Look[] = [
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
