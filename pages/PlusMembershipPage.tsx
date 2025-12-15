import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const PlusMembershipPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toast.success(
      "You've been added to the priority waitlist! We'll notify you when membership launches."
    );
  };

  const benefits = [
    {
      icon: '🚚',
      title: 'Free & Faster Delivery',
      description:
        'Get free standard delivery on all orders, with priority processing to get your supplies faster.',
    },
    {
      icon: '💸',
      title: 'Exclusive Discounts',
      description: 'Enjoy members-only pricing on hundreds of items and special seasonal sales.',
    },
    {
      icon: '🩺',
      title: 'Free Vet Consultation',
      description: 'Receive one free online vet consultation credit every month for peace of mind.',
    },
    {
      icon: '⭐',
      title: 'Early Access',
      description: 'Be the first to know about and purchase new products before anyone else.',
    },
    {
      icon: '🎁',
      title: 'Surprise Perks',
      description:
        'Receive special gifts, bonus loyalty points, and more surprises throughout the year.',
    },
  ];

  const ComingSoonBadge = () => (
    <div className="my-6 relative group cursor-default mx-auto w-max">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative px-6 py-2 bg-white dark:bg-slate-800 ring-1 ring-gray-900/5 rounded-lg leading-none flex items-center justify-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 font-extrabold text-xl animate-pulse">
          Coming Soon
        </span>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white py-24 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-2xl">
            Become a PetBhai+ Member
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-lg">
            The ultimate care package for your pet. Unlock exclusive benefits and save more with our
            premium membership plan.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Benefits Section */}
          <div className="glass-card p-8 md:p-10 mb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white text-center mb-8">
              What You Get
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="text-4xl">{benefit.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing/Subscription Section */}
          <div className="glass-card p-8 md:p-10 text-center">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Join Today!</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Choose the plan that's right for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-stretch gap-6">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`relative border-2 rounded-xl p-6 w-full sm:w-64 text-center transition-all duration-300 ${
                  selectedPlan === 'monthly'
                    ? 'border-orange-500 ring-4 ring-orange-500/20'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500'
                }`}
              >
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                  Monthly
                </h3>
                <ComingSoonBadge />
                <p className="text-slate-500 dark:text-slate-400">per month</p>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`relative border-2 rounded-xl p-6 w-full sm:w-64 text-center transition-all duration-300 ${
                  selectedPlan === 'yearly'
                    ? 'border-orange-500 ring-4 ring-orange-500/20'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500'
                }`}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <h3 className="text-xl font-semibold text-orange-600 dark:text-orange-400">
                  Yearly
                </h3>
                <ComingSoonBadge />
                <p className="text-slate-500 dark:text-slate-400">per year (save 16%)</p>
              </button>
            </div>
            <div className="mt-8">
              {currentUser?.isPlusMember ? (
                <p className="text-lg font-bold text-green-600">
                  You are already a PetBhai+ member!
                </p>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className="w-full max-w-md bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold py-4 px-8 rounded-lg text-xl hover:bg-slate-700 dark:hover:bg-slate-200 transition-all transform hover:scale-105 shadow-xl"
                >
                  Join Waitlist
                </button>
              )}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-300/50 dark:border-slate-600/50">
              <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">
                We Accept
              </p>
              <div className="flex justify-center items-center space-x-6">
                <img
                  src="https://i.ibb.co/27wH07C/bkash.png"
                  alt="bKash"
                  className="h-8 grayscale hover:grayscale-0 transition-all duration-300"
                  title="bKash"
                />
                <img
                  src="https://i.ibb.co/qjqBcf5/nagad.png"
                  alt="Nagad"
                  className="h-8 grayscale hover:grayscale-0 transition-all duration-300"
                  title="Nagad"
                />
                <img
                  src="https://i.ibb.co/p3y5M3D/bank.png"
                  alt="Bank"
                  className="h-8 grayscale hover:grayscale-0 transition-all duration-300"
                  title="Bank Transfer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlusMembershipPage;
