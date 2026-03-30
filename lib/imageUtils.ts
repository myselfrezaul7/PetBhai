import type { SyntheticEvent } from 'react';

const FALLBACK_SVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" role="img" aria-label="Image unavailable">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff7ed" />
        <stop offset="100%" stop-color="#fde68a" />
      </linearGradient>
    </defs>
    <rect width="480" height="320" rx="24" fill="url(#g)" />
    <g fill="#f97316" opacity="0.9">
      <circle cx="164" cy="126" r="22" />
      <circle cx="220" cy="98" r="22" />
      <circle cx="276" cy="126" r="22" />
      <circle cx="192" cy="186" r="26" />
      <circle cx="248" cy="186" r="26" />
      <circle cx="220" cy="220" r="34" />
    </g>
    <text x="50%" y="88%" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#7c2d12">
      PetBhai image unavailable
    </text>
  </svg>
`);

export const IMAGE_FALLBACK_SRC = `data:image/svg+xml;charset=UTF-8,${FALLBACK_SVG}`;

export const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
  const target = event.currentTarget;
  if (target.src === IMAGE_FALLBACK_SRC) {
    return;
  }

  target.onerror = null;
  target.srcset = '';
  target.src = IMAGE_FALLBACK_SRC;
};

export const getResponsiveImageSizes = (
  kind: 'card' | 'search' | 'avatar' | 'detail' | 'brand'
) => {
  switch (kind) {
    case 'avatar':
      return '(max-width: 640px) 80px, 128px';
    case 'search':
      return '48px';
    case 'detail':
      return '(max-width: 768px) 100vw, 50vw';
    case 'brand':
      return '(max-width: 640px) 72px, 96px';
    case 'card':
    default:
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
  }
};
