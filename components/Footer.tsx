import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-6 mt-auto">
      <div className="container mx-auto px-6 text-center">
        <p>
          &copy; {new Date().getFullYear()} KUTTAWAALA.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
