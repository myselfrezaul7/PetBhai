import React from 'react';

/**
 * The official logo for PetBhai.
 * Displays the brand logo from /petbhai-logo.png
 */
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/petbhai-logo.png" alt="PetBhai Logo" className={`object-contain ${className}`} />
);

export default Logo;
