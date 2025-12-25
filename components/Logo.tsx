import React from 'react';

/**
 * The official logo for PetBhai.
 * Displays the brand image from /icon-192x192.png
 */
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/icon-192x192.png" alt="PetBhai Logo" className={`object-contain ${className}`} />
);

export default Logo;
