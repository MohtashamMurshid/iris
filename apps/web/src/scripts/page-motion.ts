import { animate, inView, stagger } from 'motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const showImmediately = (selector: string) => {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = '';
  });
};

const runHeroMotion = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  if (prefersReducedMotion()) {
    showImmediately('.hero-motion');
    showImmediately('.hero-atmosphere .orbit');
    return;
  }

  animate(
    '.hero-copy .eyebrow',
    { opacity: [0, 1], y: [10, 0] },
    { duration: 0.55, ease: easeOut }
  );

  animate(
    '#hero-title',
    { opacity: [0, 1], y: [28, 0] },
    { duration: 0.85, delay: 0.06, ease: easeOut }
  );

  animate(
    '.hero-intro',
    { opacity: [0, 1], y: [16, 0] },
    { duration: 0.7, delay: 0.16, ease: easeOut }
  );

  animate(
    '.hero-actions a',
    { opacity: [0, 1], y: [12, 0] },
    { duration: 0.55, delay: stagger(0.07, { startDelay: 0.28 }), ease: easeOut }
  );

  animate(
    '.phone',
    { opacity: [0, 1], y: [36, 0], scale: [0.97, 1], rotate: 2.5 },
    { duration: 1.05, delay: 0.18, ease: easeOut }
  );

  animate(
    '.chip-look',
    { opacity: [0, 1] },
    { duration: 0.5, delay: 0.55, ease: easeOut }
  );

  animate(
    '.chip-raw',
    { opacity: [0, 1] },
    { duration: 0.5, delay: 0.62, ease: easeOut }
  );

  animate(
    '.visual-note',
    { opacity: [0, 1] },
    { duration: 0.6, delay: 0.75, ease: easeOut }
  );

  animate(
    '.hero-atmosphere .orbit',
    { opacity: [0, 1] },
    { duration: 1.2, delay: stagger(0.08, { startDelay: 0.1 }), ease: easeOut }
  );
};

const runScrollMotion = () => {
  if (prefersReducedMotion()) {
    showImmediately('.reveal');
    return;
  }

  const revealed = new WeakSet<Element>();

  inView(
    '.reveal',
    (element) => {
      if (revealed.has(element)) return;
      revealed.add(element);

      const target = element as HTMLElement;
      const delayAttr = getComputedStyle(target).getPropertyValue('--delay').trim();
      const delayMs = delayAttr ? Number.parseFloat(delayAttr) : 0;
      const delay = Number.isFinite(delayMs) ? delayMs / 1000 : 0;

      animate(
        target,
        { opacity: [0, 1], y: [22, 0] },
        { duration: 0.75, delay, ease: easeOut }
      );

      const strokes = Array.from(target.querySelectorAll<SVGGeometryElement>('.icon-stroke'));
      if (strokes.length === 0) return;

      for (const stroke of strokes) {
        const length = stroke.getTotalLength();
        stroke.style.strokeDasharray = `${length}`;
        stroke.style.strokeDashoffset = `${length}`;
      }

      animate(
        strokes,
        { strokeDashoffset: 0 },
        { duration: 0.9, delay: stagger(0.05, { startDelay: delay + 0.15 }), ease: easeOut }
      );
    },
    { margin: '0px 0px -12% 0px', amount: 0.2 }
  );
};

export const initPageMotion = () => {
  runHeroMotion();
  runScrollMotion();
};
