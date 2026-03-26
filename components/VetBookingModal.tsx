import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Vet } from '../types';
import { CloseIcon } from './icons';
import useHaptics from '../hooks/useHaptics';

interface VetBookingModalProps {
  vet: Vet;
  isOpen: boolean;
  onClose: () => void;
}

const VetBookingModal: React.FC<VetBookingModalProps> = ({ vet, isOpen, onClose }) => {
  const { triggerHaptic } = useHaptics();
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [issue, setIssue] = useState('');
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  const handleTimeSelect = (time: string) => {
    triggerHaptic('light');
    setSelectedTime(time);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issue.trim()) {
      setStep(3); // Confirmation step
    }
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
    // Reset state after a short delay to allow closing animation
    setTimeout(() => {
      setStep(1);
      setSelectedTime('');
      setIssue('');
    }, 300);
  };

  // Temporary static slots until booking availability is served by the backend.
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
  }, [isOpen]);

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
        drag={isDesktop ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={isDesktop ? 0 : 0.22}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (!isDesktop && info.offset.y > 110) {
            handleClose();
          }
        }}
      >
        {!isDesktop && (
          <div className="absolute left-1/2 top-2.5 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-300/90 dark:bg-slate-600/90" />
        )}
        <div className="p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2
                id="vet-booking-title"
                className="text-3xl font-bold text-slate-800 dark:text-white"
              >
                Book Online Consultation
              </h2>
              <p className="text-slate-700 dark:text-slate-200 text-lg mt-1">
                with <span className="font-bold text-slate-800 dark:text-white">{vet.name}</span>
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="glass-pill p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="Close booking modal"
            >
              <CloseIcon className="w-7 h-7" />
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
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                  Select a preferred consultation time:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      className="glass-pill min-h-[44px] p-3 text-center font-semibold text-orange-700 transition-colors hover:bg-orange-500 hover:text-white active:scale-[0.98] touch-manipulation dark:text-orange-300"
                    >
                      {time}
                    </button>
                  ))}
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
              >
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You have selected: <span className="font-bold">{selectedTime}</span>
                </p>
                <div>
                  <label
                    htmlFor="issue"
                    className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
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
                    className="glass-panel w-full rounded-2xl border border-white/20 p-3 text-base focus:ring-2 focus:ring-orange-500 dark:border-white/10"
                  ></textarea>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-semibold text-slate-600 hover:underline dark:text-zinc-300"
                  >
                    Back to time selection
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-orange-500 px-6 py-2 font-bold text-white hover:bg-orange-600"
                  >
                    Proceed to Confirmation
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-green-500 mx-auto mb-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Consultation Request Received
                </h3>
                <p className="text-slate-700 dark:text-slate-200 mt-2">
                  Your request for an online consultation with {vet.name} at{' '}
                  <strong>{selectedTime}</strong> has been recorded.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">
                  We will confirm availability before sending your final consultation details.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-full bg-orange-500 px-8 py-2 font-bold text-white hover:bg-orange-600"
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
