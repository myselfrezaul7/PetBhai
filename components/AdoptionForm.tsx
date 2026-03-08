import React, { useEffect, useRef } from 'react';
import type { Animal } from '../types';
import { CloseIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface AdoptionFormProps {
  animal: Animal;
  isOpen: boolean;
  onClose: () => void;
}

const AdoptionForm: React.FC<AdoptionFormProps> = ({ animal, isOpen, onClose }) => {
  const toast = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      `Thank you for your interest in adopting ${animal.name}! Your application has been submitted.`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adoption-form-title"
    >
      <div
        ref={modalRef}
        className="glass-card-ios w-full max-w-2xl max-h-[min(90vh,calc(100vh-2rem))] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                <span id="adoption-form-title">Adoption Application</span>
              </h2>
              <p className="text-slate-700 dark:text-slate-200 text-lg mt-1">
                You are applying to adopt:{' '}
                <span className="font-bold text-slate-800 dark:text-white">{animal.name}</span>
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              aria-label="Close adoption form"
            >
              <CloseIcon className="w-7 h-7" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Your Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    autoComplete="name"
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                  >
                    Phone Number (Bangladesh)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    pattern="(\+8801|01)[3-9]\d{8}"
                    placeholder="+8801..."
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                    autoComplete="email"
                    inputMode="email"
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Full Address (in Bangladesh)
                </label>
                <textarea
                  id="address"
                  rows={3}
                  required
                  autoComplete="street-address"
                  className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </fieldset>

            {/* Living Situation */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Living Situation
              </legend>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Type of Residence
                </label>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="residence"
                      value="apartment"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Apartment
                  </label>
                  <label className="flex items-center text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="residence"
                      value="house"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    House
                  </label>
                  <label className="flex items-center text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="residence"
                      value="other"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Other
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Do you own or rent your home?
                </label>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="ownRent"
                      value="own"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Own
                  </label>
                  <label className="flex items-center text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="ownRent"
                      value="rent"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Rent
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                If you rent, please be prepared to show proof of landlord's permission for pets.
              </p>
            </fieldset>

            {/* Pet Experience */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Pet Experience
              </legend>
              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Please describe your experience with pets.
                </label>
                <textarea
                  id="experience"
                  rows={4}
                  required
                  placeholder="Have you owned pets before? What kind? For how long?"
                  className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </fieldset>

            <div className="pt-5 border-t border-slate-300/50 dark:border-slate-600/50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdoptionForm;
