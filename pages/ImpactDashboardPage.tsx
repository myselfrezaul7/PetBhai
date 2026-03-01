import React, { useState } from 'react';
import { usePetManagement } from '../contexts/PetManagementContext';
import { useToast } from '../contexts/ToastContext';

const ImpactDashboardPage: React.FC = () => {
  const { impactStats, updateImpactStats } = usePetManagement();
  const toast = useToast();
  const [donationAmount, setDonationAmount] = useState<number | ''>('');

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof donationAmount === 'number' && donationAmount > 0) {
      updateImpactStats({ totalDonations: impactStats.totalDonations + donationAmount });
      setDonationAmount('');
      toast.success(`Thank you! BDT ${donationAmount} added to our community fund.`);
    }
  };

  const handleFeedStray = () => {
    updateImpactStats({ strayAnimalsFed: impactStats.strayAnimalsFed + 1 });
    toast.success('Great job! Another belly full today. 🐾');
  };

  const progressPercentage = Math.min((impactStats.totalDonations / 100000) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-green-600 mb-4">
            Our Collective Impact
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Together, the PetBhai community is changing lives across Bangladesh. Every donation and
            every meal counts.
          </p>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🥘
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
              {impactStats.strayAnimalsFed.toLocaleString()}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide text-xs">
              Meals Served to Strays
            </p>
            <button
              onClick={handleFeedStray}
              className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-full transition-colors"
            >
              + I Fed a Stray Today
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              💉
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
              {impactStats.vaccinationsFunded.toLocaleString()}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide text-xs">
              Vaccinations Funded
            </p>
            <div className="mt-4 text-xs text-green-600 dark:text-green-400 font-bold">
              Next Camp: Friday at Mirpur 12
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🏠
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">1,245</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide text-xs">
              Successful Adoptions
            </p>
            <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 font-bold">
              +12 this week!
            </div>
          </div>
        </div>

        {/* Donation Drive */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4">
                Urgent Cause
              </span>
              <h2 className="text-3xl font-bold mb-4">Winter Warmth Drive 2024</h2>
              <p className="text-indigo-100 mb-6 leading-relaxed">
                Thousands of street animals suffer during the cold waves in Bangladesh. We are
                raising funds to provide warm shelters and blankets for strays in Dhaka and
                Chittagong.
              </p>

              <div className="mb-2 flex justify-between text-sm font-bold">
                <span>Raised: ৳ {impactStats.totalDonations.toLocaleString()}</span>
                <span>Goal: ৳ 100,000</span>
              </div>
              <div className="h-4 bg-black/30 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <form onSubmit={handleDonate} className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount (BDT)"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  min="10"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Donate Now
                </button>
              </form>
            </div>
            <div className="w-full md:w-1/3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="font-bold border-b border-white/20 pb-2 mb-4">Top Contributors</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center">
                    <span className="flex items-center gap-2">🥇 Ahsan Habib</span>
                    <span className="font-bold">৳ 5,000</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="flex items-center gap-2">🥈 Nusrat Jahan</span>
                    <span className="font-bold">৳ 3,500</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="flex items-center gap-2">🥉 Karimul Bennett</span>
                    <span className="font-bold">৳ 2,000</span>
                  </li>
                  <li className="flex justify-between items-center text-indigo-200">
                    <span className="flex items-center gap-2">...and 45 others</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboardPage;
