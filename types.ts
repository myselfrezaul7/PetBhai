export interface Animal {
  id: number;
  name: string;
  breed: string;
  age: string;
  gender: 'Male' | 'Female';
  description: string;
  imageUrl: string;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Only for registration, not stored in session
  profilePictureUrl?: string;
}

export interface Post {
  id: number;
  author: {
    id: number;
    name:string;
    profilePictureUrl?: string;
  };
  content: string;
  imageUrl?: string;
  timestamp: string; // ISO string
  likes: number;
  comments: { id: number, authorName: string; text: string; }[];
}

export interface Vet {
  id: number;
  name: string;
  specialization: string;
  imageUrl: string;
  isOnline: boolean;
}

export interface Product {
  id: number;
  name: string;
  category: 'Cat Food' | 'Dog Food' | 'Cat Supplies' | 'Dog Supplies' | 'Grooming';
  price: number;
  imageUrl: string;
  description: string;
  weight: string;
}

export interface CartItem extends Product {
  quantity: number;
}