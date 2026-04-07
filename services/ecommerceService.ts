import { safeStorage, safeSessionStorage } from '../lib/storage';
import type { BundleOffer, ReorderSuggestion } from '../types';
import { apiRequest } from './apiClient';

const TOKEN_STORAGE_KEY = 'petbhai_token';

const getAuthHeaders = (): HeadersInit => {
  try {
    const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore storage access errors
  }
  return {};
};

export const fetchBundleOffer = async (productId: number): Promise<BundleOffer> => {
  return apiRequest<BundleOffer>(`/products/${productId}/bundles`, {
    method: 'GET',
  });
};

export const fetchReorderSuggestions = async (): Promise<ReorderSuggestion[]> => {
  return apiRequest<ReorderSuggestion[]>('/orders/reorder-suggestions', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};
