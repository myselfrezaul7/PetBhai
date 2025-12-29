import React, { useState, useMemo } from 'react';
import type { DeliveryArea } from '../types';
import { BANGLADESH_DISTRICTS } from '../constants';

// Delivery area data for Bangladesh
const DELIVERY_AREAS: DeliveryArea[] = [
  {
    district: 'Dhaka',
    districtBn: 'ঢাকা',
    areas: [
      'Dhanmondi',
      'Gulshan',
      'Banani',
      'Mirpur',
      'Uttara',
      'Mohammadpur',
      'Bashundhara',
      'Badda',
      'Khilgaon',
      'Motijheel',
    ],
    deliveryDays: 1,
    deliveryFee: 60,
    isAvailable: true,
    isSameDayAvailable: true,
  },
  {
    district: 'Chattogram',
    districtBn: 'চট্টগ্রাম',
    areas: ['Agrabad', 'Nasirabad', 'GEC Circle', 'Halishahar', 'Khulshi'],
    deliveryDays: 2,
    deliveryFee: 100,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Gazipur',
    districtBn: 'গাজীপুর',
    areas: ['Tongi', 'Gazipur Sadar', 'Kaliakair', 'Sreepur'],
    deliveryDays: 1,
    deliveryFee: 80,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Narayanganj',
    districtBn: 'নারায়ণগঞ্জ',
    areas: ['Narayanganj Sadar', 'Siddhirganj', 'Fatullah', 'Rupganj'],
    deliveryDays: 1,
    deliveryFee: 80,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Sylhet',
    districtBn: 'সিলেট',
    areas: ['Sylhet Sadar', 'Amberkhana', 'Zindabazar', 'Subhanighat'],
    deliveryDays: 3,
    deliveryFee: 120,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Rajshahi',
    districtBn: 'রাজশাহী',
    areas: ['Rajshahi Sadar', 'Shaheb Bazar', 'Uposhahar'],
    deliveryDays: 3,
    deliveryFee: 120,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Khulna',
    districtBn: 'খুলনা',
    areas: ['Khulna Sadar', 'Sonadanga', 'Boyra'],
    deliveryDays: 3,
    deliveryFee: 120,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Rangpur',
    districtBn: 'রংপুর',
    areas: ['Rangpur Sadar', 'Modern More', 'Shapla Chattar'],
    deliveryDays: 4,
    deliveryFee: 150,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Barishal',
    districtBn: 'বরিশাল',
    areas: ['Barishal Sadar', 'Nathullabad', 'Sagordi'],
    deliveryDays: 4,
    deliveryFee: 150,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Mymensingh',
    districtBn: 'ময়মনসিংহ',
    areas: ['Mymensingh Sadar', 'BAU Campus', 'Ganginarpar'],
    deliveryDays: 2,
    deliveryFee: 100,
    isAvailable: true,
    isSameDayAvailable: false,
  },
  {
    district: 'Comilla',
    districtBn: 'কুমিল্লা',
    areas: ['Comilla Sadar', 'Kandirpar', 'Tomsom Bridge'],
    deliveryDays: 2,
    deliveryFee: 100,
    isAvailable: true,
    isSameDayAvailable: false,
  },
];

// Icons
const TruckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

interface DeliveryAreaCheckerProps {
  onDeliverySelect?: (area: DeliveryArea | null) => void;
  compact?: boolean;
}

const DeliveryAreaChecker: React.FC<DeliveryAreaCheckerProps> = ({
  onDeliverySelect,
  compact = false,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [showResult, setShowResult] = useState(false);

  const deliveryInfo = useMemo(() => {
    return DELIVERY_AREAS.find((d) => d.district === selectedDistrict);
  }, [selectedDistrict]);

  const isDeliveryAvailable = deliveryInfo?.isAvailable ?? false;

  // Get areas for selected district
  const availableAreas = useMemo(() => {
    return deliveryInfo?.areas || [];
  }, [deliveryInfo]);

  // All districts with availability info
  const allDistricts = useMemo(() => {
    const deliverableDistricts = new Set(DELIVERY_AREAS.map((d) => d.district));
    return BANGLADESH_DISTRICTS.map((district) => ({
      name: district,
      isAvailable: deliverableDistricts.has(district),
    }));
  }, []);

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedArea('');
    setShowResult(true);

    const area = DELIVERY_AREAS.find((d) => d.district === district);
    if (onDeliverySelect) {
      onDeliverySelect(area || null);
    }
  };

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
  };

  // Calculate estimated delivery date
  const getEstimatedDeliveryDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-BD', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <MapPinIcon className="w-4 h-4 text-orange-500" />
          Check Delivery Availability
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          aria-label="Select your district for delivery check"
          className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select your district</option>
          {allDistricts.map((district) => (
            <option key={district.name} value={district.name}>
              {district.name} {district.isAvailable ? '✓' : ''}
            </option>
          ))}
        </select>

        {showResult && selectedDistrict && (
          <div
            className={`p-3 rounded-lg text-sm ${
              isDeliveryAvailable
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            {isDeliveryAvailable ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold">
                  <CheckCircleIcon className="w-4 h-4" />
                  Delivery Available!
                </div>
                <div className="text-green-600 dark:text-green-400 space-y-1">
                  <p>📦 Est. delivery: {getEstimatedDeliveryDate(deliveryInfo!.deliveryDays)}</p>
                  <p>💰 Delivery fee: ৳{deliveryInfo!.deliveryFee}</p>
                  {deliveryInfo!.isSameDayAvailable && (
                    <p className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                      <BoltIcon className="w-3 h-3" />
                      Same-day delivery available!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircleIcon className="w-4 h-4" />
                <div>
                  <p className="font-semibold">Delivery not available yet</p>
                  <p className="text-xs">
                    We're expanding soon. Contact us for special arrangements.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <TruckIcon className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Check Delivery Availability
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your location to see delivery options
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            District / জেলা
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            aria-label="Select district"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select district</option>
            {allDistricts.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name} {district.isAvailable ? '✓' : '(Coming Soon)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Area / এলাকা
          </label>
          <select
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            disabled={!selectedDistrict || availableAreas.length === 0}
            aria-label="Select area"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {availableAreas.length > 0 ? 'Select area (optional)' : 'No specific areas listed'}
            </option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Display */}
      {showResult && selectedDistrict && (
        <div
          className={`rounded-xl p-5 ${
            isDeliveryAvailable
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800'
              : 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-800'
          } animate-fade-in`}
        >
          {isDeliveryAvailable ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                    Great News! We deliver to {selectedDistrict}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {deliveryInfo?.districtBn && `${deliveryInfo.districtBn} জেলায়`} ডেলিভারি
                    সুবিধা আছে
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 text-center">
                  <ClockIcon className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Estimated Delivery</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {deliveryInfo!.deliveryDays === 1
                      ? 'Tomorrow'
                      : `${deliveryInfo!.deliveryDays} Days`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getEstimatedDeliveryDate(deliveryInfo!.deliveryDays)}
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 text-center">
                  <span className="text-2xl block mb-1">💰</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Delivery Fee</p>
                  <p className="font-bold text-slate-800 dark:text-white text-lg">
                    ৳{deliveryInfo!.deliveryFee}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Free over ৳2000</p>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 text-center">
                  {deliveryInfo!.isSameDayAvailable ? (
                    <>
                      <BoltIcon className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Express Option</p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">Same Day!</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Order before 2 PM
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl block mb-1">📦</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Delivery Type</p>
                      <p className="font-bold text-slate-800 dark:text-white">Standard</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Track your order</p>
                    </>
                  )}
                </div>
              </div>

              {deliveryInfo!.isSameDayAvailable && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
                  <BoltIcon className="w-5 h-5" />
                  <span>
                    <strong>Same-day delivery</strong> available in {selectedDistrict}! Order before
                    2 PM for delivery today.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <XCircleIcon className="w-12 h-12 mx-auto text-red-500 dark:text-red-400 mb-3" />
              <h4 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
                Delivery Not Available Yet
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                We're working hard to expand to {selectedDistrict} soon!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/8801712345678?text=Hi!%20I%20want%20delivery%20in%20${encodeURIComponent(selectedDistrict)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contact via WhatsApp
                </a>
                <button className="inline-flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  📧 Notify When Available
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coverage Map Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Currently delivering to <strong>{DELIVERY_AREAS.length}</strong> districts across
          Bangladesh.
          <br />
          <span className="text-green-600 dark:text-green-400">
            Free delivery on orders above ৳2000!
          </span>
        </p>
      </div>
    </div>
  );
};

export default DeliveryAreaChecker;
