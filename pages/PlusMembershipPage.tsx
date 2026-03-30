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
    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/60 to-pink-500/60 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition duration-500"></div>
    <div className="relative px-4 sm:px-6 py-1.5 sm:py-2 bg-white/75 dark:bg-slate-900/65 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-xl leading-none flex items-center justify-center">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 font-extrabold text-lg sm:text-xl">
        Coming Soon
      </span>
    </div>
  </div>
));
ComingSoonBadge.displayName = 'ComingSoonBadge';

const BenefitCard = memo(({ benefit }: { benefit: Benefit }) => (
  <article className="glass-card-ios p-4 sm:p-5 flex items-start space-x-4 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl">
    <div
      className="text-3xl sm:text-4xl w-12 h-12 rounded-2xl bg-white/60 dark:bg-slate-800/60 flex items-center justify-center"
      aria-hidden="true"
    >
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
    <main>
      {/* Hero Section */}
      <header className="relative py-16 sm:py-24 text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-orange-500 to-rose-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative z-10 max-w-3xl mx-auto glass-card-ios bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl border border-white/35 dark:border-white/10 p-6 md:p-10">
            <span className="inline-flex items-center rounded-full bg-white/30 px-3 py-1 text-xs md:text-sm font-semibold border border-white/40 mb-4">
              Premium Membership
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold drop-shadow-2xl">
              Become a PetBhai+ Member
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl max-w-2xl mx-auto drop-shadow-lg">
              The ultimate care package for your pet. Unlock exclusive benefits and save more with
              our premium membership plan.
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Benefits Section */}
          <section
            className="glass-card-ios p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/30 backdrop-blur-xl"
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
          <section className="glass-card-ios p-6 sm:p-8 md:p-10 text-center border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/30 backdrop-blur-xl">
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
                    ? 'border-orange-500 ring-4 ring-orange-500/20 bg-white/75 dark:bg-slate-800/70 backdrop-blur-lg'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500 bg-white/55 dark:bg-slate-800/45 backdrop-blur-lg'
                }`}
                aria-pressed="false"
                data-pressed={selectedPlan === 'monthly'}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200">
                  Monthly
                </h3>
                <ComingSoonBadge />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">per month</p>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={handleSelectYearly}
                className={`relative border-2 rounded-xl p-4 sm:p-6 w-full sm:w-64 text-center transition-all duration-300 touch-manipulation active:scale-95 ${
                  selectedPlan === 'yearly'
                    ? 'border-orange-500 ring-4 ring-orange-500/20 bg-white/75 dark:bg-slate-800/70 backdrop-blur-lg'
                    : 'border-slate-300/50 dark:border-slate-600/50 hover:border-orange-400 dark:hover:border-orange-500 bg-white/55 dark:bg-slate-800/45 backdrop-blur-lg'
                }`}
                aria-pressed="false"
                data-pressed={selectedPlan === 'yearly'}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-orange-600 dark:text-orange-400">
                  Yearly
                </h3>
                <ComingSoonBadge />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
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
                  className="w-full max-w-md bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-lg sm:text-xl hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105 shadow-xl hover:shadow-orange-500/30 touch-manipulation active:scale-95"
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={() => setShowWaitlistForm(false)}
        >
          <div
            className="glass-card-ios w-full max-w-md p-8 relative border border-white/35 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl"
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
                  className="w-full p-3 rounded-lg border border-white/60 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
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
                  className="w-full p-3 rounded-lg border border-white/60 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
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
