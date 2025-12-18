import React from 'react';

/**
 * The official logo for PetBhai, featuring a subtle, high-quality Dog Paw.
 */
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-labelledby="petbhai-logo-title"
  >
    <title id="petbhai-logo-title">PetBhai Logo</title>
    <path d="M12,11.5c-2.3,0-4.3,1-5.7,2.5c-1.4,1.6-2.1,3.7-1.8,6c0.4,3.2,3.8,4.7,7.5,4.7s7.1-1.5,7.5-4.7c0.3-2.3-0.4-4.4-1.8-6 C16.3,12.5,14.3,11.5,12,11.5z M4.5,13.2c1.9,0,3.5-1.6,3.5-3.5c0-1.9-1.6-3.5-3.5-3.5S1,7.8,1,9.7C1,11.6,2.6,13.2,4.5,13.2z M9.1,6.3c2.1,0,3.9-1.7,3.9-3.9S11.3,0,9.1,0S5.2,1.7,5.2,2.4C5.2,4.6,7,6.3,9.1,6.3z M14.9,6.3c2.1,0,3.9-1.7,3.9-3.9 S17,0,14.9,0S11,1.7,11,3.9C11,4.6,12.7,6.3,14.9,6.3z M19.5,13.2c1.9,0,3.5-1.6,3.5-3.5c0-1.9-1.6-3.5-3.5-3.5s-3.5,1.6-3.5,3.5 C16,11.6,17.6,13.2,19.5,13.2z"/>
  </svg>
);

export default Logo;