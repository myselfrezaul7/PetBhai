import React, { useState, useMemo } from 'react';
import { MOCK_VETS } from '../constants';
import VetCard from '../components/VetCard';
import type { Vet, ServiceType, VetAvailability } from '../types';

type ServiceFilter = 'all' | ServiceType;
type AvailabilityFilter = 'all' | VetAvailability;

const ConsultVetPage: React.FC = () => {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  const filteredVets = useMemo(() => {
    return MOCK_VETS.filter((vet) => {
      const serviceMatch =
        serviceFilter === 'all' || vet.services.some((s) => s.type === serviceFilter);
      const availabilityMatch =
        availabilityFilter === 'all' || vet.availability === availabilityFilter;
      return serviceMatch && availabilityMatch;
    });
  }, [serviceFilter, availabilityFilter]);

  const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm whitespace-nowrap ${
        isActive
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="container mx-auto px-3 md:px-6 py-16 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
            Consult a Veterinarian
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mt-4">
            Instantly connect with trusted vets. Book an in-clinic appointment or get expert advice
            online, right from your home.
          </p>
        </div>

        {/* Filters Section */}
        <div className="glass-card p-4 mb-12 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200 mr-2">
              Service Type:
            </span>
            <FilterButton
              label="All"
              isActive={serviceFilter === 'all'}
              onClick={() => setServiceFilter('all')}
            />
            <FilterButton
              label="Online"
              isActive={serviceFilter === 'online'}
              onClick={() => setServiceFilter('online')}
            />
            <FilterButton
              label="In-Clinic"
              isActive={serviceFilter === 'in-clinic'}
              onClick={() => setServiceFilter('in-clinic')}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200 mr-2">
              Availability:
            </span>
            <FilterButton
              label="All"
              isActive={availabilityFilter === 'all'}
              onClick={() => setAvailabilityFilter('all')}
            />
            <FilterButton
              label="Available Now"
              isActive={availabilityFilter === 'Available Now'}
              onClick={() => setAvailabilityFilter('Available Now')}
            />
            <FilterButton
              label="Available Today"
              isActive={availabilityFilter === 'Available Today'}
              onClick={() => setAvailabilityFilter('Available Today')}
            />
          </div>
        </div>

        {filteredVets.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {filteredVets.map((vet) => (
              <VetCard key={vet.id} vet={vet} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 glass-card">
            <p className="text-xl text-slate-700 dark:text-slate-200">
              No veterinarians match your current filters.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ConsultVetPage;
