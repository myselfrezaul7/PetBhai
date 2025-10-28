import React from 'react';

/**
 * A creative logo for KUTTAWAALA, featuring stylized representations of a cat and a dog.
 * This symbolizes the organization's care for all common pets.
 */
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-labelledby="logo-title"
  >
    <title id="logo-title">KUTTAWAALA Logo</title>
    <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5v.1a4.42 4.42 0 0 0-1.9 1.4 4.5 4.5 0 0 0-.4 2.5c.3 1.3 1.4 2.3 2.8 2.5h4c1.4-.2 2.5-1.2 2.8-2.5.2-.9-.1-1.8-.4-2.5a4.42 4.42 0 0 0-1.9-1.4V5.5A2.5 2.5 0 0 0 12 3zm-4 13s.6-1.8 4-1.8 4 1.8 4 1.8c-1.2 2.3-4 2.3-4 2.3-2.7 0-3-1.6-4-2.3z"/>
  </svg>
);

export default Logo;
