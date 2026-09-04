import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Vet } from '../types';
import { CloseIcon } from './icons';
import { useHaptics } from '../hooks/useHaptics';
import { useToast } from '../contexts/ToastContext';

interface VetBookingModalProps {
  vet: Vet;
  isOpen: boolean;
  onClose: () => void;
}

const VetBookingModal: React.FC<VetBookingModalProps> = ({ vet, isOpen, onClose }) => {
  const { hapticLight, hapticSuccess, hapticError, triggerCustom } = useHaptics();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [petName, setPetName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  const handleTimeSelect = (time: string) => {
    triggerCustom(10);
    hapticLight();
    setSelectedTime(time);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issue.trim() && !isSubmitting) {
      if (issue.trim().length < 5) {
        hapticError();
        toast.error('Please provide a few more details about your pet condition.');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        hapticSuccess();
        toast.success('Consultation request recorded!');
        setStep(3); // Confirmation step
      }, 800);
    }
  };

  const handleClose = useCallback(() => {
    triggerCustom(10);
    hapticLight();
    onClose();
    setTimeout(() => {
      setStep(1);
      setSelectedTime('');
      setPetName('');
      setContactNumber('');
      setIssue('');
    }, 300);
  }, [hapticLight, onClose, triggerCustom]);

  const timeSlots = ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <motion.div
      className="safe-modal-padding fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-2xl"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vet-booking-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <motion.div
        ref={modalRef}
        className="glass-card-premium w-full max-w-lg max-h-[min(92dvh,40rem)] overflow-y-auto rounded-t-3xl md:rounded-3xl overscroll-contain landscape:max-h-[80dvh]"
        onClick={(e) => e.stopPropagation()}
        initial={isDesktop ? { opacity: 0, y: 20, scale: 0.98 } : { opacity: 0, y: 80 }}
        animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
        exit={isDesktop ? { opacity: 0, y: 20, scale: 0.98 } : { opacity: 0, y: 90 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        {!isDesktop && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-slate-300/90 dark:bg-slate-600/90" />
          </div>
        )}
        <div className="p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2
                id="vet-booking-title"
                className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white"
              >
                Book Online Consultation
              </h2>
              <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base mt-1">
                with <span className="font-bold text-slate-800 dark:text-white">{vet.name}</span>
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="glass-pill p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-300 dark:hover:text-zinc-200"
              aria-label="Close booking modal"
            >
              <CloseIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                  Select a preferred consultation time:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`glass-pill min-h-[44px] p-3 text-center font-semibold transition-all touch-manipulation active:scale-[0.98] ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-orange-700 hover:bg-orange-500 hover:text-white dark:text-orange-300'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step-2"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Selected time slot:{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {selectedTime}
                  </span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="pet-name"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Pet Name (Optional):
                    </label>
                    <input
                      id="pet-name"
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="e.g. Leo"
                      className="glass-panel w-full rounded-xl border border-white/20 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 dark:border-white/10 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-number"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Contact Phone (Optional):
                    </label>
                    <input
                      id="contact-number"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="glass-panel w-full rounded-xl border border-white/20 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 dark:border-white/10 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="issue"
                    className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-1"
                  >
                    Briefly describe your pet's issue:
                  </label>
                  <textarea
                    id="issue"
                    rows={4}
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="e.g., My dog is lethargic and not eating."
                    className="glass-panel w-full rounded-2xl border border-white/20 p-3 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 dark:border-white/10 text-slate-800 dark:text-slate-100"
                  ></textarea>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs sm:text-sm font-semibold text-slate-600 hover:underline dark:text-zinc-300"
                  >
                    Back to time selection
                  </button>
                  <button
                    type="submit"
                    disabled={!issue.trim() || isSubmitting}
                    className="rounded-full bg-orange-500 px-6 py-2.5 font-bold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-md"
                  >
                    {isSubmitting ? 'Processing...' : 'Proceed to Confirmation'}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                className="text-center"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                  ✓
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                  Consultation Request Received
                </h3>
                <p className="text-slate-700 dark:text-slate-200 mt-2 text-sm sm:text-base">
                  Your request for an online consultation with {vet.name} at{' '}
                  <strong className="text-orange-600 dark:text-orange-400">{selectedTime}</strong>{' '}
                  has been recorded.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3">
                  We will confirm availability before sending your final consultation details.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-full bg-orange-500 px-8 py-2.5 font-bold text-white hover:bg-orange-600 shadow-lg text-sm sm:text-base"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VetBookingModal;
