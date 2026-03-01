export interface Review {
  id: number;
  author: string;
  rating: number; // 1-5 stars
  comment: string;
  date: string; // ISO string
  verifiedPurchase?: boolean;
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
  status?:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'confirmed'
    | 'refunded';
}

export interface PetWeightEntry {
  date: string;
  weight: number;
}

export interface PetProfileRecord {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'other';
  breed?: string;
  birthDate?: string;
  adoptionDate?: string;
  gender: 'male' | 'female' | 'unknown';
  weight?: number;
  weightHistory: PetWeightEntry[];
  imageUrl?: string;
  color?: string;
  microchipId?: string;
  isNeutered?: boolean;
  allergies?: string[];
  medicalNotes?: string;
  favoriteFood?: string;
  activityLevel: 'low' | 'medium' | 'high';
  feedingSchedule?: {
    times: string[];
    portionSize: string;
    foodType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MedicineReminderRecord {
  id: string;
  petId: string;
  medicineName: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDays?: number;
  startDate: string;
  nextDueDate: string;
  notes?: string;
  isActive: boolean;
  lastGivenDate?: string;
  notificationEnabled: boolean;
}

export type AnimalStatus =
  | 'Available'
  | 'Pending'
  | 'Adopted'
  | 'available'
  | 'pending'
  | 'adopted';
export type AnimalAge = 'Puppy/Kitten' | 'Young' | 'Adult' | 'Senior' | string;
export type AnimalGender = 'Male' | 'Female';
export type AnimalSize = 'Small' | 'Medium' | 'Large';

export interface Animal {
  id: number;
  name: string;
  breed: string;
  species?: string;
  age: AnimalAge;
  gender?: AnimalGender;
  sex?: 'Male' | 'Female';
  size?: AnimalSize;
  status: AnimalStatus;
  description: string;
  imageUrl: string;
  location?: string;
  color?: string;
  vaccinated?: boolean;
  spayedNeutered?: boolean;
  postedAt?: string;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  profilePictureUrl?: string;
  phone?: string;
  bio?: string;
  wishlist?: number[]; // Array of product IDs
  orderHistory?: Order[];
  orders?: Order[]; // Alternative orders field
  favorites?: number[]; // Array of animal IDs
  isPlusMember?: boolean;
  role?: 'customer' | 'admin';
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: string;
  tokenVersion?: number;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: string;
  socialProvider?: 'google';
  socialProviderId?: string;
  defaultShippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
  };
  petProfiles?: PetProfileRecord[];
  medicineReminders?: MedicineReminderRecord[];
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
  hidden?: boolean;
  reportCount?: number;
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
  hidden?: boolean;
  reportCount?: number;
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
  hidden?: boolean;
  reportCount?: number;
}

export type ModerationTargetType = 'post' | 'comment' | 'reply';

export interface ModerationReport {
  id: string;
  targetType: ModerationTargetType;
  targetPostId: number;
  targetCommentId?: number;
  targetReplyId?: number;
  reporterId: number;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  history: Array<{
    at: string;
    action: string;
    note?: string;
    actorId?: number;
  }>;
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
  category: 'Cat Food' | 'Dog Food' | 'Cat Supplies' | 'Dog Supplies' | 'Grooming' | 'Accessories';
  price: number;
  imageUrl: string;
  description: string;
  weight: string;
  brandId: number;
  rating: number;
  reviews: Review[];
  searchTags?: string[];
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockQuantity?: number;
  reorderPoint?: number;
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
  // Extend the Window interface to include properties added by the Facebook SDK.
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string }) => void;
    };
  }

  // Extend React's HTMLAttributes to allow for Facebook's custom chat plugin attributes.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
      page_id?: string;
      attribution?: string;
      logged_in_greeting?: string;
      logged_out_greeting?: string;
    }
  }
}
