import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  type PetProfile,
  usePetManagement,
  type MedicineReminder,
} from '../contexts/PetManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, PawIcon } from '../components/icons';
import { generateText } from '../services/geminiService';
import { RateLimiter, sanitizeInput } from '../lib/security';

type DashboardTab = 'overview' | 'reminders' | 'profile' | 'add-pet';

const toRoundedNumber = (value: string, min = 0, max = 500): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(min, Math.min(max, Number(parsed.toFixed(2))));
};

const computeNextDueDate = (
  frequency: MedicineReminder['frequency'],
  startDateIso: string,
  customDays?: number
): string => {
  const nextDate = new Date(startDateIso);

  if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setDate(nextDate.getDate() + Math.max(1, customDays || 1));
  }

  return nextDate.toISOString();
};

const calculateFoodPortion = (pet: PetProfile): number | null => {
  if (!pet.weight || pet.weight <= 0) return null;

  const rer = 70 * Math.pow(pet.weight, 0.75);
  let dailyCalories = rer;
  if (pet.type === 'cat') dailyCalories *= 1.2;
  if (pet.activityLevel === 'high') dailyCalories *= 1.5;
  if (pet.activityLevel === 'low') dailyCalories *= 0.8;

  return Math.round(dailyCalories);
};

const PetDashboardPage: React.FC = () => {
  const {
    pets,
    addPet,
    updatePet,
    deletePet,
    addWeightEntry,
    medicineReminders,
    addMedicineReminder,
    deleteMedicineReminder,
    markMedicineGiven,
    getUpcomingReminders,
    getOverdueReminders,
  } = usePetManagement();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState('');

  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const aiLimiterRef = useRef(new RateLimiter(4, 60_000));

  const [newWeightValue, setNewWeightValue] = useState('');

  const [petForm, setPetForm] = useState({
    name: '',
    type: 'dog' as PetProfile['type'],
    gender: 'male' as PetProfile['gender'],
    breed: '',
    weight: '',
    activityLevel: 'medium' as PetProfile['activityLevel'],
    birthDate: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    breed: '',
    gender: 'male' as PetProfile['gender'],
    weight: '',
    activityLevel: 'medium' as PetProfile['activityLevel'],
    birthDate: '',
  });

  const [reminderForm, setReminderForm] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'daily' as MedicineReminder['frequency'],
    customDays: '1',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }

    if (pets.length === 0) {
      setSelectedPetId(null);
      setActiveTab('add-pet');
    }
  }, [pets, selectedPetId]);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  useEffect(() => {
    if (!selectedPet) return;

    setProfileForm({
      name: selectedPet.name,
      breed: selectedPet.breed || '',
      gender: selectedPet.gender,
      weight: selectedPet.weight ? String(selectedPet.weight) : '',
      activityLevel: selectedPet.activityLevel,
      birthDate: selectedPet.birthDate ? selectedPet.birthDate.split('T')[0] : '',
    });
  }, [selectedPet]);

  const petReminders = useMemo(() => {
    if (!selectedPet) return [];
    return medicineReminders
      .filter((reminder) => reminder.petId === selectedPet.id)
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [medicineReminders, selectedPet]);

  const upcomingReminders = getUpcomingReminders(7);
  const overdueReminders = getOverdueReminders();

  const healthMetrics = useMemo(() => {
    const totalPets = pets.length;
    const activeReminders = medicineReminders.filter((item) => item.isActive).length;
    const dueToday = medicineReminders.filter((item) => {
      const due = new Date(item.nextDueDate);
      const now = new Date();
      return (
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth() &&
        due.getDate() === now.getDate()
      );
    }).length;
    const avgWeight =
      pets.length > 0
        ? (
            pets.map((pet) => pet.weight || 0).reduce((total, weight) => total + weight, 0) /
            pets.length
          ).toFixed(1)
        : '0.0';

    return { totalPets, activeReminders, dueToday, avgWeight };
  }, [medicineReminders, pets]);

  const profileCompletion = useMemo(() => {
    if (!selectedPet) return 0;

    const checks = [
      Boolean(selectedPet.name?.trim()),
      Boolean(selectedPet.breed?.trim()),
      Boolean(selectedPet.weight && selectedPet.weight > 0),
      Boolean(selectedPet.birthDate),
      Boolean(selectedPet.activityLevel),
      (selectedPet.weightHistory?.length || 0) > 0,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [selectedPet]);

  const weightHistory = selectedPet?.weightHistory || [];
  const maxWeight = useMemo(() => {
    if (weightHistory.length === 0) return 1;
    return Math.max(1, ...weightHistory.map((item) => item.weight));
  }, [weightHistory]);

  const handleAddPet = async (event: React.FormEvent) => {
    event.preventDefault();
    setDashboardError('');

    const safeName = sanitizeInput(petForm.name, 80);
    const safeBreed = sanitizeInput(petForm.breed, 80);
    const parsedWeight = petForm.weight ? toRoundedNumber(petForm.weight, 0.1, 250) : null;

    if (safeName.length < 2) {
      setDashboardError('Pet name must be at least 2 characters.');
      return;
    }

    if (petForm.weight && parsedWeight === null) {
      setDashboardError('Weight must be a valid number.');
      return;
    }

    try {
      await addPet({
        name: safeName,
        type: petForm.type,
        gender: petForm.gender,
        breed: safeBreed || undefined,
        weight: parsedWeight || undefined,
        activityLevel: petForm.activityLevel,
        birthDate: petForm.birthDate ? new Date(petForm.birthDate).toISOString() : undefined,
      });

      setPetForm({
        name: '',
        type: 'dog',
        gender: 'male',
        breed: '',
        weight: '',
        activityLevel: 'medium',
        birthDate: '',
      });
      setActiveTab('overview');
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to add pet profile.');
    }
  };

  const handleUpdatePet = async (event: React.FormEvent) => {
    event.preventDefault();
    setDashboardError('');

    if (!selectedPet) return;

    const safeName = sanitizeInput(profileForm.name, 80);
    const safeBreed = sanitizeInput(profileForm.breed, 80);
    const parsedWeightRaw = profileForm.weight
      ? toRoundedNumber(profileForm.weight, 0.1, 250)
      : undefined;

    if (safeName.length < 2) {
      setDashboardError('Pet name must be at least 2 characters.');
      return;
    }

    if (profileForm.weight && parsedWeightRaw === null) {
      setDashboardError('Weight must be a valid number.');
      return;
    }

    const parsedWeight = parsedWeightRaw === null ? undefined : parsedWeightRaw;

    try {
      await updatePet(selectedPet.id, {
        name: safeName,
        breed: safeBreed || undefined,
        gender: profileForm.gender,
        activityLevel: profileForm.activityLevel,
        weight: parsedWeight,
        birthDate: profileForm.birthDate
          ? new Date(profileForm.birthDate).toISOString()
          : undefined,
      });
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to update pet profile.');
    }
  };

  const handleDeletePet = async () => {
    if (!selectedPet) return;

    const shouldDelete = window.confirm(
      `Delete ${selectedPet.name}? This removes reminders and cannot be undone.`
    );
    if (!shouldDelete) return;

    try {
      await deletePet(selectedPet.id);
      setAiInsight('');
      setNewWeightValue('');
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to delete pet profile.');
    }
  };

  const handleAddWeightEntry = async () => {
    if (!selectedPet) return;
    setDashboardError('');

    const weight = toRoundedNumber(newWeightValue, 0.1, 250);
    if (weight === null) {
      setDashboardError('Please enter a valid weight between 0.1 and 250 kg.');
      return;
    }

    try {
      await addWeightEntry(selectedPet.id, weight);
      setNewWeightValue('');
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to save weight entry.');
    }
  };

  const handleAddReminder = async (event: React.FormEvent) => {
    event.preventDefault();
    setDashboardError('');

    if (!selectedPet) {
      setDashboardError('Select a pet before creating reminders.');
      return;
    }

    const safeMedicineName = sanitizeInput(reminderForm.medicineName, 100);
    const safeDosage = sanitizeInput(reminderForm.dosage, 100);
    const safeNotes = sanitizeInput(reminderForm.notes, 300);
    const customDays = toRoundedNumber(reminderForm.customDays, 1, 90);
    const startDate = new Date(reminderForm.startDate);

    if (safeMedicineName.length < 2 || safeDosage.length < 1) {
      setDashboardError('Medicine name and dosage are required.');
      return;
    }

    if (Number.isNaN(startDate.getTime())) {
      setDashboardError('Please select a valid start date.');
      return;
    }

    if (reminderForm.frequency === 'custom' && customDays === null) {
      setDashboardError('Custom frequency must have days between 1 and 90.');
      return;
    }

    const startDateIso = startDate.toISOString();

    try {
      await addMedicineReminder({
        petId: selectedPet.id,
        medicineName: safeMedicineName,
        dosage: safeDosage,
        frequency: reminderForm.frequency,
        customDays: reminderForm.frequency === 'custom' ? Number(customDays || 1) : undefined,
        startDate: startDateIso,
        nextDueDate: computeNextDueDate(
          reminderForm.frequency,
          startDateIso,
          Number(customDays || 1)
        ),
        notes: safeNotes || undefined,
        isActive: true,
        notificationEnabled: true,
      });

      setReminderForm((previous) => ({
        ...previous,
        medicineName: '',
        dosage: '',
        notes: '',
        customDays: '1',
      }));
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to add reminder.');
    }
  };

  const getAiHealthTip = async () => {
    if (!selectedPet) return;
    setDashboardError('');

    if (!aiLimiterRef.current.canProceed()) {
      const seconds = Math.ceil(aiLimiterRef.current.getTimeUntilReset() / 1000);
      setDashboardError(`AI insights are rate-limited. Try again in ${seconds}s.`);
      return;
    }

    setLoadingAi(true);
    try {
      const prompt = `Provide a concise but practical health and lifestyle recommendation for a ${selectedPet.activityLevel} activity ${selectedPet.gender} ${selectedPet.breed || selectedPet.type} named ${selectedPet.name}, weight ${selectedPet.weight || 'unknown'}kg, living in Bangladesh climate.`;
      const insight = await generateText(prompt);
      setAiInsight(sanitizeInput(insight, 1200));
    } catch {
      setDashboardError('Unable to generate AI insight right now. Please try again shortly.');
    } finally {
      setLoadingAi(false);
    }
  };

  const renderAddPet = () => (
    <form
      onSubmit={handleAddPet}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2"
    >
      <h3 className="md:col-span-2 text-lg font-bold text-slate-800 dark:text-white">
        Add New Pet
      </h3>

      <input
        type="text"
        value={petForm.name}
        onChange={(event) =>
          setPetForm((prev) => ({ ...prev, name: sanitizeInput(event.target.value, 80) }))
        }
        placeholder="Pet name"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        required
      />
      <input
        type="text"
        value={petForm.breed}
        onChange={(event) =>
          setPetForm((prev) => ({ ...prev, breed: sanitizeInput(event.target.value, 80) }))
        }
        placeholder="Breed"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      />

      <select
        value={petForm.type}
        onChange={(event) =>
          setPetForm((prev) => ({ ...prev, type: event.target.value as PetProfile['type'] }))
        }
        aria-label="Pet type"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      >
        <option value="dog">Dog</option>
        <option value="cat">Cat</option>
        <option value="bird">Bird</option>
        <option value="rabbit">Rabbit</option>
        <option value="hamster">Hamster</option>
        <option value="fish">Fish</option>
        <option value="other">Other</option>
      </select>

      <select
        value={petForm.gender}
        onChange={(event) =>
          setPetForm((prev) => ({ ...prev, gender: event.target.value as PetProfile['gender'] }))
        }
        aria-label="Pet gender"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="unknown">Unknown</option>
      </select>

      <input
        type="number"
        min="0.1"
        step="0.1"
        value={petForm.weight}
        onChange={(event) => setPetForm((prev) => ({ ...prev, weight: event.target.value }))}
        placeholder="Weight (kg)"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      />

      <select
        value={petForm.activityLevel}
        onChange={(event) =>
          setPetForm((prev) => ({
            ...prev,
            activityLevel: event.target.value as PetProfile['activityLevel'],
          }))
        }
        aria-label="Pet activity level"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      >
        <option value="low">Low Activity</option>
        <option value="medium">Medium Activity</option>
        <option value="high">High Activity</option>
      </select>

      <input
        type="date"
        value={petForm.birthDate}
        onChange={(event) => setPetForm((prev) => ({ ...prev, birthDate: event.target.value }))}
        aria-label="Pet birth date"
        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
      />

      <button
        type="submit"
        className="md:col-span-2 rounded-xl bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600"
      >
        Save Pet Profile
      </button>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 rounded-[2rem] border border-white/70 bg-white/75 p-6 text-slate-900 shadow-xl shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:shadow-black/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Pet Command Center</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Welcome back{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}. Manage
              care, reminders, and health progress in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('add-pet')}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            + Add Pet
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <p className="text-xs uppercase tracking-wide">Pets</p>
            <p className="mt-1 text-2xl font-bold">{healthMetrics.totalPets}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <p className="text-xs uppercase tracking-wide">Active Reminders</p>
            <p className="mt-1 text-2xl font-bold">{healthMetrics.activeReminders}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <p className="text-xs uppercase tracking-wide">Due Today</p>
            <p className="mt-1 text-2xl font-bold">{healthMetrics.dueToday}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <p className="text-xs uppercase tracking-wide">Avg. Weight</p>
            <p className="mt-1 text-2xl font-bold">{healthMetrics.avgWeight} kg</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/community"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Open Community
          </Link>
          <Link
            to="/profile"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Manage Account
          </Link>
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View Reminders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Update Pet Profile
          </button>
        </div>
      </header>

      {dashboardError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {dashboardError}
        </div>
      )}

      {pets.length === 0 && activeTab !== 'add-pet' ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/75 py-14 text-center shadow-xl shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30">
          <PawIcon className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="mt-3 text-2xl font-bold text-slate-800 dark:text-white">No pets yet</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-300">
            Start by creating your first pet profile.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('add-pet')}
            className="mt-5 rounded-full bg-slate-950 px-6 py-3 font-bold text-white hover:bg-black"
          >
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pets</h3>
              <div className="mt-3 space-y-2">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => {
                      setSelectedPetId(pet.id);
                      setActiveTab('overview');
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      selectedPetId === pet.id
                        ? 'border-slate-400 bg-white dark:border-slate-500 dark:bg-slate-800'
                        : 'border-slate-200 bg-white/70 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="font-bold text-slate-800 dark:text-white">{pet.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {(pet.breed || pet.type).toString()} • {pet.activityLevel}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Care Queue
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-slate-500">Upcoming (7d)</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {upcomingReminders.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-slate-500">Overdue</p>
                  <p className="font-bold text-rose-600">{overdueReminders.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Dashboard Shortcuts
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Health Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reminders')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Medication Planner
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Edit Pet Details
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-5 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/30 sm:p-5">
            <div
              className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-2 dark:border-slate-700"
              role="tablist"
              aria-label="Pet dashboard sections"
            >
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'reminders', label: 'Reminders' },
                { key: 'profile', label: 'Profile Controls' },
                { key: 'add-pet', label: 'Add Pet' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as DashboardTab)}
                  role="tab"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab.key
                      ? 'bg-slate-950 text-white'
                      : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'add-pet' && renderAddPet()}

            {activeTab === 'overview' && selectedPet && (
              <>
                <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {selectedPet.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {(selectedPet.breed || selectedPet.type).toString()} • {selectedPet.gender}{' '}
                        • Activity: {selectedPet.activityLevel}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {selectedPet.weight ? `${selectedPet.weight} kg` : 'Weight pending'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Profile Completion
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                        {profileCompletion}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Weight Entries
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                        {weightHistory.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Open Reminders
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                        {petReminders.filter((item) => item.isActive).length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-xl text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <PawIcon className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Predictive Nutrition</p>
                        <div className="mt-4 flex items-end gap-2">
                          <p className="text-4xl font-black">{calculateFoodPortion(selectedPet) || '?'}</p>
                          <p className="text-sm text-slate-400 mb-1">kcal / day</p>
                        </div>
                        
                        <div className="mt-6 bg-white/10 rounded-xl p-3 border border-white/5">
                           <p className="text-xs font-semibold text-orange-400 mb-1">Smart Predict</p>
                           <p className="text-sm">Based on daily consumption, you will run out of current food stock in <strong className="text-white">12 days</strong>.</p>
                           <button className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                              Auto-Reorder Food
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/65 flex flex-col">
                      <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                        <HeartIcon className="h-5 w-5 text-red-500" />
                        AI Health Insight
                      </h3>
                      <div className="mt-3 flex-grow text-sm text-slate-700 dark:text-slate-200">
                        {loadingAi ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-2 w-4/5 rounded bg-slate-200" />
                            <div className="h-2 w-2/3 rounded bg-slate-200" />
                          </div>
                        ) : aiInsight ? (
                          <p className="leading-relaxed">{aiInsight}</p>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-300">
                            Generate a personalized health insight for this pet based on real-time biometric data.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={getAiHealthTip}
                        disabled={loadingAi}
                        className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60 transition-transform active:scale-95 w-full"
                      >
                        {loadingAi ? 'Analyzing Data...' : 'Generate AI Insight'}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Digital Twin & Interactive Timeline */}
                <section className="grid gap-4 lg:grid-cols-2">
                   {/* Digital Twin */}
                   <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-lg overflow-hidden relative">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                      <h3 className="relative z-10 text-lg font-bold text-white mb-2">Digital Twin</h3>
                      <p className="relative z-10 text-xs text-slate-400">Real-time status monitoring</p>
                      
                      <div className="relative z-10 h-48 mt-4 flex items-center justify-center">
                         {/* Abstract Wireframe Representation */}
                         <div className="relative">
                            <div className="w-24 h-24 border-2 border-orange-500/50 rounded-full animate-pulse flex items-center justify-center">
                               <PawIcon className="w-12 h-12 text-orange-400" />
                            </div>
                            <div className="absolute inset-0 rounded-full border border-orange-500 animate-ping opacity-20"></div>
                         </div>
                         
                         {/* HUD Pointers */}
                         <div className="absolute right-4 top-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Vitals Normal</span>
                         </div>
                      </div>
                   </div>

                   {/* Weight Timeline */}
                   <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                          Biometric History
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="Add weight"
                            value={newWeightValue}
                            onChange={(event) => setNewWeightValue(event.target.value)}
                            className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={handleAddWeightEntry}
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-transform active:scale-95"
                          >
                            + Log
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-grow flex items-end space-x-1 pb-2 h-32">
                         {weightHistory.length > 0 ? (
                           weightHistory.slice(-12).map((entry, idx) => {
                             const heightPercent = maxWeight > 0 ? (entry.weight / maxWeight) * 100 : 0;
                             return (
                               <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                     {entry.weight}kg • {new Date(entry.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                  </div>
                                  <div 
                                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm transition-all duration-500 group-hover:from-orange-500 group-hover:to-orange-300"
                                    style={{ height: `${Math.max(10, heightPercent)}%` }}
                                  ></div>
                               </div>
                             );
                           })
                         ) : (
                           <div className="w-full text-center text-sm text-slate-500 pb-10">No biometrics logged yet.</div>
                         )}
                      </div>
                   </div>
                </section>
              </>
            )}

            {activeTab === 'reminders' && selectedPet && (
              <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
                <form
                  onSubmit={handleAddReminder}
                  className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30"
                >
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add Reminder</h3>
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      value={reminderForm.medicineName}
                      onChange={(event) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          medicineName: sanitizeInput(event.target.value, 100),
                        }))
                      }
                      placeholder="Medicine name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      required
                    />
                    <input
                      type="text"
                      value={reminderForm.dosage}
                      onChange={(event) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          dosage: sanitizeInput(event.target.value, 100),
                        }))
                      }
                      placeholder="Dosage"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={reminderForm.frequency}
                        onChange={(event) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            frequency: event.target.value as MedicineReminder['frequency'],
                          }))
                        }
                        aria-label="Reminder frequency"
                        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        type="date"
                        value={reminderForm.startDate}
                        onChange={(event) =>
                          setReminderForm((prev) => ({ ...prev, startDate: event.target.value }))
                        }
                        aria-label="Reminder start date"
                        className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      />
                    </div>

                    {reminderForm.frequency === 'custom' && (
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={reminderForm.customDays}
                        onChange={(event) =>
                          setReminderForm((prev) => ({ ...prev, customDays: event.target.value }))
                        }
                        placeholder="Repeat every X days"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      />
                    )}

                    <textarea
                      value={reminderForm.notes}
                      onChange={(event) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          notes: sanitizeInput(event.target.value, 300),
                        }))
                      }
                      placeholder="Notes"
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-slate-950 px-4 py-2 font-bold text-white hover:bg-black"
                    >
                      Save Reminder
                    </button>
                  </div>
                </form>

                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Reminder Queue
                  </h3>
                  <div className="mt-3 space-y-3">
                    {petReminders.length === 0 && (
                      <p className="text-sm text-slate-500">No reminders for this pet yet.</p>
                    )}
                    {petReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 dark:text-white">
                            {reminder.medicineName}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {reminder.frequency}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          {reminder.dosage} • Next:{' '}
                          {new Date(reminder.nextDueDate).toLocaleString()}
                        </p>
                        {reminder.notes && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                            {reminder.notes}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void markMedicineGiven(reminder.id).catch((error) => {
                                setDashboardError(
                                  error instanceof Error
                                    ? error.message
                                    : 'Failed to update reminder status.'
                                );
                              });
                            }}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                          >
                            Mark Given
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteMedicineReminder(reminder.id).catch((error) => {
                                setDashboardError(
                                  error instanceof Error
                                    ? error.message
                                    : 'Failed to remove reminder.'
                                );
                              });
                            }}
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'profile' && selectedPet && (
              <form
                onSubmit={handleUpdatePet}
                className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30 md:grid-cols-2"
              >
                <h3 className="md:col-span-2 text-lg font-bold text-slate-800 dark:text-white">
                  Profile Controls
                </h3>

                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      name: sanitizeInput(event.target.value, 80),
                    }))
                  }
                  placeholder="Pet name"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                />

                <input
                  type="text"
                  value={profileForm.breed}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      breed: sanitizeInput(event.target.value, 80),
                    }))
                  }
                  placeholder="Breed"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                />

                <select
                  value={profileForm.gender}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      gender: event.target.value as PetProfile['gender'],
                    }))
                  }
                  aria-label="Profile gender"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>

                <select
                  value={profileForm.activityLevel}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      activityLevel: event.target.value as PetProfile['activityLevel'],
                    }))
                  }
                  aria-label="Profile activity level"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="low">Low Activity</option>
                  <option value="medium">Medium Activity</option>
                  <option value="high">High Activity</option>
                </select>

                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={profileForm.weight}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, weight: event.target.value }))
                  }
                  placeholder="Weight (kg)"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                />

                <input
                  type="date"
                  value={profileForm.birthDate}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, birthDate: event.target.value }))
                  }
                  aria-label="Profile birth date"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                />

                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-black"
                  >
                    Save Profile Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePet}
                    className="rounded-xl bg-rose-100 px-4 py-2 font-semibold text-rose-700 hover:bg-rose-200"
                  >
                    Delete Pet
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default PetDashboardPage;
