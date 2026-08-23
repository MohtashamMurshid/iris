import { Fonts, IrisColors } from '@/constants/theme';

export const CameraChrome = {
  amber: '#F5C400',
  meterRed: '#FF3B30',
  ink: IrisColors.opticalBlack,
  glassFill: 'rgba(12, 12, 14, 0.78)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  white: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.62)',
  shutter: '#F4F4F6',
  shutterWell: 'rgba(244, 244, 246, 0.28)',
  dim: 'rgba(0, 0, 0, 0.42)',
  radiusButton: 22,
  radiusPill: 28,
  radiusSheet: 44,
  radiusViewfinder: 36,
} as const;

export const ChromeFonts = {
  sans: Fonts.sans,
  mono: Fonts.mono,
} as const;

export type ExposureMode = 'auto' | 'manual' | 'shutter' | 'iso';
export type AspectId = '3-2' | '1-1' | '65-24' | 'ig';
export type OverlayId = 'thirds' | 'grid' | 'golden' | 'rabatment' | 'off';
export type ZoomStop = '1' | '2' | '4' | '8';
export type LookId = 'natural' | 'daylight' | 'noir' | 'chrome' | 'faded';

export const EXPOSURE_MODES: {
  id: ExposureMode;
  label: string;
}[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'manual', label: 'Manual' },
  { id: 'shutter', label: 'Shutter Priority' },
  { id: 'iso', label: 'ISO Priority' },
];

export const ASPECTS: {
  id: AspectId;
  label: string;
  caption: string;
  widthOverHeight: number;
}[] = [
  { id: '3-2', label: '3:2', caption: '35mm', widthOverHeight: 2 / 3 },
  { id: '1-1', label: '1:1', caption: 'Square', widthOverHeight: 1 },
  { id: '65-24', label: '65:24', caption: 'Pano', widthOverHeight: 65 / 24 },
  { id: 'ig', label: 'IG', caption: '4:5', widthOverHeight: 4 / 5 },
];

export const OVERLAYS: { id: OverlayId; label: string }[] = [
  { id: 'thirds', label: 'Thirds' },
  { id: 'grid', label: 'Grid' },
  { id: 'golden', label: 'Golden' },
  { id: 'rabatment', label: 'Rabatment' },
  { id: 'off', label: 'Off' },
];

export const ZOOM_STOPS: ZoomStop[] = ['1', '2', '4', '8'];

export type LookSwatch = {
  id: LookId;
  name: string;
  description: string;
  bands: [string, string, string];
  accent: string;
};

export const LOOKS: LookSwatch[] = [
  {
    id: 'natural',
    name: 'Natural',
    description: 'Neutral color, gentle contrast, everyday light.',
    bands: ['#2F4A38', '#C4A574', '#F3E6C8'],
    accent: '#7A9A6A',
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'Open shadows, clean whites, sunlit color.',
    bands: ['#2E6BB2', '#F2C14E', '#F7F1DE'],
    accent: '#F2C14E',
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Deep blacks, silver midtones, no color.',
    bands: ['#0C0C0C', '#6E6E6E', '#E8E8E8'],
    accent: '#D0D0D0',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'Cool highlights, tight contrast, metallic edges.',
    bands: ['#1C3A48', '#8AA4B0', '#E4EEF2'],
    accent: '#9FD2E0',
  },
  {
    id: 'faded',
    name: 'Faded',
    description: 'Soft contrast, lifted blacks, quiet color.',
    bands: ['#8A6A62', '#D8C4B0', '#EFE6D8'],
    accent: '#C9A090',
  },
];

export type ScenePalette = {
  sky: string;
  glow: string;
  ground: string;
  path: string;
  gate: string;
  gateFar: string;
  veil: string;
};

export const SCENE_BY_LOOK: Record<LookId, ScenePalette> = {
  natural: {
    sky: '#C45A28',
    glow: '#E39A48',
    ground: '#2A1C14',
    path: '#3C2A1C',
    gate: '#B42318',
    gateFar: '#8A1C14',
    veil: 'transparent',
  },
  daylight: {
    sky: '#5C8FD4',
    glow: '#F0C45A',
    ground: '#5A4630',
    path: '#7A6244',
    gate: '#D43A22',
    gateFar: '#B8321C',
    veil: 'rgba(255, 236, 180, 0.08)',
  },
  noir: {
    sky: '#2A2A2A',
    glow: '#6A6A6A',
    ground: '#101010',
    path: '#1A1A1A',
    gate: '#141414',
    gateFar: '#0C0C0C',
    veil: 'rgba(0, 0, 0, 0.18)',
  },
  chrome: {
    sky: '#3E5A66',
    glow: '#8AA8B4',
    ground: '#141C20',
    path: '#1C262C',
    gate: '#2A3C44',
    gateFar: '#1C2A30',
    veil: 'rgba(140, 200, 220, 0.10)',
  },
  faded: {
    sky: '#C4A090',
    glow: '#E4C8B0',
    ground: '#6A5A50',
    path: '#8A7668',
    gate: '#A87868',
    gateFar: '#8A6054',
    veil: 'rgba(255, 248, 236, 0.16)',
  },
};

export function lookById(id: LookId): LookSwatch {
  const match = LOOKS.find((look) => look.id === id);
  if (!match) {
    throw new Error(`Unknown look: ${id}`);
  }
  return match;
}

export function aspectById(id: AspectId) {
  const match = ASPECTS.find((aspect) => aspect.id === id);
  if (!match) {
    throw new Error(`Unknown aspect: ${id}`);
  }
  return match;
}

export function exposureLabel(mode: ExposureMode): string {
  switch (mode) {
    case 'auto':
      return 'AUTO';
    case 'manual':
      return 'MANUAL';
    case 'shutter':
      return 'Tv';
    case 'iso':
      return 'ISO';
    default: {
      const _never: never = mode;
      return _never;
    }
  }
}

export function fitFrame(
  widthOverHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  let width = maxWidth;
  let height = width / widthOverHeight;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * widthOverHeight;
  }
  return { width, height };
}
