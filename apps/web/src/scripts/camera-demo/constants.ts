/** Approximate full-frame equivalents relative to a 24mm wide base. */
export const lensScales: Record<string, string> = {
  '24': '1',
  '28': '1.17',
  '35': '1.46',
  '50': '2.1',
};

export const isoSteps = [64, 100, 200, 400, 800] as const;

export const isoBrightness: Record<(typeof isoSteps)[number], string> = {
  64: '1',
  100: '1.035',
  200: '1.075',
  400: '1.13',
  800: '1.2',
};

export const shutterSteps = ['1/125', '1/250', '1/500', '1/60'] as const;

export const shutterBlur: Record<(typeof shutterSteps)[number], string> = {
  '1/500': '0px',
  '1/250': '0px',
  '1/125': '0.35px',
  '1/60': '1.1px',
};

export const formats = ['HEIC', 'RAW + HEIC', 'RAW'] as const;

export const OBJECT_POSITION_X = 0.5;
export const OBJECT_POSITION_Y = 0.61;
export const CAPTURE_WIDTH = 1080;
export const CAPTURE_HEIGHT = 1620;
