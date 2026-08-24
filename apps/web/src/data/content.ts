export const capabilities = [
  {
    number: '01',
    title: 'Direct control',
    copy: 'Shutter, ISO, focus, white balance, and exposure—without leaving the frame.',
    icon: 'control',
  },
  {
    number: '02',
    title: 'Live Iris Looks',
    copy: 'See the final character of your photograph before you press the shutter.',
    icon: 'look',
  },
  {
    number: '03',
    title: 'Files with a future',
    copy: 'Keep a finished HEIC for now or a flexible RAW file for what comes next.',
    icon: 'files',
  },
] as const;

export type CapabilityIcon = (typeof capabilities)[number]['icon'];

export const looks = [
  {
    id: 'natural',
    name: 'Natural',
    description: 'Neutral color, gentle contrast, everyday light.',
    className: 'natural',
    image: '/images/captures/natural-street.png',
    width: 1024,
    height: 1536,
    alt: 'Wet city street at night with magenta neon sidewalk reflections and a parked bicycle',
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'Open shadows, clean whites, sunlit color.',
    className: 'daylight',
    image: '/images/captures/daylight-foliage.png',
    width: 1024,
    height: 1536,
    alt: 'Sunlit tropical leaves with translucent veins and a pale tree trunk',
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Deep blacks, silver midtones, no color.',
    className: 'noir',
    image: '/images/captures/noir-architecture.png',
    width: 1024,
    height: 1536,
    alt: 'Black-and-white concrete colonnade with sharp striped shadows',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'Cool highlights, tight contrast, metallic edges.',
    className: 'chrome',
    image: '/images/captures/chrome-coast.png',
    width: 1200,
    height: 800,
    alt: 'Rugged coastal cliffs at sunset with a bright path of light on the sea',
  },
  {
    id: 'faded',
    name: 'Faded',
    description: 'Soft contrast, lifted blacks, quiet color.',
    className: 'faded',
    image: '/images/captures/faded-interior.png',
    width: 1024,
    height: 1536,
    alt: 'Quiet cafe corner with a wood table, ceramic cup, and soft window light',
  },
] as const;

export type LookId = (typeof looks)[number]['id'];

export const highlights = [
  'Manual control',
  'Live looks',
  'HEIC + RAW',
  'Private by default',
] as const;

export const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#looks', label: 'Looks' },
  { href: '#captures', label: 'Captures' },
] as const;

export const githubUrl = 'https://github.com/MohtashamMurshid/iris';
export const earlyAccessEmail =
  'mailto:hello@iris.camera?subject=Iris%20early%20access';
