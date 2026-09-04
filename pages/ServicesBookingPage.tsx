import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BANGLADESH_DISTRICTS } from '../constants';
import { useToast } from '../contexts/ToastContext';

export type BookingServiceType =
  | 'transport'
  | 'photography'
  | 'vet'
  | 'grooming'
  | 'training'
  | 'sitting';

interface BookingConfirmation {
  referenceId: string;
  serviceType: string;
  customerName: string;
  mobile: string;
  location: string;
  datetime: string;
  details: string;
}

const TAB_CONFIG: Array<{ id: BookingServiceType; label: string; icon: string; color: string }> = [
  { id: 'transport', label: 'Pet Taxi & Transport', icon: '🚚', color: 'bg-orange-500' },
  { id: 'photography', label: 'Pet Photography', icon: '📸', color: 'bg-pink-500' },
  { id: 'vet', label: 'Home Vet Visit', icon: '🩺', color: 'bg-emerald-500' },
  { id: 'grooming', label: 'At-Home Grooming', icon: '✂️', color: 'bg-cyan-500' },
  { id: 'training', label: 'Pet Training', icon: '🏅', color: 'bg-purple-500' },
  { id: 'sitting', label: 'Pet Sitting', icon: '🏠', color: 'bg-amber-500' },
];

const parseServiceParam = (param: string | null): BookingServiceType => {
  if (!param) return 'transport';
  const lower = param.toLowerCase();
  if (lower.includes('photo')) return 'photography';
  if (lower.includes('vet')) return 'vet';
  if (lower.includes('groom')) return 'grooming';
  if (lower.includes('train')) return 'training';
  if (lower.includes('sit')) return 'sitting';
  if (lower.includes('taxi') || lower.includes('transport')) return 'transport';
  return 'transport';
};

const ServicesBookingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialService = parseServiceParam(searchParams.get('service'));

  const [activeTab, setActiveTab] = useState<BookingServiceType>(initialService);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const toast = useToast();

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minDateTime = useMemo(() => new Date().toISOString().slice(0, 16), []);

  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      setActiveTab(parseServiceParam(serviceParam));
    }
  }, [searchParams]);

  const handleTabChange = (tab: BookingServiceType) => {
    setActiveTab(tab);
    setConfirmation(null);
    setSearchParams({ service: tab });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const serviceTitleMap: Record<BookingServiceType, string> = {
      transport: 'Pet Taxi & Transport',
      photography: 'Pet Photography',
      vet: 'Home Vet Consultation',
      grooming: 'At-Home Grooming & Spa',
      training: 'Pet Training & Behavior',
      sitting: 'Pet Sitting & Daycare',
    };

    const serviceType = serviceTitleMap[activeTab] || 'Pet Service';
    const referenceId = `PB-${Date.now().toString().slice(-6)}`;

    try {
      const emailBody = `
New ${serviceType} Booking Request [#${referenceId}]

Customer Details:
- Name: ${data.name || 'Valued Customer'}
- Mobile Number: ${data.mobile || 'Not provided'}
- Email: ${data.email || 'Not provided'}

Service Details:
- Category: ${serviceType}
- District: ${data.pickupLocation || data.location || 'Dhaka'}
- Date & Time: ${data.datetime || data.date || 'Flexible'}
- Pet Details: ${data.petName ? `${data.petName} (${data.petType || 'Pet'})` : 'Not specified'}
- Package / Details: ${data.package || data.destinationType || data.subservice || 'Standard'}
- Special Notes: ${data.notes || 'None'}

Please contact the customer to confirm the schedule.
      `.trim();

      const encodedSubject = encodeURIComponent(`New ${serviceType} Booking [#${referenceId}]`);
      const encodedBody = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:petbhaibd@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;

      // Open email client safely
      if (typeof window !== 'undefined') {
        window.location.href = mailtoLink;
      }

      setConfirmation({
        referenceId,
        serviceType,
        customerName: data.name || 'Valued Customer',
        mobile: data.mobile,
        location: data.pickupLocation || data.location || 'Dhaka',
        datetime: data.datetime || data.date || 'As scheduled',
        details: data.package || data.destinationType || data.subservice || 'Standard Service',
      });

      toast.success(
        'Booking request sent! We will contact you shortly via your provided mobile number.'
      );

      form.reset();
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to send booking request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen app-shell py-8 md:py-12 px-3 md:px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            &larr; Back to Services Hub
          </Link>
        </div>

        <header className="text-center mb-8">
          <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-3 py-1 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-300 mb-3">
            Doorstep & Specialized Services
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-3">
            Book Pet Services
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Convenient, trusted solutions for modern pet parents across Bangladesh.
          </p>
        </header>

        {/* Confirmation Banner if recently booked */}
        {confirmation && (
          <div className="mb-8 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              Booking Request Received!
            </h2>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Reference ID: <span className="font-mono font-bold">{confirmation.referenceId}</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-md mx-auto">
              We have received your request for <strong>{confirmation.serviceType}</strong>. Our
              coordinator will contact you at <strong>{confirmation.mobile}</strong> to confirm the
              booking and slot.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/8801712345678?text=${encodeURIComponent(
                  `Hi PetBhai, I requested booking #${confirmation.referenceId} for ${confirmation.serviceType}. My phone is ${confirmation.mobile}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors inline-flex items-center gap-2"
              >
                <span>Confirm on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        )}

        <div className="glass-card-ios overflow-hidden shadow-xl border border-white/35 dark:border-white/10">
          {/* Scrollable Tab Navigation */}
          <div className="border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-900/30 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {TAB_CONFIG.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-sm sm:text-base transition-colors flex items-center gap-2 border-b-2 ${
                      isActive
                        ? `${tab.color} text-white border-transparent shadow-sm`
                        : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10">
            {/* 1. Pet Taxi Tab */}
            {activeTab === 'transport' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Safe Rides for Your Best Friend
                    </h2>
                    <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">✔️ Climate-controlled vehicles</li>
                      <li className="flex items-center gap-2">✔️ Trained pet-friendly drivers</li>
                      <li className="flex items-center gap-2">✔️ Sanitized safety crates</li>
                      <li className="flex items-center gap-2">✔️ Vet emergency priority</li>
                    </ul>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                      <p className="font-bold text-orange-800 dark:text-orange-200">
                        Starting from 500 BDT
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                        Base fare + 50 BDT/km within Dhaka and surrounding zones.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label
                        htmlFor="transport-mobile"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="transport-mobile"
                        type="tel"
                        name="mobile"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="transport-email"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Email <span className="text-xs text-slate-500">(Optional)</span>
                      </label>
                      <input
                        id="transport-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="your@email.com"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="transport-pickup-location"
                          className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                        >
                          Pickup Location
                        </label>
                        <select
                          id="transport-pickup-location"
                          name="pickupLocation"
                          defaultValue="Dhaka"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        >
                          {BANGLADESH_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="transport-destination-type"
                          className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                        >
                          Destination Type
                        </label>
                        <select
                          id="transport-destination-type"
                          name="destinationType"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        >
                          <option>Veterinary Clinic</option>
                          <option>Boarding Center</option>
                          <option>Grooming Salon</option>
                          <option>Airport</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="transport-datetime"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="transport-datetime"
                        type="datetime-local"
                        name="datetime"
                        min={minDateTime}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all touch-manipulation active:scale-95"
                    >
                      {isSubmitting ? 'Sending...' : 'Book Pet Taxi'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2. Photography Tab */}
            {activeTab === 'photography' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Capture Precious Moments
                    </h2>
                    <p className="mb-4 text-slate-600 dark:text-slate-300">
                      Professional pet photographers who know how to work with animals to get that
                      perfect, heart-warming shot.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="aspect-square bg-slate-200 rounded-2xl bg-[url('https://picsum.photos/seed/dog-photo/200')] bg-cover shadow-sm"></div>
                      <div className="aspect-square bg-slate-200 rounded-2xl bg-[url('https://picsum.photos/seed/cat-photo/200')] bg-cover shadow-sm"></div>
                      <div className="aspect-square bg-slate-200 rounded-2xl bg-[url('https://picsum.photos/seed/rabbit-photo/200')] bg-cover shadow-sm"></div>
                      <div className="aspect-square bg-slate-200 rounded-2xl bg-[url('https://picsum.photos/seed/bird-photo/200')] bg-cover shadow-sm"></div>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label
                        htmlFor="photography-mobile"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="photography-mobile"
                        type="tel"
                        name="mobile"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="photography-email"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Email <span className="text-xs text-slate-500">(Optional)</span>
                      </label>
                      <input
                        id="photography-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="your@email.com"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Package Type
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="mini"
                            className="w-4 h-4 text-pink-500"
                          />
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-white">
                              Mini Session (2000 BDT)
                            </span>
                            <span className="text-xs text-slate-500">30 mins, 5 edited photos</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="standard"
                            className="w-4 h-4 text-pink-500"
                            defaultChecked
                          />
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-white">
                              Standard (5000 BDT)
                            </span>
                            <span className="text-xs text-slate-500">
                              1 hour, 15 edited photos, 1 print
                            </span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700">
                          <input
                            type="radio"
                            name="package"
                            value="premium"
                            className="w-4 h-4 text-pink-500"
                          />
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-white">
                              Premium (10000 BDT)
                            </span>
                            <span className="text-xs text-slate-500">
                              2 hours, 30 photos, album included
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="photography-date"
                        className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200"
                      >
                        Preferred Date
                      </label>
                      <input
                        id="photography-date"
                        type="date"
                        name="date"
                        min={minDate}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all touch-manipulation active:scale-95"
                    >
                      {isSubmitting ? 'Sending...' : 'Book Photoshoot'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. Home Vet Visit Tab */}
            {activeTab === 'vet' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Professional Doctor at Your Doorstep
                    </h2>
                    <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        ✔️ Licensed veterinary practitioners
                      </li>
                      <li className="flex items-center gap-2">✔️ Full home health examinations</li>
                      <li className="flex items-center gap-2">✔️ Core vaccination & deworming</li>
                      <li className="flex items-center gap-2">
                        ✔️ Prescription and after-care guidance
                      </li>
                    </ul>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p className="font-bold text-emerald-800 dark:text-emerald-200">
                        Home Visit Fee: From ৳800
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                        Covers doctor travel and initial consultation in Dhaka.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                          Pet Name
                        </label>
                        <input
                          type="text"
                          name="petName"
                          placeholder="e.g. Leo"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                          Pet Species
                        </label>
                        <select
                          name="petType"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        >
                          <option>Cat</option>
                          <option>Dog</option>
                          <option>Bird</option>
                          <option>Rabbit</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        District
                      </label>
                      <select
                        name="location"
                        defaultValue="Dhaka"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      >
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Preferred Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="datetime"
                        min={minDateTime}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Symptoms / Concerns
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Briefly describe what your pet is experiencing..."
                        className="w-full p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                      {isSubmitting ? 'Sending...' : 'Request Home Vet'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 4. Grooming Tab */}
            {activeTab === 'grooming' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Doorstep Pet Grooming & Spa
                    </h2>
                    <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        ✔️ Medicated bath & coat de-shedding
                      </li>
                      <li className="flex items-center gap-2">
                        ✔️ Gentle nail trimming & ear cleaning
                      </li>
                      <li className="flex items-center gap-2">✔️ Sanitary hair trims & styling</li>
                      <li className="flex items-center gap-2">✔️ Stress-free in-home session</li>
                    </ul>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                      <p className="font-bold text-cyan-800 dark:text-cyan-200">
                        Packages from ৳1,200
                      </p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">
                        Tailored for cats and dogs of all sizes.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                          Pet Type
                        </label>
                        <select
                          name="petType"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        >
                          <option>Cat (Short/Long Hair)</option>
                          <option>Dog (Small Breed)</option>
                          <option>Dog (Medium/Large Breed)</option>
                          <option>Rabbit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                          Package
                        </label>
                        <select
                          name="package"
                          className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                        >
                          <option>Basic Grooming (Bath & Nails)</option>
                          <option>Full Spa & Hair Styling</option>
                          <option>De-Shedding & Anti-Flea Bath</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        min={minDate}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                      {isSubmitting ? 'Sending...' : 'Book Grooming Session'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 5. Training Tab */}
            {activeTab === 'training' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Positive Pet Training & Behavior
                    </h2>
                    <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">✔️ Puppy potty & leash basics</li>
                      <li className="flex items-center gap-2">✔️ Separation anxiety reduction</li>
                      <li className="flex items-center gap-2">
                        ✔️ Barking & aggression management
                      </li>
                      <li className="flex items-center gap-2">
                        ✔️ 100% force-free positive methods
                      </li>
                    </ul>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Program Type
                      </label>
                      <select
                        name="package"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      >
                        <option>Puppy Basics (Potty & Socialization)</option>
                        <option>Obedience (Leash, Sit, Stay)</option>
                        <option>Behavior Correction (Barking, Anxiety)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Preferred Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        min={minDate}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                      {isSubmitting ? 'Sending...' : 'Request Pet Trainer'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 6. Sitting Tab */}
            {activeTab === 'sitting' && (
              <div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                      Loving Pet Sitting & Boarding
                    </h2>
                    <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">✔️ Daily in-home drop-in visits</li>
                      <li className="flex items-center gap-2">
                        ✔️ Fresh food, water, and litter change
                      </li>
                      <li className="flex items-center gap-2">
                        ✔️ Photo & video updates each visit
                      </li>
                      <li className="flex items-center gap-2">
                        ✔️ Overnight cage-free home boarding
                      </li>
                    </ul>
                  </div>

                  <form onSubmit={handleBooking} className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        required
                        placeholder="01XXXXXXXXX"
                        pattern="[0-9]{11}"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Service Type
                      </label>
                      <select
                        name="package"
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      >
                        <option>Drop-In Feeding Visit (1-2 times/day)</option>
                        <option>Overnight Pet Sitting</option>
                        <option>Cage-Free Home Boarding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">
                        Service Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        min={minDate}
                        required
                        className="w-full min-h-[44px] p-3 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                      {isSubmitting ? 'Sending...' : 'Book Pet Sitter'}
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
