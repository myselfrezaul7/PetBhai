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

// Detect if running in serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = !!(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

// Resolve DB_PATH reliably whether running from dist or src
const getDbPath = (): string => {
  // In serverless, we can't write to filesystem, so return a dummy path
  if (isServerless) {
    return '/tmp/db.json'; // Vercel allows /tmp but it's ephemeral
  }

  // Check if we're in dist or src directory
  const possiblePaths = [
    path.join(__dirname, '../data/db.json'), // From dist/
    path.join(__dirname, '../../data/db.json'), // From dist/src/
    path.join(process.cwd(), 'backend/data/db.json'), // From project root
    path.join(process.cwd(), 'data/db.json'), // From backend folder
  ];

  for (const p of possiblePaths) {
    const dir = path.dirname(p);
    try {
      if (fs.existsSync(dir)) {
        return p;
      }
    } catch {
      // Ignore filesystem errors in restricted environments
    }
  }

  // Default to first path and create directory
  return possiblePaths[0];
};

const DB_PATH = getDbPath();

interface DatabaseSchema {
  users: User[];
  products: Product[];
  articles: Article[];
  vets: Vet[];
  animals: Animal[];
  brands: Brand[];
  orders: Order[];
  posts: Post[];
  bannedUsers: number[];
}

const buildPostSignature = (post: Pick<Post, 'author' | 'content'>): string => {
  return `${post.author.id}|${post.author.name.trim().toLowerCase()}|${post.content.trim().toLowerCase()}`;
};

const MOCK_POST_SIGNATURES = new Set(MOCK_POSTS.map((post) => buildPostSignature(post)));

const stripLegacyMockPosts = (posts: Post[]): { cleanedPosts: Post[]; removedCount: number } => {
  const cleanedPosts = posts.filter((post) => !MOCK_POST_SIGNATURES.has(buildPostSignature(post)));
  return {
    cleanedPosts,
    removedCount: posts.length - cleanedPosts.length,
  };
};

const INITIAL_DATA: DatabaseSchema = {
  users: [...MOCK_USERS],
  products: [...MOCK_PRODUCTS],
  articles: [...MOCK_ARTICLES],
  vets: [...MOCK_VETS],
  animals: [...MOCK_ANIMALS],
  brands: [...MOCK_BRANDS],
  orders: [],
  posts: [],
  bannedUsers: [],
};

export class PersistenceError extends Error {
  status = 503;
  details?: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'PersistenceError';
    this.details = details;
  }
}

class Database {
  public data: DatabaseSchema;
  private isLoaded: boolean = false;
  private loadError: Error | null = null;
  private writeQueue: Promise<boolean> = Promise.resolve(true);
  private hasWarnedAboutServerlessPersistence = false;

  constructor() {
    try {
      this.data = this.loadData();
      if (!Array.isArray(this.data.bannedUsers)) {
        this.data.bannedUsers = [];
      }

      const { cleanedPosts, removedCount } = stripLegacyMockPosts(this.data.posts);
      if (removedCount > 0) {
        this.data.posts = cleanedPosts;
        this.persistToDisk(this.data);
        console.log(`Removed ${removedCount} legacy mock community posts from database`);
      }

      this.isLoaded = true;
      console.log(
        `Database initialized with ${this.data.products.length} products, ${this.data.users.length} users`
      );
    } catch (error) {
      console.error('CRITICAL: Failed to initialize database:', error);
      this.loadError = error as Error;
      // Fall back to in-memory initial data
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.isLoaded = true;
    }
  }

  public getStatus(): { loaded: boolean; error: string | null; path: string; writeCapable: boolean; mode: string } {
    return {
      loaded: this.isLoaded,
      error: this.loadError?.message || null,
      path: DB_PATH,
      writeCapable: !isServerless,
      mode: isServerless ? 'ephemeral' : 'persistent',
    };
  }

  private loadData(): DatabaseSchema {
    try {
      console.log(`Attempting to load database from: ${DB_PATH}`);
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
    this.persistToDisk(initialClone);
    return initialClone;
  }

  private persistToDisk(data: DatabaseSchema, retries = 3): boolean {
    if (isServerless && !this.hasWarnedAboutServerlessPersistence) {
      console.warn(
        'Persistent writes are disabled in the current serverless environment. Data will reset between executions.'
      );
      this.hasWarnedAboutServerlessPersistence = true;
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const timestamp = `${Date.now()}-${attempt}`;
      const tempPath = `${DB_PATH}.tmp.${timestamp}`;
      const backupPath = `${DB_PATH}.bak`;

      try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));

        // Replace DB file with rollback backup if replacement fails
        let hadBackup = false;
        if (fs.existsSync(DB_PATH)) {
          fs.renameSync(DB_PATH, backupPath);
          hadBackup = true;
        }

        try {
          fs.renameSync(tempPath, DB_PATH);
          if (hadBackup && fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          return true; // Success
        } catch (replaceError) {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          if (hadBackup && fs.existsSync(backupPath)) {
            fs.renameSync(backupPath, DB_PATH);
          }
          throw replaceError;
        }
      } catch (e) {
        lastError = e as Error;
        console.error(`Failed to save DB (attempt ${attempt}/${retries}):`, e);
        try {
          // Additional cleanup attempts could go here
        } catch {
          // best effort cleanup
        }
      }
    }
    
    throw new PersistenceError(`Failed to persist database to disk after ${retries} attempts. Last error: ${lastError?.message}`);
  }

  private enqueueSave(data: DatabaseSchema): Promise<boolean> {
    this.writeQueue = this.writeQueue
      .catch(() => false) // Ignore previous failures in the queue chain
      .then(() => {
        try {
          return this.persistToDisk(data);
        } catch (error) {
          // We must re-throw so the caller knows the persistence failed
          throw error;
        }
      });
    return this.writeQueue;
  }

  public async write(): Promise<boolean> {
    if (isServerless && process.env.NODE_ENV === 'production') {
      console.error('Database writes are disabled in production serverless mode to prevent silent data loss.');
      throw new PersistenceError('Database persistence unavailable in this environment (Serverless).');
    }
    const snapshot = JSON.parse(JSON.stringify(this.data)) as DatabaseSchema;
    return this.enqueueSave(snapshot);
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
  get bannedUsers() {
    return this.data.bannedUsers;
  }
}

export const db = new Database();
