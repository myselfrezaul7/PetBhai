import { z } from 'zod';

// Common validation patterns
const bdPhoneRegex = /^(\+8801|01)[3-9]\d{8}$/;

// Reusable field schemas
export const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')
  .trim();

export const bdPhoneSchema = z
  .string()
  .regex(bdPhoneRegex, 'Please enter a valid Bangladesh phone number (e.g., +8801XXXXXXXXX)');

export const addressSchema = z
  .string()
  .min(10, 'Please enter a complete address')
  .max(500, 'Address is too long');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup form schema
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// Checkout form schema
export const checkoutSchema = z.object({
  name: nameSchema,
  phone: bdPhoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  address: addressSchema,
  city: z.string().min(2, 'Please select a city'),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Contact form schema
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: bdPhoneSchema.optional().or(z.literal('')),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject is too long'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message is too long'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Review form schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review is too long'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// Profile update schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: bdPhoneSchema.optional().or(z.literal('')),
  address: addressSchema.optional().or(z.literal('')),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Adoption application schema
export const adoptionApplicationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: bdPhoneSchema,
  address: addressSchema,
  occupation: z.string().min(2, 'Please enter your occupation'),
  housingType: z.enum(['house', 'apartment', 'other'], {
    errorMap: () => ({ message: 'Please select your housing type' }),
  }),
  hasYard: z.boolean(),
  hasOtherPets: z.boolean(),
  otherPetsDescription: z.string().optional(),
  hasChildren: z.boolean(),
  childrenAges: z.string().optional(),
  experience: z.string().min(20, 'Please describe your pet experience (min 20 characters)'),
  reason: z.string().min(20, 'Please explain why you want to adopt (min 20 characters)'),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
  }),
});

export type AdoptionApplicationFormData = z.infer<typeof adoptionApplicationSchema>;

// Vet booking schema
export const vetBookingSchema = z.object({
  petName: z.string().min(1, 'Pet name is required').max(50),
  petType: z.enum(['dog', 'cat', 'bird', 'other'], {
    errorMap: () => ({ message: 'Please select pet type' }),
  }),
  petAge: z.string().min(1, 'Pet age is required'),
  reason: z.string().min(10, 'Please describe the reason for visit'),
  preferredDate: z.string().min(1, 'Please select a date'),
  preferredTime: z.string().min(1, 'Please select a time'),
  ownerName: nameSchema,
  ownerPhone: bdPhoneSchema,
  ownerEmail: emailSchema.optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});

export type VetBookingFormData = z.infer<typeof vetBookingSchema>;

// Volunteer registration schema
export const volunteerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: bdPhoneSchema,
  address: addressSchema,
  age: z.number().min(16, 'You must be at least 16 years old').max(100),
  occupation: z.string().min(2),
  availability: z.array(z.string()).min(1, 'Please select at least one availability option'),
  interests: z.array(z.string()).min(1, 'Please select at least one area of interest'),
  experience: z.string().min(20, 'Please describe your experience'),
  motivation: z.string().min(20, 'Please describe your motivation'),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
});

export type VolunteerFormData = z.infer<typeof volunteerSchema>;

// Report animal schema
export const reportAnimalSchema = z.object({
  reporterName: nameSchema,
  reporterPhone: bdPhoneSchema,
  reporterEmail: emailSchema.optional().or(z.literal('')),
  animalType: z.enum(['dog', 'cat', 'bird', 'other'], {
    errorMap: () => ({ message: 'Please select animal type' }),
  }),
  condition: z.enum(['injured', 'sick', 'abandoned', 'lost', 'other'], {
    errorMap: () => ({ message: 'Please select condition' }),
  }),
  location: addressSchema,
  description: z.string().min(20, 'Please provide more details about the situation'),
  urgency: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Please select urgency level' }),
  }),
  canProvideTemporaryCare: z.boolean(),
});

export type ReportAnimalFormData = z.infer<typeof reportAnimalSchema>;

// Community post schema
export const communityPostSchema = z.object({
  content: z
    .string()
    .min(10, 'Post must be at least 10 characters')
    .max(2000, 'Post is too long (max 2000 characters)'),
  imageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type CommunityPostFormData = z.infer<typeof communityPostSchema>;

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
  interests: z.array(z.string()).optional(),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
