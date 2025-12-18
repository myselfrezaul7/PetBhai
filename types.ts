
import type React from 'react';

export interface Review {
  id: number;
  author: string;
  rating: number; // 1-5 stars
  comment: string;
  date: string; // ISO string
}

export interface Brand {
  id: number;
  name: string;
  logoUrl: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  date: string; // ISO string
  readTime: number; // in minutes
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface Order {
  orderId: string;
  date: string; // ISO string
  total: number;
  items: CartItem[];
}

export type AnimalStatus = 'Available' | 'Pending' | 'Adopted';
export type AnimalAge = 'Puppy/Kitten' | 'Young' | 'Adult' | 'Senior';
export type AnimalGender = 'Male' | 'Female';
export type AnimalSize = 'Small' | 'Medium' | 'Large';

export interface Animal {
  id: number;
  name: string;
  breed: string;
  age: AnimalAge;
  gender: AnimalGender;
  size: AnimalSize;
  status: AnimalStatus;
  description: string;
  imageUrl: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  profilePictureUrl?: string;
  wishlist: number[]; // Array of product IDs
  orderHistory: Order[];
  favorites: number[]; // Array of animal IDs
  isPlusMember?: boolean;
}

export interface CommentReply {
  id: number;
  author: {
    id: number;
    name: string;
    profilePictureUrl?: string;
  };
  text: string;
}

export interface Comment {
  id: number;
  author: {
    id: number;
    name: string;
    profilePictureUrl?: string;
  };
  text: string;
  replies: CommentReply[];
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
  comments: Comment[];
}

export type VetAvailability = 'Available Now' | 'Available Today' | 'Offline';
export type ServiceType = 'online' | 'in-clinic';

export interface VetService {
    name: string;
    price: number;
    type: ServiceType;
}

export interface VetReview {
    id: number;
    author: string;
    rating: number;
    comment: string;
    date: string; // ISO string
}

export interface Vet {
  id: number;
  name: string;
  specialization: string;
  clinicName: string;
  address: string;
  phone: string;
  imageUrl: string;
  availability: VetAvailability;
  bio: string;
  qualifications: string[];
  services: VetService[];
  reviews: VetReview[];
}

export interface Product {
  id: number;
  name: string;
  category: 'Cat Food' | 'Dog Food' | 'Cat Supplies' | 'Dog Supplies' | 'Grooming';
  price: number;
  imageUrl: string;
  description: string;
  weight: string;
  brandId: number;
  rating: number;
  reviews: Review[];
  searchTags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

// Types for Expanded Services
export interface Service {
    name: string;
    price: number | 'Varies';
    description: string;
}

export type ProfessionalCategory = 'Groomer' | 'Trainer' | 'Pet Sitter';

export interface BaseProfessional {
    id: number;
    category: ProfessionalCategory;
    name: string;
    imageUrl: string;
    bio: string;
    location: string; // District
    services: Service[];
    rating: number;
}

export interface Groomer extends BaseProfessional {
    category: 'Groomer';
    specialties: string[];
}
export interface Trainer extends BaseProfessional {
    category: 'Trainer';
    certifications: string[];
    methods: string;
}

export interface PetSitter extends BaseProfessional {
    category: 'Pet Sitter';
    servicesOffered: ('Boarding' | 'House Sitting' | 'Drop-in Visits')[];
    petTypes: ('Dogs' | 'Cats' | 'Small Animals')[];
}

declare global {
  // Fix: Moved AIStudio interface definition inside declare global to properly merge
  // with any ambient definitions and resolve type conflict errors.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  // Extend the Window interface to include properties added by the Facebook SDK and AI Studio.
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string }) => void;
    };
    // Fix: Added optional modifier '?' to 'aistudio' to resolve "All declarations... 
    // must have identical modifiers" error by matching the environment's likely definition.
    aistudio?: AIStudio;
  }

  // Extend React's HTMLAttributes to allow for Facebook's custom chat plugin attributes.
  namespace React {
    interface HTMLAttributes<T> {
      page_id?: string;
      attribution?: string;
      logged_in_greeting?: string;
      logged_out_greeting?: string;
    }
  }
}
