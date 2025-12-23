import {
  MOCK_PRODUCTS,
  MOCK_USERS,
  MOCK_ARTICLES,
  MOCK_VETS,
  MOCK_ANIMALS,
  MOCK_BRANDS,
} from './data/mockData';
import type { User, Product, Article, Vet, Animal, Brand, Order } from './types';

// In-memory database
export const db = {
  users: [...MOCK_USERS] as User[],
  products: [...MOCK_PRODUCTS] as Product[],
  articles: [...MOCK_ARTICLES] as Article[],
  vets: [...MOCK_VETS] as Vet[],
  animals: [...MOCK_ANIMALS] as Animal[],
  brands: [...MOCK_BRANDS] as Brand[],
  orders: [] as Order[],
};
