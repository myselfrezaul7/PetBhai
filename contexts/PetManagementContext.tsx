import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiRequest, getErrorMessage } from '../services/apiClient';

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
  strayAnimalsFed: number;
  vaccinationsFunded: number;
  totalDonations: number;
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
  addPet: (
    pet: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt' | 'weightHistory'>
  ) => Promise<PetProfile>;
  updatePet: (id: string, updates: Partial<PetProfile>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  getPetById: (id: string) => PetProfile | undefined;
  addWeightEntry: (petId: string, weight: number) => Promise<void>;

  // Medicine Reminders
  medicineReminders: MedicineReminder[];
  addMedicineReminder: (reminder: Omit<MedicineReminder, 'id'>) => Promise<MedicineReminder>;
  updateMedicineReminder: (id: string, updates: Partial<MedicineReminder>) => Promise<void>;
  deleteMedicineReminder: (id: string) => Promise<void>;
  markMedicineGiven: (id: string) => Promise<void>;
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
  updateImpactStats: (stats: Partial<ImpactStats>) => void;
}

const PetManagementContext = createContext<PetManagementContextType | undefined>(undefined);

const PRICE_ALERTS_KEY = 'petbhai_price_alerts';
const GROUP_BUYS_KEY = 'petbhai_group_buys';
const IMPACT_KEY = 'petbhai_impact_stats';
const TOKEN_STORAGE_KEY = 'petbhai_token';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_IMPACT_STATS: ImpactStats = {
  strayAnimalsFed: 0,
  vaccinationsFunded: 0,
  totalDonations: 0,
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
  const toast = useToast();
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuyItem[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStats>(() => {
    try {
        const stored = safeStorage.getItem(IMPACT_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_IMPACT_STATS;
    } catch {
        return DEFAULT_IMPACT_STATS;
    }
  });

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error('Session expired. Please sign in again.');
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const syncPetManagementFromServer = useCallback(async () => {
    if (!currentUser?.id) {
      setPets([]);
      setMedicineReminders([]);
      return;
    }

    const payload = await apiRequest<{
      pets?: PetProfile[];
      medicineReminders?: MedicineReminder[];
    }>(`/auth/${currentUser.id}/pet-management`, {
      headers: getAuthHeaders(),
    });

    setPets(Array.isArray(payload?.pets) ? payload.pets : []);
    setMedicineReminders(
      Array.isArray(payload?.medicineReminders) ? payload.medicineReminders : []
    );
  }, [currentUser?.id, getAuthHeaders]);

  // Load data on user change
  useEffect(() => {
    let isMounted = true;

    const loadPetData = async () => {
      if (currentUser?.id) {
        try {
          await syncPetManagementFromServer();
        } catch (error) {
          if (isMounted) {
            setPets([]);
            setMedicineReminders([]);
          }
          console.error(getErrorMessage(error, 'Failed to load pet dashboard data.'));
        }

        try {
          const storedAlerts = safeStorage.getItem(`${PRICE_ALERTS_KEY}_${currentUser.id}`);
          if (isMounted) {
            setPriceAlerts(storedAlerts ? JSON.parse(storedAlerts) : []);
          }
        } catch {
          if (isMounted) {
            setPriceAlerts([]);
          }
        }
      } else {
        if (isMounted) {
          setPets([]);
          setMedicineReminders([]);
          setPriceAlerts([]);
        }
      }
    };

    void loadPetData();

    // Load global data
    try {
      const storedGroupBuys = safeStorage.getItem(GROUP_BUYS_KEY);
      setGroupBuys(storedGroupBuys ? JSON.parse(storedGroupBuys) : []);

      const storedImpact = safeStorage.getItem(IMPACT_KEY);
      setImpactStats(storedImpact ? JSON.parse(storedImpact) : DEFAULT_IMPACT_STATS);
    } catch {
      setGroupBuys([]);
      setImpactStats(DEFAULT_IMPACT_STATS);
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, syncPetManagementFromServer]);

  // Save price alerts
  useEffect(() => {
    if (currentUser?.id && priceAlerts.length >= 0) {
      try {
        safeStorage.setItem(`${PRICE_ALERTS_KEY}_${currentUser.id}`, JSON.stringify(priceAlerts));
      } catch (e) {
        console.warn('Failed to save price alerts to safeStorage', e);
      }
    }
  }, [priceAlerts, currentUser?.id]);

  // Save group buys (global)
  useEffect(() => {
    try {
      safeStorage.setItem(GROUP_BUYS_KEY, JSON.stringify(groupBuys));
    } catch (e) {
      console.warn('Failed to save group buys to safeStorage', e);
    }
  }, [groupBuys]);

  // Save impact stats (global)
  useEffect(() => {
    try {
      safeStorage.setItem(IMPACT_KEY, JSON.stringify(impactStats));
    } catch (e) {
      console.warn('Failed to save impact stats to safeStorage', e);
    }
  }, [impactStats]);

  // Pet Profile Methods
  const addPet = useCallback(
    async (
      petData: Omit<PetProfile, 'id' | 'createdAt' | 'updatedAt' | 'weightHistory'>
    ): Promise<PetProfile> => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to add pets.');
      }

      try {
        const response = await apiRequest<{
          pet: PetProfile;
          pets: PetProfile[];
          medicineReminders: MedicineReminder[];
        }>(`/auth/${currentUser.id}/pets`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(petData),
        });

        setPets(Array.isArray(response?.pets) ? response.pets : []);
        setMedicineReminders(
          Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
        );

        return response.pet;
      } catch (error) {
        console.error('Failed to add pet:', error);
        toast.error(getErrorMessage(error) || 'Failed to add pet');
        throw error;
      }
    },
    [currentUser?.id, getAuthHeaders, toast]
  );

  const updatePet = useCallback(
    async (id: string, updates: Partial<PetProfile>) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to update pets.');
      }

      try {
        const response = await apiRequest<{
          pets: PetProfile[];
          medicineReminders: MedicineReminder[];
        }>(`/auth/${currentUser.id}/pets/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        });

        setPets(Array.isArray(response?.pets) ? response.pets : []);
        setMedicineReminders(
          Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
        );
      } catch (error) {
        console.error('Failed to update pet:', error);
        toast.error(getErrorMessage(error) || 'Failed to update pet');
        throw error;
      }
    },
    [currentUser?.id, getAuthHeaders, toast]
  );

  const deletePet = useCallback(
    async (id: string) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to delete pets.');
      }

      try {
        const response = await apiRequest<{
          pets: PetProfile[];
          medicineReminders: MedicineReminder[];
        }>(`/auth/${currentUser.id}/pets/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        setPets(Array.isArray(response?.pets) ? response.pets : []);
        setMedicineReminders(
          Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
        );
      } catch (error) {
        console.error('Failed to delete pet:', error);
        toast.error(getErrorMessage(error) || 'Failed to delete pet');
        throw error;
      }
    },
    [currentUser?.id, getAuthHeaders, toast]
  );

  const getPetById = useCallback((id: string) => pets.find((p) => p.id === id), [pets]);

  const addWeightEntry = useCallback(
    async (petId: string, weight: number) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to update weight entries.');
      }

      try {
        const response = await apiRequest<{
          pets: PetProfile[];
          medicineReminders: MedicineReminder[];
        }>(`/auth/${currentUser.id}/pets/${encodeURIComponent(petId)}/weights`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ weight }),
        });

        setPets(Array.isArray(response?.pets) ? response.pets : []);
        setMedicineReminders(
          Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
        );
      } catch (error) {
        console.error('Failed to add weight entry:', error);
        toast.error(getErrorMessage(error) || 'Failed to add weight entry');
        throw error;
      }
    },
    [currentUser?.id, getAuthHeaders, toast]
  );

  // Medicine Reminder Methods
  const addMedicineReminder = useCallback(
    async (reminderData: Omit<MedicineReminder, 'id'>): Promise<MedicineReminder> => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to add reminders.');
      }

      const response = await apiRequest<{
        reminder: MedicineReminder;
        pets: PetProfile[];
        medicineReminders: MedicineReminder[];
      }>(`/auth/${currentUser.id}/reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reminderData),
      });

      setPets(Array.isArray(response?.pets) ? response.pets : []);
      setMedicineReminders(
        Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
      );

      return response.reminder;
    },
    [currentUser?.id, getAuthHeaders]
  );

  const updateMedicineReminder = useCallback(
    async (id: string, updates: Partial<MedicineReminder>) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to update reminders.');
      }

      const response = await apiRequest<{
        pets: PetProfile[];
        medicineReminders: MedicineReminder[];
      }>(`/auth/${currentUser.id}/reminders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      setPets(Array.isArray(response?.pets) ? response.pets : []);
      setMedicineReminders(
        Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
      );
    },
    [currentUser?.id, getAuthHeaders]
  );

  const deleteMedicineReminder = useCallback(
    async (id: string) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to delete reminders.');
      }

      const response = await apiRequest<{
        pets: PetProfile[];
        medicineReminders: MedicineReminder[];
      }>(`/auth/${currentUser.id}/reminders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      setPets(Array.isArray(response?.pets) ? response.pets : []);
      setMedicineReminders(
        Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
      );
    },
    [currentUser?.id, getAuthHeaders]
  );

  const markMedicineGiven = useCallback(
    async (id: string) => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to update reminders.');
      }

      const response = await apiRequest<{
        pets: PetProfile[];
        medicineReminders: MedicineReminder[];
      }>(`/auth/${currentUser.id}/reminders/${encodeURIComponent(id)}/mark-given`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      setPets(Array.isArray(response?.pets) ? response.pets : []);
      setMedicineReminders(
        Array.isArray(response?.medicineReminders) ? response.medicineReminders : []
      );
    },
    [currentUser?.id, getAuthHeaders]
  );

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

  const updateImpactStats = useCallback(
    (stats: Partial<ImpactStats>) => {
      setImpactStats((prev) => ({ ...prev, ...stats }));
    },
    [setImpactStats]
  );

  const value = useMemo(
    () => ({
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
      updateImpactStats,
    }),
    [
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
      updateImpactStats,
    ]
  );

  return <PetManagementContext.Provider value={value}>{children}</PetManagementContext.Provider>;
};

export const usePetManagement = () => {
  const context = useContext(PetManagementContext);
  if (!context) {
    throw new Error('usePetManagement must be used within a PetManagementProvider');
  }
  return context;
};
