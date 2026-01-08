import React, { useState } from 'react';
import { BANGLADESH_DISTRICTS } from '../constants';
import { useToast } from '../contexts/ToastContext';

const ServicesBookingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transport' | 'photography'>('transport');
  const toast = useToast();

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Booking request sent! A partner will contact you shortly.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            Premium Pet Services
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Convenient solutions for modern pet parents in Bangladesh
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('transport')}
              className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${
                activeTab === 'transport'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              🚚 Pet Taxi & Transport
            </button>
            <button
              onClick={() => setActiveTab('photography')}
              className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${
                activeTab === 'photography'
                  ? 'bg-pink-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              📸 Pet Photography
            </button>
          </div>

          <div className="p-6 md:p-10">
            {activeTab === 'transport' ? (
              <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4">Safe Rides for Your Best Friend</h2>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2">✔️ Climate controlled vehicles</li>
                      <li className="flex items-center gap-2">✔️ Trained pet-friendly drivers</li>
                      <li className="flex items-center gap-2">✔️ Safety crates available</li>
                      <li className="flex items-center gap-2">✔️ Vet emergency priority</li>
                    </ul>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="font-bold text-orange-800 dark:text-orange-200">
                        Starting from 500 BDT
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-300">
                        Base fare + 50 BDT/km
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Pickup Location</label>
                      <select className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600">
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Destination Type</label>
                      <select className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600">
                        <option>Veterinary Clinic</option>
                        <option>Boarding Center</option>
                        <option>Grooming Salon</option>
                        <option>Airport</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg"
                    >
                      Book Pet Taxi
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4">Capture Precious Moments</h2>
                    <p className="mb-4 text-slate-600 dark:text-slate-300">
                      Professional photographers who know how to work with animals to get that
                      perfect shot.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="aspect-square bg-slate-200 rounded-lg bg-[url('https://picsum.photos/seed/dog-photo/200')] bg-cover"></div>
                      <div className="aspect-square bg-slate-200 rounded-lg bg-[url('https://picsum.photos/seed/cat-photo/200')] bg-cover"></div>
                      <div className="aspect-square bg-slate-200 rounded-lg bg-[url('https://picsum.photos/seed/rabbit-photo/200')] bg-cover"></div>
                      <div className="aspect-square bg-slate-200 rounded-lg bg-[url('https://picsum.photos/seed/bird-photo/200')] bg-cover"></div>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Package Type</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="mini"
                            className="w-4 h-4 text-pink-500"
                          />
                          <div>
                            <span className="font-bold block">Mini Session (2000 BDT)</span>
                            <span className="text-xs text-slate-500">30 mins, 5 edited photos</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="standard"
                            className="w-4 h-4 text-pink-500"
                            defaultChecked
                          />
                          <div>
                            <span className="font-bold block">Standard (5000 BDT)</span>
                            <span className="text-xs text-slate-500">
                              1 hour, 15 edited photos, 1 print
                            </span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="premium"
                            className="w-4 h-4 text-pink-500"
                          />
                          <div>
                            <span className="font-bold block">Premium (10000 BDT)</span>
                            <span className="text-xs text-slate-500">
                              2 hours, 30 photos, album included
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Preferred Date</label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg shadow-lg"
                    >
                      Book Photoshoot
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesBookingPage;
