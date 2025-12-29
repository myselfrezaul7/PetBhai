import React, { useState, useMemo } from 'react';
import { useVaccination } from '../contexts/VaccinationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  VACCINE_INFO,
  type Pet,
  type VaccinationRecord,
  type PetType,
  type VaccineType,
} from '../types';
import { CloseIcon, PawIcon } from './icons';

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const SyringeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.15 15.18l-1.81-1.81L12.16 10.55l1.81 1.81L11.15 15.18zM19.5 2.5L17 5l2.5 2.5 2.5-2.5L19.5 2.5zM5.28 19.71L2.5 22.5 1.5 21.5l2.79-2.79L5.28 19.71zM8.5 6l-6 6 3 3 1.5-1.5-1.5-1.5 4.5-4.5L8.5 6zM14.5 12l-1.5-1.5 4.5-4.5 1.5 1.5L14.5 12z" />
  </svg>
);

// Pet type labels
const PET_TYPE_LABELS: Record<PetType, { en: string; bn: string; emoji: string }> = {
  dog: { en: 'Dog', bn: 'কুকুর', emoji: '🐕' },
  cat: { en: 'Cat', bn: 'বিড়াল', emoji: '🐈' },
  bird: { en: 'Bird', bn: 'পাখি', emoji: '🦜' },
  other: { en: 'Other', bn: 'অন্যান্য', emoji: '🐾' },
};

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pet: Omit<Pet, 'id' | 'createdAt'>) => void;
}

const AddPetModal: React.FC<AddPetModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PetType>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      type,
      breed: breed.trim() || undefined,
      birthDate: birthDate || undefined,
    });

    // Reset form
    setName('');
    setType('dog');
    setBreed('');
    setBirthDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card p-6 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Your Pet</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Close add pet modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Pet Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tommy, Mittens"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Pet Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PET_TYPE_LABELS) as PetType[]).map((petType) => (
                <button
                  key={petType}
                  type="button"
                  onClick={() => setType(petType)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    type === petType
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                      : 'border-slate-300 dark:border-slate-600 hover:border-orange-300'
                  }`}
                >
                  <span className="text-2xl block">{PET_TYPE_LABELS[petType].emoji}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {PET_TYPE_LABELS[petType].en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Breed (Optional)
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g., Golden Retriever, Persian"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Birth Date (Optional)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              aria-label="Pet birth date"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Add Pet
          </button>
        </form>
      </div>
    </div>
  );
};

interface AddVaccinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: Pet[];
  onAdd: (vaccination: Omit<VaccinationRecord, 'id'>) => void;
  selectedPetId?: string;
}

const AddVaccinationModal: React.FC<AddVaccinationModalProps> = ({
  isOpen,
  onClose,
  pets,
  onAdd,
  selectedPetId,
}) => {
  const [petId, setPetId] = useState(selectedPetId || '');
  const [vaccineType, setVaccineType] = useState<VaccineType>('rabies');
  const [customVaccineName, setCustomVaccineName] = useState('');
  const [dateGiven, setDateGiven] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [vetName, setVetName] = useState('');
  const [notes, setNotes] = useState('');

  // Get selected pet type for filtering vaccines
  const selectedPet = pets.find((p) => p.id === petId);

  // Filter vaccines based on pet type
  const availableVaccines = useMemo(() => {
    if (!selectedPet) return Object.keys(VACCINE_INFO) as VaccineType[];
    return (Object.keys(VACCINE_INFO) as VaccineType[]).filter((v) =>
      VACCINE_INFO[v].petType.includes(selectedPet.type)
    );
  }, [selectedPet]);

  // Auto-calculate next due date based on vaccine interval
  const handleVaccineTypeChange = (type: VaccineType) => {
    setVaccineType(type);
    if (dateGiven && type !== 'other') {
      const givenDate = new Date(dateGiven);
      givenDate.setDate(givenDate.getDate() + VACCINE_INFO[type].interval);
      setNextDueDate(givenDate.toISOString().split('T')[0]);
    }
  };

  const handleDateGivenChange = (date: string) => {
    setDateGiven(date);
    if (date && vaccineType !== 'other') {
      const givenDate = new Date(date);
      givenDate.setDate(givenDate.getDate() + VACCINE_INFO[vaccineType].interval);
      setNextDueDate(givenDate.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petId || !dateGiven || !nextDueDate) return;

    onAdd({
      petId,
      vaccineName: vaccineType === 'other' ? customVaccineName : VACCINE_INFO[vaccineType].name,
      dateGiven: new Date(dateGiven).toISOString(),
      nextDueDate: new Date(nextDueDate).toISOString(),
      vetName: vetName.trim() || undefined,
      notes: notes.trim() || undefined,
      isCompleted: false,
    });

    // Reset form
    setPetId('');
    setVaccineType('rabies');
    setCustomVaccineName('');
    setDateGiven(new Date().toISOString().split('T')[0]);
    setNextDueDate('');
    setVetName('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Add Vaccination Record
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Close add vaccination modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Select Pet *
            </label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              aria-label="Select pet"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Choose a pet</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {PET_TYPE_LABELS[pet.type].emoji} {pet.name} ({PET_TYPE_LABELS[pet.type].en})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Vaccine Type *
            </label>
            <select
              value={vaccineType}
              onChange={(e) => handleVaccineTypeChange(e.target.value as VaccineType)}
              aria-label="Select vaccine type"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
              required
            >
              {availableVaccines.map((type) => (
                <option key={type} value={type}>
                  {VACCINE_INFO[type].name} ({VACCINE_INFO[type].nameBn})
                </option>
              ))}
            </select>
          </div>

          {vaccineType === 'other' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Vaccine Name *
              </label>
              <input
                type="text"
                value={customVaccineName}
                onChange={(e) => setCustomVaccineName(e.target.value)}
                placeholder="Enter vaccine name"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Date Given *
              </label>
              <input
                type="date"
                value={dateGiven}
                onChange={(e) => handleDateGivenChange(e.target.value)}
                aria-label="Vaccination date given"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Next Due Date *
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                aria-label="Next vaccination due date"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Vet Name (Optional)
            </label>
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              placeholder="e.g., Dr. Ahmed"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={!petId || !dateGiven || !nextDueDate}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Vaccination Record
          </button>
        </form>
      </div>
    </div>
  );
};

// Utility function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDaysUntil = (dateString: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const VaccinationReminder: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    pets,
    vaccinations,
    addPet,
    deletePet,
    addVaccination,
    deleteVaccination,
    getUpcomingVaccinations,
    getOverdueVaccinations,
    getPetVaccinations,
    markVaccinationComplete,
  } = useVaccination();

  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showAddVaccinationModal, setShowAddVaccinationModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'overview' | 'pets' | 'history'>('overview');

  const upcomingVaccinations = getUpcomingVaccinations(30);
  const overdueVaccinations = getOverdueVaccinations();

  if (!isAuthenticated) {
    return (
      <div className="glass-card p-6 text-center">
        <SyringeIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Vaccination Reminders
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Please log in to track your pet's vaccinations and get reminders.
        </p>
        <a
          href="#/login"
          className="inline-block bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }

  const handleAddVaccinationForPet = (petId: string) => {
    setSelectedPetId(petId);
    setShowAddVaccinationModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner for Overdue/Upcoming */}
      {(overdueVaccinations.length > 0 || upcomingVaccinations.length > 0) && (
        <div
          className={`rounded-xl p-4 ${
            overdueVaccinations.length > 0
              ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
              : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertIcon
              className={`w-6 h-6 flex-shrink-0 ${
                overdueVaccinations.length > 0 ? 'text-red-600' : 'text-yellow-600'
              }`}
            />
            <div>
              <h4
                className={`font-bold ${
                  overdueVaccinations.length > 0
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-yellow-800 dark:text-yellow-300'
                }`}
              >
                {overdueVaccinations.length > 0
                  ? `${overdueVaccinations.length} Overdue Vaccination${overdueVaccinations.length > 1 ? 's' : ''}!`
                  : `${upcomingVaccinations.length} Upcoming Vaccination${upcomingVaccinations.length > 1 ? 's' : ''}`}
              </h4>
              <p
                className={`text-sm ${
                  overdueVaccinations.length > 0
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-yellow-700 dark:text-yellow-400'
                }`}
              >
                {overdueVaccinations.length > 0
                  ? 'Please schedule a vet visit as soon as possible.'
                  : "Schedule your pet's vaccination appointment soon."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-300/50 dark:border-slate-600/50">
        {(['overview', 'pets', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {pets.length === 0 ? (
            <div className="text-center py-8">
              <PawIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                No Pets Added Yet
              </h4>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Add your pet to start tracking vaccinations
              </p>
              <button
                onClick={() => setShowAddPetModal(true)}
                className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Add Your First Pet
              </button>
            </div>
          ) : (
            <>
              {/* Overdue Vaccinations */}
              {overdueVaccinations.length > 0 && (
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <AlertIcon className="w-5 h-5" />
                    Overdue
                  </h4>
                  <div className="space-y-2">
                    {overdueVaccinations.map((v) => {
                      const pet = pets.find((p) => p.id === v.petId);
                      const daysOverdue = Math.abs(getDaysUntil(v.nextDueDate));
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {pet ? PET_TYPE_LABELS[pet.type].emoji : '🐾'}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {pet?.name} - {v.vaccineName}
                              </p>
                              <p className="text-sm text-red-600 dark:text-red-400">
                                {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => markVaccinationComplete(v.id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Mark as done"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Vaccinations */}
              {upcomingVaccinations.length > 0 && (
                <div>
                  <h4 className="font-bold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Upcoming (Next 30 days)
                  </h4>
                  <div className="space-y-2">
                    {upcomingVaccinations.map((v) => {
                      const pet = pets.find((p) => p.id === v.petId);
                      const daysUntil = getDaysUntil(v.nextDueDate);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {pet ? PET_TYPE_LABELS[pet.type].emoji : '🐾'}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {pet?.name} - {v.vaccineName}
                              </p>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Due in {daysUntil} day{daysUntil > 1 ? 's' : ''} (
                                {formatDate(v.nextDueDate)})
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => markVaccinationComplete(v.id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Mark as done"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {overdueVaccinations.length === 0 && upcomingVaccinations.length === 0 && (
                <div className="text-center py-8">
                  <CheckIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                    All Caught Up! 🎉
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    No vaccinations due in the next 30 days.
                  </p>
                </div>
              )}

              {/* Quick Add Button */}
              <button
                onClick={() => setShowAddVaccinationModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Add Vaccination Record
              </button>
            </>
          )}
        </div>
      )}

      {/* Pets Tab */}
      {activeTab === 'pets' && (
        <div className="space-y-4">
          {pets.map((pet) => {
            const petVaccinations = getPetVaccinations(pet.id);
            return (
              <div key={pet.id} className="glass-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{PET_TYPE_LABELS[pet.type].emoji}</span>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-lg">
                        {pet.name}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {PET_TYPE_LABELS[pet.type].en}
                        {pet.breed && ` • ${pet.breed}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePet(pet.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete pet"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  {petVaccinations.length} vaccination record
                  {petVaccinations.length !== 1 ? 's' : ''}
                </div>

                <button
                  onClick={() => handleAddVaccinationForPet(pet.id)}
                  className="w-full py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                >
                  + Add Vaccination
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setShowAddPetModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:border-orange-500 hover:text-orange-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Another Pet
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {vaccinations.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No vaccination records yet.</p>
            </div>
          ) : (
            vaccinations
              .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime())
              .map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border ${
                      v.isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {pet ? PET_TYPE_LABELS[pet.type].emoji : '🐾'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {v.vaccineName}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {pet?.name} • Given: {formatDate(v.dateGiven)}
                          </p>
                          {v.vetName && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              By: {v.vetName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.isCompleted && (
                          <span className="text-green-600 dark:text-green-400 text-xs font-semibold">
                            ✓ Done
                          </span>
                        )}
                        <button
                          onClick={() => deleteVaccination(v.id)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete record"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Modals */}
      <AddPetModal
        isOpen={showAddPetModal}
        onClose={() => setShowAddPetModal(false)}
        onAdd={addPet}
      />
      <AddVaccinationModal
        isOpen={showAddVaccinationModal}
        onClose={() => {
          setShowAddVaccinationModal(false);
          setSelectedPetId(undefined);
        }}
        pets={pets}
        onAdd={addVaccination}
        selectedPetId={selectedPetId}
      />
    </div>
  );
};

export default VaccinationReminder;
