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
  paymentMethod?: string;
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
  likes: number[];
  timestamp: string;
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
  likes: number[];
  timestamp: string;
}

export interface Post {
  id: number;
  author: {
    id: number;
    name: string;
    profilePictureUrl?: string;
  };
  content: string;
  imageUrl?: string;
  timestamp: string; // ISO string
  likes: number[];
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

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

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
  stockStatus?: StockStatus;
  stockQuantity?: number;
  originalPrice?: number; // For showing discounts
  discount?: number; // Percentage discount
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

// Pet for vaccination tracking
export type PetType = 'dog' | 'cat' | 'bird' | 'other';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed?: string;
  birthDate?: string; // ISO string
  imageUrl?: string;
  createdAt: string;
}

export interface VaccinationRecord {
  id: string;
  petId: string;
  vaccineName: string;
  dateGiven: string; // ISO string
  nextDueDate: string; // ISO string
  vetName?: string;
  notes?: string;
  isCompleted: boolean;
  reminderSent?: boolean;
}

// Common vaccinations for dogs and cats in Bangladesh
export type VaccineType =
  | 'rabies'
  | 'dhpp' // Distemper, Hepatitis, Parvovirus, Parainfluenza
  | 'bordetella'
  | 'leptospirosis'
  | 'fvrcp' // Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia
  | 'felv' // Feline Leukemia
  | 'deworming'
  | 'other';

export const VACCINE_INFO: Record<
  VaccineType,
  { name: string; nameBn: string; interval: number; petType: PetType[] }
> = {
  rabies: { name: 'Rabies', nameBn: 'জলাতঙ্ক', interval: 365, petType: ['dog', 'cat'] },
  dhpp: { name: 'DHPP (5-in-1)', nameBn: 'ডিএইচপিপি', interval: 365, petType: ['dog'] },
  bordetella: {
    name: 'Bordetella (Kennel Cough)',
    nameBn: 'কেনেল কফ',
    interval: 180,
    petType: ['dog'],
  },
  leptospirosis: {
    name: 'Leptospirosis',
    nameBn: 'লেপ্টোস্পাইরোসিস',
    interval: 365,
    petType: ['dog'],
  },
  fvrcp: { name: 'FVRCP (3-in-1)', nameBn: 'এফভিআরসিপি', interval: 365, petType: ['cat'] },
  felv: { name: 'Feline Leukemia', nameBn: 'ফেলাইন লিউকেমিয়া', interval: 365, petType: ['cat'] },
  deworming: { name: 'Deworming', nameBn: 'কৃমিনাশক', interval: 90, petType: ['dog', 'cat'] },
  other: {
    name: 'Other',
    nameBn: 'অন্যান্য',
    interval: 365,
    petType: ['dog', 'cat', 'bird', 'other'],
  },
};

// Delivery areas
export interface DeliveryArea {
  district: string;
  districtBn: string;
  areas: string[];
  deliveryDays: number;
  deliveryFee: number;
  isAvailable: boolean;
  isSameDayAvailable?: boolean;
}

declare global {
  // Extend the Window interface to include properties added by the Facebook SDK.
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string }) => void;
    };
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
