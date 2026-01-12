import fs from 'fs';
import path from 'path';
import {
  MOCK_PRODUCTS,
  MOCK_USERS,
  MOCK_ARTICLES,
  MOCK_VETS,
  MOCK_ANIMALS,
  MOCK_BRANDS,
  MOCK_POSTS,
} from './data/mockData';
import type { User, Product, Article, Vet, Animal, Brand, Order, Post } from './types';

const DB_PATH = path.join(__dirname, '../data/db.json');

interface DatabaseSchema {
  users: User[];
  products: Product[];
  articles: Article[];
  vets: Vet[];
  animals: Animal[];
  brands: Brand[];
  orders: Order[];
  posts: Post[];
}

const INITIAL_DATA: DatabaseSchema = {
  users: [...MOCK_USERS],
  products: [...MOCK_PRODUCTS],
  articles: [...MOCK_ARTICLES],
  vets: [...MOCK_VETS],
  animals: [...MOCK_ANIMALS],
  brands: [...MOCK_BRANDS],
  orders: [],
  posts: [...MOCK_POSTS],
};

class Database {
  public data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        console.log('Loading database from disk...');
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error loading database, using initial data:', error);
    }

    console.log('Initializing new database...');
    // Deep copy implementation to ensure we don't mutate reference constants if we had any
    const initialClone = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(initialClone);
    return initialClone;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, DB_PATH);
    } catch (e) {
      console.error('Failed to save DB', e);
    }
  }

  public write() {
    this.saveData(this.data);
  }

  // Getters for backward compatibility with existing code that expects db.users, etc.
  get users() {
    return this.data.users;
  }
  get products() {
    return this.data.products;
  }
  get articles() {
    return this.data.articles;
  }
  get vets() {
    return this.data.vets;
  }
  get animals() {
    return this.data.animals;
  }
  get brands() {
    return this.data.brands;
  }
  get orders() {
    return this.data.orders;
  }
  get posts() {
    return this.data.posts;
  }
}

export const db = new Database();
