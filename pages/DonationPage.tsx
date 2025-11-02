import React, { useState } from 'react';
import { HeartIcon } from '../components/icons';
import { MOCK_DONATION_TIERS } from '../constants';
import type { DonationTier } from '../types';

const DonationPage: React.FC = () => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const handleTierClick = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };
    
    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(value);
        setSelectedAmount(null);
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = selectedAmount || Number(customAmount);
        if (amount > 0) {
            alert(`Thank you for your generous donation of ৳${amount}!`);
        } else {
            alert("Please select or enter a donation amount.");
        }
    };

    const DonationCard: React.FC<{ tier: DonationTier, isSelected: boolean, onClick: () => void }> = ({ tier, isSelected, onClick }) => (
        <button 
            onClick={onClick}
            className={`glass-card p-6 text-left w-full h-full transition-all duration-300 transform hover:-translate-y-1 ${isSelected ? 'ring-4 ring-orange-500' : 'ring-2 ring-transparent'}`}
        >
            <p className="text-3xl font-bold text-slate-800 dark:text-white">৳{tier.amount}</p>
            <p className="text-xl font-semibold mt-2 text-orange-600 dark:text-orange-400">{tier.title}</p>
            <p className="mt-2 text-slate-700 dark:text-slate-200">{tier.description}</p>
        </button>
    );

    return (
        <div className="container mx-auto px-6 py-16 animate-fade-in">
            <div className="text-center mb-12 max-w-3xl mx-auto">
                <HeartIcon className="w-20 h-20 text-orange-500 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">Make a Difference Today</h1>
                <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
                    Your generous support helps us rescue, rehabilitate, and rehome animals in need. Every taka counts and contributes directly to providing food, shelter, and vital medical care.
                </p>
            </div>

            <div className="max-w-4xl mx-auto glass-card p-8">
                <form onSubmit={handleSubmit}>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-8">Choose a Donation Amount</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MOCK_DONATION_TIERS.map(tier => (
                            <DonationCard 
                                key={tier.id}
                                tier={tier}
                                isSelected={selectedAmount === tier.amount}
                                onClick={() => handleTierClick(tier.amount)}
                            />
                        ))}
                     </div>
                     <div className="flex items-center my-8">
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold">OR</span>
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                     <div>
                        <label htmlFor="customAmount" className="block text-lg font-semibold text-slate-700 dark:text-slate-200 text-center">Enter a Custom Amount</label>
                        <div className="mt-2 relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xl text-slate-500">৳</span>
                             <input 
                                type="text"
                                id="customAmount"
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                placeholder="e.g., 2000"
                                className="w-full text-center text-2xl font-bold p-3 pl-10 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                             />
                        </div>
                     </div>
                     <div className="mt-10">
                        <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 px-4 rounded-lg text-xl hover:bg-orange-600 transition-colors transform hover:scale-105">
                            Donate Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DonationPage;