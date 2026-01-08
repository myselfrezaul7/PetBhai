import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Types
export interface MedicineReminder {
  id: string;
  petId: string;
  medicineName: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number;
  startDate: string;
  nextDueDate: string;
  notes?: string;
  isActive: boolean;
  lastGivenDate?: string;
  notificationEnabled: boolean;
}

export interface PetWeight {
  date: string;
  weight: number; // in kg
}

export interface PetProfile {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'other';
  breed?: string;
  birthDate?: string;
  adoptionDate?: string;
  gender: 'male' | 'female' | 'unknown';
  weight?: number; // current weight in kg
  weightHistory: PetWeight[];
  imageUrl?: string;
  color?: string;
  microchipId?: string;
  isNeutered?: boolean;
  allergies?: string[];
  medicalNotes?: string;
  favoriteFood?: string;
  activityLevel: 'low' | 'medium' | 'high';
  feedingSchedule?: {
    times: string[];
    portionSize: string;
    foodType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlert {
  id: string;
  productId: number;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
  isTriggered: boolean;
  notifiedAt?: string;
}

export interface GroupBuyItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  originalPrice: number;
  groupPrice: number;
  minParticipants: number;
  currentParticipants: number;
  maxParticipants: number;
  expiresAt: string;
  createdBy: number;
  participants: number[];
  status: 'active' | 'completed' | 'expired' | 'cancelled';
}

export interface ImpactStats {
  animalsHelped: number;
  mealsProvided: number;
  adoptionsCompleted: number;
  volunteersEngaged: number;
  donationsRaised: number;
  rescueOperations: number;
  veterinaryCareSessions: number;
  communityEvents: number;
}

interface PetManagementContextType {
  // Pet Profiles
  pets: PetProfile[];
  addPet: (pet: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt' | 'weightHistory'>) => PetProfile;
  updatePet: (id: string, updates: Partial<PetProfile>) => void;
  deletePet: (id: string) => void;
  getPetById: (id: string) => PetProfile | undefined;
  addWeightEntry: (petId: string, weight: number) => void;

  // Medicine Reminders
  medicineReminders: MedicineReminder[];
  addMedicineReminder: (reminder: Omit<MedicineReminder, 'id'>) => MedicineReminder;
  updateMedicineReminder: (id: string, updates: Partial<MedicineReminder>) => void;
  deleteMedicineReminder: (id: string) => void;
  markMedicineGiven: (id: string) => void;
  getUpcomingReminders: (daysAhead?: number) => MedicineReminder[];
  getOverdueReminders: () => MedicineReminder[];

  // Price Alerts
  priceAlerts: PriceAlert[];
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>) => PriceAlert;
  removePriceAlert: (id: string) => void;
  checkPriceAlerts: (products: { id: number; price: number }[]) => PriceAlert[];

  // Group Buying
  groupBuys: GroupBuyItem[];
  createGroupBuy: (
    item: Omit<GroupBuyItem, 'id' | 'currentParticipants' | 'participants' | 'status'>
  ) => GroupBuyItem;
  joinGroupBuy: (groupBuyId: string) => boolean;
  leaveGroupBuy: (groupBuyId: string) => void;
  getActiveGroupBuys: () => GroupBuyItem[];

  // Impact Stats
  impactStats: ImpactStats;
  incrementImpact: (key: keyof ImpactStats, amount?: number) => void;
}

const PetManagementContext = createContext<PetManagementContextType | undefined>(undefined);

const PETS_KEY = 'petbhai_pet_profiles';
const REMINDERS_KEY = 'petbhai_medicine_reminders';
const PRICE_ALERTS_KEY = 'petbhai_price_alerts';
const GROUP_BUYS_KEY = 'petbhai_group_buys';
const IMPACT_KEY = 'petbhai_impact_stats';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_IMPACT_STATS: ImpactStats = {
  animalsHelped: 1247,
  mealsProvided: 15680,
  adoptionsCompleted: 342,
  volunteersEngaged: 89,
  donationsRaised: 485000,
  rescueOperations: 156,
  veterinaryCareSessions: 892,
  communityEvents: 24,
};

export const PetManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [medicineReminders, setMedicineReminders] = useState<MedicineReminder[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuyItem[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStats>(DEFAULT_IMPACT_STATS);

  // Load data on user change
  useEffect(() => {
    if (currentUser?.id) {
      try {
        const storedPets = localStorage.getItem(`${PETS_KEY}_${currentUser.id}`);
        setPets(storedPets ? JSON.parse(storedPets) : []);

        const storedReminders = localStorage.getItem(`${REMINDERS_KEY}_${currentUser.id}`);
        setMedicineReminders(storedReminders ? JSON.parse(storedReminders) : []);

        const storedAlerts = localStorage.getItem(`${PRICE_ALERTS_KEY}_${currentUser.id}`);
        setPriceAlerts(storedAlerts ? JSON.parse(storedAlerts) : []);
      } catch {
        setPets([]);
        setMedicineReminders([]);
        setPriceAlerts([]);
      }
    } else {
      setPets([]);
      setMedicineReminders([]);
      setPriceAlerts([]);
    }

    // Load global data
    try {
      const storedGroupBuys = localStorage.getItem(GROUP_BUYS_KEY);
      setGroupBuys(storedGroupBuys ? JSON.parse(storedGroupBuys) : []);

      const storedImpact = localStorage.getItem(IMPACT_KEY);
      setImpactStats(storedImpact ? JSON.parse(storedImpact) : DEFAULT_IMPACT_STATS);
    } catch {
      setGroupBuys([]);
      setImpactStats(DEFAULT_IMPACT_STATS);
    }
  }, [currentUser?.id]);

  // Save pets
  useEffect(() => {
    if (currentUser?.id && pets.length >= 0) {
      localStorage.setItem(`${PETS_KEY}_${currentUser.id}`, JSON.stringify(pets));
    }
  }, [pets, currentUser?.id]);

  // Save reminders
  useEffect(() => {
    if (currentUser?.id && medicineReminders.length >= 0) {
      localStorage.setItem(`${REMINDERS_KEY}_${currentUser.id}`, JSON.stringify(medicineReminders));
    }
  }, [medicineReminders, currentUser?.id]);

  // Save price alerts
  useEffect(() => {
    if (currentUser?.id && priceAlerts.length >= 0) {
      localStorage.setItem(`${PRICE_ALERTS_KEY}_${currentUser.id}`, JSON.stringify(priceAlerts));
    }
  }, [priceAlerts, currentUser?.id]);

  // Save group buys (global)
  useEffect(() => {
    localStorage.setItem(GROUP_BUYS_KEY, JSON.stringify(groupBuys));
  }, [groupBuys]);

  // Save impact stats (global)
  useEffect(() => {
    localStorage.setItem(IMPACT_KEY, JSON.stringify(impactStats));
  }, [impactStats]);

  // Pet Profile Methods
  const addPet = useCallback(
    (petData: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt' | 'weightHistory'>): PetProfile => {
      const now = new Date().toISOString();
      const newPet: PetProfile = {
        ...petData,
        id: generateId(),
        weightHistory: petData.weight ? [{ date: now, weight: petData.weight }] : [],
        createdAt: now,
        updatedAt: now,
      };
      setPets((prev) => [...prev, newPet]);
      return newPet;
    },
    []
  );

  const updatePet = useCallback((id: string, updates: Partial<PetProfile>) => {
    setPets((prev) =>
      prev.map((pet) =>
        pet.id === id ? { ...pet, ...updates, updatedAt: new Date().toISOString() } : pet
      )
    );
  }, []);

  const deletePet = useCallback((id: string) => {
    setPets((prev) => prev.filter((pet) => pet.id !== id));
    setMedicineReminders((prev) => prev.filter((r) => r.petId !== id));
  }, []);

  const getPetById = useCallback((id: string) => pets.find((p) => p.id === id), [pets]);

  const addWeightEntry = useCallback((petId: string, weight: number) => {
    setPets((prev) =>
      prev.map((pet) =>
        pet.id === petId
          ? {
              ...pet,
              weight,
              weightHistory: [...pet.weightHistory, { date: new Date().toISOString(), weight }],
              updatedAt: new Date().toISOString(),
            }
          : pet
      )
    );
  }, []);

  // Medicine Reminder Methods
  const addMedicineReminder = useCallback(
    (reminderData: Omit<MedicineReminder, 'id'>): MedicineReminder => {
      const newReminder: MedicineReminder = {
        ...reminderData,
        id: generateId(),
      };
      setMedicineReminders((prev) => [...prev, newReminder]);
      return newReminder;
    },
    []
  );

  const updateMedicineReminder = useCallback((id: string, updates: Partial<MedicineReminder>) => {
    setMedicineReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const deleteMedicineReminder = useCallback((id: string) => {
    setMedicineReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const markMedicineGiven = useCallback((id: string) => {
    setMedicineReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const now = new Date();
        let nextDue = new Date();

        switch (r.frequency) {
          case 'daily':
            nextDue.setDate(nextDue.getDate() + 1);
            break;
          case 'weekly':
            nextDue.setDate(nextDue.getDate() + 7);
            break;
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'custom':
            nextDue.setDate(nextDue.getDate() + (r.customDays || 1));
            break;
        }

        return {
          ...r,
          lastGivenDate: now.toISOString(),
          nextDueDate: nextDue.toISOString(),
        };
      })
    );
  }, []);

  const getUpcomingReminders = useCallback(
    (daysAhead: number = 7): MedicineReminder[] => {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + daysAhead);

      return medicineReminders
        .filter((r) => {
          if (!r.isActive) return false;
          const due = new Date(r.nextDueDate);
          return due >= now && due <= future;
        })
        .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    },
    [medicineReminders]
  );

  const getOverdueReminders = useCallback((): MedicineReminder[] => {
    const now = new Date();
    return medicineReminders
      .filter((r) => r.isActive && new Date(r.nextDueDate) < now)
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [medicineReminders]);

  // Price Alert Methods
  const addPriceAlert = useCallback(
    (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>): PriceAlert => {
      const newAlert: PriceAlert = {
        ...alertData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        isTriggered: false,
      };
      setPriceAlerts((prev) => [...prev, newAlert]);
      return newAlert;
    },
    []
  );

  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const checkPriceAlerts = useCallback(
    (products: { id: number; price: number }[]): PriceAlert[] => {
      const triggered: PriceAlert[] = [];

      setPriceAlerts((prev) =>
        prev.map((alert) => {
          const product = products.find((p) => p.id === alert.productId);
          if (product && product.price <= alert.targetPrice && !alert.isTriggered) {
            triggered.push({ ...alert, isTriggered: true, currentPrice: product.price });
            return {
              ...alert,
              isTriggered: true,
              currentPrice: product.price,
              notifiedAt: new Date().toISOString(),
            };
          }
          if (product) {
            return { ...alert, currentPrice: product.price };
          }
          return alert;
        })
      );

      return triggered;
    },
    []
  );

  // Group Buy Methods
  const createGroupBuy = useCallback(
    (
      itemData: Omit<GroupBuyItem, 'id' | 'currentParticipants' | 'participants' | 'status'>
    ): GroupBuyItem => {
      if (!currentUser) throw new Error('Must be logged in');

      const newGroupBuy: GroupBuyItem = {
        ...itemData,
        id: generateId(),
        currentParticipants: 1,
        participants: [currentUser.id],
        status: 'active',
      };
      setGroupBuys((prev) => [...prev, newGroupBuy]);
      return newGroupBuy;
    },
    [currentUser]
  );

  const joinGroupBuy = useCallback(
    (groupBuyId: string): boolean => {
      if (!currentUser) return false;

      let success = false;
      setGroupBuys((prev) =>
        prev.map((gb) => {
          if (gb.id !== groupBuyId) return gb;
          if (gb.participants.includes(currentUser.id)) return gb;
          if (gb.currentParticipants >= gb.maxParticipants) return gb;
          if (gb.status !== 'active') return gb;

          success = true;
          const newParticipants = [...gb.participants, currentUser.id];
          const isCompleted = newParticipants.length >= gb.minParticipants;

          return {
            ...gb,
            participants: newParticipants,
            currentParticipants: newParticipants.length,
            status: isCompleted ? 'completed' : 'active',
          };
        })
      );
      return success;
    },
    [currentUser]
  );

  const leaveGroupBuy = useCallback(
    (groupBuyId: string) => {
      if (!currentUser) return;

      setGroupBuys((prev) =>
        prev.map((gb) => {
          if (gb.id !== groupBuyId) return gb;
          if (!gb.participants.includes(currentUser.id)) return gb;
          if (gb.createdBy === currentUser.id) return gb; // Creator can't leave

          const newParticipants = gb.participants.filter((p) => p !== currentUser.id);
          return {
            ...gb,
            participants: newParticipants,
            currentParticipants: newParticipants.length,
            status: 'active',
          };
        })
      );
    },
    [currentUser]
  );

  const getActiveGroupBuys = useCallback((): GroupBuyItem[] => {
    const now = new Date();
    return groupBuys.filter((gb) => gb.status === 'active' && new Date(gb.expiresAt) > now);
  }, [groupBuys]);

  // Impact Stats Methods
  const incrementImpact = useCallback((key: keyof ImpactStats, amount: number = 1) => {
    setImpactStats((prev) => ({
      ...prev,
      [key]: prev[key] + amount,
    }));
  }, []);

  return (
    <PetManagementContext.Provider
      value={{
        pets,
        addPet,
        updatePet,
        deletePet,
        getPetById,
        addWeightEntry,
        medicineReminders,
        addMedicineReminder,
        updateMedicineReminder,
        deleteMedicineReminder,
        markMedicineGiven,
        getUpcomingReminders,
        getOverdueReminders,
        priceAlerts,
        addPriceAlert,
        removePriceAlert,
        checkPriceAlerts,
        groupBuys,
        createGroupBuy,
        joinGroupBuy,
        leaveGroupBuy,
        getActiveGroupBuys,
        impactStats,
        incrementImpact,
      }}
    >
      {children}
    </PetManagementContext.Provider>
  );
};

export const usePetManagement = () => {
  const context = useContext(PetManagementContext);
  if (!context) {
    throw new Error('usePetManagement must be used within a PetManagementProvider');
  }
  return context;
};
