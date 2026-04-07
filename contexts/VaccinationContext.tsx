import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Pet, VaccinationRecord } from '../types';
import { useAuth } from './AuthContext';

const PETS_STORAGE_KEY = 'petbhai_pets';
const VACCINATIONS_STORAGE_KEY = 'petbhai_vaccinations';

interface VaccinationContextType {
  pets: Pet[];
  vaccinations: VaccinationRecord[];
  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => Pet;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  addVaccination: (vaccination: Omit<VaccinationRecord, 'id'>) => VaccinationRecord;
  updateVaccination: (id: string, updates: Partial<VaccinationRecord>) => void;
  deleteVaccination: (id: string) => void;
  getUpcomingVaccinations: (daysAhead?: number) => VaccinationRecord[];
  getOverdueVaccinations: () => VaccinationRecord[];
  getPetVaccinations: (petId: string) => VaccinationRecord[];
  markVaccinationComplete: (id: string, nextDueDate?: string) => void;
}

const VaccinationContext = createContext<VaccinationContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load from safeStorage
const loadPets = (userId: number | undefined): Pet[] => {
  if (!userId) return [];
  try {
    const stored = safeStorage.getItem(`${PETS_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadVaccinations = (userId: number | undefined): VaccinationRecord[] => {
  if (!userId) return [];
  try {
    const stored = safeStorage.getItem(`${VACCINATIONS_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const VaccinationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);

  // Load data when user changes
  useEffect(() => {
    if (currentUser?.id) {
      setPets(loadPets(currentUser.id));
      setVaccinations(loadVaccinations(currentUser.id));
    } else {
      setPets([]);
      setVaccinations([]);
    }
  }, [currentUser?.id]);

  // Save pets to safeStorage
  useEffect(() => {
    if (currentUser?.id) {
      try {
        safeStorage.setItem(`${PETS_STORAGE_KEY}_${currentUser.id}`, JSON.stringify(pets));
      } catch (e) {
        console.warn('Failed to save pets to safeStorage', e);
      }
    }
  }, [pets, currentUser?.id]);

  // Save vaccinations to safeStorage
  useEffect(() => {
    if (currentUser?.id) {
      try {
        safeStorage.setItem(
          `${VACCINATIONS_STORAGE_KEY}_${currentUser.id}`,
          JSON.stringify(vaccinations)
        );
      } catch (e) {
        console.warn('Failed to save vaccinations to safeStorage', e);
      }
    }
  }, [vaccinations, currentUser?.id]);

  const addPet = useCallback((petData: Omit<Pet, 'id' | 'createdAt'>): Pet => {
    const newPet: Pet = {
      ...petData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPets((prev) => [...prev, newPet]);
    return newPet;
  }, []);

  const updatePet = useCallback((id: string, updates: Partial<Pet>) => {
    setPets((prev) => prev.map((pet) => (pet.id === id ? { ...pet, ...updates } : pet)));
  }, []);

  const deletePet = useCallback((id: string) => {
    setPets((prev) => prev.filter((pet) => pet.id !== id));
    // Also delete associated vaccinations
    setVaccinations((prev) => prev.filter((v) => v.petId !== id));
  }, []);

  const addVaccination = useCallback(
    (vaccinationData: Omit<VaccinationRecord, 'id'>): VaccinationRecord => {
      const newVaccination: VaccinationRecord = {
        ...vaccinationData,
        id: generateId(),
      };
      setVaccinations((prev) => [...prev, newVaccination]);
      return newVaccination;
    },
    []
  );

  const updateVaccination = useCallback((id: string, updates: Partial<VaccinationRecord>) => {
    setVaccinations((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }, []);

  const deleteVaccination = useCallback((id: string) => {
    setVaccinations((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const getUpcomingVaccinations = useCallback(
    (daysAhead: number = 30): VaccinationRecord[] => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      return vaccinations
        .filter((v) => {
          if (v.isCompleted) return false;
          const dueDate = new Date(v.nextDueDate);
          return dueDate >= now && dueDate <= futureDate;
        })
        .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    },
    [vaccinations]
  );

  const getOverdueVaccinations = useCallback((): VaccinationRecord[] => {
    const now = new Date();
    return vaccinations
      .filter((v) => {
        if (v.isCompleted) return false;
        const dueDate = new Date(v.nextDueDate);
        return dueDate < now;
      })
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [vaccinations]);

  const getPetVaccinations = useCallback(
    (petId: string): VaccinationRecord[] => {
      return vaccinations
        .filter((v) => v.petId === petId)
        .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime());
    },
    [vaccinations]
  );

  const markVaccinationComplete = useCallback((id: string, nextDueDate?: string) => {
    setVaccinations((prev) => {
      const updated = prev.map((v) => {
        if (v.id !== id) return v;
        return { ...v, isCompleted: true };
      });

      // If a next due date is specified, create a new record
      if (nextDueDate) {
        const original = prev.find((v) => v.id === id);
        if (original) {
          const newRecord: VaccinationRecord = {
            id: generateId(),
            petId: original.petId,
            vaccineName: original.vaccineName,
            dateGiven: new Date().toISOString(),
            nextDueDate: nextDueDate,
            vetName: original.vetName,
            isCompleted: false,
          };
          return [...updated, newRecord];
        }
      }

      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      pets,
      vaccinations,
      addPet,
      updatePet,
      deletePet,
      addVaccination,
      updateVaccination,
      deleteVaccination,
      getUpcomingVaccinations,
      getOverdueVaccinations,
      getPetVaccinations,
      markVaccinationComplete,
    }),
    [
      pets,
      vaccinations,
      addPet,
      updatePet,
      deletePet,
      addVaccination,
      updateVaccination,
      deleteVaccination,
      getUpcomingVaccinations,
      getOverdueVaccinations,
      getPetVaccinations,
      markVaccinationComplete,
    ]
  );

  return <VaccinationContext.Provider value={value}>{children}</VaccinationContext.Provider>;
};

export const useVaccination = (): VaccinationContextType => {
  const context = useContext(VaccinationContext);
  if (!context) {
    throw new Error('useVaccination must be used within a VaccinationProvider');
  }
  return context;
};
