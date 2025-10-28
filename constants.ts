import type { Animal, User, Post, Vet, Product } from './types';

export const MOCK_ANIMALS: Animal[] = [
  {
    id: 1,
    name: 'Buddy',
    breed: 'Golden Retriever Mix',
    age: '2 years',
    gender: 'Male',
    description: 'Buddy is a playful and friendly dog who loves fetch and long walks. He is great with kids and other dogs.',
    imageUrl: 'https://picsum.photos/seed/buddy/400/300',
  },
  {
    id: 2,
    name: 'Lucy',
    breed: 'Domestic Shorthair',
    age: '1 year',
    gender: 'Female',
    description: 'Lucy is a sweet and curious cat who enjoys sunbathing and chasing laser pointers. She is looking for a quiet home.',
    imageUrl: 'https://picsum.photos/seed/lucy/400/300',
  },
  {
    id: 3,
    name: 'Max',
    breed: 'German Shepherd',
    age: '3 years',
    gender: 'Male',
    description: 'Max is a loyal and intelligent companion. He is well-trained and would thrive in an active household.',
    imageUrl: 'https://picsum.photos/seed/max/400/300',
  },
  {
    id: 4,
    name: 'Daisy',
    breed: 'Beagle',
    age: '4 years',
    gender: 'Female',
    description: 'Daisy is a cheerful and loving beagle with a nose for adventure. Her tail is always wagging!',
    imageUrl: 'https://picsum.photos/seed/daisy/400/300',
  },
  {
    id: 5,
    name: 'Rocky',
    breed: 'Labrador Mix',
    age: '10 months',
    gender: 'Male',
    description: 'Rocky is an energetic puppy full of life and love. He is learning basic commands and is eager to please.',
    imageUrl: 'https://picsum.photos/seed/rocky/400/300',
  },
  {
    id: 6,
    name: 'Misty',
    breed: 'Siamese',
    age: '5 years',
    gender: 'Female',
    description: 'Misty is an elegant and affectionate cat who loves to be pampered. She enjoys quiet afternoons and gentle pets.',
    imageUrl: 'https://picsum.photos/seed/misty/400/300',
  },
];

export const MOCK_USERS: User[] = [
    { id: 1, name: "Aisha Rahman", email: "aisha@example.com", password: "password123" },
    { id: 2, name: "Jamal Khan", email: "jamal@example.com", password: "password123" },
];

export const MOCK_POSTS: Post[] = [
    {
        id: 1,
        author: { id: 1, name: "Aisha Rahman" },
        content: "Found this little one near Dhanmondi Lake. Keeping him safe for now. Does anyone know of a good vet nearby?",
        imageUrl: "https://picsum.photos/seed/post1/600/400",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 15,
        comments: [
            { id: 1, authorName: "Jamal Khan", text: "So adorable! Try Dr. Alam's clinic." }
        ],
    },
    {
        id: 2,
        author: { id: 2, name: "Jamal Khan" },
        content: "Just adopted Max from PetBhai last week! He's settling in so well. Thank you to the team for making the process so smooth. Here he is enjoying his new favorite spot.",
        imageUrl: "https://picsum.photos/seed/post2/600/400",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        likes: 42,
        comments: [
            { id: 1, authorName: "Aisha Rahman", text: "That's wonderful news! Congratulations!" },
            { id: 2, authorName: "Admin", text: "We're so happy for you and Max!" }
        ],
    }
];

export const MOCK_VETS: Vet[] = [
    {
        id: 1,
        name: 'Dr. Fatima Ahmed',
        specialization: 'General Pet Health',
        imageUrl: 'https://picsum.photos/seed/vet1/200/200',
        isOnline: true,
    },
    {
        id: 2,
        name: 'Dr. Kabir Hossain',
        specialization: 'Canine Specialist',
        imageUrl: 'https://picsum.photos/seed/vet2/200/200',
        isOnline: true,
    },
    {
        id: 3,
        name: 'Dr. Nazia Islam',
        specialization: 'Feline Health & Nutrition',
        imageUrl: 'https://picsum.photos/seed/vet3/200/200',
        isOnline: false,
    },
    {
        id: 4,
        name: 'Dr. Rohan Chowdhury',
        specialization: 'Exotic Animals & Birds',
        imageUrl: 'https://picsum.photos/seed/vet4/200/200',
        isOnline: true,
    },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Me-O Adult Cat Food Tuna',
    category: 'Cat Food',
    price: 1850,
    imageUrl: 'https://picsum.photos/seed/catfood1/400/300',
    description: 'A delicious and nutritious tuna-flavored dry food for adult cats of all breeds.',
    weight: '7kg',
  },
  {
    id: 2,
    name: 'Drools Optimum Performance Puppy Food',
    category: 'Dog Food',
    price: 380,
    imageUrl: 'https://picsum.photos/seed/dogfood1/400/300',
    description: 'Specially formulated for puppies to support their growth and development with essential nutrients.',
    weight: '3kg',
  },
  {
    id: 3,
    name: 'Whiskas Kitten (2-12 months) Wet Cat Food',
    category: 'Cat Food',
    price: 65,
    imageUrl: 'https://picsum.photos/seed/catfood2/400/300',
    description: 'Tender, juicy chicken in gravy, perfect for your growing kitten.',
    weight: '85g',
  },
  {
    id: 4,
    name: 'Pedigree Adult Dry Dog Food (Chicken & Veg)',
    category: 'Dog Food',
    price: 1500,
    imageUrl: 'https://picsum.photos/seed/dogfood2/400/300',
    description: 'A complete and balanced meal for your adult dog, packed with chicken and vegetable goodness.',
    weight: '10kg',
  },
  {
    id: 5,
    name: 'SmartHeart Power Pack Puppy Food',
    category: 'Dog Food',
    price: 950,
    imageUrl: 'https://picsum.photos/seed/dogfood3/400/300',
    description: 'High-energy formula to support active puppies and promote a strong physique.',
    weight: '3kg',
  },
  {
    id: 6,
    name: 'Royal Canin Persian Adult Cat Food',
    category: 'Cat Food',
    price: 2200,
    imageUrl: 'https://picsum.photos/seed/catfood3/400/300',
    description: 'Tailor-made nutrition for Persian cats to maintain their long, beautiful coats and digestive health.',
    weight: '2kg',
  },
];