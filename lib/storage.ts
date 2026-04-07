export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage setItem error:', e);
      return false;
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removeItem error:', e);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('sessionStorage setItem error:', e);
      return false;
    }
  },
  removeItem: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('sessionStorage removeItem error:', e);
    }
  },
};
