import React from 'react';
import { CloseIcon } from './icons';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-policy-title"
    >
      <div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <h2 id="cookie-policy-title" className="text-3xl font-bold text-slate-800 dark:text-white">
              About Cookies on PetBhai
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              aria-label="Close cookie policy modal"
            >
              <CloseIcon className="w-7 h-7" />
            </button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
            <p>
              Cookies are small text files stored on your device that help us improve your experience on our website. We use them for various purposes, which are explained below.
            </p>

            <h3 className="text-slate-800 dark:text-white">Strictly Necessary Cookies</h3>
            <p>
              These cookies are essential for the website to function correctly and cannot be switched off in our systems. They are usually only set in response to actions made by you, such as logging in or filling in forms. You can choose "Necessary only" to use just these.
            </p>
            <ul>
              <li><strong>Shopping Cart:</strong> We use local storage (similar to a cookie) to remember the items you've added to your cart, so they're still there when you return.</li>
              <li><strong>Session Management:</strong> To keep you logged in as you navigate the site.</li>
              <li><strong>Consent Preference:</strong> To remember your cookie consent choice so we don't ask you again.</li>
            </ul>

            <h3 className="text-slate-800 dark:text-white">Analytics & Functional Cookies (Optional)</h3>
            <p>
              These cookies allow us to enable additional functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, then some or all of these services may not function properly. You can enable these by choosing "Accept all".
            </p>
            <ul>
              <li><strong>Third-Party Features:</strong> Enabling tools like the Facebook Messenger chat plugin for live support.</li>
              <li><strong>Analytics:</strong> Collecting anonymous data about how visitors use our site, which helps us improve our services (we plan to add this in the future).</li>
            </ul>
             <div className="mt-8 text-center">
                <button
                    onClick={onClose}
                    className="bg-orange-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Got It
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyModal;
