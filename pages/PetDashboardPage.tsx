import React, { useState, useEffect } from 'react';
import { usePetManagement, PetProfile, MedicineReminder } from '../contexts/PetManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PawIcon, HeartIcon } from '../components/icons';
import { generateText } from '../services/geminiService';

const PetDashboardPage: React.FC = () => {
  const {
    pets,
    addPet,
    deletePet,
    updatePet,
    medicineReminders,
    addMedicineReminder,
    markMedicineGiven,
    getUpcomingReminders,
  } = usePetManagement();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'nutrition' | 'add-pet'>(
    'overview'
  );
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const upcomingReminders = getUpcomingReminders(7);

  const calculateFoodPortion = (pet: PetProfile) => {
    if (!pet.weight) return null;

    // Simple calculation for demo purposes
    // Dog: RER = 70 * (weight in kg ^ 0.75)
    // Cat: RER = 70 * (weight in kg ^ 0.75) * 1.2

    const weightInKg = pet.weight;
    const rer = 70 * Math.pow(weightInKg, 0.75);

    let dailyCalories = rer;
    if (pet.type === 'cat') dailyCalories *= 1.2;
    if (pet.activityLevel === 'high') dailyCalories *= 1.5;
    if (pet.activityLevel === 'low') dailyCalories *= 0.8;

    return Math.round(dailyCalories);
  };

  const getAiHealthTip = async () => {
    if (!selectedPet) return;

    setLoadingAi(true);
    try {
      const prompt = `Provide a short, personalized health tip for a ${selectedPet.activityLevel} energy ${selectedPet.gender} ${selectedPet.breed || selectedPet.type} named ${selectedPet.name} who weighs ${selectedPet.weight || 'unknown'}kg in Bangladesh climate.`;
      const tip = await generateText(prompt);
      setAiAnalysis(tip);
    } catch (error) {
      console.error(error);
      setAiAnalysis(
        'Stay hydrated! Especially in our humid weather, make sure your pet has fresh water always available.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const AddPetForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'dog' as const,
      gender: 'male' as const,
      breed: '',
      weight: '',
      activityLevel: 'medium' as const,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addPet({
        ...formData,
        weight: parseFloat(formData.weight) || undefined,
        activityLevel: formData.activityLevel as any,
      });
      setActiveTab('overview');
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm"
      >
        <h3 className="text-xl font-bold mb-4">Add New Pet</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-lg dark:bg-slate-700"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full p-2 border rounded-lg dark:bg-slate-700"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Breed</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg dark:bg-slate-700"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 border rounded-lg dark:bg-slate-700"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            className="w-full p-2 border rounded-lg dark:bg-slate-700"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Activity Level</label>
          <select
            className="w-full p-2 border rounded-lg dark:bg-slate-700"
            value={formData.activityLevel}
            onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
          >
            <option value="low">Low (Couch Potato)</option>
            <option value="medium">Medium (Daily Walks)</option>
            <option value="high">High (Very Active)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-bold"
        >
          Add Family Member 🐾
        </button>
      </form>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Pet Family</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Manage health, nutrition, and happiness
          </p>
        </div>
        <button
          onClick={() => setActiveTab('add-pet')}
          className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition"
        >
          + Add Pet
        </button>
      </header>

      {pets.length === 0 && activeTab !== 'add-pet' ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <PawIcon className="w-20 h-20 mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No pets added yet</h2>
          <p className="mb-6 text-slate-500">
            Add your furry friends to start tracking their health!
          </p>
          <button
            onClick={() => setActiveTab('add-pet')}
            className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 shadow-lg"
          >
            Add Your First Pet
          </button>
        </div>
      ) : activeTab === 'add-pet' ? (
        <AddPetForm />
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3">
                Your Pets
              </h3>
              <div className="space-y-2">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                      selectedPetId === pet.id
                        ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                      {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐾'}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 dark:text-white">{pet.name}</p>
                      <p className="text-xs text-slate-500">{pet.breed || pet.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3">
                Upcoming Reminders
              </h3>
              {upcomingReminders.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start space-x-3 border-l-2 border-red-500 pl-3"
                    >
                      <div>
                        <p className="font-bold text-sm">{reminder.medicineName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(reminder.nextDueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markMedicineGiven(reminder.id)}
                        className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Done
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No pending medicines 🎉</p>
              )}
              <button
                onClick={() => {
                  /* TODO: Open Add Reminder Modal */
                }}
                className="w-full mt-4 text-xs text-center text-orange-600 font-bold hover:underline"
              >
                + Add Medication Reminder
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {selectedPet && (
              <>
                {/* Pet Header */}
                <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-4 border-white/30">
                      {selectedPet.type === 'cat' ? '🐱' : selectedPet.type === 'dog' ? '🐶' : '🐰'}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{selectedPet.name}</h2>
                      <p className="opacity-90">
                        {selectedPet.breed} •{' '}
                        {selectedPet.gender === 'male' ? '♂️ Male' : '♀️ Female'} •{' '}
                        {selectedPet.birthDate
                          ? `${Math.floor(
                              (new Date().getTime() - new Date(selectedPet.birthDate).getTime()) /
                                (365.25 * 24 * 60 * 60 * 1000)
                            )} years`
                          : 'Age Unknown'}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                          {selectedPet.weight ? `${selectedPet.weight} kg` : 'Weight unknown'}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm capitalize">
                          Activity: {selectedPet.activityLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <PawIcon className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 border-b dark:border-slate-700 overflow-x-auto">
                  {['overview', 'health', 'nutrition'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-3 font-bold capitalize whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'text-slate-500 hover:text-orange-500'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Daily Nutrition</h3>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <span className="text-green-600 font-bold">Recommended</span>
                        </div>
                      </div>

                      <div className="text-center py-6">
                        <div className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
                          {calculateFoodPortion(selectedPet) || '?'}
                          <span className="text-lg text-slate-500 ml-1">kcal/day</span>
                        </div>
                        <p className="text-slate-500 text-sm">
                          Based on {selectedPet.weight}kg weight & {selectedPet.activityLevel}{' '}
                          activity
                        </p>
                      </div>

                      <button className="w-full mt-2 py-2 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 font-semibold transition">
                        Detailed Feeding Plan
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <HeartIcon className="w-5 h-5 text-red-500" />
                        AI Health Insight
                      </h3>
                      <div className="bg-indigo-50 dark:bg-slate-900 rounded-lg p-4 min-h-[120px] text-sm leading-relaxed">
                        {loadingAi ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-2 bg-indigo-200 rounded w-3/4"></div>
                            <div className="h-2 bg-indigo-200 rounded w-1/2"></div>
                          </div>
                        ) : aiAnalysis ? (
                          <p>{aiAnalysis}</p>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-slate-500 mb-3">
                              Get personalized tips for {selectedPet.name}
                            </p>
                            <button
                              onClick={getAiHealthTip}
                              className="bg-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-600"
                            >
                              Generate Insight ✨
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Weight graph placeholder */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Weight History</h3>
                  <div className="h-48 flex items-end justify-between space-x-2 px-4 border-b border-l border-slate-200 dark:border-slate-700 pb-2">
                    {/* Mock bars */}
                    {[40, 42, 45, 43, 46, 50, 50].map((h, i) => (
                      <div
                        key={i}
                        className="w-full bg-orange-200 dark:bg-orange-900/40 rounded-t hover:bg-orange-400 transition-colors relative group"
                        style={{ height: `${h}%` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {selectedPet.weight}kg
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 px-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default PetDashboardPage;
