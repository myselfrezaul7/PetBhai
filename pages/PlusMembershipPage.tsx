import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CloseIcon } from '../components/icons';

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
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

const ComingSoonBadge = memo(() => (
  <div className="my-4 sm:my-6 relative group cursor-default mx-auto w-max">
    <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative px-4 sm:px-6 py-1.5 sm:py-2 bg-white dark:bg-slate-800 ring-1 ring-gray-900/5 rounded-lg leading-none flex items-center justify-center">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 font-extrabold text-lg sm:text-xl animate-pulse">
        Coming Soon
      </span>
    </div>
  </div>
));
ComingSoonBadge.displayName = 'ComingSoonBadge';

const BenefitCard = memo(({ benefit }: { benefit: Benefit }) => (
  <article className="flex items-start space-x-4">
    <div className="text-3xl sm:text-4xl" aria-hidden="true">
      {benefit.icon}
    </div>
    <div>
      <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
        {benefit.title}
      </h3>
      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
        {benefit.description}
      </p>
    </div>
  </article>
));
BenefitCard.displayName = 'BenefitCard';

const PlusMembershipPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistData, setWaitlistData] = useState({
    email: currentUser?.email || '',
    phone: '',
  });

  const handleSubscribe = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowWaitlistForm(true);
  }, [isAuthenticated, navigate]);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!waitlistData.email || !waitlistData.phone) {
      toast.error('Please provide both email and phone number.');
      return;
    }

    // Construct mailto link to "send" the data
    const subject = encodeURIComponent('PetBhai+ Waitlist Join Request');
    const body = encodeURIComponent(
      `Hello PetBhai Team,\n\nI would like to join the PetBhai+ waitlist.\n\nEmail: ${waitlistData.email}\nPhone: ${waitlistData.phone}\nPlan Interest: ${selectedPlan}\n\nThank you!`
    );

    window.location.href = `mailto:petbhaibd@gmail.com?subject=${subject}&body=${body}`;

    toast.success(
      "You've been added to the priority waitlist! We'll notify you when membership launches."
    );
    setShowWaitlistForm(false);
  };

  const handleSelectMonthly = useCallback(() => setSelectedPlan('monthly'), []);
  const handleSelectYearly = useCallback(() => setSelectedPlan('yearly'), []);

  const isPlusMember = useMemo(() => currentUser?.isPlusMember, [currentUser]);

  return (
    <main className="animate-fade-in">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white py-16 sm:py-24 text-center">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold drop-shadow-2xl">
            Become a PetBhai+ Member
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl max-w-2xl mx-auto drop-shadow-lg">
            The ultimate care package for your pet. Unlock exclusive benefits and save more with our
            premium membership plan.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Benefits Section */}
          <section
            className="glass-card p-6 sm:p-8 md:p-10 mb-8 sm:mb-12"
            aria-labelledby="benefits-heading"
          >
            <h2
              id="benefits-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white text-center mb-6 sm:mb-8"
            >
              What You Get
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {BENEFITS.map((benefit, index) => (
                <BenefitCard key={index} benefit={benefit} />
              ))}
            </div>
          </section>

          {/* Pricing/Subscription Section */}
          <section className="glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
              Join Today!
            </h2>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-6">
              Choose the plan that's right for you.
            </p>
            <div
              className="flex flex-col sm:flex-row justify-center items-stretch gap-4 sm:gap-6"
              role="group"
              aria-label="Membership plan options"
            >
              {/* Monthly Plan */}
              <button
                onClick={handleSelectMonthly}
                className={`relative border-2 rounded-xl p-4 sm:p-6 w-full sm:w-64 text-center transition-all duration-300 touch-manipulation active:scale-95 ${
                  selectedPlan === 'monthly'
                    ? 'border-orange-500 ring-4 ring-orange-500/20'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500'
                }`}
                aria-pressed={selectedPlan === 'monthly' ? 'true' : 'false'}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">
                  Monthly
                </h3>
                <ComingSoonBadge />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">per month</p>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={handleSelectYearly}
                className={`relative border-2 rounded-xl p-4 sm:p-6 w-full sm:w-64 text-center transition-all duration-300 touch-manipulation active:scale-95 ${
                  selectedPlan === 'yearly'
                    ? 'border-orange-500 ring-4 ring-orange-500/20'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500'
                }`}
                aria-pressed={selectedPlan === 'yearly' ? 'true' : 'false'}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-orange-600 dark:text-orange-400">
                  Yearly
                </h3>
                <ComingSoonBadge />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  per year (save 25%)
                </p>
              </button>
            </div>
            <div className="mt-6 sm:mt-8">
              {isPlusMember ? (
                <p className="text-base sm:text-lg font-bold text-green-600">
                  You are already a PetBhai+ member!
                </p>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className="w-full max-w-md bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-lg sm:text-xl hover:bg-slate-700 dark:hover:bg-slate-200 transition-all transform hover:scale-105 shadow-xl touch-manipulation active:scale-95"
                >
                  Join Waitlist
                </button>
              )}
            </div>
            <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-300/50 dark:border-slate-600/50">
              <p className="text-center text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                We Accept
              </p>
              <p className="text-center text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                bKash, Nagad, COD
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistForm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
          onClick={() => setShowWaitlistForm(false)}
        >
          <div
            className="glass-card w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWaitlistForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              aria-label="Close waitlist form"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Join the Waitlist
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              We'll notify you as soon as PetBhai+ is available in your area.
            </p>
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={waitlistData.email}
                  onChange={(e) => setWaitlistData({ ...waitlistData, email: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={waitlistData.phone}
                  onChange={(e) => setWaitlistData({ ...waitlistData, phone: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
              >
                Submit & Join Waitlist
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default PlusMembershipPage;
