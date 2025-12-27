// Storage Utilities
// Safe localStorage/sessionStorage operations with JSON serialization and error handling

type StorageType = 'local' | 'session';

interface StorageOptions<T> {
  storage?: StorageType;
  ttl?: number; // Time to live in milliseconds
  defaultValue?: T;
  validate?: (value: unknown) => value is T;
}

interface StoredValue<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// Check if storage is available
const isStorageAvailable = (type: StorageType): boolean => {
  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Get the appropriate storage object
const getStorage = (type: StorageType): Storage | null => {
  if (!isStorageAvailable(type)) return null;
  return type === 'local' ? window.localStorage : window.sessionStorage;
};

// Storage prefix for all PetBhai keys
const PREFIX = 'petbhai_';

/**
 * Safely get a value from storage
 */
export function getItem<T>(key: string, options: StorageOptions<T> = {}): T | null {
  const { storage = 'local', defaultValue = null, validate, ttl } = options;

  const store = getStorage(storage);
  if (!store) return defaultValue as T | null;

  try {
    const rawValue = store.getItem(`${PREFIX}${key}`);
    if (rawValue === null) return defaultValue as T | null;

    const parsed: StoredValue<T> = JSON.parse(rawValue);

    // Check expiry
    if (parsed.expiry && Date.now() > parsed.expiry) {
      store.removeItem(`${PREFIX}${key}`);
      return defaultValue as T | null;
    }

    // Check TTL from options (in case stored without expiry)
    if (ttl && Date.now() - parsed.timestamp > ttl) {
      store.removeItem(`${PREFIX}${key}`);
      return defaultValue as T | null;
    }

    // Validate if validator provided
    if (validate && !validate(parsed.value)) {
      console.warn(`Storage value for "${key}" failed validation, returning default`);
      store.removeItem(`${PREFIX}${key}`);
      return defaultValue as T | null;
    }

    return parsed.value;
  } catch (error) {
    console.error(`Error reading "${key}" from storage:`, error);
    // Try to clean up corrupted data
    try {
      store.removeItem(`${PREFIX}${key}`);
    } catch {
      // Ignore cleanup errors
    }
    return defaultValue as T | null;
  }
}

/**
 * Safely set a value in storage
 */
export function setItem<T>(key: string, value: T, options: StorageOptions<T> = {}): boolean {
  const { storage = 'local', ttl } = options;

  const store = getStorage(storage);
  if (!store) return false;

  try {
    const storedValue: StoredValue<T> = {
      value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : undefined,
    };

    store.setItem(`${PREFIX}${key}`, JSON.stringify(storedValue));
    return true;
  } catch (error) {
    console.error(`Error writing "${key}" to storage:`, error);

    // Check if quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // Try to clear old items and retry
      cleanupOldItems(storage);
      try {
        const storedValue: StoredValue<T> = {
          value,
          timestamp: Date.now(),
          expiry: ttl ? Date.now() + ttl : undefined,
        };
        store.setItem(`${PREFIX}${key}`, JSON.stringify(storedValue));
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}

/**
 * Remove an item from storage
 */
export function removeItem(key: string, storage: StorageType = 'local'): boolean {
  const store = getStorage(storage);
  if (!store) return false;

  try {
    store.removeItem(`${PREFIX}${key}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all PetBhai items from storage
 */
export function clearAll(storage: StorageType = 'local'): boolean {
  const store = getStorage(storage);
  if (!store) return false;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => store.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up expired items to free space
 */
export function cleanupOldItems(storage: StorageType = 'local'): void {
  const store = getStorage(storage);
  if (!store) return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key?.startsWith(PREFIX)) continue;

      try {
        const rawValue = store.getItem(key);
        if (!rawValue) continue;

        const parsed = JSON.parse(rawValue) as StoredValue<unknown>;
        if (parsed.expiry && now > parsed.expiry) {
          keysToRemove.push(key);
        }
      } catch {
        // Remove corrupted items
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => store.removeItem(key));
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Get all PetBhai keys in storage
 */
export function getAllKeys(storage: StorageType = 'local'): string[] {
  const store = getStorage(storage);
  if (!store) return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(PREFIX)) {
        keys.push(key.slice(PREFIX.length));
      }
    }
  } catch {
    // Return whatever we got
  }
  return keys;
}

/**
 * Get storage usage information
 */
export function getStorageInfo(storage: StorageType = 'local'): {
  used: number;
  keys: number;
} {
  const store = getStorage(storage);
  if (!store) return { used: 0, keys: 0 };

  let used = 0;
  let keys = 0;

  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key?.startsWith(PREFIX)) continue;

      keys++;
      const value = store.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  } catch {
    // Return whatever we calculated
  }

  return { used: used * 2, keys }; // *2 for UTF-16 encoding
}

// Export convenience object
export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,
  clearAll,
  cleanup: cleanupOldItems,
  getAllKeys,
  getInfo: getStorageInfo,
  isAvailable: isStorageAvailable,
};

export default storage;
