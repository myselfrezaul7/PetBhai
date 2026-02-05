import {
  User,
  Post,
  Vet,
  Product,
  Order,
  Review,
  Article,
  VetReview,
  Animal,
  Brand,
  Comment,
} from '../types';

export const MOCK_BRANDS: Brand[] = [
  { id: 1, name: 'Royal Canin', logoUrl: 'https://placehold.co/200x200?text=Royal+Canin' },
  { id: 2, name: 'Pedigree', logoUrl: 'https://placehold.co/200x200?text=Pedigree' },
  { id: 3, name: 'Drools', logoUrl: 'https://placehold.co/200x200?text=Drools' },
  { id: 4, name: 'Me-O', logoUrl: 'https://placehold.co/200x200?text=Me-O' },
  {
    id: 5,
    name: 'Whiskas',
    logoUrl: 'https://placehold.co/200x200?text=Whiskas',
  },
  {
    id: 6,
    name: 'SmartHeart',
    logoUrl: 'https://placehold.co/200x200?text=SmartHeart',
  },
  {
    id: 7,
    name: 'Lara',
    logoUrl: 'https://placehold.co/200x200?text=Lara',
  },
  {
    id: 8,
    name: 'Kaniva',
    logoUrl: 'https://placehold.co/200x200?text=Kaniva',
  },
  {
    id: 9,
    name: 'Reflex Plus',
    logoUrl: 'https://placehold.co/200x200?text=Reflex+Plus',
  },
  {
    id: 10,
    name: 'Spectrum',
    logoUrl: 'https://placehold.co/200x200?text=Spectrum',
  },
  {
    id: 11,
    name: 'Trendline',
    logoUrl: 'https://placehold.co/200x200?text=Trendline',
  },
  {
    id: 12,
    name: 'Harvest Luck',
    logoUrl: 'https://placehold.co/200x200?text=Harvest+Luck',
  },
  {
    id: 13,
    name: 'Bonnie',
    logoUrl: 'https://placehold.co/200x200?text=Bonnie',
  },
  {
    id: 14,
    name: 'Reflex',
    logoUrl: 'https://placehold.co/200x200?text=Reflex',
  },
  {
    id: 15,
    name: 'JerHigh',
    logoUrl: 'https://placehold.co/200x200?text=JerHigh',
  },
  {
    id: 16,
    name: 'PetBhai Essentials',
    logoUrl: 'https://placehold.co/200x200?text=PetBhai+Essentials',
  },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    author: 'Aisha R.',
    rating: 5,
    comment: 'My cat absolutely loves this. The tuna flavor is her favorite!',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    author: 'Jamal K.',
    rating: 4,
    comment: "Good quality food, my cat's coat has become much shinier.",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Me-O Adult Cat Food Tuna',
    category: 'Cat Food',
    price: 2850,
    imageUrl: 'https://placehold.co/600x400?text=Me-O+Adult+Cat+Food+Tuna',
    description:
      'A delicious and nutritious tuna-flavored dry food for adult cats of all breeds. Enriched with vitamins and minerals for a healthy life. A popular choice for cat owners in Bangladesh.',
    weight: '7kg',
    brandId: 4,
    rating: 4.8,
    reviews: MOCK_REVIEWS,
    searchTags: ['বিড়াল', 'খাবার', 'ক্যাট ফুড', 'cat food', 'biral', 'khabar', 'meo', 'tuna'],
  },
  {
    id: 2,
    name: 'Drools Optimum Performance Puppy Food',
    category: 'Dog Food',
    price: 1300,
    imageUrl: 'https://placehold.co/600x400?text=Drools+Optimum+Performance+Puppy+Food',
    description:
      'Specially formulated for puppies to support their growth and development with essential nutrients, prebiotics and probiotics. Highly recommended by vets.',
    weight: '3kg',
    brandId: 3,
    rating: 4.5,
    reviews: [
      {
        id: 3,
        author: 'Fahim C.',
        rating: 5,
        comment: 'My puppy is growing so fast and healthy with this food.',
        date: new Date().toISOString(),
      },
    ],
    searchTags: [
      'কুকুর',
      'খাবার',
      'পাপি',
      'ডগ ফুড',
      'dog food',
      'kukur',
      'khabar',
      'puppy',
      'drools',
    ],
  },
  {
    id: 3,
    name: 'Whiskas Ocean Fish (Adult)',
    category: 'Cat Food',
    price: 800,
    imageUrl: 'https://placehold.co/600x400?text=Whiskas+Ocean+Fish+Adult',
    description:
      'Whiskas Ocean Fish is a complete and balanced dry food for adult cats. It supports healthy skin and a shiny coat. Very popular in Dhaka.',
    weight: '1.2kg',
    brandId: 5,
    rating: 4.6,
    reviews: [],
    searchTags: ['whiskas', 'cat food', 'fish', 'ocean fish', 'biral', 'khabar'],
  },
  {
    id: 4,
    name: 'Pedigree Adult Dry Dog Food (Chicken & Veg)',
    category: 'Dog Food',
    price: 4300,
    imageUrl: 'https://placehold.co/600x400?text=Pedigree+Adult+Dry+Dog+Food',
    description:
      'A complete and balanced meal for your adult dog, packed with chicken and vegetable goodness for a healthy immune system.',
    weight: '10kg',
    brandId: 2,
    rating: 4.7,
    reviews: [],
    searchTags: [
      'কুকুর',
      'খাবার',
      'পেডিগ্রি',
      'dog food',
      'kukur',
      'khabar',
      'adult',
      'chicken',
      'pedigree',
    ],
  },
  {
    id: 5,
    name: 'Royal Canin Persian Adult Cat Food',
    category: 'Cat Food',
    price: 3600,
    imageUrl: 'https://placehold.co/600x400?text=Royal+Canin+Persian+Adult+Cat+Food',
    description:
      'Tailor-made nutrition for Persian cats to maintain their long, beautiful coats and digestive health. Almond-shaped kibble for easy grasping.',
    weight: '2kg',
    brandId: 1,
    rating: 4.9,
    reviews: [
      {
        id: 4,
        author: 'Sadia A.',
        rating: 5,
        comment: 'The only food my Persian will eat. Her coat has never looked better!',
        date: new Date().toISOString(),
      },
    ],
    searchTags: [
      'বিড়াল',
      'খাবার',
      'রয়াল ক্যানিন',
      'পার্সিয়ান',
      'cat food',
      'biral',
      'khabar',
      'royal canin',
      'persian',
    ],
  },
  {
    id: 6,
    name: 'SmartHeart Adult Cat Food Chicken & Tuna',
    category: 'Cat Food',
    price: 580,
    imageUrl: 'https://placehold.co/600x400?text=SmartHeart+Adult+Cat+Food',
    description:
      'SmartHeart Adult Cat Food is formulated to meet adult cat nutritional requirements. Enriched with DHA and EPA.',
    weight: '1.2kg',
    brandId: 6,
    rating: 4.5,
    reviews: [],
    searchTags: ['smartheart', 'cat food', 'chicken', 'tuna', 'biral', 'khabar'],
  },
  {
    id: 7,
    name: 'Lara Adult Cat Food Salmon',
    category: 'Cat Food',
    price: 1450,
    imageUrl: 'https://placehold.co/600x400?text=Lara+Adult+Cat+Food+Salmon',
    description:
      'Delicious chunks with salmon for adult cats. Let your cat enjoy this crispy food. A premium choice available in Bangladesh.',
    weight: '2kg',
    brandId: 7,
    rating: 4.4,
    reviews: [],
    searchTags: ['lara', 'cat food', 'salmon', 'biral', 'khabar', 'fish'],
  },
  {
    id: 8,
    name: 'SmartHeart Power Pack Puppy',
    category: 'Dog Food',
    price: 1650,
    imageUrl: 'https://placehold.co/600x400?text=SmartHeart+Power+Pack+Puppy',
    description:
      'High energy formula for active puppies. Promotes muscle mass and proper structure.',
    weight: '3kg',
    brandId: 6,
    rating: 4.7,
    reviews: [],
    searchTags: ['smartheart', 'dog food', 'puppy', 'power pack', 'kukur', 'khabar'],
  },
  {
    id: 9,
    name: 'Cat Litter Bentonite (Apple Scent)',
    category: 'Cat Supplies',
    price: 480,
    imageUrl: 'https://placehold.co/600x400?text=Cat+Litter+Bentonite',
    description: 'Premium clumping cat litter with apple scent. Dust-free and super absorbent.',
    weight: '5L',
    brandId: 4,
    rating: 4.3,
    reviews: [],
    searchTags: ['litter', 'bali', 'cat litter', 'bathroom', 'biral'],
  },
  {
    id: 10,
    name: 'Himalaya Erina EP Shampoo',
    category: 'Grooming',
    price: 380,
    imageUrl: 'https://placehold.co/600x400?text=Himalaya+Erina+EP+Shampoo',
    description: 'Controls ectoparasites like ticks, fleas and lice. Prevents skin infections.',
    weight: '200ml',
    brandId: 2,
    rating: 4.6,
    reviews: [],
    searchTags: ['shampoo', 'ticks', 'fleas', 'grooming', 'gosol'],
  },
  {
    id: 11,
    name: 'Heavy-Duty Nylon Dog Leash',
    category: 'Dog Supplies',
    price: 850,
    imageUrl: 'https://placehold.co/600x400?text=Heavy+Duty+Nylon+Dog+Leash',
    description:
      'A strong and reliable 6-foot nylon leash, perfect for daily walks and training sessions.',
    weight: '150g',
    brandId: 3,
    rating: 4.9,
    reviews: [],
    searchTags: ['বেল্ট', 'রশি', 'লিচ', 'belt', 'leash', 'roshi', 'walk'],
  },
  {
    id: 12,
    name: 'Interactive Feather Wand for Cats',
    category: 'Cat Supplies',
    price: 450,
    imageUrl: 'https://placehold.co/600x400?text=Interactive+Feather+Wand',
    description:
      'Engage your cat in hours of fun with this interactive feather wand. Great for exercise and bonding.',
    weight: '50g',
    brandId: 4,
    rating: 4.4,
    reviews: [],
    searchTags: ['খেলনা', 'বিড়াল', 'খেলনা', 'toy', 'cat toy', 'khelna', 'biral'],
  },
  {
    id: 13,
    name: 'Durable Rubber Chew Bone for Dogs',
    category: 'Dog Supplies',
    price: 600,
    imageUrl: 'https://placehold.co/600x400?text=Durable+Rubber+Chew+Bone',
    description:
      'A tough, durable chew toy designed to withstand even the most enthusiastic chewers. Promotes dental health.',
    weight: '200g',
    brandId: 3,
    rating: 4.6,
    reviews: [],
    searchTags: ['খেলনা', 'হাড়', 'কুকুর', 'toy', 'bone', 'chew', 'kukur', 'khelna'],
  },
  {
    id: 14,
    name: 'Stainless Steel Pet Bowl (Anti-Skid)',
    category: 'Dog Supplies',
    price: 350,
    imageUrl: 'https://placehold.co/600x400?text=Stainless+Steel+Pet+Bowl',
    description:
      'High-quality stainless steel bowl with a rubber base to prevent sliding and tipping. Easy to clean.',
    weight: 'Medium',
    brandId: 16,
    stockStatus: 'in-stock',
    rating: 4.5,
    reviews: [],
    searchTags: ['bowl', 'barty', 'food bowl', 'water bowl', 'kukur', 'biral'],
  },
  {
    id: 15,
    name: 'Whiskas Pocket Ocean Fish',
    category: 'Cat Food',
    price: 50,
    imageUrl: 'https://placehold.co/600x400?text=Whiskas+Pocket+Ocean+Fish',
    description: 'Small trial pack of Whiskas Ocean Fish. Perfect for a single meal or treat.',
    weight: '85g',
    brandId: 5,
    rating: 4.2,
    reviews: [],
    searchTags: ['whiskas', 'cat food', 'small', 'packet', 'biral', 'khabar'],
  },
  {
    id: 16,
    name: 'Cat Scratching Post (Sisal Rope)',
    category: 'Cat Supplies',
    price: 1200,
    imageUrl: 'https://placehold.co/600x400?text=Cat+Scratching+Post',
    description:
      'Save your furniture! Durable sisal rope scratching post that cats love to scratch. Includes a hanging toy.',
    weight: '1.5kg',
    brandId: 16,
    rating: 4.7,
    reviews: [],
    searchTags: ['scratcher', 'scratch', 'post', 'toy', 'biral', 'khelna'],
  },
  {
    id: 17,
    name: 'Soft Fleece Pet Bed (Washable)',
    category: 'Dog Supplies',
    price: 1550,
    imageUrl: 'https://placehold.co/600x400?text=Soft+Fleece+Pet+Bed',
    description:
      'Ultra-soft fleece bed for cats and small dogs. Machine washable and very cozy for winter.',
    weight: 'Size M',
    brandId: 16,
    rating: 4.8,
    reviews: [],
    searchTags: ['bed', 'sleep', 'bichana', 'cushion', 'dog', 'cat'],
  },
  {
    id: 18,
    name: 'Reflex Plus Adult Cat Food (Chicken)',
    category: 'Cat Food',
    price: 3200,
    imageUrl: 'https://placehold.co/600x400?text=Reflex+Plus+Adult+Cat+Food',
    description:
      'Super premium cat food with chicken. Xylo-oligosaccharides (XOS) super prebiotics for digestion.',
    weight: '8kg',
    brandId: 9,
    rating: 4.9,
    reviews: [],
    searchTags: ['reflex', 'plus', 'cat food', 'chicken', 'biral', 'khabar'],
  },
  {
    id: 19,
    name: 'Bonnie Adult Cat Food (Chicken)',
    category: 'Cat Food',
    price: 4500,
    imageUrl: 'https://placehold.co/600x400?text=Bonnie+Adult+Cat+Food',
    description:
      'Bulk pack of Bonnie Adult Cat Food. Great value for multi-cat households. Chicken flavor.',
    weight: '10kg',
    brandId: 13,
    rating: 4.4,
    reviews: [],
    searchTags: ['bonnie', 'cat food', 'chicken', 'bulk', 'biral', 'khabar'],
  },
  {
    id: 20,
    name: 'SmartHeart Adult Dog Food (Roast Beef)',
    category: 'Dog Food',
    price: 1450,
    imageUrl: 'https://placehold.co/600x400?text=SmartHeart+Adult+Dog+Food',
    description: 'SmartHeart Dog Food with Roast Beef flavor. Irresistible taste for your dog.',
    weight: '3kg',
    brandId: 6,
    rating: 4.6,
    reviews: [],
    searchTags: ['smartheart', 'dog food', 'beef', 'roast beef', 'kukur', 'khabar'],
  },
  {
    id: 21,
    name: 'Drools Chicken and Egg Adult Dog Food',
    category: 'Dog Food',
    price: 1150,
    imageUrl: 'https://placehold.co/600x400?text=Drools+Chicken+and+Egg',
    description:
      'Drools Chicken and Egg formula provides complete nutrition. Real chicken meat and egg.',
    weight: '3kg',
    brandId: 3,
    rating: 4.5,
    reviews: [],
    searchTags: ['drools', 'dog food', 'chicken', 'egg', 'kukur', 'khabar'],
  },
  {
    id: 22,
    name: 'Reflex High Quality Adult Dog Food (Lamb & Rice)',
    category: 'Dog Food',
    price: 1700,
    imageUrl: 'https://placehold.co/600x400?text=Reflex+High+Quality+Adult+Dog+Food',
    description: 'Reflex Dog Food with Lamb & Rice is easy to digest and perfect for adult dogs.',
    weight: '3kg',
    brandId: 14,
    rating: 4.7,
    reviews: [],
    searchTags: ['reflex', 'dog food', 'lamb', 'rice', 'kukur', 'khabar'],
  },
  {
    id: 23,
    name: 'JerHigh Meat as Meals',
    category: 'Dog Food',
    price: 800,
    imageUrl: 'https://placehold.co/600x400?text=JerHigh+Meat+as+Meals',
    description:
      'JerHigh Meat as Meals is a premium semi-moist dog food suitable for all breeds. Soft texture.',
    weight: '500g',
    brandId: 15,
    rating: 4.9,
    reviews: [],
    searchTags: ['jerhigh', 'dog food', 'soft', 'treat', 'kukur', 'khabar'],
  },
  {
    id: 24,
    name: 'Bentonite Cat Litter (Lemon/Coffee)',
    category: 'Cat Supplies',
    price: 450,
    imageUrl: 'https://placehold.co/600x400?text=Bentonite+Cat+Litter',
    description:
      'High-quality Bentonite Cat Litter with pleasant scent (Lemon or Coffee). Strong clumping action.',
    weight: '5L',
    brandId: 16,
    rating: 4.3,
    reviews: [],
    searchTags: ['litter', 'bali', 'cat litter', 'lemon', 'coffee', 'biral'],
  },
  {
    id: 25,
    name: 'Plastic Litter Box with Rim',
    category: 'Cat Supplies',
    price: 800,
    imageUrl: 'https://placehold.co/600x400?text=Plastic+Litter+Box',
    description:
      'Durable plastic litter box with removable rim to prevent spillage. Easy to clean.',
    weight: 'Medium',
    brandId: 16,
    rating: 4.4,
    reviews: [],
    searchTags: ['litter box', 'tray', 'toilet', 'cat', 'biral', 'box'],
  },
  {
    id: 26,
    name: 'Self-cleaning Slicker Brush',
    category: 'Grooming',
    price: 450,
    imageUrl: 'https://placehold.co/600x400?text=Self-cleaning+Slicker+Brush',
    description:
      'Easily remove loose fur and tangles. One-click self-cleaning mechanism makes grooming a breeze.',
    weight: '1 unit',
    brandId: 16,
    rating: 4.7,
    reviews: [],
    searchTags: ['brush', 'comb', 'fur', 'grooming', 'cat', 'dog', 'hair'],
  },
  {
    id: 27,
    name: 'Pet Carrier Cage (Airline Approved)',
    category: 'Cat Supplies',
    price: 2000,
    imageUrl: 'https://placehold.co/600x400?text=Pet+Carrier+Cage',
    description:
      'Sturdy pet carrier cage suitable for cats and small dogs. Good ventilation and secure lock.',
    weight: 'Size S',
    brandId: 16,
    rating: 4.8,
    reviews: [],
    searchTags: ['carrier', 'cage', 'travel', 'transport', 'cat', 'dog'],
  },
  {
    id: 28,
    name: 'Pet Nail Clipper',
    category: 'Grooming',
    price: 350,
    imageUrl: 'https://placehold.co/600x400?text=Pet+Nail+Clipper',
    description:
      'Sharp stainless steel blades for precise cutting. Safety guard to prevent over-cutting.',
    weight: '1 unit',
    brandId: 16,
    rating: 4.5,
    reviews: [],
    searchTags: ['nail', 'clipper', 'cut', 'grooming', 'cat', 'dog', 'nok'],
  },
  {
    id: 29,
    name: 'Adjustable Nylon Neck Collar with Bell',
    category: 'Cat Supplies',
    price: 250,
    imageUrl: 'https://placehold.co/600x400?text=Adjustable+Nylon+Collar',
    description: 'Colorful nylon collar with a cute bell. Adjustable size for cats and small dogs.',
    weight: '1 unit',
    brandId: 16,
    rating: 4.3,
    reviews: [],
    searchTags: ['collar', 'belt', 'bell', 'ghonti', 'cat', 'dog', 'neck'],
  },
];

const MOCK_ORDERS: Order[] = [
  {
    orderId: 'PB-1678886400',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    total: 6450,
    items: [
      { ...MOCK_PRODUCTS[0], quantity: 1 },
      { ...MOCK_PRODUCTS[4], quantity: 1 },
    ],
    status: 'delivered',
  },
  {
    orderId: 'PB-1679491200',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    total: 1300,
    items: [{ ...MOCK_PRODUCTS[1], quantity: 1 }],
    status: 'processing',
  },
  {
    orderId: 'PB-1680096000',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total: 480,
    items: [{ ...MOCK_PRODUCTS[8], quantity: 1 }],
    status: 'shipped',
  },
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    author: {
      id: 2,
      name: 'Jamal Khan',
      profilePictureUrl: 'https://picsum.photos/seed/jamal/200',
    },
    text: 'Great advice! I was wondering about this for my cat.',
    likes: [1],
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: 101,
        author: {
          id: 1,
          name: 'Aisha Rahman',
          profilePictureUrl: 'https://picsum.photos/seed/aisha/200',
        },
        text: 'Same here, thanks for sharing!',
        likes: [2],
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    author: {
      id: 1,
      name: 'Aisha Rahman',
      profilePictureUrl: 'https://picsum.photos/seed/aisha/200',
    },
    content:
      'Just switched my cat to Royal Canin and her coat has never been shinier! Anyone else have good experiences with this brand?',
    imageUrl: 'https://picsum.photos/seed/post1/600/400',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likes: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    comments: MOCK_COMMENTS,
  },
  {
    id: 2,
    author: {
      id: 2,
      name: 'Jamal Khan',
      profilePictureUrl: 'https://picsum.photos/seed/jamal/200',
    },
    content:
      '🐕 Pro tip for new dog owners: Consistency is key in training! Start with basic commands like "sit" and "stay" and practice daily. My German Shepherd learned these in just 2 weeks. What training tips do you have?',
    imageUrl: 'https://picsum.photos/seed/post2/600/400',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: [1, 3, 5, 7],
    comments: [],
  },
  {
    id: 3,
    author: {
      id: 3,
      name: 'Fatima Akter',
      profilePictureUrl: 'https://picsum.photos/seed/fatima/200',
    },
    content:
      'Looking for recommendations for a good vet in Dhanmondi area. My kitten needs her first vaccination. Any suggestions would be greatly appreciated! 🐱💉',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    likes: [1, 2],
    comments: [
      {
        id: 2,
        author: {
          id: 1,
          name: 'Aisha Rahman',
          profilePictureUrl: 'https://picsum.photos/seed/aisha/200',
        },
        text: 'I highly recommend Dr. Kabir at Dhaka Pet Hospital! Very gentle with kittens.',
        likes: [3],
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        replies: [],
      },
    ],
  },
];

const MOCK_VET_REVIEWS: VetReview[] = [
  {
    id: 1,
    author: 'Aisha R.',
    rating: 5,
    comment: 'Dr. Ahmed was so gentle with my cat and very knowledgeable. Highly recommend!',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    author: 'Jamal K.',
    rating: 5,
    comment:
      "Excellent online consultation. Dr. Islam gave me clear advice for my senior cat's diet.",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_VETS: Vet[] = [
  {
    id: 1,
    name: 'Dr. Fatima Ahmed',
    specialization: 'General Pet Health',
    clinicName: 'Paws & Claws Clinic',
    address: 'House 15, Road 7, Block G, Banani, Dhaka',
    phone: '+8801712-345678',
    imageUrl: 'https://picsum.photos/seed/vet1/200/200',
    availability: 'Available Today',
    bio: 'Dr. Fatima Ahmed is a compassionate veterinarian with over 10 years of experience in small animal medicine. She graduated from the Bangladesh Agricultural University and has a special interest in dermatology and internal medicine.',
    qualifications: ['DVM, BAU', 'Member of BSAVA'],
    services: [
      { name: 'General Consultation', price: 800, type: 'in-clinic' },
      { name: 'Online Consultation', price: 600, type: 'online' },
      { name: 'Annual Vaccination', price: 1500, type: 'in-clinic' },
    ],
    reviews: MOCK_VET_REVIEWS,
  },
  {
    id: 2,
    name: 'Dr. Kabir Hossain',
    specialization: 'Canine Specialist',
    clinicName: 'Dhaka Pet Hospital',
    address: '21/A, Dhanmondi Road 2, Dhaka',
    phone: '+8801812-345679',
    imageUrl: 'https://picsum.photos/seed/vet2/200/200',
    availability: 'Offline',
    bio: 'Dr. Kabir Hossain is a leading canine specialist in Dhaka, with a focus on orthopedic surgery and behavioral therapy. His state-of-the-art facility provides top-notch care for dogs of all breeds and sizes.',
    qualifications: [
      'DVM, Chittagong Veterinary and Animal Sciences University',
      'Advanced Certification in Canine Surgery',
    ],
    services: [
      { name: 'Specialist Consultation', price: 1200, type: 'in-clinic' },
      { name: 'Orthopedic Surgery', price: 25000, type: 'in-clinic' },
    ],
    reviews: [],
  },
  {
    id: 3,
    name: 'Dr. Nazia Islam',
    specialization: 'Feline Health & Nutrition',
    clinicName: 'The Cat Care Center',
    address: '123/B, Gulshan Avenue, Gulshan 2, Dhaka',
    phone: '+8801912-345680',
    imageUrl: 'https://picsum.photos/seed/vet3/200/200',
    availability: 'Available Now',
    bio: 'Dr. Nazia Islam is a dedicated feline practitioner who runs a cats-only clinic to ensure a stress-free environment for her patients. She is an expert in feline nutrition and preventative care.',
    qualifications: ['DVM, SYLVET', 'Certified Feline Nutritionist'],
    services: [
      { name: 'Online Feline Consultation', price: 700, type: 'online' },
      { name: 'In-Clinic Feline Check-up', price: 1000, type: 'in-clinic' },
      { name: 'Dental Cleaning', price: 3500, type: 'in-clinic' },
    ],
    reviews: [MOCK_VET_REVIEWS[1]],
  },
  {
    id: 4,
    name: 'Dr. Asaduzzaman Noor',
    specialization: 'Avian & Exotic Pets',
    clinicName: 'Birds & Exotics Care',
    address: 'Plot 5, Section 6, Mirpur, Dhaka',
    phone: '+8801755-123456',
    imageUrl: 'https://picsum.photos/seed/vet4/200/200',
    availability: 'Available Today',
    bio: 'Dr. Noor is one of the few specialists in Bangladesh focusing on birds and exotic pets. Whether you have a parrot, rabbit, or turtle, Dr. Noor offers expert advice on diet, habitat, and health.',
    qualifications: ['DVM, BAU', 'Masters in Wildlife Medicine'],
    services: [
      { name: 'Online Bird Consultation', price: 600, type: 'online' },
      { name: 'Exotic Pet Checkup', price: 1000, type: 'in-clinic' },
      { name: 'Beak & Nail Trimming', price: 400, type: 'in-clinic' },
    ],
    reviews: [],
  },
  {
    id: 5,
    name: 'Dr. Rebeka Sultana',
    specialization: 'Veterinary Dermatology',
    clinicName: 'Vet Care BD',
    address: 'Sector 4, Road 13, Uttara, Dhaka',
    phone: '+8801611-987654',
    imageUrl: 'https://picsum.photos/seed/vet5/200/200',
    availability: 'Available Now',
    bio: 'Skin issues are very common in our humid climate. Dr. Rebeka Sultana specializes in diagnosing and treating complicated skin conditions, allergies, and fungal infections in dogs and cats.',
    qualifications: ['DVM, SAU', 'PhD in Veterinary Dermatology'],
    services: [
      { name: 'Online Skin Consultation', price: 800, type: 'online' },
      { name: 'Dermatology Screening', price: 1500, type: 'in-clinic' },
      { name: 'Allergy Testing', price: 2000, type: 'in-clinic' },
    ],
    reviews: [],
  },
  {
    id: 6,
    name: 'Dr. Imtiaz Ahmed',
    specialization: 'General Medicine & Surgery',
    clinicName: 'Chattogram Pet Hospital',
    address: 'O.R. Nizam Road, Chittagong',
    phone: '+8801819-556677',
    imageUrl: 'https://picsum.photos/seed/vet6/200/200',
    availability: 'Available Today',
    bio: 'Based in Chittagong, Dr. Imtiaz Ahmed brings 8 years of experience in treating small animals. He is well-known for his calm demeanor and accurate diagnosis. He is now available for online consultations nationwide.',
    qualifications: ['DVM, CVASU', 'Member of BCVA'],
    services: [
      { name: 'Telemedicine Session', price: 500, type: 'online' },
      { name: 'General Health Check', price: 700, type: 'in-clinic' },
      { name: 'Spay/Neuter Surgery', price: 4000, type: 'in-clinic' },
    ],
    reviews: [],
  },
  {
    id: 7,
    name: 'Dr. Nyla Khan',
    specialization: 'Pet Nutrition & Behavior',
    clinicName: 'Pet Life Hospital',
    address: 'Bashundhara R/A, Dhaka',
    phone: '+8801913-445566',
    imageUrl: 'https://picsum.photos/seed/vet7/200/200',
    availability: 'Available Now',
    bio: 'Dr. Nyla Khan focuses on the holistic well-being of pets. If your pet is a picky eater, overweight, or showing behavioral issues like aggression or anxiety, Dr. Nyla can provide a customized plan online.',
    qualifications: ['DVM, BAU', 'Certified Clinical Pet Nutritionist'],
    services: [
      { name: 'Diet & Nutrition Plan', price: 1000, type: 'online' },
      { name: 'Behavioral Therapy (Online)', price: 1200, type: 'online' },
      { name: 'Weight Management', price: 800, type: 'in-clinic' },
    ],
    reviews: [],
  },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 11,
    title: 'পোষা প্রাণীর এঁটেল এবং মাছি সমস্যা: প্রতিরোধের সেরা উপায়',
    content: `এঁটেল (ticks) এবং মাছি (fleas) পোষা প্রাণীর জন্য শুধুমাত্র বিরক্তিকর নয়, বরং মারাত্মক স্বাস্থ্য ঝুঁকির কারণ হতে পারে। বাংলাদেশের উষ্ণ এবং আর্দ্র আবহাওয়া এদের বংশবৃদ্ধির জন্য অত্যন্ত সহায়ক। একজন দায়িত্বশীল মালিক হিসেবে, এই পরজীবীগুলো থেকে আপনার পোষ্যকে সুরক্ষিত রাখা আপনার অন্যতম প্রধান দায়িত্ব। এই আর্টিকেলে আমরা এঁটেল ও মাছির বিপদ এবং তা প্রতিরোধের কার্যকরী উপায় নিয়ে বিস্তারিত আলোচনা করব।

**কেন এঁটেল এবং মাছি বিপজ্জনক?**
এই ক্ষুদ্র পরজীবীগুলো আপনার পোষ্যের স্বাস্থ্যের উপর বড় ধরনের নেতিবাচক প্রভাব ফেলতে পারে।
* **রক্তস্বল্পতা:** মারাত্মক সংক্রমণের ক্ষেত্রে, বিশেষ করে ছোট বা দুর্বল প্রাণীদের মধ্যে, অতিরিক্ত রক্ত শোষণের ফলে অ্যানিমিয়া বা রক্তস্বল্পতা দেখা দিতে পারে। এর ফলে আপনার পোষ্য দুর্বল এবং নিস্তেজ হয়ে পড়তে পারে।
* **রোগের সংক্রমণ:** এঁটেল 'Tick Fever' (Ehrlichiosis, Babesiosis) এর মতো মারাত্মক রোগ ছড়াতে পারে, যা সঠিক সময়ে চিকিৎসা না করালে কুকুরের জন্য প্রাণঘাতী হতে পারে। এই রোগগুলোর লক্ষণের মধ্যে রয়েছে জ্বর, অলসতা, এবং ক্ষুধামন্দা। অন্যদিকে, মাছি টেপওয়ার্ম (tapeworms) এবং বিভিন্ন ধরণের ত্বকের রোগ বা অ্যালার্জি (Flea Allergy Dermatitis) সৃষ্টি করতে পারে, যা পোষ্যের জন্য অত্যন্ত কষ্টদায়ক।
* **চুলকানি এবং অস্বস্তি:** ক্রমাগত চুলকানির ফলে পোষ্যের ত্বক ক্ষতিগ্রস্ত হয়, ঘা হতে পারে এবং ব্যাকটেরিয়া সংক্রমণ হতে পারে। এটি তাদের মানসিক স্বাস্থ্যের উপরও প্রভাব ফেলে, তাদের খিটখিটে করে তোলে।

**প্রতিরোধের কার্যকরী উপায়:**
প্রতিরোধই চিকিৎসার চেয়ে উত্তম। নিচে কিছু জনপ্রিয় এবং কার্যকরী প্রতিরোধ ব্যবস্থার বর্ণনা দেওয়া হলো:
* **Spot-on Treatment:** এটি সবচেয়ে জনপ্রিয় এবং কার্যকর উপায়। প্রতি মাসে একবার পোষ্যের ঘাড়ের পেছনের চামড়ায় এই তরল ওষুধ প্রয়োগ করতে হয়। এটি রক্তে মিশে গিয়ে এঁটেল এবং মাছিকে মেরে ফেলে এবং নতুন সংক্রমণ থেকে দীর্ঘমেয়াদী সুরক্ষা দেয়। Fipronil বা Selamectin युक्त পণ্যগুলো বেশ কার্যকর। ব্যবহারের আগে প্যাকেজের নির্দেশাবলী ভালোভাবে পড়ে নিন।
* **Flea and Tick Collar:** এই কলারগুলো একটি নির্দিষ্ট সময় পর্যন্ত (সাধারণত ৩-৮ মাস) পরজীবী তাড়ানোর রাসায়নিক নির্গত করে পোষ্যকে সুরক্ষিত রাখে। এটি একটি সহজ এবং দীর্ঘস্থায়ী সমাধান, তবে সব পোষ্যের জন্য এটি উপযুক্ত নাও হতে পারে।
* **ওষুধ বা ট্যাবলেট:** পশুচিকিৎসকের পরামর্শে কিছু খাওয়ার ওষুধও পাওয়া যায় যা রক্তে মিশে এঁটেল ও মাছি নিয়ন্ত্রণ করে। এগুলো খুব দ্রুত কাজ করে এবং ব্যবহারের জন্য সুবিধাজনক।
* **পরিবেশ পরিষ্কার রাখা:** শুধুমাত্র পোষ্যের শরীর থেকে পরজীবী দূর করলেই হবে না। আপনার বাড়ি এবং পোষ্যের থাকার জায়গাও পরিষ্কার রাখতে হবে। নিয়মিত ভ্যাকুয়াম করা, পোষ্যের বিছানা গরম জলে ধোয়া এবং প্রয়োজনে কীটনাশক স্প্রে ব্যবহার করা আবশ্যক। মনে রাখবেন, মাছির জীবনের ৯০% পরিবেশেই কেটে যায়, পোষ্যের শরীরে নয়।

**উপসংহার:**
আপনার পোষ্যের বয়স, ওজন এবং স্বাস্থ্য অবস্থা অনুযায়ী কোন প্রতিরোধ ব্যবস্থাটি সবচেয়ে উপযুক্ত হবে, তা জানতে সর্বদা একজন অভিজ্ঞ পশুচিকিৎসকের সাথে পরামর্শ করুন। নিয়মিত প্রতিরোধমূলক ব্যবস্থা গ্রহণ করে আপনি আপনার পোষ্যকে এই বিরক্তিকর এবং বিপজ্জনক পরজীবী থেকে সুরক্ষিত রাখতে পারেন এবং তাকে একটি সুস্থ ও সুখী জীবন উপহার দিতে পারেন।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,itchy?lock=11',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 12,
    title: 'বর্ষাকালে পোষা প্রাণীর যত্ন: আপনার পোষ্যকে রাখুন সুস্থ ও সুরক্ষিত',
    content: `বর্ষাকাল সবার জন্য স্বস্তিদায়ক হলেও আমাদের পোষা বন্ধুদের জন্য কিছু স্বাস্থ্য ঝুঁকি নিয়ে আসে। এই সময়ে অতিরিক্ত আর্দ্রতা এবং জল জমার কারণে ব্যাকটেরিয়া ও ছত্রাকের সংক্রমণ বাড়ে। তাই বর্ষায় আপনার পোষ্যের জন্য প্রয়োজন বাড়তি যত্ন এবং মনোযোগ।

**বর্ষাকালীন সাধারণ সমস্যা:**
* **ত্বকের সংক্রমণ:** ভেজা আবহাওয়ায় কুকুর এবং বিড়ালের ত্বকে ছত্রাক এবং ব্যাকটেরিয়া জনিত সংক্রমণ (Fungal/Bacterial infection), হট স্পট (Hot Spot) এবং চুলকানি দেখা যায়। ভেজা পশম ঘণ্টার পর ঘণ্টা থাকলে এই ঝুঁকি আরও বেড়ে যায়।
* **পায়ের সমস্যা:** কাদামাটি এবং নোংরা জলে হাঁটার কারণে পায়ের পাতা এবং নখের ফাঁকে সংক্রমণ হতে পারে, যা Pododermatitis নামে পরিচিত। এর ফলে পায়ে ব্যথা, ফোলাভাব এবং চুলকানি হতে পারে।
* **পোকামাকড়ের উপদ্রব:** এই সময়ে এঁটেল (ticks) এবং মাছির (fleas) উপদ্রব অনেক বেড়ে যায়। জমা জল মশার বংশবৃদ্ধির জন্যও সহায়ক, যা Heartworm রোগের ঝুঁকি বাড়ায়।
* **হজমের সমস্যা:** দূষিত জল পান করার ফলে ডায়রিয়া, বমি এবং অন্যান্য পেটের সমস্যা (Gastroenteritis) হতে পারে। বাইরে হাঁটার সময় খেয়াল রাখুন যেন আপনার পোষ্য ডোবা বা নোংরা জল পান না করে।

**প্রয়োজনীয় যত্ন ও টিপস:**
* **শরীর শুকনো রাখুন:** বৃষ্টিতে ভিজলে বা বাইরে থেকে আসার পর পোষ্যের শরীর, বিশেষ করে থাবা এবং পশম, তোয়ালে দিয়ে ভালোভাবে মুছে শুকনো করে দিন। প্রয়োজনে হেয়ার ড্রায়ার লো-হিট সেটিং এ ব্যবহার করতে পারেন। কান এবং পায়ের আঙ্গুলের ফাঁকগুলো ভালোভাবে পরিষ্কার করতে ভুলবেন না।
* **নিয়মিত গ্রুমিং:** নিয়মিত ব্রাশ করলে ত্বকে বায়ু চলাচল বাড়ে এবং জট বাঁধা প্রতিরোধ হয়, যা ত্বকের সংক্রমণ কমাতে সাহায্য করে। এই সময়ে পোষ্যের পশম ছোট করে ছেঁটে রাখাও একটি ভালো উপায়।
* **পরজীবী নিয়ন্ত্রণ:** বর্ষার আগেই পশুচিকিৎসকের পরামর্শ অনুযায়ী এঁটেল এবং মাছির জন্য প্রতিরোধমূলক ব্যবস্থা (যেমন Spot-on treatment) গ্রহণ করুন। এটি অত্যন্ত গুরুত্বপূর্ণ।
* **খাবার ও জল:** পোষ্যকে সর্বদা ফিল্টার করা বা ফোটানো বিশুদ্ধ জল খেতে দিন। ভেজা এবং স্যাঁতসেঁতে আবহাওয়ায় খাবার দ্রুত নষ্ট হয়ে যেতে পারে, তাই তাজা খাবার পরিবেশন করুন এবং দীর্ঘ সময় ধরে খাবার ফেলে রাখবেন না।
* **বাড়ির ভেতর ব্যায়াম:** বৃষ্টির কারণে বাইরে হাঁটা সম্ভব না হলে, বাড়ির ভেতরেই বিভিন্ন খেলাধুলার মাধ্যমে তাদের সক্রিয় রাখুন। Fetch, tug-of-war বা পাজল টয় দিয়ে তাদের ব্যস্ত রাখতে পারেন। এটি তাদের শারীরিক ও মানসিক স্বাস্থ্য ভালো রাখতে সাহায্য করবে।
* **বজ্রপাতের ভয়:** অনেক পোষ্য বজ্রপাতের শব্দে ভয় পায়। এই সময়ে তাদের একটি নিরাপদ ও আরামদায়ক স্থানে থাকতে দিন এবং শান্ত রাখার চেষ্টা করুন। প্রয়োজনে calming music বা white noise ব্যবহার করুন।

এই ছোট ছোট পদক্ষেপগুলো অনুসরণ করলে আপনার পোষ্য বর্ষাকাল উপভোগ করতে পারবে এবং সুস্থ থাকবে। যেকোনো স্বাস্থ্য সমস্যা দেখা দিলে, যেমন ক্রমাগত চুলকানি, খাওয়া-দাওয়া বন্ধ করে দেওয়া বা ডায়রিয়া, দ্রুত পশুচিকিৎসকের শরণাপন্ন হন।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,rain?lock=12',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 13,
    title: 'বয়স্ক পোষ্যের যত্ন: আপনার সিনিয়র বন্ধুকে দিন সোনালী সময়',
    content: `আমাদের পোষা বন্ধুরা যখন বার্ধক্যে পৌঁছায়, তখন তাদের প্রয়োজন হয় বিশেষ যত্ন এবং মনোযোগের। বয়স বাড়ার সাথে সাথে তাদের শরীর এবং আচরণে অনেক পরিবর্তন আসে। এই পরিবর্তনগুলো বুঝে সঠিক যত্ন নিলে তারা তাদের জীবনের শেষ সময়টা আরাম ও শান্তিতে কাটাতে পারে।

**বয়স্ক পোষ্যের সাধারণ পরিবর্তন:**
* **গতি কমে যাওয়া:** আর্থ্রাইটিস এবং জয়েন্টের ব্যথার কারণে তাদের হাঁটাচলা এবং দৌড়ানোর গতি কমে যায়। সিঁড়ি ভাঙতে বা গাড়িতে উঠতে কষ্ট হতে পারে। তারা আগের মতো লাফাতে বা খেলতে আগ্রহী নাও হতে পারে।
* **দৃষ্টি ও শ্রবণশক্তি হ্রাস:** বয়স বাড়ার সাথে সাথে তাদের দৃষ্টিশক্তি এবং শ্রবণশক্তি দুর্বল হয়ে পড়ে। তারা সহজেই চমকে যেতে পারে বা আপনার ডাকে সাড়া দিতে দেরি করতে পারে।
* **ওজন পরিবর্তন:** মেটাবলিজম কমে যাওয়ার কারণে ওজন বাড়তে পারে, অথবা দাঁতের সমস্যা বা অন্যান্য রোগের কারণে ওজন কমতেও পারে। উভয় ক্ষেত্রেই পশুচিকিৎসকের পরামর্শ নেওয়া জরুরি।
* **আচরণের পরিবর্তন:** তারা আগের চেয়ে বেশি ঘুমাতে পারে, খেলাধুলায় আগ্রহ হারাতে পারে অথবা 불안 বা বিভ্রান্তি (cognitive dysfunction) অনুভব করতে পারে। তারা একা থাকতে ভয় পেতে পারে বা রাতে অস্থির থাকতে পারে।

**কীভাবে যত্ন নেবেন?**
* **নিয়মিত পশুচিকিৎসক চেকআপ:** বয়স্ক পোষ্যদের জন্য প্রতি ছয় মাসে অন্তত একবার পশুচিকিৎসকের কাছে নিয়ে যাওয়া উচিত। এর মাধ্যমে বয়স-সম্পর্কিত রোগ যেমন কিডনি সমস্যা, হৃদরোগ, ডায়াবেটিস বা ক্যান্সার প্রাথমিক পর্যায়ে সনাক্ত করা সম্ভব হয় এবং সময়মতো চিকিৎসা শুরু করা যায়।
* **সঠিক খাদ্য:** তাদের জন্য বিশেষভাবে তৈরি সিনিয়র ডায়েট বেছে নিন, যাতে ক্যালোরি কম কিন্তু ফাইবার এবং প্রয়োজনীয় পুষ্টি বেশি থাকে। জয়েন্টের স্বাস্থ্যের জন্য গ্লুকোসামিন এবং কনড্রয়েটিন সমৃদ্ধ খাবার বা সাপ্লিমেন্ট খুবই উপকারী।
* **আরামদায়ক পরিবেশ:** তাদের ঘুমানোর জন্য একটি নরম এবং আরামদায়ক অর্থোপেডিক বিছানার ব্যবস্থা করুন, যা সহজেই অ্যাক্সেসযোগ্য। পিচ্ছিল মেঝেতে কার্পেট বা ম্যাট ব্যবহার করুন যাতে তাদের হাঁটতে সুবিধা হয় এবং পড়ে যাওয়ার ঝুঁকি কমে।
* **হালকা ব্যায়াম:** তাদের সক্রিয় রাখতে প্রতিদিন অল্প সময়ের জন্য হালকা হাঁটা বা সাঁতারের মতো ব্যায়াম করান। এটি তাদের পেশী শক্তিশালী রাখতে, জয়েন্ট সচল রাখতে এবং ওজন নিয়ন্ত্রণে সাহায্য করবে। অতিরিক্ত ব্যায়াম করাবেন না।
* **মানসিক উদ্দীপনা:** তাদের মস্তিষ্ককে সক্রিয় রাখতে পাজল টয় বা সহজ প্রশিক্ষণ সেশন চালু রাখুন। এটি তাদের মনকে সজাগ রাখতে সাহায্য করবে।
* **অতিরিক্ত ভালোবাসা ও ধৈর্য:** এই সময়ে তাদের সবচেয়ে বেশি প্রয়োজন আপনার সঙ্গ, ভালোবাসা এবং ধৈর্য। তাদের শারীরিক এবং মানসিক পরিবর্তনের সাথে মানিয়ে নিন এবং তাদের প্রতি সহানুভূতিশীল হন।

আপনার সিনিয়র বন্ধুর জীবনের এই পর্যায়ে সঠিক যত্ন নিশ্চিত করা আপনার দায়িত্ব। আপনার একটু বাড়তি মনোযোগ তাদের শেষ দিনগুলোকে আনন্দময়, আরামদায়ক এবং মর্যাদাপূর্ণ করে তুলতে পারে।`,
    imageUrl: 'https://loremflickr.com/600/400/old,dog?lock=13',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 14,
    title: 'পথকুকুরদের বুঝুন: ভয় নয়, সহানুভূতি প্রয়োজন',
    content: `বাংলাদেশে পথকুকুর আমাদের নগর জীবনের একটি অবিচ্ছেদ্য অংশ। অনেকেই তাদের ভয় পান বা অবহেলার চোখে দেখেন। কিন্তু একটু সহানুভূতি এবং সঠিক জ্ঞান দিয়ে আমরা তাদের সাথে শান্তিপূর্ণভাবে সহাবস্থান করতে পারি এবং একটি প্রাণী-বান্ধব সমাজ গড়ে তুলতে পারি।

**পথকুকুরদের আচরণ বোঝা:**
পথকুকুররা সাধারণত মানুষের সঙ্গ এড়িয়ে চলে। তারা সামাজিক প্রাণী এবং নিজেদের এলাকা (territory) রক্ষা করে। তারা তখনই আক্রমণাত্মক হতে পারে যখন তারা নিজেদের বা তাদের বাচ্চাদের বিপন্ন মনে করে, অথবা যখন তাদের এলাকায় অচেনা কেউ বা অন্য প্রাণী প্রবেশ করে। তাদের শারীরিক ভাষা বোঝা গুরুত্বপূর্ণ। লেজ নিচু করা, কান পেছনের দিকে নেওয়া বা غرغر করা তাদের ভয় বা অস্বস্তির লক্ষণ। এই সময়ে তাদের থেকে দূরত্ব বজায় রাখাই শ্রেয়। সরাসরি চোখের দিকে তাকিয়ে থাকা বা দৌড় দেওয়া তাদের ভয় পাওয়ানোর কারণ হতে পারে।

**সহানুভূতি কেন প্রয়োজন?**
রাস্তার কুকুরদের জীবন অত্যন্ত কঠিন। তাদের প্রতিনিয়ত ক্ষুধা, রোগ, দুর্ঘটনা এবং মানুষের নিষ্ঠুরতার সাথে লড়াই করতে হয়। তাদের প্রয়োজন আমাদের সহানুভূতি, ঘৃণা নয়।
* **খাবার ও জল:** আপনার বাড়ির আশেপাশে নির্দিষ্ট স্থানে তাদের জন্য পরিষ্কার জল এবং উচ্ছিষ্ট খাবার রাখতে পারেন। এটি তাদের আবর্জনা থেকে খাবার খোঁজার প্রবণতা কমাবে। তবে খেয়াল রাখবেন যেন জায়গাটি নোংরা না হয়।
* **প্রাথমিক চিকিৎসা:** ছোটখাটো আঘাত দেখলে, সম্ভব হলে, প্রাথমিক চিকিৎসা প্রদান করতে পারেন অথবা কোনো পশু কল্যাণ সংস্থাকে জানাতে পারেন। তীব্র গরমে বা শীতে তাদের জন্য একটি অস্থায়ী আশ্রয়ের ব্যবস্থা করতে পারেন।
* **CNVR (Catch-Neuter-Vaccinate-Return):** পথকুকুরদের সংখ্যা নিয়ন্ত্রণের সবচেয়ে মানবিক এবং বৈজ্ঞানিক পদ্ধতি হলো CNVR। এই পদ্ধতিতে, কুকুরদের ধরে, তাদের বন্ধ্যাত্বকরণ এবং জলাতঙ্ক টিকা দিয়ে আবার তাদের নিজেদের এলাকায় ছেড়ে দেওয়া হয়। এর ফলে নতুন কুকুরছানার জন্ম নিয়ন্ত্রিত হয়, এলাকাটি জলাতঙ্ক মুক্ত থাকে এবং কুকুরদের মধ্যে মারামারি কমে। এটিই কুকুরদের সংখ্যা নিয়ন্ত্রণের একমাত্র স্থায়ী এবং মানবিক সমাধান।

**কীভাবে সাহায্য করতে পারেন?**
আপনি সরাসরি কোনো প্রাণীকে উদ্ধার করতে না পারলেও, স্থানীয় পশু কল্যাণ সংস্থাগুলোকে সাহায্য করতে পারেন। অনুদান প্রদান, স্বেচ্ছাসেবক হিসেবে কাজ করা বা তাদের কার্যক্রম সম্পর্কে সচেতনতা তৈরি করার মাধ্যমেও আপনি একটি বড় ভূমিকা পালন করতে পারেন। আপনার এলাকার কমিউনিটিকে CNVR প্রোগ্রামের গুরুত্ব সম্পর্কে বোঝাতে পারেন।

পথকুকুররা আমাদের পরিবেশের অংশ। তাদের ভয় না পেয়ে, তাদের প্রতি একটু দয়া দেখালে এবং তাদের সমস্যার স্থায়ী সমাধানে সাহায্য করলে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলা সম্ভব, যেখানে মানুষ এবং প্রাণী উভয়েই শান্তিতে বসবাস করতে পারবে।`,
    imageUrl: 'https://loremflickr.com/600/400/street,dog?lock=14',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 10,
    title: 'কুকুরের পারভোভাইরাস: বাংলাদেশের কুকুরদের জন্য এক মারাত্মক হুমকি',
    content: `কুকুরের পারভোভাইরাস (Canine Parvovirus বা CPV) একটি অত্যন্ত গুরুতর এবং সংক্রামক ভাইরাল রোগ যা মূলত টিকা না দেওয়া কুকুর এবং ছয় মাসের কম বয়সী কুকুরছানাদের প্রভাবিত করে। বাংলাদেশের একজন পশুচিকিৎসক হিসেবে, আমি এর ভয়াবহ প্রভাব নিজের চোখে দেখেছি এবং বহু পোষ্যকে এর কারণে মারা যেতে দেখেছি। তাই এই রোগ সম্পর্কে সঠিক জ্ঞান থাকা প্রত্যেক কুকুর মালিকের জন্য অপরিহার্য।

**কিভাবে ছড়ায়?**
এই ভাইরাসটি অত্যন্ত শক্তিশালী এবং পরিবেশে দীর্ঘ সময় ধরে বেঁচে থাকতে পারে, এমনকি মাস থেকে বছর পর্যন্ত। এটি সংক্রমিত কুকুরের মলের মাধ্যমে ছড়ায়। ভাইরাসটি সরাসরি সংস্পর্শে বা পরোক্ষভাবে ছড়াতে পারে। এমনকি মানুষ তার জুতা, পোশাক বা হাতের মাধ্যমেও অজান্তেই এই ভাইরাসটি এক স্থান থেকে অন্য স্থানে, যেমন পার্ক থেকে বাড়িতে, ছড়িয়ে দিতে পারে। এর মানে হলো, আপনার কুকুর যদি সরাসরি কোনো সংক্রমিত কুকুরের সংস্পর্শে না-ও আসে, তবুও সে পারভোতে আক্রান্ত হতে পারে।

**প্রধান লক্ষণসমূহ:**
পারভোভাইরাস কুকুরের অন্ত্র এবং অস্থি মজ্জাকে আক্রমণ করে, যার ফলে গুরুতর লক্ষণ দেখা দেয়।
* **তীব্র বমি:** কুকুর ক্রমাগত বমি করতে থাকে, অনেক সময় বমিতে রক্তও দেখা যায়।
* **রক্তযুক্ত ডায়রিয়া:** দুর্গন্ধযুক্ত, পানির মতো বা রক্তমিশ্রিত ডায়রিয়া পারভোর একটি প্রধান লক্ষণ। এটি ডিহাইড্রেশনের প্রধান কারণ।
* **অলসতা ও দুর্বলতা:** কুকুর হঠাৎ করে নিস্তেজ হয়ে পড়ে, খেলাধুলা বা হাঁটাচলায় আগ্রহ হারিয়ে ফেলে। তারা অত্যন্ত দুর্বল হয়ে পড়ে।
* **ক্ষুধামন্দা এবং ডিহাইড্রেশন:** কুকুর খাওয়া-দাওয়া পুরোপুরি বন্ধ করে দেয়। ক্রমাগত বমি এবং ডায়রিয়ার কারণে শরীর দ্রুত পানিশূন্য হয়ে পড়ে, যা শক এবং মৃত্যুর অন্যতম প্রধান কারণ।
* **জ্বর:** সংক্রমণের প্রাথমিক পর্যায়ে কুকুরের জ্বর হতে পারে।

**লক্ষণ দেখা দিলে করণীয়:**
যদি আপনার কুকুরের মধ্যে উপরের কোনো লক্ষণ দেখা যায়, তাহলে **এক মুহূর্তও দেরি না করে দ্রুত একজন অভিজ্ঞ পশুচিকিৎসকের সাথে যোগাযোগ করুন।** এটি একটি মেডিকেল ইমার্জেন্সি। পারভোভাইরাসের ক্ষেত্রে সময়মতো চিকিৎসা জীবন এবং মৃত্যুর মধ্যে পার্থক্য গড়ে দিতে পারে। পশুচিকিৎসক সাধারণত শিরায় স্যালাইন (IV fluids) দিয়ে ডিহাইড্রেশন নিয়ন্ত্রণ করেন, সেকেন্ডারি ব্যাকটেরিয়া সংক্রমণ রোধে অ্যান্টিবায়োটিক দেন এবং বমি কমানোর ওষুধ দিয়ে থাকেন। বাড়িতে এর কোনো চিকিৎসা নেই।

**প্রতিরোধই সর্বোত্তম এবং একমাত্র উপায়:**
পারভোভাইরাস প্রতিরোধের সবচেয়ে কার্যকর উপায় হলো সময়মতো এবং সম্পূর্ণ টিকাদান। কুকুরছানার বয়স ৬-৮ সপ্তাহ হলে প্রথম টিকা দিতে হয় এবং এরপর পশুচিকিৎসকের পরামর্শ অনুযায়ী বুস্টার ডোজগুলো (সাধারণত ৩-৪ সপ্তাহ পরপর) সম্পন্ন করতে হয়। একটি সম্পূর্ণ টিকাদান কোর্সই আপনার পোষা প্রাণীকে এই মারাত্মক রোগ থেকে প্রায় শতভাগ সুরক্ষিত রাখতে পারে। যতক্ষণ না পর্যন্ত টিকাদান কোর্স সম্পন্ন হয়, ততক্ষণ আপনার কুকুরছানাকে পার্ক বা অন্যান্য কুকুরের সংস্পর্শে আনা থেকে বিরত রাখুন।`,
    imageUrl: 'https://loremflickr.com/600/400/sick,dog?lock=10',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 9,
    title: 'কুকুরছানা বা বিড়ালছানাকে পটি ট্রেনিং করানোর সহজ এবং কার্যকরী উপায়',
    content: `একটি নতুন কুকুরছানা বা বিড়ালছানা ঘরে আনা নিঃসন্দেহে আনন্দের, কিন্তু একটি পরিষ্কার এবং শান্তিপূর্ণ সংসারের জন্য সঠিক পটি ট্রেনিং অপরিহার্য। এই ট্রেনিংয়ের জন্য প্রয়োজন ধৈর্য, ধারাবাহিকতা এবং ইতিবাচক মনোভাব। পশুচিকিৎসকদের আচরণগত নীতির উপর ভিত্তি করে তৈরি এই বিস্তারিত নির্দেশিকা আপনাকে সফল হতে সাহায্য করবে।

**ধাপ ১: সঠিক স্থান নির্ধারণ এবং রুটিন তৈরি:**
* **বিড়ালছানার জন্য:** একটি শান্ত এবং সহজে পৌঁছানো যায় এমন জায়গায় লিটার বক্স রাখুন। বিড়ালরা গোপনীয়তা পছন্দ করে। তাদের খাওয়ার জায়গা বা ঘুমানোর জায়গা থেকে দূরে রাখুন। প্রথম দিকে, তাকে বেশ কয়েকবার লিটার বক্স দেখিয়ে দিন।
* **কুকুরছানার জন্য:** বাড়ির বাইরে একটি নির্দিষ্ট স্থান ঠিক করুন যেখানে আপনি চান সে টয়লেট করুক। প্রতিবার একই জায়গায় নিয়ে গেলে তারা গন্ধের মাধ্যমে স্থানটি চিনতে পারবে।
* **রুটিন:** প্রতিদিন একটি নির্দিষ্ট রুটিন অনুসরণ করুন। ঘুম থেকে ওঠার পর, প্রতিটি খাবার খাওয়ার পর, খেলাধুলার পর এবং ঘুমানোর আগে অবশ্যই তাকে নির্ধারিত স্থানে নিয়ে যান। কুকুরছানাদের মূত্রথলি ছোট হওয়ায় তাদের প্রতি ১-২ ঘণ্টা পরপর বাইরে নিয়ে যাওয়া উচিত।

**ধাপ ২: সংকেত চিনতে শিখুন:**
আপনার পোষ্য যখন ঘুরতে থাকে, মেঝের গন্ধ নিতে থাকে, অস্থির আচরণ করে বা কোণায় যেতে চেষ্টা করে, তখন বুঝতে হবে তার টয়লেট করার সময় হয়েছে। এই সংকেতগুলো চিনে দ্রুত তাকে লিটার বক্সে বা বাইরের নির্দিষ্ট স্থানে নিয়ে যান। সময়ের সাথে সাথে আপনি এই সংকেতগুলো আরও ভালোভাবে বুঝতে পারবেন।

**ধাপ ৩: ইতিবাচক মনোভাব এবং পুরস্কার:**
এটি ট্রেনিংয়ের সবচেয়ে গুরুত্বপূর্ণ অংশ। সঠিক জায়গায় মলত্যাগ করলে সাথে সাথে তাকে প্রচুর প্রশংসা করুন, গায়ে হাত বুলিয়ে আদর করুন এবং একটি ছোট পুরস্কার (ট্রিট) দিন। 'Good boy' বা 'Good girl' এর মতো শব্দ ব্যবহার করুন। এটি তাদের ভালো আচরণকে উৎসাহিত করবে এবং তারা দ্রুত শিখবে যে সঠিক জায়গায় টয়লেট করলে ভালো কিছু হয়।

**দুর্ঘটনা ঘটলে কী করবেন:**
বাড়িতে দুর্ঘটনা ঘটবেই, এটি ট্রেনিং প্রক্রিয়ার একটি স্বাভাবিক অংশ।
* **শান্ত থাকুন:** দুর্ঘটনার জন্য কখনোই আপনার পোষ্যকে বকাঝকা, মারধর বা তার নাক প্রস্রাবে ডুবিয়ে দেবেন না। এতে তারা ভয় পেয়ে আপনার থেকে লুকিয়ে টয়লেট করতে শিখবে, যা সমস্যা আরও বাড়িয়ে তুলবে এবং আপনার সাথে তার সম্পর্ক নষ্ট করবে।
* **শব্দ করে থামান:** যদি আপনি তাকে ভুল জায়গায় টয়লেট করতে দেখেন, তাহলে হাতে তালি দিয়ে বা 'আহ!' বলে একটি তীক্ষ্ণ শব্দ করে তাকে থামান এবং দ্রুত সঠিক জায়গায় নিয়ে যান।
* **সঠিকভাবে পরিষ্কার করুন:** অ্যামোনিয়া-ভিত্তিক ক্লিনার ব্যবহার করবেন না, কারণ এটি প্রস্রাবের গন্ধের মতো, যা তাদের একই জায়গায় আবার টয়লেট করতে উৎসাহিত করতে পারে। এনজাইম-ভিত্তিক ক্লিনার (Enzyme-based cleaner) ব্যবহার করুন যা গন্ধ সম্পূর্ণরূপে দূর করে।

ধৈর্য ধরুন। প্রতিটি পোষ্য ভিন্ন এবং শিখতে ভিন্ন সময় নিতে পারে। আপনার ধারাবাহিক প্রচেষ্টা এবং ইতিবাচক মনোভাবই একটি সফল পটি ট্রেনিংয়ের চাবিকাঠি।`,
    imageUrl: 'https://loremflickr.com/600/400/puppy,ground?lock=9',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 4,
    title: 'বাংলাদেশে বিড়ালের যত্ন: স্বাস্থ্য, খাদ্য এবং সুখী জীবন',
    content: `বাংলাদেশে একটি বিড়াল পোষা তার নিজস্ব আনন্দ এবং চ্যালেঞ্জ নিয়ে আসে। এখানকার উষ্ণ এবং আর্দ্র আবহাওয়ার কারণে তাদের যত্নের জন্য কিছু বিশেষ দিকে নজর রাখা প্রয়োজন। এই নির্দেশিকাটি আপনাকে আপনার বিড়াল বন্ধুর জন্য একটি স্বাস্থ্যকর এবং সুখী জীবন নিশ্চিত করতে সাহায্য করবে।

**খাদ্য এবং পানীয়:**
* **জল:** গরমের কারণে ডিহাইড্রেশন একটি বড় সমস্যা। সর্বদা তাজা এবং পরিষ্কার জলের ব্যবস্থা রাখুন। একাধিক জলের পাত্র বাড়ির বিভিন্ন স্থানে রাখতে পারেন। বিড়ালরা প্রবহমান জল পছন্দ করে, তাই একটি ওয়াটার ফাউন্টেন তাদের জল পানে উৎসাহিত করতে পারে।
* **খাবার:** বিড়ালের স্বাস্থ্যের জন্য অপরিহার্য অ্যামিনো অ্যাসিড 'টরিণ' (Taurine) সমৃদ্ধ উচ্চ মানের ক্যাট ফুড বেছে নিন। শুধুমাত্র শুকনো খাবারের (Dry food) উপর নির্ভর না করে, তাদের খাদ্যতালিকায় ভেজা খাবারও (Wet food) অন্তর্ভুক্ত করুন। এটি তাদের শরীরে জলের জোগান বাড়াতে সাহায্য করে এবং মূত্রনালীর সমস্যা প্রতিরোধে সহায়ক।
* **নিষিদ্ধ খাবার:** রান্না করা মাছ বা মাংস দেওয়ার সময় খেয়াল রাখবেন যেন তাতে কাঁটা বা হাড় না থাকে। পেঁয়াজ, রসুন, চকোলেট, अंगুর বা কিসমিস বিড়ালের জন্য বিষাক্ত, তাই এগুলো থেকে তাদের দূরে রাখুন।

**স্বাস্থ্য এবং পরিচ্ছন্নতা:**
* **পরজীবী নিয়ন্ত্রণ:** মাছি (fleas), এঁটেল (ticks) এবং কৃমি (worms) আমাদের দেশে সাধারণ সমস্যা। নিয়মিত পশুচিকিৎসকের পরামর্শ অনুযায়ী ডিওয়ার্মিং এবং পরজীবী নিয়ন্ত্রণের ব্যবস্থা গ্রহণ করুন, এমনকি যদি আপনার বিড়াল বাড়ির বাইরে না যায়।
* **গ্রুমিং:** নিয়মিত ব্রাশ করলে তাদের পশম ঝরঝরে থাকে এবং হেয়ারবলের সমস্যা কমে। লম্বা পশমের বিড়ালের জন্য এটি আরও বেশি গুরুত্বপূর্ণ। এটি আপনার সাথে তার বন্ধনকেও দৃঢ় করে।
* **লিটার বক্স:** লিটার বক্স প্রতিদিন পরিষ্কার করুন এবং সপ্তাহে অন্তত একবার সম্পূর্ণরূপে পরিষ্কার করে নতুন লিটার দিন। অপরিষ্কার লিটার বক্সের কারণে বিড়াল অন্য জায়গায় মলত্যাগ করতে পারে এবং এটি মূত্রনালীর সংক্রমণের (Urinary Tract Infection) ঝুঁকি বাড়ায়।
* **হিটস্ট্রোক থেকে সুরক্ষা:** দিনের সবচেয়ে গরম সময়ে, বিশেষ করে দুপুরবেলা, আপনার বিড়ালকে ঘরের ভেতরে একটি ঠান্ডা এবং আরামদায়ক স্থানে রাখুন। ফ্যান বা এসি চালু রাখুন।

**মানসিক ও শারীরিক সুস্থতা:**
* **খেলার সময়:** প্রতিদিন আপনার বিড়ালের সাথে ইন্টারেক্টিভ খেলনা (যেমন ফেদার ওয়ান্ড) দিয়ে খেলুন। এটি তাদের শিকারের প্রাকৃতিক প্রবৃত্তিকে উৎসাহিত করে এবং তাদের শারীরিক ও মানসিকভাবে সক্রিয় রাখে।
* **নিরাপদ পরিবেশ:** আপনার বাড়িটি বিড়ালের জন্য নিরাপদ কিনা তা নিশ্চিত করুন। বিষাক্ত গাছপালা, ছোট খেলনা বা বৈদ্যুতিক তার তাদের নাগালের বাইরে রাখুন।

একজন সুখী বিড়াল মানে একজন সুখী মালিক। এই ছোট ছোট বিষয়গুলোর দিকে খেয়াল রাখলে আপনার আদরের বন্ধুটি একটি সুস্থ ও দীর্ঘ জীবন পাবে।`,
    imageUrl: 'https://loremflickr.com/600/400/cat,stray?lock=4',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 5,
    title: 'বাংলাদেশে কুকুরের জন্য প্রয়োজনীয় টিকার সময়সূচী',
    content: `বাংলাদেশে প্রচলিত জীবনঘাতী রোগ যেমন পারভোভাইরাস, ডিসটেম্পার এবং জলাতঙ্ক থেকে আপনার কুকুরকে রক্ষা করার সবচেয়ে কার্যকর এবং একমাত্র উপায় হলো সময়মতো টিকাদান। টিকা আপনার কুকুরের শরীরে এই রোগগুলোর বিরুদ্ধে অ্যান্টিবডি তৈরি করে, যা তাকে ভবিষ্যতে সুরক্ষিত রাখে। এখানে একটি সাধারণ সময়সূচী দেওয়া হলো, তবে আপনার কুকুরের স্বাস্থ্য এবং জীবনযাত্রার উপর ভিত্তি করে একটি ব্যক্তিগত সময়সূচীর জন্য সর্বদা আপনার পশুচিকিৎসকের সাথে পরামর্শ করুন।

**কোর ভ্যাকসিন (Core Vaccines) কি?**
কোর ভ্যাকসিনগুলো সেইসব টিকা যা সকল কুকুরকে, তাদের অবস্থান বা জীবনযাত্রা নির্বিশেষে, দেওয়া উচিত। এগুলো গুরুতর, বিশ্বব্যাপী বিস্তৃত এবং প্রাণঘাতী রোগ থেকে রক্ষা করে।

**কুকুরছানার জন্য মূল টিকার সময়সূচী:**
কুকুরছানারা মায়ের দুধ থেকে কিছু প্রাথমিক রোগ প্রতিরোধ ক্ষমতা পায়, যা সময়ের সাথে সাথে কমে যায়। তাই সঠিক সময়ে টিকা শুরু করা অত্যন্ত গুরুত্বপূর্ণ।
* **৬-৮ সপ্তাহ:** প্রথম টিকা - সাধারণত Distemper, Hepatitis, Parainfluenza, এবং Parvovirus (DHPPi বা কম্বো ভ্যাকসিন) এর সমন্বয়ে দেওয়া হয়।
* **১০-১২ সপ্তাহ:** দ্বিতীয় বুস্টার ডোজ - DHPPi টিকার দ্বিতীয় ডোজ। এই ডোজটি রোগ প্রতিরোধ ক্ষমতাকে আরও শক্তিশালী করে।
* **১৪-১৬ সপ্তাহ:** তৃতীয় বুস্টার ডোজ এবং প্রথম জলাতঙ্ক (Rabies) টিকা - DHPPi টিকার চূড়ান্ত বুস্টার ডোজ এবং জলাতঙ্কের প্রথম টিকা। এই ডোজটি অত্যন্ত গুরুত্বপূর্ণ কারণ এর পরেই কুকুরছানার প্রাথমিক টিকাদান কোর্স সম্পন্ন হয় এবং সে বাইরের পরিবেশে যাওয়ার জন্য সুরক্ষিত হয়।

**নন-কোর ভ্যাকসিন (Non-Core Vaccines):**
এগুলো ঐচ্ছিক টিকা যা আপনার কুকুরের জীবনযাত্রার উপর নির্ভর করে প্রয়োজন হতে পারে।
* **লেপ্টোস্পাইরোসিস (Leptospirosis):** যে কুকুররা জমা জল বা পুকুরের সংস্পর্শে আসে, তাদের জন্য এই টিকাটি সুপারিশ করা হয়। এটি একটি ব্যাকটেরিয়া জনিত রোগ যা মানুষেও ছড়াতে পারে।
* **কেনেল কফ (Kennel Cough):** যদি আপনার কুকুরকে বোর্ডিং-এ রাখতে হয় বা সে অন্যান্য অনেক কুকুরের সংস্পর্শে আসে, তবে এই টিকাটি দেওয়া উচিত।

**বার্ষিক বুস্টার (Annual Booster):**
প্রাথমিক কোর্স সম্পন্ন হওয়ার পর, রোগ প্রতিরোধ ক্ষমতা বজায় রাখার জন্য প্রতি বছর একটি বুস্টার শট দেওয়া প্রয়োজন। এর মধ্যে জলাতঙ্ক এবং অন্যান্য মূল টিকা অন্তর্ভুক্ত থাকে। আপনার পশুচিকিৎসক আপনার কুকুরের জন্য সঠিক বুস্টার সময়সূচী নির্ধারণ করে দেবেন।

**উপসংহার:**
আপনার কুকুরকে টিকা দেওয়ার মাধ্যমে আপনি শুধু তাকেই রক্ষা করছেন না, বরং জলাতঙ্কের মতো জুনোটিক (zoonotic) রোগ থেকে আপনার পরিবার এবং সমাজকেও সুরক্ষিত রাখছেন। টিকাদানে অবহেলা আপনার পোষ্যের জন্য মারাত্মক পরিণতি ডেকে আনতে পারে।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,vet?lock=5',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 6,
    title: 'FIP কী? বাংলাদেশের বিড়াল মালিকদের জন্য একটি বিস্তারিত নির্দেশিকা',
    content: `ফেলাইন ইনফেকশাস পেরিটোনাইটিস (Feline Infectious Peritonitis বা FIP) হলো বিড়ালের একটি মারাত্মক এবং জটিল ভাইরাল রোগ যা ফেলাইন করোনাভাইরাস (Feline Coronavirus বা FCoV) দ্বারা সৃষ্ট। যদিও বেশিরভাগ FCoV সংক্রমণ নিরীহ এবং হালকা ডায়রিয়ার কারণ হয়, কিছু ক্ষেত্রে ভাইরাসটি পরিবর্তিত (mutate) হয়ে FIP রোগ সৃষ্টি করতে পারে, যা প্রায় সবসময়ই মারাত্মক। বাংলাদেশের বিড়াল মালিকদের মধ্যে এই রোগ নিয়ে সচেতনতা বাড়ানো অত্যন্ত জরুরি।

**FIP এর প্রকারভেদ:**
FIP প্রধানত দুটি রূপে দেখা যায়, যদিও কিছু ক্ষেত্রে উভয়ের মিশ্রণও দেখা যেতে পারে:
1.  **ওয়েট বা আর্দ্র ফর্ম (Wet Form):** এই ক্ষেত্রে, শরীরের বিভিন্ন গহ্বরে, যেমন পেট (abdomen) বা বুক (chest), হলুদ বর্ণের তরল জমা হয়। এর ফলে পেট ফুলে যায় (Ascites) এবং শ্বাসকষ্ট দেখা দেয়। এটি রোগের দ্রুত বিস্তারকারী এবং সাধারণ রূপ।
2.  **ড্রাই বা শুষ্ক ফর্ম (Dry Form):** এই ক্ষেত্রে, শরীরের বিভিন্ন অঙ্গ যেমন চোখ, মস্তিষ্ক, লিভার বা কিডনিতে প্রদাহ (inflammation) এবং ক্ষত (lesions) সৃষ্টি হয়। এর লক্ষণগুলো অস্পষ্ট হতে পারে এবং ধীরে ধীরে প্রকাশ পায়, যেমন ওজন হ্রাস, দীর্ঘস্থায়ী জ্বর, অলসতা এবং ক্ষুধামন্দা। অনেক সময় স্নায়ুতন্ত্রের সমস্যা (যেমন, ভারসাম্যহীনতা বা খিঁচুনি) বা চোখের সমস্যাও দেখা যায়।

**কারা বেশি ঝুঁকিতে থাকে?**
*   **বয়স:** সাধারণত তরুণ বিড়াল (দুই বছরের কম বয়সী) এবং বৃদ্ধ বিড়ালরা FIP-এর সর্বোচ্চ ঝুঁকিতে থাকে।
*   **দুর্বল রোগ প্রতিরোধ ক্ষমতা:** স্ট্রেস, অন্য কোনো রোগ বা অস্ত্রোপচারের কারণে যাদের রোগ প্রতিরোধ ক্ষমতা দুর্বল হয়ে পড়ে, তাদের ঝুঁকি বেশি।
*   **পরিবেশ:** একাধিক বিড়াল আছে এমন বাড়ি, শেল্টার বা কattery-তে FCoV-এর সংক্রমণের ঝুঁকি বেশি, যা FIP-এর ঝুঁকিও বাড়িয়ে তোলে।

**রোগ নির্ণয় এবং চিকিৎসা:**
FIP রোগ নির্ণয় করা বেশ কঠিন কারণ এর লক্ষণগুলো অন্যান্য অনেক রোগের সাথে মিলে যায়। পশুচিকিৎসকরা সাধারণত রক্ত পরীক্ষা, জমে থাকা তরল বিশ্লেষণ এবং অন্যান্য ক্লিনিকাল লক্ষণগুলোর সমন্বয়ে একটি সম্ভাব্য সিদ্ধান্তে পৌঁছান। ঐতিহাসিকভাবে FIP-কে নিশ্চিত মৃত্যু বলে গণ্য করা হতো। তবে, সম্প্রতি GS-441524-এর মতো অ্যান্টিভাইরাল ওষুধ আশার আলো দেখাচ্ছে এবং অনেক ক্ষেত্রে সফলভাবে FIP নিরাময় করতে সক্ষম হচ্ছে। যদিও, এই চিকিৎসা বাংলাদেশে এখনও ব্যয়বহুল এবং সহজলভ্য নয়।

প্রতিরোধের জন্য, বিড়ালের থাকার পরিবেশ পরিষ্কার-পরিচ্ছন্ন রাখা, লিটার বক্স নিয়মিত পরিষ্কার করা, তাদের মানসিক চাপ কমানো এবং একটি স্বাস্থ্যকর জীবনযাত্রা নিশ্চিত করাই সর্বোত্তম উপায়। নতুন বিড়াল আনার আগে তাকে কোয়ারেন্টাইনে রাখাও একটি ভালো অভ্যাস।`,
    imageUrl: 'https://loremflickr.com/600/400/cat,sick?lock=6',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 7,
    title: 'জলাতঙ্ক প্রতিরোধ: আপনার পোষ্য এবং পরিবারকে সুরক্ষিত রাখার গুরুত্ব',
    content: `জলাতঙ্ক বা Rabies একটি মারাত্মক ভাইরাল রোগ যা কেন্দ্রীয় স্নায়ুতন্ত্রকে (central nervous system) আক্রমণ করে এবং একবার লক্ষণ প্রকাশ পেলে এটি ১০০% প্রাণঘাতী। এই রোগটি টিকার মাধ্যমে সম্পূর্ণ প্রতিরোধযোগ্য। বাংলাদেশে, যেখানে পথকুকুরের সংখ্যা অনেক এবং জলাতঙ্ক একটি স্থানীয় রোগ (endemic), পোষ্য মালিকদের জন্য এর প্রতিরোধ ব্যবস্থা গ্রহণ করা শুধুমাত্র একটি পছন্দ নয়, বরং একটি অপরিহার্য দায়িত্ব।

**কীভাবে ছড়ায়?**
ভাইরাসটি সাধারণত সংক্রমিত প্রাণীর লালার মাধ্যমে, কামড় বা আঁচড়ের মাধ্যমে ছড়ায়। ক্ষত বা শ্লেষ্মা ঝিল্লির সংস্পর্শে এলেও এটি ছড়াতে পারে। কুকুর, বিড়াল, বাদুড়, বেজি সহ যেকোনো স্তন্যপায়ী প্রাণী এই রোগে আক্রান্ত হতে পারে এবং রোগ ছড়াতে পারে।

**আপনার পোষ্যের জন্য সুরক্ষা:**
* **টিকাদান:** সকল কুকুর এবং বিড়াল মালিকদের জন্য জলাতঙ্ক টিকা একটি আইনি এবং নৈতিক দায়িত্ব। পশুচিকিৎসকের পরামর্শ অনুযায়ী সঠিক সময়ে (সাধারণত ৩ মাস বয়সে) প্রথম টিকা এবং এরপর প্রতি বছর বা নির্দেশ অনুযায়ী বুস্টার ডোজ সম্পন্ন করুন। এটিই আপনার পোষ্যকে রক্ষা করার একমাত্র নিশ্চিত উপায়।
* **নজরদারি:** আপনার পোষ্যকে বাইরে একা ছেড়ে দেবেন না, বিশেষ করে রাতে। হাঁটার সময় সর্বদা রশি (leash) ব্যবহার করুন যাতে সে অন্য কোনো অজানা বা বন্য প্রাণীর সংস্পর্শে না আসে।
* **আচরণ পরিবর্তন লক্ষ্য করুন:** যদি আপনার পোষ্য কোনো বন্য প্রাণীর সাথে লড়াই করে বা কোনো কারণে অস্বাভাবিক আচরণ করে (যেমন, অতিরিক্ত আগ্রাসন বা লালা ঝরা), তবে তাকে সাবধানে আলাদা রাখুন এবং অবিলম্বে পশুচিকিৎসকের সাথে যোগাযোগ করুন।

**আপনার পরিবারের জন্য সুরক্ষা:**
* **অজানা প্রাণী থেকে দূরত্ব:** কখনো অজানা, বন্য বা অস্বাভাবিক আচরণকারী প্রাণীর কাছে যাবেন না। শিশুদেরও এই বিষয়ে সতর্ক করুন এবং শেখান যে কোনো প্রাণীকে বিরক্ত করা উচিত নয়।
* **কামড়ালে করণীয়:** যদি কোনো প্রাণী আপনাকে বা আপনার পরিবারের কাউকে কামড় বা আঁচড় দেয়, তাহলে এক মুহূর্তও দেরি করবেন না।
    1.  **ক্ষতস্থান পরিষ্কার করুন:** ক্ষতস্থানটি অবিলম্বে কমপক্ষে ১৫ মিনিট ধরে সাবান ও জল দিয়ে ভালোভাবে ধুয়ে ফেলুন।
    2.  **ডাক্তারের কাছে যান:** দ্রুত ডাক্তারের কাছে যান এবং পোস্ট-এক্সপোজার প্রোফিল্যাক্সিস (Post-Exposure Prophylaxis বা PEP) সম্পর্কে পরামর্শ নিন।
    3.  **PEP কোর্স সম্পন্ন করুন:** PEP হলো জলাতঙ্কের টিকা এবং প্রয়োজনে ইমিউনোগ্লোবুলিনের একটি কোর্স যা লক্ষণ প্রকাশের আগেই ভাইরাসটিকে নিষ্ক্রিয় করে দেয়। এটি জীবন রক্ষাকারী।

মনে রাখবেন, জলাতঙ্কের ক্ষেত্রে কোনো ঝুঁকি নেওয়া যাবে না। আপনার পোষ্যের একটি টিকা আপনার পুরো পরিবার এবং সমাজকে এই ভয়াবহ রোগ থেকে সুরক্ষিত রাখতে পারে।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,bark?lock=7',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 8,
    title: 'আপনার পোষ্যকে স্পে বা নিউটার করার গুরুত্ব: একটি দায়িত্বশীল সিদ্ধান্ত',
    content: `স্পেয়িং (Spaying - স্ত্রী প্রাণীর জরায়ু ও ডিম্বাশয় অপসারণ) এবং নিউটারিং (Neutering - পুরুষ প্রাণীর অণ্ডকোষ অপসারণ) হলো অস্ত্রোপচার পদ্ধতি যা পোষ্যদের প্রজনন ক্ষমতা স্থায়ীভাবে বন্ধ করে দেয়। এটি কেবল একটি জন্ম নিয়ন্ত্রণের পদ্ধতিই নয়, বরং এর অনেক স্বাস্থ্যগত, আচরণগত এবং সামাজিক সুবিধাও রয়েছে যা আপনার পোষ্যের জীবনমান উন্নত করতে পারে।

**স্বাস্থ্যগত সুবিধা:**
* **ক্যান্সার প্রতিরোধ:** স্পে করা স্ত্রী প্রাণীদের স্তন ক্যান্সার (mammary cancer) এবং জরায়ুর মারাত্মক সংক্রমণ (pyometra) হওয়ার ঝুঁকি নাটকীয়ভাবে হ্রাস পায়, বিশেষ করে যদি প্রথম 'হিট' বা ঋতুচক্রের আগে করা হয়।
* **পুরুষদের স্বাস্থ্য:** নিউটার করা পুরুষ প্রাণীদের অণ্ডকোষের ক্যান্সার (testicular cancer) হওয়ার সম্ভাবনা থাকে না এবং প্রোস্টেট সম্পর্কিত সমস্যার ঝুঁকিও অনেক কমে যায়।
* **দীর্ঘ জীবন:** বিভিন্ন গবেষণায় দেখা গেছে যে, স্পে/নিউটার করা পোষ্যরা সাধারণত তাদের অপরিবর্তিত সঙ্গীদের তুলনায় দীর্ঘ এবং স্বাস্থ্যকর জীবনযাপন করে।

**আচরণগত সুবিধা:**
* **আগ্রাসন হ্রাস:** নিউটার করা পুরুষ কুকুর এবং বিড়ালরা এলাকা চিহ্নিত করার জন্য প্রস্রাব করা (urine marking), অন্য প্রাণীর উপর চড়ে বসা (mounting) এবং অন্যান্য পুরুষ প্রাণীর প্রতি আগ্রাসন দেখানোর প্রবণতা কমিয়ে দেয়।
* **ঘুরে বেড়ানো কমানো:** প্রজননের তাড়নায় পুরুষ পোষ্যরা প্রায়ই সঙ্গীর খোঁজে বাড়ি থেকে পালিয়ে যায়, যা দুর্ঘটনা, মারামারি বা হারিয়ে যাওয়ার ঝুঁকি বাড়ায়। নিউটারিং এই বিপজ্জনক প্রবণতা কমাতে সাহায্য করে।
* **শান্ত স্বভাব:** স্পে করা স্ত্রী প্রাণীরা 'হিটে' (heat cycle) আসে না, যা তাদের এবং মালিক উভয়ের জন্যই অস্বস্তিকর চিৎকার, অস্থিরতা এবং অযাচিত পুরুষ প্রাণীর আগমন এড়াতে সাহায্য করে।

**সামাজিক প্রভাব:**
সবচেয়ে গুরুত্বপূর্ণ হলো, স্পে এবং নিউটারিং পথপ্রাণীর অতিরিক্ত জনসংখ্যা নিয়ন্ত্রণে একটি অপরিহার্য ভূমিকা পালন করে। বাংলাদেশে লক্ষ লক্ষ কুকুর এবং বিড়াল রাস্তায় আশ্রয়হীন জীবনযাপন করে। প্রতিটি অনাকাঙ্ক্ষিত গর্ভধারণ এই সংখ্যাকে আরও বাড়িয়ে তোলে, যার ফলে আরও বেশি প্রাণী ক্ষুধা, রোগ এবং নিষ্ঠুরতার শিকার হয়। আপনার পোষ্যকে স্পে/নিউটার করার মাধ্যমে আপনি এই বিশাল সমস্যার সমাধানে সরাসরি অবদান রাখছেন। এটি একজন পোষ্য মালিকের সবচেয়ে দায়িত্বশীল পছন্দগুলোর মধ্যে অন্যতম। আপনার পশুচিকিৎসকের সাথে কথা বলে আপনার পোষ্যের জন্য এই অস্ত্রোপচারের সঠিক সময় নির্ধারণ করুন।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,surgery?lock=8',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 1,
    title: 'আপনার পোষ্যের জন্য সঠিক খাবার বেছে নেওয়ার চূড়ান্ত নির্দেশিকা',
    content: `পুষ্টি আপনার পোষ্যের স্বাস্থ্য, শক্তি এবং দীর্ঘায়ু জীবনের ভিত্তি। কিন্তু বাজারে এত ধরণের পোষ্যের খাবারের মধ্যে সঠিকটি বেছে নেওয়া বেশ কঠিন মনে হতে পারে। এই বিস্তারিত নির্দেশিকা আপনাকে আপনার পোষ্যের জন্য একটি স্বাস্থ্যকর এবং সঠিক সিদ্ধান্ত নিতে সাহায্য করবে।

**খাবারের লেবেল পড়ুন এবং বুঝুন:**
একটি ভালো পোষ্যের খাবারের প্যাকেজিং তথ্যবহুল হয়।
* **উপাদান তালিকা:** খাবারের প্যাকেজের পেছনের উপাদান তালিকাটি ভালোভাবে পড়ুন। প্রথম কয়েকটি উপাদান সবচেয়ে গুরুত্বপূর্ণ। প্রথম উপাদানটি সর্বদা একটি নির্দিষ্ট মাংসের উৎস হওয়া উচিত, যেমন 'Chicken', 'Deboned Chicken', 'Lamb' বা 'Fish'।। 'Meat and bone meal' বা অস্পষ্ট 'by-products' লেখা খাবারগুলো এড়িয়ে চলাই ভালো।
* **পুষ্টির গ্যারান্টি:** প্যাকেজে একটি AAFCO (Association of American Feed Control Officials) বিবৃতি আছে কিনা তা পরীক্ষা করুন। এটি নিশ্চিত করে যে খাবারটি আপনার পোষ্যের জীবনযাত্রার নির্দিষ্ট ধাপের (যেমন, puppy, adult, senior) জন্য পুষ্টিগতভাবে সম্পূর্ণ এবং ভারসাম্যপূর্ণ।
* **কৃত্রিম উপাদান এড়িয়ে চলুন:** কৃত্রিম রঙ, স্বাদ এবং প্রিজারভেটিভ (যেমন BHA, BHT, Ethoxyquin) যুক্ত খাবার এড়িয়ে চলুন। এগুলো পোষ্যের স্বাস্থ্যের জন্য ক্ষতিকর হতে পারে।

**বয়স, জাত এবং আকারের গুরুত্ব:**
পোষ্যের পুষ্টির চাহিদা তার জীবনচক্র এবং আকারের উপর নির্ভর করে পরিবর্তিত হয়।
* **বয়স-নির্দিষ্ট ফর্মুলা:** কুকুরছানা এবং বিড়ালছানাদের বৃদ্ধি এবং বিকাশের জন্য প্রাপ্তবয়স্কদের চেয়ে বেশি প্রোটিন এবং ক্যালোরির প্রয়োজন হয়। অন্যদিকে, বয়স্ক পোষ্যদের জন্য কম ক্যালোরি এবং জয়েন্ট সাপোর্টের জন্য গ্লুকোসামিনের মতো অতিরিক্ত পুষ্টির প্রয়োজন হতে পারে। তাই সর্বদা আপনার পোষ্যের বয়সের জন্য উপযুক্ত খাবার বেছে নিন।
* **জাত ও আকার:** বড় জাতের কুকুরের জয়েন্টের স্বাস্থ্য সহায়তার জন্য গ্লুকোসামিন এবং কনড্রয়েটিন সমৃদ্ধ খাবার প্রয়োজন, যা ছোট জাতের জন্য ততটা জরুরি নয়। কিছু ব্র্যান্ড তাদের অনন্য প্রয়োজনের জন্য জাত-নির্দিষ্ট (breed-specific) ফর্মুলাও সরবরাহ করে, যেমন পার্সিয়ান বিড়াল বা জার্মান শেপার্ডের জন্য।

**ওয়েট ফুড বনাম ড্রাই ফুড:**
উভয় প্রকারের খাবারেরই নিজস্ব সুবিধা রয়েছে।
* **ড্রাই ফুড (কিبل):** সুবিধাজনক, সাশ্রয়ী এবং দাঁতের স্বাস্থ্য ভালো রাখতে সাহায্য করে, কারণ চিবানোর সময় এটি দাঁত পরিষ্কার করতে সাহায্য করে।
* **ওয়েট ফুড (ক্যানড):** এতে জলের পরিমাণ বেশি থাকে, যা পোষ্যের শরীরকে হাইড্রেটেড রাখতে সাহায্য করে, বিশেষ করে বিড়ালের জন্য এটি খুব উপকারী। এটি picky eaters বা দাঁতের সমস্যাযুক্ত পোষ্যদের জন্য ভালো বিকল্প।

**উপসংহার:**
সন্দেহের ক্ষেত্রে, আপনার পোষ্যের জন্য কোন খাবারটি সবচেয়ে উপযুক্ত হবে তা জানতে সর্বদা আপনার পশুচিকিৎসকের সাথে পরামর্শ করুন। তিনিই আপনার পোষ্যের স্বাস্থ্য, ওজন এবং প্রয়োজন অনুযায়ী সেরা পরামর্শ দিতে পারবেন।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,bowl?lock=1',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 6,
  },
  {
    id: 2,
    title: 'একটি স্বাস্থ্যকর কোটের জন্য ৫টি প্রয়োজনীয় গ্রুমিং টিপস',
    content: `গ্রুমিং কেবল আপনার পোষ্যকে দেখতে সুন্দর রাখার জন্য নয়; এটি তাদের শারীরিক এবং মানসিক স্বাস্থ্যের জন্য অত্যাবশ্যক। নিয়মিত গ্রুমিং ত্বক এবং কোটকে সুস্থ রাখে, পরজীবী নিয়ন্ত্রণ করে, এবং আপনার সাথে আপনার পোষ্যের বন্ধনকে আরও দৃঢ় করে তোলে।

**১. নিয়মিত ব্রাশ করুন:**
পোষ্যের কোটের ধরন অনুযায়ী সঠিক ব্রাশ নির্বাচন করুন। ছোট পশমের জন্য রাবার ব্রাশ এবং লম্বা পশমের জন্য স্লিকার বা পিন ব্রাশ ভালো কাজ করে। ব্রাশ করা আলগা পশম এবং ময়লা দূর করে, ত্বকের নিচে রক্ত সঞ্চালন বাড়ায় এবং শরীরের প্রাকৃতিক তেলকে সমানভাবে ছড়িয়ে দিয়ে কোটকে চকচকে রাখে। এটি বেদনাদায়ক জট বাঁধা (matting) প্রতিরোধ করে, যা পরবর্তীতে ত্বকের মারাত্মক সংক্রমণের কারণ হতে পারে।

**২. সঠিকভাবে স্নান করানো:**
পোষ্যকে শুধুমাত্র প্রয়োজনে এবং পোষ্য-নির্দিষ্ট শ্যাম্পু ব্যবহার করে স্নান করান। অতিরিক্ত স্নান তাদের ত্বকের প্রাকৃতিক তেল নষ্ট করে দিতে পারে। মানুষের শ্যাম্পু তাদের ত্বকের pH ভারসাম্য নষ্ট করে দেয়, যা শুষ্কতা এবং চুলকানির কারণ হতে পারে। স্নানের সময় কানে তুলা দিয়ে রাখুন যাতে জল প্রবেশ করতে না পারে এবং স্নানের পর ভালোভাবে শুকিয়ে নিন।

**৩. নখ ছাঁটা:**
অতিরিক্ত লম্বা নখ হাঁটার সময় ব্যথা সৃষ্টি করতে পারে এবং সময়ের সাথে সাথে তাদের হাড়ের গঠনেও সমস্যা করতে পারে। যদি আপনি মেঝেতে নখের 'ক্লিক-ক্লিক' শব্দ শুনতে পান, তবে বুঝতে হবে নখ কাটার সময় হয়েছে। প্রতি ৩-৪ সপ্তাহে তাদের নখ পরীক্ষা করুন এবং প্রয়োজনে ছেঁটে দিন। আপনি যদি নিজে কাটতে ভয় পান, তবে একজন পেশাদার গ্রুমার বা পশুচিকিৎসকের সাহায্য নিন।

**৪. কান পরিষ্কার করা:**
নিয়মিত আপনার পোষ্যের কান পরীক্ষা করুন। যদি কানে ময়লা, দুর্গন্ধ বা লালচে ভাব দেখেন, তবে এটি সংক্রমণের লক্ষণ হতে পারে। পশুচিকিৎসক-অনুমোদিত ইয়ার ক্লিনিং সলিউশন ব্যবহার করে একটি নরম তুলার বল দিয়ে আলতো করে কানের বাইরের অংশ পরিষ্কার করুন। কটন বাড ব্যবহার করা থেকে বিরত থাকুন কারণ এটি কানের পর্দাকে ক্ষতিগ্রস্ত করতে পারে।

**৫. দাঁতের যত্ন:**
দাঁতের রোগ পোষ্যদের মধ্যে একটি সাধারণ এবং প্রতিরোধযোগ্য সমস্যা। এটি প্রতিরোধ করার জন্য, পোষ্য-নির্দিষ্ট টুথপেস্ট এবং ব্রাশ দিয়ে নিয়মিত তাদের দাঁত ব্রাশ করার অভ্যাস গড়ে তুলুন। ছোটবেলা থেকেই এই অভ্যাস শুরু করলে ভালো হয়। ডেন্টাল চিবানো বা খেলনাও দাঁতে প্লাক জমা কমাতে সাহায্য করতে পারে।

এই গ্রুমিং রুটিনটি আপনার পোষ্যকে শুধু দেখতেই সুন্দর রাখবে না, বরং তাকে সুস্থ, সুখী এবং আরামদায়ক জীবনযাপন করতেও সাহায্য করবে।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,bath?lock=2',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 3,
    title: 'ইন্টারেক্টিভ খেলনা: আপনার পোষ্যকে মানসিকভাবে উদ্দীপিত রাখার গুরুত্ব',
    content: `শারীরিক ব্যায়ামের মতোই মানসিক উদ্দীপনাও আপনার পোষ্যের সার্বিক সুস্থতার জন্য অপরিহার্য। একটি উদাস বা একঘেয়ে পোষ্য প্রায়শই ধ্বংসাত্মক আচরণ (যেমন, জিনিসপত্র চিবানো), অতিরিক্ত ঘেউ ঘেউ করা বা উদ্বেগের মতো আচরণগত সমস্যা প্রদর্শন করে। ইন্টারেক্টিভ খেলনা এবং এনরিচমেন্ট অ্যাক্টিভিটি আপনার পোষ্যের মস্তিষ্ককে সক্রিয় এবং ব্যস্ত রাখার একটি চমৎকার উপায়।

**মানসিক উদ্দীপনা কেন প্রয়োজন?**
* **একঘেয়েমি দূর করে:** এটি তাদের প্রাকৃতিক প্রবৃত্তি যেমন শিকার করা, খোঁজা এবং সমস্যা সমাধানের আকাঙ্ক্ষা পূরণ করে। যখন তাদের মস্তিষ্ক ব্যস্ত থাকে, তখন তারা খারাপ আচরণে কম জড়িয়ে পড়ে।
* **আচরণগত সমস্যা কমায়:** একটি ক্লান্ত এবং মানসিকভাবে সন্তুষ্ট পোষ্য সাধারণত একটি ভালো আচরণের পোষ্য। এটি علیحدگی জনিত উদ্বেগ (separation anxiety) কমাতেও সাহায্য করতে পারে।
* **মস্তিষ্কের স্বাস্থ্য ভালো রাখে:** নিয়মিত মানসিক ব্যায়াম তাদের মস্তিষ্ককে তীক্ষ্ণ রাখে, যা বয়স্ক পোষ্যদের ক্ষেত্রে কগনিটিভ ডিসফাংশন (canine cognitive dysfunction) প্রতিরোধে সাহায্য করতে পারে।
* **বন্ধন দৃঢ় করে:** আপনার সাথে খেলা বা প্রশিক্ষণে অংশ নেওয়া আপনার এবং আপনার পোষ্যের মধ্যে সম্পর্ককে আরও মজবুত করে তোলে।

**কিছু জনপ্রিয় ইন্টারেক্টিভ খেলনা এবং আইডিয়া:**
* **ফুড পাজল এবং পাজল ফিডার:** এই খেলনাগুলোতে আপনার পোষ্যকে খাবার বা ট্রিট পাওয়ার জন্য একটি ছোট সমস্যা সমাধান করতে হয়, যেমন একটি স্লাইড সরানো বা একটি বল ঘোরানো। এটি তাদের দ্রুত খাওয়া থেকেও বিরত রাখে।
* **লিকিম্যাট (LickiMat):** একটি টেক্সচার্ড ম্যাটের উপর দই, পিনাট বাটার বা ওয়েট ফুডের মতো নরম খাবার ছড়িয়ে দেওয়া পোষ্যদের জন্য, বিশেষ করে কুকুরদের জন্য, একটি শান্তিদায়ক এবং দীর্ঘস্থায়ী কার্যকলাপ। চাটার প্রক্রিয়া তাদের শান্ত করতে সাহায্য করে।
* **স্নাফল ম্যাট (Snuffle Mat):** একটি কাপড়ের ম্যাট যেখানে আপনি শুকনো খাবার বা ট্রিট লুকিয়ে রাখতে পারেন এবং আপনার কুকুরকে তার ঘ্রাণশক্তি ব্যবহার করে তা খুঁজে বের করতে হয়। এটি তাদের প্রাকৃতিক ঘ্রাণ নেওয়ার ইচ্ছাকে পূরণ করে।
* **'হাইড অ্যান্ড সিক' খেলা:** আপনার পোষ্যকে এক জায়গায় বসতে বলে আপনি অন্য ঘরে লুকিয়ে যান এবং তারপর তাকে ডাকুন। এটি একটি মজাদার খেলা যা তাদের শ্রবণশক্তি এবং মস্তিষ্ককে কাজে লাগায়।
* **নতুন কৌশল শেখানো:** 'shake hands' বা 'roll over' এর মতো নতুন কৌশল শেখানো তাদের মস্তিষ্ককে সক্রিয় রাখার একটি চমৎকার উপায়।

আপনার পোষ্যের দৈনন্দিন রুটিনে এই ধরনের কার্যকলাপ অন্তর্ভুক্ত করা শুধুমাত্র তাদের বিনোদনই দেবে না, বরং আপনার সাথে তার বন্ধনকে আরও শক্তিশালী করবে এবং একটি সুখী, সুস্থ ও ভারসাম্যপূর্ণ জীবন নিশ্চিত করবে।`,
    imageUrl: 'https://loremflickr.com/600/400/dog,playing?lock=3',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 20,
    title: 'হিটস্ট্রোক: গরমে আপনার পোষা প্রাণী কি ঝুঁকিতে?',
    content: `বাংলাদেশের তীব্র গরমে আমাদের মতো পোষা প্রাণীরাও হিটস্ট্রোকের মারাত্মক ঝুঁকিতে থাকে। হিটস্ট্রোক বা হাইপারথার্মিয়া তখন ঘটে যখন প্রাণীর শরীরের তাপমাত্রা স্বাভাবিকের চেয়ে অনেক বেড়ে যায় এবং তারা তা নিয়ন্ত্রণে আনতে পারে না। এটি একটি অত্যন্ত জরুরি অবস্থা এবং দ্রুত ব্যবস্থা না নিলে মৃত্যু পর্যন্ত হতে পারে।

**হিটস্ট্রোকের লক্ষণ:**
* **অতিরিক্ত হাঁপানো (Excessive Panting):** কুকুররা শরীর ঠান্ডা করতে হাঁপায়, কিন্তু যদি এটি অবিরাম এবং খুব দ্রুত হয়, তবে সতর্ক হোন।
* **লালা ঝরা:** অতিরিক্ত এবং ঘন লালা ঝরা।
* **অস্থিরতা:** প্রাণীটি ঠান্ডা জায়গা খুঁজছে, শুয়ে পড়ছে বা হাঁটতে চাইছে না।
* **মাড়ি লাল বা ফ্যাকাসে:** মাড়ির রঙ গাঢ় লাল বা নীলচে হয়ে যাওয়া।
* **জ্বর:** শরীরের তাপমাত্রা ১০৪°F বা তার বেশি।
* **বমি বা ডায়রিয়া:** অনেক সময় রক্তযুক্ত হতে পারে।

**জরুরি করণীয়:**
* **ঠান্ডা স্থানে নিন:** অবিলম্বে পোষ্যটিকে রোদ থেকে সরিয়ে ফ্যান বা এসির নিচে নিয়ে যান।
* **জল দিন:** স্বাভাবিক তাপমাত্রার (বরফ ঠান্ডা নয়) জল খেতে দিন।
* **শরীর ভেজান:** ভেজা তোয়ালে দিয়ে বা জল স্প্রে করে তার শরীর, বিশেষ করে পেট এবং পায়ের থাবা ভিজিয়ে দিন। *কখনোই বরফ জল ব্যবহার করবেন না*, কারণ এটি রক্তনালী সংকুচিত করে তাপ বের হওয়া বন্ধ করে দিতে পারে।
* **ভেটের কাছে যান:** শরীরের তাপমাত্রা কিছুটা কমলে দ্রুত পশুচিকিৎসকের কাছে নিয়ে যান। অভ্যন্তরীণ অঙ্গের ক্ষতি হয়েছে কিনা তা পরীক্ষা করা জরুরি।

**প্রতিরোধ:**
* ভর দুপুরে বা কড়া রোদে হাঁটাতে বের হবেন না। সকাল বা সন্ধ্যায় হাঁটা নিরাপদ।
* সব সময় পর্যাপ্ত পরিষ্কার জলের ব্যবস্থা রাখুন।
* বন্ধ গাড়িতে পোষ্যকে রেখে যাবেন না, এমনকি জানলা খোলা থাকলেও। গাড়ির ভেতরের তাপমাত্রা খুব দ্রুত বাড়ে।`,
    imageUrl: '', // Will be generated
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 21,
    title: 'বিড়ালের কিডনি রোগ (CKD): নীরব ঘাতক ও তার প্রতিকার',
    content: `ক্রনিক কিডনি ডিজিজ (CKD) বয়স্ক বিড়ালদের মৃত্যুর অন্যতম প্রধান কারণ। এটি একটি নীরব ঘাতক কারণ কিডনির প্রায় ৭০% অকেজো না হওয়া পর্যন্ত সাধারণত কোনো লক্ষণ প্রকাশ পায় না। তবে প্রাথমিক পর্যায়ে ধরা পড়লে সঠিক যত্ন ও খাদ্যাভ্যাসের মাধ্যমে বিড়ালকে দীর্ঘদিন সুস্থ রাখা সম্ভব।

**লক্ষণসমূহ:**
* **অতিরিক্ত জল পান ও প্রস্রাব:** বিড়াল হঠাৎ করে প্রচুর জল খাচ্ছে এবং লিটার বক্স দ্রুত ভরে যাচ্ছে।
* **ওজন হ্রাস:** ভালো খাওয়া সত্ত্বেও ওজন কমে যাওয়া বা ক্ষুধামন্দা।
* **বমি:** মাঝে মাঝে বা নিয়মিত বমি করা।
* **অলসতা:** আগের মতো খেলাধুলা না করা, বেশি ঘুমানো।
* **মুখের দুর্গন্ধ:** কিডনি টক্সিন বের করতে না পারায় মুখে অ্যামোনিয়ার মতো গন্ধ হতে পারে।
* **কোটের উজ্জ্বলতা হারানো:** পশম রুক্ষ ও অগোছালো হয়ে যাওয়া।

**প্রতিরোধ ও ব্যবস্থাপনা:**
* **জল:** বিড়ালরা প্রাকৃতিকভাবে জল কম খায়, যা কিডনির ওপর চাপ ফেলে। তাদের বেশি জল খেতে উৎসাহিত করুন। ওয়েট ফুড (Wet food) বা ক্যানড ফুড দিন, কারণ এতে ৭০-৮০% জল থাকে। ওয়াটার ফাউন্টেন ব্যবহার করতে পারেন।
* **নিয়মিত চেকআপ:** ৭ বছরের বেশি বয়সী বিড়ালদের বছরে অন্তত একবার রক্ত পরীক্ষা (Blood work) করানো উচিত। এতে ক্রিয়েটিনিন ও BUN লেভেল দেখে কিডনির অবস্থা বোঝা যায়।
* **প্রেসক্রিপশন ডায়েট:** কিডনি রোগ ধরা পড়লে ভেটের পরামর্শ অনুযায়ী রেনাল ডায়েট (Renal Diet) খাওয়ালে কিডনির ওপর চাপ কমে এবং আয়ু বাড়ে।
* **স্ট্রেস কমানো:** বিড়ালকে শান্ত পরিবেশে রাখুন।`,
    imageUrl: '',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readTime: 6,
  },
  {
    id: 22,
    title: 'হেয়ারবল (Hairball): বিড়ালের স্বাভাবিক সমস্যা নাকি চিন্তার কারণ?',
    content: `বিড়ালরা স্বভাবগতভাবেই খুব পরিষ্কার-পরিচ্ছন্ন প্রাণী এবং তারা নিজেদের জিভ দিয়ে চেটে পরিষ্কার রাখে (grooming)। এই প্রক্রিয়ায় তারা অনেক আলগা পশম গিলে ফেলে। এই পশম সাধারণত মলের সাথে বেরিয়ে যায়, কিন্তু কখনো কখনো এটি পেটে জমা হয়ে দলা পাকিয়ে বমি আকারে বেরিয়ে আসে, যাকে আমরা 'হেয়ারবল' বলি।

**কখন এটি স্বাভাবিক?**
মাসে এক-দুবার হেয়ারবল বমি করা সাধারণত স্বাভাবিক। এটি দেখতে অনেকটা পাইপ বা সসেজের মতো হয়।

**কখন চিন্তার কারণ?**
* **ঘন ঘন বমি:** সপ্তাহে একাধিকবার হেয়ারবল বমি করা।
* **বমি করার চেষ্টা কিন্তু বের না হওয়া:** বিড়াল ওয়াক-ওয়াক করছে বা কফ তোলার চেষ্টা করছে কিন্তু কিছু বের হচ্ছে না। এটি অন্ত্রে ব্লকেজের লক্ষণ হতে পারে যা প্রাণঘাতী।
* **কোষ্ঠকাঠিন্য:** পশম অন্ত্রে আটকে গেলে মলত্যাগ করতে সমস্যা হতে পারে।
* **ক্ষুধামন্দা:** হেয়ারবলের কারণে পেট ভরা মনে হতে পারে এবং বিড়াল খাওয়া কমিয়ে দিতে পারে।

**প্রতিকার:**
* **নিয়মিত ব্রাশ:** প্রতিদিন বা সপ্তাহে কয়েকবার বিড়ালকে ব্রাশ করলে আলগা পশম উঠে আসে এবং পেটে কম যায়।
* **হেয়ারবল জেল:** বাজারে মল্ট পেস্ট বা হেয়ারবল জেল পাওয়া যায় যা পশমকে পিচ্ছিল করে মলের সাথে বের হতে সাহায্য করে।
* **বিশেষ খাবার:** 'Hairball Control' ক্যাট ফুডে ফাইবার বেশি থাকে যা হজমে সাহায্য করে।
* **গ্রাস (Cat Grass):** বিড়াল ঘাস খেলে তা ফাইবার হিসেবে কাজ করে এবং বমির মাধ্যমে পশম বের করে দিতে সাহায্য করে।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 23,
    title: 'কুকুরের মুখের দুর্গন্ধ: এটি কি কেবলই বাজে গন্ধ?',
    content: `অনেকেই মনে করেন কুকুরের মুখের দুর্গন্ধ বা 'Doggie Breath' স্বাভাবিক। কিন্তু আসলে এটি প্রায়শই দাঁত বা মাড়ির রোগের (Periodontal disease) লক্ষণ। অবহেলা করলে এটি দাঁত পড়ে যাওয়া, ব্যথা, এমনকি কিডনি ও হার্টের সমস্যার কারণ হতে পারে।

**দুর্গন্ধের কারণ:**
* **প্লাক ও টার্টার:** দাঁতে ব্যাকটেরিয়া জমে হলুদ বা বাদামী টার্টার তৈরি হয়, যা দুর্গন্ধের প্রধান কারণ।
* **খাদ্যাভ্যাস:** আবর্জনা বা পচা খাবার খাওয়ার অভ্যাস।
* **ডায়াবেটিস:** মিষ্টি বা ফলের মতো গন্ধ ডায়াবেটিসের লক্ষণ হতে পারে।
* **কিডনি সমস্যা:** প্রস্রাবের মতো গন্ধ কিডনি রোগের ইঙ্গিত দিতে পারে।

**সমাধান:**
* **ব্রাশ করা:** কুকুরের দাঁত নিয়মিত (সপ্তাহে অন্তত ৩-৪ দিন) ব্রাশ করা উচিত। মানুষের পেস্ট ব্যবহার করবেন না (ফ্লোরাইড বিষাক্ত), কুকুরের জন্য বিশেষ এনজাইমেটিক টুথপেস্ট ব্যবহার করুন।
* **ডেন্টাল চিউ (Dental Chews):** ভালো মানের ডেন্টাল স্টিক বা চিউ টয় চিবানো দাঁত পরিষ্কার রাখতে সাহায্য করে।
* **ভেটেরিনারি স্কেলিং:** যদি দাঁতে খুব বেশি টার্টার জমে যায়, তবে ভেটের কাছে নিয়ে স্কেলিং বা প্রফেশনাল ক্লিনিং করানো প্রয়োজন।
* **খাবার:** শুকনো খাবার (Dry kibble) দাঁত পরিষ্কার রাখতে কিছুটা সাহায্য করে।`,
    imageUrl: '',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 24,
    title: 'কুকুরকে কতদিন পর পর গোসল করানো উচিত?',
    content: `অনেক নতুন মালিক কুকুরকে মানুষের মতো রোজ বা প্রতি সপ্তাহে গোসল করাতে চান। কিন্তু এটি ত্বকের জন্য ক্ষতিকর হতে পারে। কুকুরের ত্বকের নিজস্ব প্রাকৃতিক তেল (Natural Oils) থাকে যা তাদের ত্বক ও পশমকে সুস্থ রাখে।

**সঠিক সময়সূচী:**
* **সাধারণ নিয়ম:** বেশিরভাগ কুকুরের জন্য মাসে একবার গোসল করানোই যথেষ্ট।
* **চর্মরোগ থাকলে:** ভেটের পরামর্শ অনুযায়ী মেডিসিনাল শ্যাম্পু দিয়ে সপ্তাহে একবার বা নির্দেশমতো গোসল করাতে হতে পারে।
* **গরমকাল:** গরমে ২-৩ সপ্তাহ পর পর গোসল করানো যেতে পারে, তবে সাধারণ জল দিয়ে গা মুছিয়ে দেওয়া বা ধুয়ে দেওয়া বেশি নিরাপদ।
* **নোংরা হলে:** যদি কুকুর কাদায় খেলে বা গায়ে দুর্গন্ধ হয়, তবে তখনই গোসল করান।

**সতর্কতা:**
* মানুষের শ্যাম্পু ব্যবহার করবেন না। কুকুরের ত্বকের pH মানুষের থেকে ভিন্ন। ভালো মানের Dog Shampoo ব্যবহার করুন।
* গোসলের সময় কানে যেন জল না ঢোকে সেদিকে খেয়াল রাখুন (কানে তুলো দিতে পারেন)।
* গোসলের পর খুব ভালোভাবে লোম শুকানো জরুরি, বিশেষ করে পায়ের আঙুলের ফাঁকে, যাতে ফাঙ্গাল ইনফেকশন না হয়।`,
    imageUrl: '',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 25,
    title: 'বিড়ালকে দুধ দেওয়া: ভালোবাসা নাকি ক্ষতি?',
    content: `ছোটবেলার কার্টুন দেখে আমাদের ধারণা হয়েছে যে দুধ বিড়ালের প্রিয় এবং আদর্শ খাবার। কিন্তু বাস্তবতা হলো, প্রাপ্তবয়স্ক বেশিরভাগ বিড়ালই 'ল্যাকটোজ ইনটলারেন্ট' (Lactose Intolerant)।

**কেন দুধ ক্ষতিকর?**
বিড়ালছানা মায়ের দুধ হজম করতে পারে, কিন্তু বড় হওয়ার সাথে সাথে তাদের শরীরে 'ল্যাকটেজ' এনজাইম তৈরি হওয়া কমে যায়। গরুর দুধে প্রচুর ল্যাকটোজ থাকে যা তারা হজম করতে পারে না।

**দুধ খাওয়ার ফলে কী হয়?**
* **পেট খারাপ:** ডায়রিয়া বা পাতলা পায়খানা।
* **গ্যাস ও পেটে ব্যথা:** বিড়াল অস্বস্তি বোধ করতে পারে।
* **বমি:** হজম না হওয়ায় বমি হতে পারে।

**বিকল্প কী?**
* **বিশুদ্ধ জল:** বিড়ালের জন্য সেরা পানীয় হলো পরিষ্কার জল।
* **ল্যাকটোজ-ফ্রি মিল্ক:** যদি আপনি সত্যিই দুধ খাওয়াতে চান, তবে পেট শপ-এ পাওয়া বিশেষ 'Cat Milk' বা ল্যাকটোজ-মুক্ত দুধ দিতে পারেন, তবে তা-ও পরিমিত। দুধকে খাবার হিসেবে নয়, মাঝে মাঝে 'ট্রিট' হিসেবে দেখা উচিত।`,
    imageUrl: '',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 26,
    title: 'চকোলেট: আপনার পোষ্যের জন্য এক মিষ্টি বিষ',
    content: `চকোলেট আমাদের জন্য সুস্বাদু হলেও কুকুর এবং বিড়ালের জন্য এটি মারাত্মক বিষাক্ত। চকোলেটে 'থিওব্রোমিন' (Theobromine) এবং ক্যাফেইন থাকে, যা পোষা প্রাণীরা মানুষের মতো মেটাবলাইজ বা হজম করতে পারে না।

**কোন চকোলেট বেশি ক্ষতিকর?**
সব চকোলেটই ক্ষতিকর, তবে ডার্ক চকোলেট (Dark Chocolate) এবং বেকিং চকোলেটে থিওব্রোমিন বেশি থাকে, তাই এটি সবচেয়ে বিপজ্জনক। হোয়াইট চকোলেটে পরিমাণ কম থাকলেও তাতে প্রচুর ফ্যাট ও চিনি থাকে যা প্যানক্রিয়াটাইটিস করতে পারে।

**লক্ষণ:**
* বমি ও ডায়রিয়া
* অতিরিক্ত তৃষ্ণা ও প্রস্রাব
* অস্থিরতা ও দ্রুত শ্বাস-প্রশ্বাস
* মাংসপেশির খিঁচুনি (Tremors)
* হার্টবিট বেড়ে যাওয়া
* খিঁচুনি (Seizures) ও মৃত্যু

**কী করবেন?**
যদি সন্দেহ হয় আপনার পোষ্য চকোলেট খেয়েছে, তবে পরিমাণ এবং প্রকারভেদ নোট করুন এবং **অবিলম্বে** ভেটের কাছে যান। লক্ষণ প্রকাশের জন্য অপেক্ষা করবেন না। যত দ্রুত চিকিৎসা শুরু হবে, বাঁচার সম্ভাবনা তত বেশি।`,
    imageUrl: '',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 27,
    title: 'ইনডোর বনাম আউটডোর বিড়াল: কোনটি বেশি নিরাপদ?',
    content: `বাংলাদেশে বিড়াল পালনের ক্ষেত্রে এটি একটি বড় বিতর্ক। বিড়ালকে কি ঘরের ভেতরেই রাখা উচিত, নাকি বাইরে ঘুরতে দেওয়া উচিত? বিশেষজ্ঞদের মতে, ইনডোর বা ঘরোয়া জীবনই বিড়ালের জন্য সবচেয়ে নিরাপদ ও স্বাস্থ্যকর।

**আউটডোর বিড়ালের ঝুঁকি:**
* **দুর্ঘটনা:** রাস্তায় গাড়ি চাপা পড়া বা দুর্ঘটনার ঝুঁকি।
* **রোগবালাই:** অন্যান্য বিড়ালের সংশ্রবে এসে FIP, FeLV, FIV বা জলাতঙ্কের মতো প্রাণঘাতী রোগ হতে পারে।
* **পরজীবী:** এঁটেল, মাছি ও কৃমির আক্রমণ।
* **মারামারি:** এলাকা দখল নিয়ে অন্য বিড়াল বা কুকুরের কামড়।
* **হারিয়ে যাওয়া বা চুরি:** বা ঢাকায় বিড়াল হারিয়ে যাওয়া খুব সাধারণ।

**ইনডোর বিড়ালকে খুশি রাখার উপায়:**
অনেকে ভাবেন ঘরে বিড়াল একঘেয়েমি বোধ করবে। কিন্তু সঠিক এনরিচমেন্ট দিলে তারা ঘরেই সুখে থাকে:
* জানলার পাশে বসার জায়গা (Cat TV)।
* স্ক্র্যাচিং পোস্ট এবং ক্যাট ট্রি।
* প্রচুর খেলনা এবং আপনার সাথে খেলার সময়।
* বারান্দায় নেট দিয়ে নিরাপদ 'ক্যাটিও' (Catio) তৈরি করা।

পরিসংখ্যানে দেখা গেছে, ইনডোর বিড়াল আউটডোর বিড়ালের চেয়ে অনেক বেশি দিন বাঁচে।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 28,
    title: 'বিড়াল কেন লিটার বক্সের বাইরে টয়লেট করছে?',
    content: `বিড়াল স্বভাবতই পরিচ্ছন্ন। যদি সে হঠাৎ লিটার বক্স ব্যবহার বন্ধ করে, তবে বুঝতে হবে সে কোনো সমস্যার মধ্য দিয়ে যাচ্ছে। এটি তার 'খারাপ ব্যবহার' নয়, বরং সাহায্যের আবেদন।

**সম্ভাব্য কারণ:**
1.  **অপরিচ্ছন্ন বক্স:** বিড়াল নোংরা টয়লেট ঘৃণা করে। বক্সটি কি রোজ পরিষ্কার করা হয়?
2.  **মেডিকেল সমস্যা:** প্রস্রাবে সংক্রমণ (UTI), কিডনি স্টোন বা ডায়াবেটিস হলে প্রস্রাব ধরে রাখা কষ্টকর হয় বা প্রস্রাব করা বেদনাদায়ক হয়। তখন তারা বক্সকে ব্যথার সাথে মিলিয়ে ফেলে। সবার আগে ভেটের কাছে চেকআপ করান।
3.  **বক্সের অবস্থান:** বক্সটি কি খুব কোলাহলপূর্ণ জায়গায়? নাকি এমন জায়গায় যেখানে যেতে তার কষ্ট হয়?
4.  **লিটার পছন্দ না হওয়া:** হঠাৎ বালু বা লিটার পরিবর্তন করেছেন? বিড়ালের সুগন্ধিযুক্ত লিটার অপছন্দ হতে পারে।
5.  **স্ট্রেস:** বাড়িতে নতুন মানুষ, নতুন পোষ্য বা আসবাবপত্র পরিবর্তনের কারণে স্ট্রেস হতে পারে।
6.  **বহু বিড়াল:** একাধিক বিড়াল থাকলে ‘Number of cats + 1’ সূত্র মেনে লিটার বক্স দিন।

বকাঝকা না করে কারণটি খুঁজে বের করার চেষ্টা করুন।`,
    imageUrl: '',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 29,
    title: 'নতুন পোষ্যকে পরিবারের সাথে পরিচিত করানোর সঠিক উপায়',
    content: `বাড়িতে আগে থেকেই একটি পোষ্য আছে এবং আপনি নতুন আরেকটি আনতে চান? হুট করে তাদের মুখোমুখি করা বিপদজনক হতে পারে। ধাপে ধাপে পরিচয় করানোই সফলতার চাবিকাঠি।

**ধাপ ১: গন্ধ বিনিময় (Scent Swapping)**
প্রথম কয়েকদিন তাদের আলাদা ঘরে রাখুন। তাদের একে অপরকে দেখতে দেবেন না, কিন্তু তাদের বিছানা বা খেলনা অদলবদল করুন। এতে তারা একে অপরের গন্ধের সাথে পরিচিত হবে।

**ধাপ ২: দূর থেকে দেখা**
মশারি বা কাঁচের দরজার আড়াল থেকে তাদের একে অপরকে দেখতে দিন। এই সময় তাদের সুস্বাদু খাবার বা ট্রিট দিন। এতে তারা বুঝবে যে অপর প্রাণীটির উপস্থিতি মানেই ভালো কিছু (খাবার)।

**ধাপ ৩: নিয়ন্ত্রিত সাক্ষাৎ**
কয়েকদিন পর, কুকুর হলে লিশ পড়িয়ে এবং বিড়াল হলে সাবধানে কাছে আনুন। মারামারি বা ফোঁসফাঁস করলে আবার আলাদা করুন। জোর করবেন না।

**ধাপ ৪: পূর্ণ স্বাধীনতা**
যখন তারা একে অপরের উপস্থিতিতে শান্ত থাকবে, তখন নজরদারির মধ্যে তাদের একসাথে ছাড়ুন। সম্পূর্ণ মিলেমিশে থাকতে কয়েক সপ্তাহ থেকে মাস পর্যন্ত লাগতে পারে। ধৈর্য ধরুন।`,
    imageUrl: '',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 30,
    title: 'সেপারেশন অ্যাংজাইটি: আপনার পোষ্য কি আপনাকে ছাড়া থাকতে পারে না?',
    content: `আপনি কাজে বেরোলেই কি আপনার কুকুর ঘেউ ঘেউ করে, ঘরের জিনিস নষ্ট করে বা অস্থির হয়ে যায়? এটি 'সেপারেশন অ্যাংজাইটি' বা বিচ্ছেদ ভীতির লক্ষণ। করোনাকালে সবসময় মানুষের সাথে থেকে অনেক পোষ্য এখন একা থাকতে ভয় পায়।

**লক্ষণ:**
* মালিক যাওয়ার প্রস্তুতি (জুতো পরা, চাবি নেওয়া) নিলেই অস্থির হওয়া
* একা থাকলে ক্রমাগত ডাকা বা কাঁদা
* দরজায় আঁচড়ানো বা পালানোর চেষ্টা করা
* ঘরে প্রস্রাব-পায়খানা করা (যদিও সে পটি ট্রেন্ড)

**সমাধান:**
* **Desensitization:** চাবি নেওয়া বা জুতো পরার মতো কাজগুলো করুন কিন্তু বাইরে যাবেন না। এতে সে বুঝবে এই কাজগুলোর মানেই আপনি তাকে ছেড়ে যাচ্ছেন না।
* **Low-key বিদায়:** বেরোনোর সময় বা ফেরার সময় অতিরিক্ত আবেগ দেখাবেন না বা খুব আদর করবেন না। শান্তভাবে বের হন ও ঢুকুন।
* **ব্যস্ত রাখা:** বেরোনোর আগে তাকে একটি দীর্ঘস্থায়ী খেলনা বা ট্রিট-ভরা কং (Kong toy) দিয়ে যান।
* **ব্যায়াম:** বেরোনোর আগে তাকে ভালোভাবে ব্যায়াম করান যাতে সে ক্লান্ত হয়ে ঘুমিয়ে থাকে।
* তীব্র ক্ষেত্রে ভেট বা বিহেভিয়ারিস্টের পরামর্শ নিন।`,
    imageUrl: '',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 31,
    title: 'কুকুরের আগ্রাসী আচরণ: কারণ ও প্রতিকার',
    content: `কুকুর অকারণে কামড়ায় বা হিংস্র হয় না। আগ্রাসনের পেছনে সবসময় একটি কারণ থাকে। সেটি ভয়, ব্যথা, বা এলাকা রক্ষার তাগিদ হতে পারে।

**আগ্রাসনের ধরন:**
* **ভয় থেকে (Fear Aggression):** কুকুর যখন কোণঠাসা বোধ করে বা ভয় পায়।
* **ব্যথা থেকে (Pain-induced):** কোথাও ব্যথা থাকলে স্পর্শ করলে কামড়াতে পারে।
* **খাবার বা খেলনা রক্ষা (Resource Guarding):** নিজের প্রিয় জিনিস কেউ কেড়ে নেবে ভেবে।

**করণীয়:**
* **শাস্তি দেবেন না:** মারধর করলে ভয় ও আগ্রাসন বাড়ে।
* **ট্রিগার চিহ্নিত করুন:** কি করলে সে রেগে যায়? অচেনা মানুষ? অন্য কুকুর? সেই পরিস্থিতি এড়িয়ে চলুন বা ধীরে ধীরে অভ্যস্ত করান।
* **সোশ্যালাইজেশন:** ছোটবেলা থেকে বিভিন্ন মানুষ ও পরিবেশের সাথে মেশা জরুরি।
* **প্রফেশনাল সাহায্য:** যদি কুকুর কামড়ানোর প্রবণতা দেখায়, তবে দেরি না করে একজন প্রফেশনাল ডগ ট্রেইনার বা বিহেভিয়ারিস্টের সাহায্য নিন। এটি পরিবারের সুরক্ষার প্রশ্ন।`,
    imageUrl: '',
    author: 'মো: জামাল (ডগ ট্রেইনার)',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 32,
    title: 'মানুষের কোন খাবারগুলো পোষা প্রাণীর জন্য নিরাপদ?',
    content: `আমরা প্রায়ই ভালোবেসে আমাদের পাতের খাবার কুকুর বা বিড়ালকে দিই। কিছু খাবার নিরাপদ হলেও অনেক খাবারই বিষাক্ত।

**নিরাপদ (পরিমিত পরিমাণে):**
* **রান্না করা মাংস:** মুরগি, গরু বা মাছ (তেল-মসলা, পেঁয়াজ ও হাড় ছাড়া)।
* **ডিম:** সেদ্ধ ডিম প্রোটিনের ভালো উৎস।
* **ভাত:** পেটের সমস্যায় সাদা ভাত ও সেদ্ধ মুরগি খুব উপকারী।
* **সবজি:** গাজর, মিষ্টি কুমড়া, বিনস, শসা (সেদ্ধ)।
* **ফল:** আপেল (বীজ ছাড়া), তরমুজ, কলা, ব্লুবেরি।

**বিষাক্ত/বিপদজনক (কখনোই দেবেন না):**
* **পেঁয়াজ ও রসুন:** রক্তস্বল্পতা করে (পাকা বা কাঁচা উভয়ই)।
* **আঙ্গুর ও কিসমিস:** কিডনি ফেইলিওর করতে পারে।
* **চকোলেট ও কফি:** হার্ট ও নার্ভের ক্ষতি করে।
* **অ্যাভোকাডো:** বিষাক্ত।
* **জাইলিটল (Xylitol):** চুইংগাম বা পিনাট বাটারে থাকা কৃত্রিম চিনি, যা লিভার নষ্ট করে।
* **অ্যালকোহল ও মিষ্টি:** অত্যন্ত ক্ষতিকর।

নতুন খাবার দেওয়ার আগে সর্বদা ভেটের পরামর্শ নিন।`,
    imageUrl: '',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 33,
    title: 'পেট ফার্স্ট এইড কিট: বিপদের বন্ধু',
    content: `রাতে বা ছুটির দিনে হঠাৎ পোষ্য অসুস্থ হলে বা আঘাত পেলে ভেটের কাছে যাওয়ার আগে ফার্স্ট এইড বা প্রাথমিক চিকিৎসা জীবন বাঁচাতে পারে। প্রতিটি পেট মালিকের বাড়িতে একটি ফার্স্ট এইড বক্স রাখা উচিত।

**কি বক্সে কি কি রাখবেন?**
* **ভেটের নম্বর:** আপনার ভেট এবং নিকটস্থ ইমার্জেন্সি হাসপাতালের নম্বর।
* **গজ ও ব্যান্ডেজ:** রক্তপাত বন্ধ করতে ও ক্ষত বাঁধতে।
* **অ্যান্টিসেপটিক:** পভিসেপ বা হেক্সিসল (ক্ষত পরিষ্কার করতে)।
* **তুলা ও কাঁচি:** ড্রেসিংয়ের জন্য।
* **থার্মোমিটার:** জ্বর মাপার জন্য (রেকটাল থার্মোমিটার)।
* **টুইজার (Tweezers):** কাঁটা বা পোকা বের করতে।
* **সিরিঞ্জ (সুঁই ছাড়া):** ওষুধ বা তরল খাওয়ানোর জন্য।
* **স্যালাইন:** ওরাল স্যালাইন পাউডার (ডিহাইড্রেশনের জন্য) এবং ক্ষত ধোয়ার জন্য নরমাল স্যালাইন।
* **গ্লাভস:** নিজের সুরক্ষার জন্য।
* **পুরানো তোয়ালে:** প্রাণীকে ধরে রাখতে বা মুছতে।

মনে রাখবেন, ফার্স্ট এইড মানে চিকিৎসা নয়, এটি হাসপাতালে পৌঁছানোর আগে সাময়িক স্বস্তি মাত্র।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 34,
    title: 'কীভাবে সঠিক পশুচিকিৎসক (Vet) নির্বাচন করবেন?',
    content: `আপনার পোষ্যের সুস্বাস্থ্যের জন্য একজন ভালো ও বিশ্বস্ত পশুচিকিৎসক খুঁজে বের করা অত্যন্ত গুরুত্বপূর্ণ। বিপদের সময় আপনি কার ওপর ভরসা করবেন তা আগে থেকেই ঠিক করে রাখা উচিত।

**বিবেচ্য বিষয়:**
* **যোগ্যতা ও লাইসেন্স:** ডাক্তার রেজিস্টার্ড কিনা নিশ্চিত হন (DVM ডিগ্রি)।
* **ব্যবহার:** তিনি কি আপনার পোষ্যের প্রতি সহানুভূতিশীল? তিনি কি আপনার প্রশ্নের উত্তর ধৈর্য ধরে দেন?
* **ক্লিনিকের সুবিধা:** ক্লিনিকে কি এক্স-রে, রক্ত পরীক্ষা বা সার্জারির ব্যবস্থা আছে? নাকি শুধুমাত্র কনসালটেশন হয়?
* **ইমার্জেন্সি সেবা:** তারা কি ছুটির দিনে বা রাতের বেলা জরুরি সেবা দেয়?
* **অবস্থান:** ক্লিনিকটি আপনার বাসা থেকে কত দূরে? জরুরি অবস্থায় দূরত্ব একটি বড় ফ্যাক্টর।
* **রিভিউ:** অন্যান্য পেট প্যারেন্টদের মতামত বা অনলাইন রিভিউ দেখুন।

**টিপস:**
পোষ্য অসুস্থ হওয়ার আগেই একবার 'ওয়েলনেস চেকআপ'-এর জন্য যান। এতে ডাক্তারের সাথে এবং ক্লিনিকের পরিবেশের সাথে আপনার ও আপনার পোষ্যের পরিচিতি হবে।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 35,
    title: 'পোষা প্রাণীর টিকার সময়সূচী: সুস্থতার প্রথম ধাপ',
    content: `টিকা বা ভ্যাকসিন আপনার পোষ্যকে প্রাণঘাতী রোগ থেকে রক্ষা করে। বাংলাদেশে কুকুর ও বিড়ালের জন্য নির্ধারিত টিকার সময়সূচী মেনে চলা অত্যন্ত জরুরি।

**কুকুরের টিকা:**
* **পাপ্পি ডিপি (Puppy DP):** ৬ সপ্তাহ বয়সে (পারভোভাইরাস ও ডিসটেম্পার)।
* **৬-ইন-১ বা ৭-ইন-১ (DHLPP):** ১ম ডোজ ৮-৯ সপ্তাহে, বুস্টার ২১ দিন পর পর ২ বার। এটি ডিসটেম্পার, হেপাটাইটিস, লেপ্টোস্পাইরোসিস, পারভো এবং প্যারাইনফ্লুয়েঞ্জা থেকে রক্ষা করে।
* **জলাতঙ্ক (Rabies):** ৩ মাস বয়সে ১ম ডোজ, ২১ দিন পর বুস্টার (অপশনাল তবে রিকমেন্ডেড), এরপর প্রতি বছর ১ বার।
* **ক্যানেল কফ:** প্রয়োজন অনুযায়ী।

**বিড়ালের টিকা:**
* **ট্রিক্যাট (Tricat/FVRCP):** ১ম ডোজ ৮ সপ্তাহে, ২১ দিন পর বুস্টার। এটি প্যানলিউকোপেনিয়া, রাইনোট্রাকাইটিস ও ক্যালিসিভাইরাস থেকে রক্ষা করে।
* **জলাতঙ্ক (Rabies):** ৩ মাস বয়সে এবং এরপর প্রতি বছর।

টিকা দেওয়ার আগে অবশ্যই ভেটের কাছে ডিওর্মিং (কৃমিনাশক) করানো উচিত। অসুস্থ প্রাণীকে কখনোই টিকা দেবেন না।`,
    imageUrl: '',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 36,
    title: 'কৃমিনাশক (Deworming): কেন এবং কখন?',
    content: `কৃমি পোষা প্রাণীর খুব সাধারণ কিন্তু মারাত্মক সমস্যা। কৃমি থাকলে টিকা কাজ করে না এবং প্রাণীর বৃদ্ধি ব্যাহত হয়। মানুষের মধ্যেও কৃমি ছড়াতে পারে (Zoonotic), তাই নিয়মিত ডিওর্মিং জরুরি।

**সময়সূচী:**
* **বাচ্চা (Puppy/Kitten):** ১ মাস বয়স থেকে শুরু করে ৩ মাস বয়স পর্যন্ত প্রতি ১৫ দিন পর পর।
* **বাড়ন্ত বয়স:** ৩ মাস থেকে ৬ মাস বয়স পর্যন্ত মাসে ১ বার।
* **প্রাপ্তবয়স্ক:** ৬ মাসের পর থেকে প্রতি ৩ মাস বা ১ ঋতু পর পর (বছরে ৪ বার)।

**ডোজ:**
প্রাণীর ওজনের ওপর ভিত্তি করে ওষুধের ডোজ নির্ধারণ করা হয় (যেমন: প্রতি ১০ কেজির জন্য ১টা ট্যাবলেট)। সঠিক ওজন না মেপে ওষুধ দেবেন না। ওভারডোজ বিষাক্ত হতে পারে, আবার কম ডোজে কৃমি মরে না।

**লক্ষণ:**
পেট ফোলা, বমি, ডায়রিয়া, পায়ুপথ ঘষা (Scooting), খাবারে অরুচি বা অতিরিক্ত ক্ষুধা।`,
    imageUrl: '',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 37,
    title: 'পারভোভাইরাস: কুকুরের জন্য এক মূর্তিমান আতঙ্ক',
    content: `বাংলাদেশে কুকুর ছানার মৃত্যুর অন্যতম প্রধান কারণ ক্যানাইন পারভোভাইরাস। এটি অত্যন্ত ছোঁয়াচে এবং এর কোনো নির্দিষ্ট অ্যান্টিভাইরাল ওষুধ নেই।

**লক্ষণ:**
* তীব্র দুর্গন্ধযুক্ত রক্ত-মিশ্রিত ডায়রিয়া।
* অবিরাম বমি।
* খাওয়ায় অনীহা ও নিস্তেজ হয়ে পড়া।
* জ্বর বা শরীরের তাপমাত্রা কমে যাওয়া।
* ডিহাইড্রেশন বা পানিশূন্যতা।

**চিকিৎসা:**
লক্ষণ দেখার সাথে সাথে ভেটের কাছে নিতে হবে। স্যালাইন থেরাপি, অ্যান্টিবায়োটিক (সেকেন্ডারি ইনফেকশন রোধে) এবং সাপোর্টিভ কেয়ারই একমাত্র ভরসা। ঘরোয়া টোটকা বা ঝাড়ফুঁক করে সময় নষ্ট করলে মৃত্যু নিশ্চিত।

**প্রতিরোধ:**
* সঠিক সময়ে এবং সঠিক নিয়মে টিকা দেওয়া।
* টিকা সম্পূর্ণ না হওয়া পর্যন্ত কুকুর ছানাকে বাইরে বা অন্য কুকুরের কাছে না নেওয়া।
* আক্রান্ত কুকুরের সংস্পর্শ এড়িয়ে চলা এবং নিজের জুতো/জামা পরিষ্কার রাখা (ভাইরাস জুতোর মাধ্যমেও ঘরে আসতে পারে)।`,
    imageUrl: '',
    author: 'ডঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 38,
    title: 'বিড়ালের মূত্রনালীর সংক্রমণ (FLUTD/UTI)',
    content: `বিড়াল, বিশেষ করে পুরুষ বিড়ালদের মধ্যে মূত্রনালীর সমস্যা বা FLUTD (Feline Lower Urinary Tract Disease) খুব সাধারণ। এটি অত্যন্ত যন্ত্রণাদায়ক এবং দ্রুত চিকিৎসা না করালে কিডনি ফেল বা মূত্রথলি ফেটে মৃত্যু হতে পারে।

**লক্ষণ:**
* লিটার বক্সে বারবার যাওয়া কিন্তু প্রস্রাব না হওয়া বা ফোঁটা ফোঁটা হওয়া।
* প্রস্রাবের সময় ব্যথায় চিৎকার করা।
* প্রস্রাবে রক্ত।
* লিটার বক্সের বাইরে যত্রতত্র প্রস্রাব করা।
* যৌনাঙ্গ বারবার চাটা।

**কারণ:**
* কম জল পান করা।
* মানসিক চাপ বা স্ট্রেস।
* স্থূলতা বা অতিরিক্ত ওজন।
* ম্যাগনেসিয়াম বা ফসফরাস যুক্ত খাবার বেশি খাওয়া (শুকনো খাবারে এই ঝুঁকি বেশি)।

**প্রতিরোধ:**
* প্রচুর পরিমাণে বিশুদ্ধ জল খেতে দিন।
* ওয়েট ফুড বা ভেজা খাবার খাওয়ান।
* ওবেসিটি নিয়ন্ত্রণ করুন।
* পুরুষ বিড়ালকে ক্যাস্ট্রেট বা নিউটার করালে ঝুঁকি কিছুটা কমে (যদিও এটি নিয়ে মতভেদ আছে, তবে নিউটার করালে আচরণগত সমস্যা কমে যা স্ট্রেস কমায়)।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 39,
    title: 'কুকুরকে কি ভাত দেওয়া উচিত? সঠিক ডায়েট গাইড',
    content: `বাংলাদেশের প্রেক্ষাপটে ভাত সহজলভ্য, তাই অনেকেই কুকুরকে ভাত খাওয়াতে পছন্দ করেন। কুকুর 'ওমনিভোর' (Omnivore), অর্থাৎ তারা মাংসের পাশাপাশি শর্করা বা ভাত হজম করতে পারে। তবে কিছু নিয়ম মানা জরুরি।

**কিভাবে দেবেন?**
* **পরিমাণ:** খাবারের ৫০% প্রোটিন (মাংস/মাছ), ৩০% সবজি এবং ২০% ভাত হতে পারে। শুধুমাত্র ভাত দিলে কুকুর অপুষ্টিতে ভুগবে।
* **প্রকার:** সাদা ভাত বা লাল চালের ভাত দেওয়া যায়। খিচুড়ি দিলে তাতে তেল, মশলা, পেঁয়াজ দেবেন না। হলুদ ও সামান্য লবণ (খুব কম) দেওয়া যেতে পারে।
* **সমস্যা:** অতিরিক্ত ভাত দিলে কুকুর মোটা হয়ে যেতে পারে (Obesity) এবং ডায়াবেটিসের ঝুঁকি বাড়ে।

**বিকল্প:**
মিষ্টি আলুর সিদ্ধ ভাতের চেয়ে ভালো বিকল্প কারণ এতে ফাইবার ও ভিটামিন বেশি। তবে পরিমিত পরিমাণে ভাত দিলে ক্ষতি নেই, যদি সাথে পর্যাপ্ত প্রোটিন থাকে।`,
    imageUrl: '',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 40,
    title: 'ঘরে তৈরি বিড়ালের খাবার (Homemade Cat Food Recipes)',
    content: `বাজারের কেনা ক্যাট ফুড অনেক সময় ব্যয়বহুল বা ভেজাল হতে পারে। তাই অনেকে ঘরে তৈরি খাবার দিতে চান। বিড়াল 'কার্নিভোর' (Carnivore), তাই তাদের খাবারে মাংসের প্রাধান্য থাকতে হবে।

**সহজ রেসিপি (চিকেন ডিলাইট):**
1.  **উপকরণ:** মুরগির মাংস (হাড় ছাড়া) ১০০ গ্রাম, কলিজা ৩০ গ্রাম, চাল ২৫ গ্রাম (সিদ্ধ), মিষ্টি কুমড়া বা গাজর সিদ্ধ ২০ গ্রাম।
2.  **প্রস্তুত প্রণালী:** সব উপকরণ কোনো তেল, মশলা বা পেঁয়াজ ছাড়া ভালো করে সিদ্ধ করুন। ব্লেন্ডার বা হাতে চটকে পেস্ট বা ছোট টুকরো করে দিন।
3.  **সতর্কতা:** বিড়ালের শরীরে 'টৌরিন' (Taurine) তৈরির ক্ষমতা নেই, যা মাংসে থাকে। সিদ্ধ করলে টৌরিন কমে যায়, তাই নিয়মিত ঘরে তৈরি খাবার খাওয়ালে ভেটের পরামর্শে 'টৌরিন সাপ্লিমেন্ট' যোগ করা উচিত। শুধুমাত্র সেদ্ধ মাংসে দীর্ঘমেয়াদে পুষ্টির ঘাটতি হতে পারে।

**টিপস:**
মাছের কাঁটা বেছে দিন। কাঁচা মাছ বা মাংস দেবেন না, এতে সালমোনেলা বা কৃমির ঝুঁকি থাকে।`,
    imageUrl: '',
    author: 'শেফালি বেগম',
    date: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 41,
    title: 'স্পেইং বা নিউটারিং (বন্ধ্যাকরণ): কেন করবেন?',
    content: `অনেকে মনে করেন পোষ্যকে অপারেশন করানো নিষ্ঠুরতা। কিন্তু স্পেইং (মেয়েদের) বা নিউটারিং (ছেলেদের) আসলে তাদের স্বাস্থ্য ও দীর্ঘায়ুর জন্য উপকারী।

**উপকারিতা:**
* **ক্যান্সার প্রতিরোধ:** মেয়েদের জরায়ু ও স্তন ক্যান্সার এবং ছেলেদের টেস্টিকুলার ক্যান্সারের ঝুঁকি শূন্যে নেমে আসে।
* **আচরণগত উন্নতি:** চিৎকার করা, ঘর নোংরা করা (Spraying) বা ফোঁসফাঁস করা কমে যায়। বাড়ি থেকে পালানোর প্রবণতা কমে।
* **জনসংখ্যা নিয়ন্ত্রণ:** বাংলাদেশে পথপ্রাণীর সংখ্যা কমানোর এটিই একমাত্র মানবিক উপায়। একটি বিড়াল দম্পতি ৫ বছরে কয়েক হাজার বাচ্চার জন্ম দিতে পারে!

**কখন করবেন?**
সাধারণত ৫-৬ মাস বয়সে করা সবচেয়ে নিরাপদ। তবে ভেটের পরামর্শ নিন। অপারেশনের পর ৭-১০ দিন বিশেষ যত্ন (কলার পরানো, ওষুধ খাওয়ানো) নিতে হয়।`,
    imageUrl: '',
    author: 'ডাঃ তামান্না ইসলাম',
    date: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 42,
    title: 'ফাঙ্গাল ইনফেকশন: পোষা প্রাণীর চুলকানি ও পশম পরার কারণ',
    content: `বাংলাদেশের আবহাওয়ায় আর্দ্রতা বেশি থাকায় ফাঙ্গাল ইনফেকশন বা দাউদ খুব সাধারণ সমস্যা। এটি ছোঁয়াচে এবং মানুষের শরীরেও ছড়াতে পারে।

**লক্ষণ:**
* গোলাকার বা রিং-এর মতো চাকা চাকা দাগ (Ringworm)।
* পশম উঠে গিয়ে চামড়া লাল হয়ে যাওয়া।
* তীব্র চুলকানি ও আঁশ ওঠা (Dandruff)।

**করণীয়:**
* আক্রান্ত স্থান ও তার চারপাশের পশম ট্রিম করে দিন।
* আক্রান্ত স্থান শুকনো রাখুন। ফাঙ্গাস ভিজা জায়গায় দ্রুত বাড়ে।
* ভেটের পরামর্শে অ্যান্টি-ফাঙ্গাল ক্রিম ও শ্যাম্পু ব্যবহার করুন।
* লিভারের ক্ষতি হতে পারে বলে ভেটের পরামর্শ ছাড়া মুখে খাওয়ার ওষুধ দেবেন না।
* ঘর ও বিছানা নিয়মিত জীবাণুনাশক দিয়ে পরিষ্কার করুন।`,
    imageUrl: '',
    author: 'ডাঃ কবির হোসেন',
    date: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 43,
    title: 'ম্যানজ (Mange) বা স্ক্যাবিস: নিরাময় সম্ভব?',
    content: `রাস্তার কুকুরদের গায়ে প্রায়ই চামড়া উঠে যাওয়া, লোমহীন ও ক্ষতবিক্ষত অবস্থা দেখা যায়—এটিই ম্যানজ। এটি মাইট (Mite) বা এক ধরণের অতি ক্ষুদ্র পরজীবী দ্বারা হয়। এটি দুই প্রকার: সারকপটিক (ছোঁয়াচে ও চুলকায়) এবং ডেমোডেকটিক (বংশগত ও কম চুলকায়)।

**চিকিৎসা:**
অনেকে পোড়া মবিল ব্যবহার করেন যা **মারাত্মক ক্ষতিকর ও বিষাক্ত**। এটি ত্বকের ছিদ্র বন্ধ করে দেয় এবং বিষক্রিয়ায় প্রাণী মারা যেতে পারে।

**সঠিক চিকিৎসা:**
* ভেটের পরামর্শে আইভারমেকটিন বা নির্দিষ্ট ইনজেকশন/ট্যাবলেট।
* অ্যান্টি-প্যারাসাইটিক শ্যাম্পু (বেনজয়েল পারঅক্সাইড যুক্ত)।
* ইমিউন বুস্টার বা সুষম খাবার।
সঠিক চিকিৎসায় ৪-৬ সপ্তাহের মধ্যে সম্পূর্ণ সেরে ওঠা সম্ভব।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 44,
    title: 'বিড়াল কি সারাদিন ঘুমায়? স্বাভাবিক ঘুমের সময়কাল',
    content: `বিড়ালকে বলা হয় ঘুমের রাজা। তারা দিনে গড়ে ১২ থেকে ১৬ ঘণ্টা এমনকি ২০ ঘণ্টাও ঘুমাতে পারে!

**কেন এত ঘুম?**
বিড়াল শিকারী প্রাণী (Predator)। শিকারের জন্য প্রচুর শক্তি সঞ্চয় করতে হয়, তাই তারা ঘুমের মাধ্যমে শক্তি সংরক্ষণ করে। গোধূলি এবং ভোরে তারা সবচেয়ে বেশি সক্রিয় থাকে (Crepuscular)।

**কখন চিন্তার কারণ?**
যদি ঘুমের পরিমাণ হঠাৎ খুব বেড়ে যায় এবং জেগে থাকার সময়ও নিস্তেজ বা ঝিমিয়ে থাকে, তবে এটি অসুস্থতার লক্ষণ হতে পারে। জ্বর, ব্যথা বা এনিমিয়া থাকলে তারা বেশি ঘুমায়। আবার বয়স্ক বিড়ালদের ঘুমের পরিমাণ স্বাভাবিকভাবেই বেশি হয়।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 45,
    title: 'পোষা প্রাণীর চোখের যত্ন: টিয়ার স্টেইন ও সংক্রমণ',
    content: `বিশেষ করে পার্সিয়ান বিড়াল এবং কিছু কুকুরের (যেমন শিহ-ৎজু) চোখের নিচে লালচে বা বাদামী দাগ (Tear Stain) দেখা যায়।

**প্রতিকার:**
* **পরিষ্কার:** রোজ সকালে নরম সুতি কাপড় বা তুলো হালকা গরম জলে ভিজিয়ে চোখ মুছে দিন।
* **উন্নত খাবার:** নিম্ন মানের খাবারে রং বা প্রিজারভেটিভ থাকলে টিয়ার স্টেইন বাড়ে।
* **চোখের ড্রপ:** চোখ লাল হলে বা পিচুটি কাটলে ভেটের পরামর্শে ড্রপ দিন। মানুষের ড্রপ দেবেন না।
* **লোম ছাঁটা:** চোখের খোঁচা লাগে এমন লোম সাবধানে কেটে দিন।`,
    imageUrl: '',
    author: 'ডাঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 46,
    title: 'বর্ষাকালে পোষা প্রাণীর বিশেষ যত্ন',
    content: `বর্ষাকাল পোষ্যদের জন্য চ্যালেঞ্জিং। স্যাঁতসেঁতে আবহাওয়ায় ফাঙ্গাস, পোকা এবং পেটের সমস্যা বাড়ে।

**টিপস:**
* **শুকনো রাখুন:** বাইরে থেকে আসার পর বা ভিজে গেলে হেয়ার ড্রায়ার বা তোয়ালে দিয়ে লোম সম্পূর্ণ শুকিয়ে দিন।
* **খাবার:** এই সময় খাবার দ্রুত নষ্ট হয়। বেশিক্ষণ বাটিতে খাবার ফেলে রাখবেন না। শুকনো খাবার এয়ারটাইট কন্টেইনারে রাখুন।
* **পায়ের যত্ন:** কাদা থেকে ফিরে পা ধুয়ে শুকিয়ে নিন।
* **পোকা:** মশা ও মাছির উপদ্রব বাড়ে যা হার্টওয়ার্ম বা ম্যাগট উন্ড করতে পারে। মশারি বা নিরাপদ রিপেলেন্ট ব্যবহার করুন।`,
    imageUrl: '',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 47,
    title: 'পোষা প্রাণীকে একা রেখে ভ্রমণে যাওয়ার টিপস',
    content: `ঈদে বা ছুটিতে বাড়ি যাওয়ার সময় পোষ্যকে নিয়ে দুশ্চিন্তা হয়। সেরা উপায় হলো সাথে নেওয়া। কিন্তু যদি তা সম্ভব না হয়?

1.  **বিশ্বস্ত বন্ধু বা আত্মীয়:** কারো দায়িত্বে রেখে যান বা কাউকে আপনার বাসায় এসে দেখাশোনা করতে বলুন।
2.  **পেট বোর্ডিং/হোটেল:** বর্তমানে ঢাকা ও বড় শহরগুলোতে পেট বোর্ডিং সুবিধা আছে। ভালো রিভিউ দেখে বুকিং দিন। তাদের ভ্যাক্সিনেশন কার্ড ও খাবার বুঝিয়ে দিন।
3.  **বাসায় একা:** বিড়ালকে ১-২ দিন পর্যাপ্ত খাবার ও জল দিয়ে একা রাখা যায় (যদি সে অভ্যস্ত হয়), কিন্তু কুকুরকে একা রাখা উচিত নয়। সিসি ক্যামেরা দিয়ে মনিটর করুন।

**সাথে নিলে:**
ট্রেন বা নিজস্ব গাড়ি সবচেয়ে সুবিধাজনক। বাসে বা বিমানে সাধারণত পোষ্য নিতে দেয় না। সাথে নিলে তার জন্য আলাদা ক্যারিয়ার, পটি প্যাড ও খাবার নিন।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 48,
    title: 'বিড়ালের লেজের ভাষা: সে কি বলতে চায়?',
    content: `বিড়াল কথা বলতে না পারলেও লেজ দিয়ে তার মনের ভাব প্রকাশ করে।

* **লেজ সোজা ও আগা বাঁকা (প্রশ্নবোধক চিহ্ন):** সে খুব খুশি এবং খেলতে চায়।
* **লেজ ফোলানো:** প্রচণ্ড ভয় পেয়েছে বা রেগে আছে। নিজেকে বড় দেখানোর চেষ্টা।
* **লেজ নাড়ানো (Wagging):** কুকুরের মতো খুশি নয়, বরং বিড়াল লেজ নাড়ালে বুঝতে হবে সে বিরক্ত বা দ্বিধাগ্রস্ত।
* **পায়ের ফাঁকে লেজ:** ভয় বা বশ্যতা স্বীকার।
* **ধীরে ধীরে নাড়ানো:** কোনো কিছুর ওপর গভীর মনোযোগ (শিকার করার আগে)।

বোঝার চেষ্টা করুন, সম্পর্ক সুন্দর হবে।`,
    imageUrl: '',
    author: 'ডাঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 49,
    title: 'বয়স্ক পোষা প্রাণীর যত্ন (Senior Pet Care)',
    content: `বয়স বাড়ার সাথে সাথে পোষ্যদের চাহিদা বদলায়। কুকুর ৭-৮ বছর এবং বিড়াল ১০-১১ বছরের পর 'সিনিয়র' হিসেবে গণ্য হয়।

**পরিবর্তন ও যত্ন:**
* **আর্থ্রাইটিস:** হাঁটাচলায় ধীরগতি। তাদের জন্য নরম বিছানা দিন এবং উঁচু জায়গায় ওঠা থেকে বিরত রাখুন (বা র‍্যাম্প দিন)।
* **দাঁত:** দাঁত পড়ে যাওয়া বা ব্যথা। নরম খাবার বা ভেজানো কিবল দিন।
* **দৃষ্টি ও শ্রবণশক্তি:** চোখে কম দেখলে বা কানে কম শুনলে তাদের চমকে দেবেন না। ধীরে কাছে যান।
* **চেকআপ:** ৬ মাস পর পর ভেটের কাছে নিয়ে কিডনি, লিভার ও হার্ট চেক করান।
* **খাবার:** সিনিয়র ডায়েট বা কম ক্যালোরি কিন্তু হাই প্রোটিন খাবার দিন যাতে ওজন ঠিক থাকে।`,
    imageUrl: '',
    author: 'ডাঃ কবির হোসেন',
    date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 50,
    title: 'বাংলাদেশে প্রাণী কল্যাণ আইন ২০১৯: আপনি কি জানেন?',
    content: `অনেকেই জানেন না যে বাংলাদেশে প্রাণীদের সুরক্ষার জন্য একটি শক্তিশালী আইন রয়েছে। 'প্রাণী কল্যাণ আইন ২০১৯' অনুযায়ী কোনো প্রাণীকে অকারণে কষ্ট দেওয়া, হত্যা করা বা অবহেলা করা দণ্ডনীয় অপরাধ।

**আইনের কিছু গুরুত্বপূর্ণ দিক:**
* **মালিকের দায়িত্ব:** মালিককে তার পোষা প্রাণীর জন্য উপযুক্ত খাবার, বাসস্থান ও চিকিৎসা নিশ্চিত করতে হবে।
* **নিষ্ঠুরতা:** অকারণে প্রহার, বিষ প্রয়োগ বা আটকে রাখা অপরাধ।
* **দণ্ড:** এই আইন লঙ্ঘনে ৬ মাসের জেল বা জরিমানা বা উভয় দণ্ড হতে পারে।
* **রাস্তার প্রাণী:** রাস্তার কুকুর বা বিড়ালকে হত্যা বা অপসারণ করা সম্পূর্ণ বেআইনি (যদি না জলাতঙ্ক বা মারাত্মক রোগ থাকে এবং তা ভেটের দ্বারা নিশ্চিত হয়)।

একজন সচেতন নাগরিক হিসেবে আমাদের এই আইন সম্পর্কে জানা এবং অন্যকে জানানো উচিত।`,
    imageUrl: '',
    author: 'অ্যাডভোকেট রিয়াজ উদ্দিন',
    date: new Date(Date.now() - 31 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 51,
    title: 'শীতকালে বিড়ালের বিশেষ যত্ন (Winter Care for Cats)',
    content: `শীতকাল বিড়ালদের জন্য বেশ আরামদায়ক মনে হলেও অতিরিক্ত শীতে তারা অসুস্থ হতে পারে।

**কিভাবে যত্ন নেবেন?**
* **উষ্ণ বিছানা:** বিড়াল উষ্ণ জায়গা পছন্দ করে। তাদের জন্য কম্বল বা গরম কাপড়ের বিছানা দিন। রোদে বসার ব্যবস্থা করুন।
* **সোয়েটার:** যদি বিড়াল সহ্য করে, তবে হালকা সোয়েটার পরাতে পারেন (তবে বেশিক্ষণ নয়)। স্ফিনিক্স বা লোমবিহীন বিড়ালের জন্য এটি আবশ্যিক।
* **খাবার ও জল:** শীতে জল কম খাওয়ার প্রবণতা থাকে, তাই হালকা গরম জল বা ওয়েট ফুড দিন। খাবারে প্রোটিন বাড়িয়ে দিন।
* **আর্থ্রাইটিস:** বয়স্ক বিড়ালদের শীতে ব্যথার সমস্যা বাড়ে। তাদের বিছানা নিচু জায়গায় রাখুন।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 52,
    title: 'কুকুরের কানে ইনফেকশন: লক্ষণ ও চিকিৎসা',
    content: `কুকুরের, বিশেষ করে লম্বা কানওয়ালা কুকুরের (যেমন ককার স্প্যানিয়েল, বিগল) কানে ইনফেকশন খুব সাধারণ।

**লক্ষণ:**
* মাথা ঝাকানো বা কান চুলকানো।
* কান থেকে কটু গন্ধ বের হওয়া।
* কানের ভেতর লাল হয়ে যাওয়া বা কালো ময়লা জমা।
* কান স্পর্শ করলে ব্যথা পাওয়া বা আর্তনাদ করা।

**কারণ:**
ইস্ট, ব্যাকটেরিয়া, মাইট বা কানে জল ঢোকা।

**চিকিৎসা:**
ভেটের পরামর্শে ইয়ার ড্রপ বা ক্লিনার ব্যবহার করতে হবে। নিয়মিত কান পরিষ্কার রাখলে এবং গোসলের সময় সতর্ক থাকলে এটি প্রতিরোধ করা সম্ভব।`,
    imageUrl: '',
    author: 'ডাঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 33 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 53,
    title: 'বিড়াল কি ইঁদুর বা পোকা ধরলে ক্ষতি হবে?',
    content: `শিকারী স্বভাবের কারণে বিড়াল প্রায়ই ইঁদুর, টিকটিকি বা তেলাপোকা ধরে বা খায়। এটি কি নিরাপদ?

**ঝুঁকি:**
* **বিষক্রিয়া:** ইঁদুর বা পোকাটি যদি বিষ খেয়ে থাকে (যেমন ইঁদুর মারার বিষ), তবে তা খেয়ে বিড়ালেরও বিষক্রিয়া হতে পারে (Secondary poisoning)।
* **পরজীবী:** ইঁদুরের মাধ্যমে বিড়ালের পেটে ফিতাকৃমি (Tapeworm) বা টক্সোপ্লাজমোসিস ছড়াতে পারে।
* **জীবাণু:** সালমোনেলা বা অন্যান্য ব্যাকটেরিয়াল ইনফেকশন হতে পারে।

**করণীয়:**
বিড়ালকে নিয়মিত ডিওর্মিং করান এবং যতটা সম্ভব এই ধরনের 'শিকার' খাওয়া থেকে বিরত রাখুন।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 54,
    title: 'নতুন মা বিড়াল ও তার ছানাদের যত্ন',
    content: `আপনার বিড়াল যদি মা হয়, তবে তাকে এবং তার সন্তানদের বিরক্ত করবেন না। মা বিড়াল নিজেই ছানাদের সবকিছু সামলে নেয়।

**আপনার দায়িত্ব:**
* **নিরাপদ স্থান:** কোলাহলমুক্ত, উষ্ণ এবং অন্ধকার কোণ বেছে দিন। একটি বাক্সে নরম কাপড় দিয়ে 'নেস্টিং বক্স' বানিয়ে দিন।
* **মায়ের খাবার:** মা বিড়ালকে প্রচুর পরিমাণে পুষ্টিকর খাবার (Kitten food ভালো কারণ এতে প্রোটিন বেশি) এবং ক্যালসিয়াম দিন। সে যেন ডিহাইড্রেটেড না হয়।
* **হাত দেবেন না:** জন্মের প্রথম ১-২ সপ্তাহ ছানাদের হাত দেবেন না। এতে মা বিড়াল স্ট্রেসড হয়ে ছানাদের প্রত্যাখ্যান করতে পারে বা লুকিয়ে ফেলতে পারে।
* **চোখ ফোটা:** সাধারণত ৭-১০ দিনে ছানাদের চোখ ফোটে। জোর করে চোখ মেলানোর চেষ্টা করবেন না।`,
    imageUrl: '',
    author: 'ডঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 55,
    title: 'কুকুরের ঘেউ ঘেউ কমানোর উপায়',
    content: `কুকুর ঘেউ ঘেউ করবেই, এটি তাদের যোগাযোগের মাধ্যম। কিন্তু অতিরিক্ত ঘেউ ঘেউ বিরক্তির কারণ হতে পারে।

**কেন করে?**
একঘেয়েমি, মনোযোগ আকর্ষণ, ভয় বা সতর্কবার্তা দিতে।

**সমাধান:**
* **ব্যায়াম:** ক্লান্ত কুকুর শান্ত কুকুর। তাকে পর্যাপ্ত হাঁটার ও খেলার সুযোগ দিন।
* **মনোযোগ দেবেন না:** মনোযোগ আকর্ষণের জন্য ডাকলে উপেক্ষা করুন। শান্ত হলে আদর দিন।
* **'Quiet' কমান্ড:** তাকে 'Quiet' বা 'চুপ' কমান্ড শেখান। সে চুপ করলে ট্রিট দিন।
* **ট্রিগার কমান:** বাইরের মানুষ দেখে ডাকলে জানলার পর্দা টেনে দিন।`,
    imageUrl: '',
    author: 'মো: জামাল (ডগ ট্রেইনার)',
    date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 56,
    title: 'বিড়ালের নখ কাটার সঠিক নিয়ম',
    content: `ঘরের আসবাবপত্র বাঁচাতে এবং আঁচড় থেকে রক্ষা পেতে বিড়ালের নখ কাটা জরুরি।

**কিভাবে কাটবেন?**
* **সামগ্রী:** মানুষের নেইল কাটার নয়, বিড়ালের জন্য বিশেষ নেইল ক্লিপার বা কাঁচি ব্যবহার করুন।
* **পদ্ধতি:** বিড়ালকে শান্ত অবস্থায় কোলে নিন। থাবার মাঝখানে হালকা চাপ দিলে নখ বেরিয়ে আসবে।
* **সতর্কতা:** নখের গোড়ায় গোলাপি অংশ (The Quick) থাকে, যেখানে রক্তনালী থাকে। *কখনোই* এই অংশ কাটবেন না। কুইকের একটু ওপর থেকে শুধুমাত্র সাদা/স্বচ্ছ অংশটুকু কাটুন।
* **রক্তপাত:** ভুল করে কেটে গেলে রক্ত বন্ধ করতে কর্নফ্লাওয়ার বা স্টাইপটিক পাউডার লাগান।

ভয় পেলে জোর করবেন না, দিনে এক-দুটি নখ কাটুন।`,
    imageUrl: '',
    author: 'আয়েশা রহমান',
    date: new Date(Date.now() - 37 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 57,
    title: 'অ্যাডপশন গাইড: বাংলাদেশে কোথা থেকে পোষ্য দত্তক নেবেন?',
    content: `একটি প্রাণী কিনে না এনে দত্তক নেওয়া মহৎ কাজ। বাংলাদেশে এখন অনেক সংস্থা এবং ফেসবুক গ্রুপ আছে যারা অ্যাডপশনে সাহায্য করে।

**কোথায় পাবেন?**
* **ফেসবুক গ্রুপ:** 'Dog Lovers of Bangladesh', 'Cat Society of Bangladesh' ইত্যাদি গ্রুপে প্রায়ই রেসকিউ করা বা ফোস্টার করা প্রাণীর দত্তক বিজ্ঞপ্তি দেওয়া হয়।
* **সংস্থা:** Obhoyaronno, PAW Foundation, Care for Paws ইত্যাদি সংস্থা মাঝেমধ্যে অ্যাডপশন ড্রাইভ দেয়।

**শর্তাবলী:**
দত্তক দেওয়ার আগে তারা সাধারণত নিশ্চিত করে আপনি প্রাণীটির দায়িত্ব নিতে পারবেন কিনা (আর্থিক ও পরিবেশগত)। অনেক সময় তারা আপনার বাসা ভিজিট করতে পারেন। এটি প্রাণীর মঙ্গলের জন্যই করা হয়।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 58,
    title: 'বিড়াল কেন হাঁটু বা পেটে \'ময়দা মাখায়\' (Kneading)?',
    content: `বিড়ালদের সামনের দু'পা দিয়ে নরম জায়গায় চাপ দেওয়ার এই আচরণকে 'বিস্কুট বানানো' বা 'Kneading' বলা হয়।

**এর মানে কি?**
* **শৈশবের স্মৃতি:** ছোটবেলায় মা বিড়ালের দুধ খাওয়ার সময় তারা পেটে চাপ দেয় যাতে দুধ বের হয়। বড় হওয়ার পরও সুখকর মুহূর্তের স্মৃতি হিসেবে এই অভ্যাস থেকে যায়।
* **ভালোবাসা:** তারা যখন আপনার কোলে এই কাজ করে, তখন তারা বোঝায় তারা আপনাকে ভালোবাসে এবং আপনার কাছে নিরাপদ বোধ করছে।
* **এলাকা চিহ্নিত করা:** তাদের থাবায় ঘ্রাণ গ্রন্থি থাকে, যা দিয়ে তারা নিজের এলাকা মার্ক করে।

এটি একটি অত্যন্ত পজিটিভ আচরণ।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 39 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 59,
    title: 'কেন কুকুর ঘাস খায়?',
    content: `মাংসাশী প্রাণী হয়েও কুকুর কেন ঘাস খায়, তা নিয়ে অনেক ধোঁয়াশা আছে।

**সম্ভাব্য কারণ:**
* **পেটের সমস্যা:** অনেকে মনে করেন পেটে গ্যাস বা অস্বস্তি হলে বমি করার জন্য কুকুর ঘাস খায়। ঘাস তাদের পেটে সুড়সুড়ি দেয়।
* **পুষ্টির অভাব:** ফাইবার বা নির্দিষ্ট ভিটামিনের অভাবে তারা ঘাস খেতে পারে।
* **স্বাদ বা একঘেয়েমি:** অনেক সময় শুধু স্বাদের জন্য বা খেলার ছলে তারা কচি ঘাস চিবোয়।

যদি ঘাস খাওয়ার পর নিয়মিত বমি করে বা অসুস্থ দেখায়, তবে ভেটের পরামর্শ নিন। রাস্তার পাশের ঘাসে বিষাক্ত স্প্রে বা কৃমির ডিম থাকতে পারে, তাই সাবধান।`,
    imageUrl: '',
    author: 'ডঃ কবির হোসেন',
    date: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 60,
    title: 'বাংলাদেশে পারসিয়ান বিড়ালের যত্ন ও রক্ষণাবেক্ষণ',
    content: `বাংলাদেশে পারসিয়ান বিড়াল খুব জনপ্রিয় কিন্তু তাদের বিশেষ যত্ন প্রয়োজন। আমাদের গরম ও ধুলোবালি তাদের জন্য কষ্টকর।

**বিশেষ যত্ন:**
* **গ্রুমিং:** তাদের লম্বা লোম রোজ ব্রাশ না করলে জট পেকে যায় (Matting)। জট পাকলে চামড়ায় ইনফেকশন হয়।
* **তাপমাত্রা:** তারা গরম সহ্য করতে পারে না। গরমকালে এসি বা ফ্যানের নিচে রাখুন। লোম ছোট করে দিতে পারেন (Lion Cut)।
* **চোখ ও নাক:** তাদের চ্যাপ্টা মুখের কারণে শ্বাসকষ্ট ও চোখের সমস্যা হয়। রোজ মুখ ও চোখ পরিষ্কার করতে হয়।
* **লিটার:** তাদের লোমে লিটার আটকে যায়, তাই ভালো মানের ক্লাম্পিং লিটার ব্যবহার করুন এবং নিয়মিত লোম ট্রিম করুন।`,
    imageUrl: '',
    author: 'শেফালি বেগম',
    date: new Date(Date.now() - 41 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 61,
    title: 'পটি ট্রেনিং (Potty Training): কুকুরছানার প্রথম শিক্ষা',
    content: `একটি নতুন কুকুরছানাকে ঘরে আনার পর সবচেয়ে বড় চ্যালেঞ্জ হলো পটি ট্রেনিং।

**টিপস:**
* **রুটিন:** খাওয়ার পর, খেলার পর এবং ঘুম থেকে ওঠার পর—এই তিন সময় তাকে নির্দিষ্ট জায়গায় নিয়ে যান।
* **নির্দিষ্ট জায়গা:** সবসময় একই জায়গায় পটি করান। সেখানে তার আগের গন্ধ থাকলে সে বুঝবে ওটাই তার টয়লেট।
* **প্রশংসা:** সঠিক জায়গায় পটি করলে সাথে সাথে প্রশংসা করুন বা ট্রিট দিন।
* **দুর্ঘটনা:** ভুল জায়গায় করলে বকা দেবেন না বা মারবেন না। চুপচাপ পরিষ্কার করে ফেলুন এবং গন্ধ দূর করতে এনজাইমেটিক ক্লিনার ব্যবহার করুন।`,
    imageUrl: '',
    author: 'মো: জামাল (ডগ ট্রেইনার)',
    date: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 62,
    title: 'কালো বিড়াল নিয়ে কুসংস্কার বনাম বাস্তবতা',
    content: `আমাদের সমাজে কালো বিড়াল নিয়ে অনেক ভুল ধারণা বা কুসংস্কার আছে। বলা হয় কালো বিড়াল অশুভ বা রাস্তা পার হলে বিপদ হয়।

**বাস্তবতা:**
এগুলোর কোনো বৈজ্ঞানিক ভিত্তি নেই। কালো বিড়াল অন্য যেকোনো রঙের বিড়ালের মতোই স্নেহপরায়ণ ও সুন্দর। বরং কালো রঙের কারণে অ্যাডপশন সেন্টারে তাদের কেউ নিতে চায় না।

**মজার তথ্য:**
কিছু সংস্কৃতিতে (যেমন জাপান ও ইংল্যান্ডে) কালো বিড়ালকে সৌভাগ্যের প্রতীক মনে করা হয়! কুসংস্কারে কান না দিয়ে একটি কালো বিড়াল দত্তক নিয়ে দেখুন, আপনার জীবন ভালোবাসায় ভরে যাবে।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 43 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 63,
    title: 'মাইক্রোচিপিং: আপনার পোষ্যের ডিজিটাল পরিচয়',
    content: `পোষা প্রাণী হারিয়ে যাওয়া খুব কষ্টের। কলার বা নেমপ্লেট খুলে পড়ে যেতে পারে, কিন্তু মাইক্রোচিপ সারা জীবনের সুরক্ষা।

**কিভাবে কাজ করে?**
চাল এর দানার মতো ছোট একটি চিপ ইনজেকশনের মাধ্যমে প্রাণীর ঘাড়ের চামড়ার নিচে ঢুকিয়ে দেওয়া হয়। এতে একটি ইউনিক আইডি নম্বর থাকে।

**বাংলাদেশে সুবিধা:**
এখনো খুব বেশি ভেট ক্লিনিকে স্ক্যানার নেই, তবে ধীরে ধীরে এটি জনপ্রিয় হচ্ছে। বিদেশে নিয়ে যেতে হলে (Pet Export) মাইক্রোচিপিং বাধ্যতামূলক।`,
    imageUrl: '',
    author: 'ডাঃ তামান্না ইসলাম',
    date: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 64,
    title: 'বিড়াল কি শুধু মাছ খায়? সুষম খাবারের গুরুত্ব',
    content: `বাঙালি মানেই মাছে-ভাতে, আর বিড়াল মাছ খাবে এটাই স্বাভাবিক। কিন্তু শুধু মাছ বিড়ালের জন্য ক্ষতিকর হতে পারে।

**সমস্যা:**
* **ভিটামিন ই অভাব:** অতিরিক্ত কাঁচা বা রান্না মাছ খাওয়ালে ভিটামিন ই-এর অভাব দেখা দেয়, যা 'ইয়েলো ফ্যাট ডিজিজ' (Yellow Fat Disease) তৈরি করে।
* **হাড়:** মাছের কাঁটা গলায় বা অন্ত্রে আটকে যেতে পারে।
* **থিয়ামিন ধ্বংস:** কিছু কাঁচা মাছে এমন এনজাইম থাকে যা ভিটামিন বি১ (থিয়ামিন) নষ্ট করে, যা স্নায়ুতন্ত্রের জন্য জরুরি।

মাছ মাঝে মাঝে দেওয়া ভালো, তবে এটিই একমাত্র খাবার হওয়া উচিত নয়।`,
    imageUrl: '',
    author: 'ডাঃ কবির হোসেন',
    date: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
  },
  {
    id: 65,
    title: 'বিড়ালের জন্য বিষাক্ত গাছপালা',
    content: `শখ করে ঘরে গাছ লাগিয়েছেন? খেয়াল রাখুন তা আপনার বিড়ালের জন্য বিষ কিনা। কিছু সাধারণ ইনডোর প্ল্যান্ট বিড়ালের জন্য মৃত্যুদূত হতে পারে।

**বিষাক্ত গাছ:**
* **লিলি (Lilies):** সমস্ত প্রকার লিলি বিড়ালের কিডনি ফেইলিওর করতে পারে। সামান্য পরাগরেণুও মারাত্মক।
* **অ্যালোভেরা:** পাতা খেলে বমি ও ডায়রিয়া হয়।
* **মানিপ্ল্যান্ট (Pothos):** মুখ ও গলায় জ্বালাপোড়া করে।
* **স্নেক প্ল্যান্ট:** বমি ও বমিভাব তৈরি করে।

গাছ কেনার আগে ইন্টারনেটে চেক করে নিন তা 'Pet Friendly' কিনা। স্পাইডার প্ল্যান্ট বা ফান জাতীয় গাছ নিরাপদ।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 66,
    title: 'রেবিজ বা জলাতঙ্ক: সচেতনতাই একমাত্র প্রতিরোধ',
    content: `জলাতঙ্ক একটি ১০০% মারণঘাতী রোগ। লক্ষণ দেখা দিলে মৃত্যু নিশ্চিত। কিন্তু টিকার মাধ্যমে এটি ১০০% প্রতিরোধযোগ্য।

**কিভাবে ছড়ায়?**
আক্রান্ত কুকুর, বিড়াল, শিয়াল বা বাদুড়ের কামড় বা আঁচড়ের মাধ্যমে লালা থেকে ছড়ায়।

**কামড়ালে করণীয়:**
* **ধোয়া:** ক্ষতস্থান সাথে সাথে ক্ষারযুক্ত সাবান (যেমন কাপড় কাচা সাবান) ও প্রচুর জল দিয়ে অন্তত ১৫ মিনিট ধরে ধুতে হবে। এটি ভাইরাসের কার্যকারিতা অনেক কমিয়ে দেয়।
* **টিকা:** যত দ্রুত সম্ভব ডাক্তারের পরামর্শে অ্যান্টি-রেবিজ ভ্যাকসিন নিতে হবে। পোষা প্রাণী কামড়ালেও ঝুঁকি নেবেন না যদি তার টিকার ইতিহাস নিশ্চিত না থাকে।`,
    imageUrl: '',
    author: 'ডাঃ ফাতিমা আহমেদ',
    date: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
    readTime: 5,
  },
  {
    id: 67,
    title: 'কুকুরকে লিফটে বা সিঁড়িতে ওঠানো-নামানো',
    content: `অ্যাপার্টমেন্টে কুকুর পালার ক্ষেত্রে লিফট বা সিঁড়ি ব্যবহার করতে হয়।

**টিপস:**
* **হিপ ডিসপ্লাসিয়া:** বড় জাতের কুকুর বা কুকুরছানাদের অতিরিক্ত সিঁড়ি ভাঙানো উচিত নয়, এতে হিপ জয়েন্টে সমস্যা হতে পারে।
* **লিফট:** লিফটে অন্য মানুষ থাকলে কুকুরকে ছোট করে ধরে কোণায় দাঁড়ান বা অনুমতি নিন। কুকুর যেন কারো গায়ের ওপর না পড়ে সেদিকে খেয়াল রাখুন।
* **ভয়:** প্রথম প্রথম লিফটে উঠতে ভয় পেতে পারে। ট্রিট দিয়ে উৎসাহ দিন।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 68,
    title: 'বিড়ালের একনে বা ব্রন (Feline Acne)',
    content: `বিড়ালেরও থুতনিতে ব্রন হয়! থুতনির নিচে কালো কালো গুড়ি বা লাল ফোলা দেখা গেলে বুঝবেন এটি একনে।

**কারণ:**
প্লাস্টিকের বাটি ব্যবহার করা এর প্রধান কারণ। প্লাস্টিকের বাটিতে ব্যাকটেরিয়া জমে থাকে যা ব্রন তৈরি করে।

**প্রতিকার:**
* প্লাস্টিকের বাটি বদলে স্টেইনলেস স্টিল বা সিরামিকের বাটি ব্যবহার করুন।
* খাওয়ার পর থুতনি পরিষ্কার করে দিন।
* ভেটের পরামর্শে অ্যান্টিসেপটিক দিয়ে পরিষ্কার করুন।`,
    imageUrl: '',
    author: 'ডাঃ নাজিয়া ইসলাম',
    date: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 69,
    title: 'পেট ইনস্যুরেন্স: বাংলাদেশে কি সম্ভব?',
    content: `বিদেশে পোষা প্রাণীর বিমা বা ইনস্যুরেন্স খুব সাধারণ, যা চিকিৎসার খরচ বহন করে। বাংলাদেশে এখনো এটি প্রচলিত নয়।

**ভবিষ্যৎ:**
কিছু কিছু বেসরকারি প্রতিষ্ঠান ও স্টার্টআপ এখন এটি নিয়ে কাজ করছে। বর্তমানে সেভিংস বা ইমার্জেন্সি ফান্ড তৈরি রাখাই বুদ্ধিমানের কাজ। পোষ্যের চিকিৎসার জন্য আলাদা একটি ফান্ড বা মাটির ব্যাংক রাখুন।`,
    imageUrl: '',
    author: 'অর্থনীতিবিদ ড. রফিক',
    date: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
  },
  {
    id: 70,
    title: 'কুকুর বা বিড়ালের নাম রাখার আইডিয়া',
    content: `নতুন অতিথির নাম কি হবে?

**জনপ্রিয় নাম:**
* **কুকুর:** টমি, টাইগার, রকি, লালু, ভুলু, ম্যাক্স, বেলা।
* **বিড়াল:** মিনি, পুষি, মিউ, সিম্বা, লুনা, ওরিও, বাঘা।

নাম ছোট ও স্পষ্ট হলে তাদের ডাকতে ও শেখাতে সুবিধা হয়।`,
    imageUrl: '',
    author: 'পেটভাই টিম',
    date: new Date(Date.now() - 51 * 60 * 60 * 1000).toISOString(),
    readTime: 2,
  },
];

export const MOCK_ANIMALS: Animal[] = [
  {
    id: 1,
    name: 'Mittens',
    species: 'Cat',
    breed: 'Persian',
    age: '2 years',
    location: 'Dhaka',
    imageUrl: 'https://placehold.co/600x400?text=Persian+Cat+Mittens',
    status: 'available',
    description:
      'A lovely fluffy Persian cat looking for a forever home. Very friendly and great with kids.',
    sex: 'Female',
    color: 'White',
    vaccinated: true,
    spayedNeutered: true,
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'Rocky',
    species: 'Dog',
    breed: 'German Shepherd',
    age: '5 months',
    location: 'Chittagong',
    imageUrl: 'https://placehold.co/600x400?text=German+Shepherd+Rocky',
    status: 'available',
    description: 'Energetic and playful German Shepherd puppy. Needs a loving family with space.',
    sex: 'Male',
    color: 'Black & Tan',
    vaccinated: true,
    spayedNeutered: false,
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Rahim Ahmed',
    email: 'rahim@example.com',
    role: 'customer',
    orders: MOCK_ORDERS,
    defaultShippingAddress: {
      fullName: 'Rahim Ahmed',
      address: 'House 12, Road 5, Dhanmondi',
      city: 'Dhaka',
      phone: '01711223344',
    },
  },
  {
    id: 'user_2',
    name: 'Admin User',
    email: 'admin@petbhai.com',
    role: 'admin',
    orders: [],
  },
];
