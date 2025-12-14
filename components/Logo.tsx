import React from 'react';

/**
 * The official logo for PetBhai, featuring a smaller, more subtle Dog Paw print.
 */
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-labelledby="logo-title"
  >
    <title id="logo-title">PetBhai Paw Logo</title>
    <path d="M8.35 8.16C9.17 8.5 9.61 9.4 9.28 10.22C8.95 11.04 8.05 11.48 7.23 11.15C6.41 10.82 5.97 9.92 6.3 9.1C6.63 8.28 7.53 7.84 8.35 8.16ZM10.92 5.71C11.55 5.71 12.06 6.22 12.06 6.85C12.06 7.48 11.55 7.99 10.92 7.99C10.29 7.99 9.78 7.48 9.78 6.85C9.78 6.22 10.29 5.71 10.92 5.71ZM13.08 5.71C13.71 5.71 14.22 6.22 14.22 6.85C14.22 7.48 13.71 7.99 13.08 7.99C12.45 7.99 11.94 7.48 11.94 6.85C11.94 6.22 12.45 5.71 13.08 5.71ZM15.65 8.16C16.47 7.84 17.37 8.28 17.7 9.1C18.03 9.92 17.59 10.82 16.77 11.15C15.95 11.48 15.05 11.04 14.72 10.22C14.39 9.4 14.83 8.5 15.65 8.16ZM12 12.5C14.21 12.5 16 14.29 16 16.5C16 17.88 14.88 19 13.5 19H10.5C9.12 19 8 17.88 8 16.5C8 14.29 9.79 12.5 12 12.5Z"/>
  </svg>
);

export default Logo;