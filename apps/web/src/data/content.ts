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
    name: 'Natural',
    description: 'Quiet color. Honest light.',
    className: 'natural',
    image: '/images/looks/natural.jpg',
    alt: 'A cyclist passing a concrete wall beneath soft tree shadows',
  },
  {
    name: 'Daylight',
    description: 'Warm highlights. Clean blues.',
    className: 'daylight',
    image: '/images/looks/daylight.jpg',
    alt: 'A person in red ascending a sunlit coastal stairway',
  },
  {
    name: 'Noir',
    description: 'Soft silver. Deep blacks.',
    className: 'noir',
    image: '/images/looks/noir.jpg',
    alt: 'A solitary figure standing beneath a rain-darkened railway overpass',
  },
] as const;

export const highlights = [
  'Manual control',
  'Live looks',
  'HEIC + RAW',
  'Private by default',
] as const;

export const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#looks', label: 'Iris Looks' },
  { href: '#principles', label: 'Why Iris' },
] as const;

export const githubUrl = 'https://github.com/MohtashamMurshid/iris';
export const earlyAccessEmail =
  'mailto:hello@iris.camera?subject=Iris%20early%20access';
