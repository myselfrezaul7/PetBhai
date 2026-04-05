import React, { useEffect, useRef, useState } from 'react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
      setIsSubmitting(false); // Reset on close
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      toast.success(
        `Thank you for your interest in adopting ${animal.name}! Your application has been submitted.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="glass-card-ios w-full max-w-2xl max-h-[min(90vh,calc(100vh-2rem))] overflow-y-auto m-auto p-0 border-0 bg-transparent shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-md open:animate-scale-in z-50"
      aria-labelledby="adoption-form-title"
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 w-full h-full p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              <span id="adoption-form-title">Adoption Application</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-300 text-lg mt-1">
              You are applying to adopt:{' '}
              <span className="font-bold text-zinc-900 dark:text-zinc-50">{animal.name}</span>
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:text-zinc-50"
            aria-label="Close adoption form"
          >
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-zinc-500 dark:text-zinc-300 mb-3">
                Your Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-zinc-500 dark:text-zinc-300"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    autoComplete="name"
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/95 dark:bg-zinc-900/95/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-zinc-500 dark:text-zinc-300"
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
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/95 dark:bg-zinc-900/95/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-500 dark:text-zinc-300"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                    autoComplete="email"
                    inputMode="email"
                    className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/95 dark:bg-zinc-900/95/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-zinc-500 dark:text-zinc-300"
                >
                  Full Address (in Bangladesh)
                </label>
                <textarea
                  id="address"
                  rows={3}
                  required
                  autoComplete="street-address"
                  className="mt-1 block w-full min-h-[44px] p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/95 dark:bg-zinc-900/95/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </fieldset>

            {/* Living Situation */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-zinc-500 dark:text-zinc-300 mb-3">
                Living Situation
              </legend>
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-300">
                  Type of Residence
                </label>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center text-zinc-500 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="residence"
                      value="apartment"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Apartment
                  </label>
                  <label className="flex items-center text-zinc-500 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="residence"
                      value="house"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    House
                  </label>
                  <label className="flex items-center text-zinc-500 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-300">
                  Do you own or rent your home?
                </label>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center text-zinc-500 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="ownRent"
                      value="own"
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                    />{' '}
                    Own
                  </label>
                  <label className="flex items-center text-zinc-500 dark:text-zinc-300">
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
              <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-2">
                If you rent, please be prepared to show proof of landlord's permission for pets.
              </p>
            </fieldset>

            {/* Pet Experience */}
            <fieldset className="border-t border-slate-300/50 dark:border-slate-600/50 pt-5">
              <legend className="text-xl font-semibold text-zinc-500 dark:text-zinc-300 mb-3">
                Pet Experience
              </legend>
              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-zinc-500 dark:text-zinc-300"
                >
                  Please describe your experience with pets.
                </label>
                <textarea
                  id="experience"
                  rows={4}
                  required
                  placeholder="Have you owned pets before? What kind? For how long?"
                  className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-white/95 dark:bg-zinc-900/95/50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </fieldset>

            <div className="pt-5 border-t border-slate-300/50 dark:border-slate-600/50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-200 dark:bg-slate-600 text-zinc-500 dark:text-zinc-300 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-amber-50/80 dark:bg-zinc-800/800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </form>
      </div>
    </dialog>
  );
};

export default AdoptionForm;
