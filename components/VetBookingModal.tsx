import React, { useState } from 'react';
import type { Vet } from '../types';
import { CloseIcon } from './icons';

interface VetBookingModalProps {
  vet: Vet;
  isOpen: boolean;
  onClose: () => void;
}

const VetBookingModal: React.FC<VetBookingModalProps> = ({ vet, isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [issue, setIssue] = useState('');

  if (!isOpen) return null;
  
  const handleTimeSelect = (time: string) => {
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
      onClose();
      // Reset state after a short delay to allow closing animation
      setTimeout(() => {
          setStep(1);
          setSelectedTime('');
          setIssue('');
      }, 300);
  };

  // Mock available time slots for today
  const timeSlots = ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in" onClick={handleClose}>
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Book Online Consultation</h2>
                    <p className="text-slate-700 dark:text-slate-200 text-lg mt-1">with <span className="font-bold text-slate-800 dark:text-white">{vet.name}</span></p>
                </div>
                <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><CloseIcon className="w-7 h-7" /></button>
            </div>
            
            {/* Step 1: Select Time */}
            {step === 1 && (
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Select an available time for today:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {timeSlots.map(time => (
                            <button key={time} onClick={() => handleTimeSelect(time)} className="p-3 text-center font-semibold bg-orange-100/50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-200 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Describe Issue */}
            {step === 2 && (
                <form onSubmit={handleSubmit}>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">You have selected: <span className="font-bold">{selectedTime}</span></p>
                    <div>
                        <label htmlFor="issue" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Briefly describe your pet's issue:</label>
                        <textarea 
                            id="issue" 
                            rows={4} 
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            required 
                            placeholder="e.g., My dog is lethargic and not eating." 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                        ></textarea>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:underline">Back to time selection</button>
                        <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600">
                            Proceed to Confirmation
                        </button>
                    </div>
                </form>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Booking Confirmed!</h3>
                    <p className="text-slate-700 dark:text-slate-200 mt-2">
                        Your online consultation with {vet.name} is scheduled for <strong>{selectedTime} today</strong>.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">You will receive an email confirmation with a video call link shortly. (This is a demo).</p>
                    <button onClick={handleClose} className="mt-6 bg-orange-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-orange-600">
                        Close
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VetBookingModal;
