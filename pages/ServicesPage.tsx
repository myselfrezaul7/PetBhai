import React, { useState, useMemo } from 'react';
import { MOCK_VETS, MOCK_GROOMERS, MOCK_TRAINERS, MOCK_PET_SITTERS, BANGLADESH_DISTRICTS } from '../constants';
import VetCard from '../components/VetCard';
import ServiceCard from '../components/ServiceCard';
import type { Vet, Groomer, Trainer, PetSitter } from '../types';

type ServiceTab = 'Vets' | 'Groomers' | 'Trainers' | 'Sitters';

const ServicesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ServiceTab>('Vets');
    const [locationFilter, setLocationFilter] = useState<string>('All');

    const professionals = useMemo(() => {
        let list: (Vet | Groomer | Trainer | PetSitter)[] = [];
        switch (activeTab) {
            case 'Vets': list = MOCK_VETS; break;
            case 'Groomers': list = MOCK_GROOMERS; break;
            case 'Trainers': list = MOCK_TRAINERS; break;
            case 'Sitters': list = MOCK_PET_SITTERS; break;
        }
        if (locationFilter === 'All') {
            return list;
        }
        return list.filter(p => 'address' in p ? p.address.includes(locationFilter) : p.location === locationFilter);
    }, [activeTab, locationFilter]);

    const TabButton: React.FC<{ label: ServiceTab }> = ({ label }) => (
        <button
            onClick={() => setActiveTab(label)}
            className={`px-4 py-3 font-bold text-lg rounded-t-lg transition-colors border-b-4 ${
                activeTab === label
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500/30'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="container mx-auto px-4 md:px-6 py-16 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">Professional Pet Services</h1>
                <p className="text-lg text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mt-4">
                    Find and book trusted local professionals for every pet need.
                </p>
            </div>

            {/* Tabs & Filters */}
            <div className="glass-card p-4 mb-12">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="border-b border-slate-300/50 dark:border-slate-600/50 flex-grow w-full overflow-x-auto">
                        <nav className="flex space-x-2 whitespace-nowrap">
                            <TabButton label="Vets" />
                            <TabButton label="Groomers" />
                            <TabButton label="Trainers" />
                            <TabButton label="Sitters" />
                        </nav>
                    </div>
                     <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                        <label htmlFor="location-filter" className="font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline">Location:</label>
                        <select 
                            id="location-filter" 
                            value={locationFilter} 
                            onChange={e => setLocationFilter(e.target.value)} 
                            className="w-full sm:w-auto p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500"
                        >
                            <option value="All">All Bangladesh</option>
                            {BANGLADESH_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {professionals.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
                    {professionals.map(p => {
                       if ('specialization' in p) { // It's a Vet
                           return <VetCard key={`vet-${p.id}`} vet={p} />;
                       }
                       // It's a Groomer, Trainer, or Sitter
                       return <ServiceCard key={`${p.category}-${p.id}`} professional={p} />;
                    })}
                </div>
            ) : (
                <div className="text-center py-10 glass-card">
                    <p className="text-xl text-slate-700 dark:text-slate-200">No {activeTab.toLowerCase()} found for "{locationFilter}".</p>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;