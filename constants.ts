import type { User, Post, Vet, Product, Order, Comment, Brand, Review, Article, Animal, DonationTier, SuccessStory, VetReview } from './types';

export const MOCK_BRANDS: Brand[] = [
    { id: 1, name: 'Royal Canin', logoUrl: 'https://i.ibb.co/LzB7sSg/royalcanin-logo.png' },
    { id: 2, name: 'Pedigree', logoUrl: 'https://i.ibb.co/M2xN0d4/pedigree-logo.png' },
    { id: 3, name: 'Drools', logoUrl: 'https://i.ibb.co/3k5g2xH/drools-logo.png' },
    { id: 4, name: 'Me-O', logoUrl: 'https://i.ibb.co/Y0M4yC4/meo-logo.png' },
];

const MOCK_REVIEWS: Review[] = [
    { id: 1, author: "Aisha R.", rating: 5, comment: "My cat absolutely loves this. The tuna flavor is her favorite!", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, author: "Jamal K.", rating: 4, comment: "Good quality food, my cat's coat has become much shinier.", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Me-O Adult Cat Food Tuna',
    category: 'Cat Food',
    price: 1850,
    imageUrl: 'https://picsum.photos/seed/catfood1/400/300',
    description: 'A delicious and nutritious tuna-flavored dry food for adult cats of all breeds. Enriched with vitamins and minerals for a healthy life.',
    weight: '7kg',
    brandId: 4,
    rating: 4.8,
    reviews: MOCK_REVIEWS,
  },
  {
    id: 2,
    name: 'Drools Optimum Performance Puppy Food',
    category: 'Dog Food',
    price: 380,
    imageUrl: 'https://picsum.photos/seed/dogfood1/400/300',
    description: 'Specially formulated for puppies to support their growth and development with essential nutrients, prebiotics and probiotics.',
    weight: '3kg',
    brandId: 3,
    rating: 4.5,
    reviews: [ { id: 3, author: "Fahim C.", rating: 5, comment: "My puppy is growing so fast and healthy with this food.", date: new Date().toISOString() } ],
  },
  {
    id: 4,
    name: 'Pedigree Adult Dry Dog Food (Chicken & Veg)',
    category: 'Dog Food',
    price: 1500,
    imageUrl: 'https://picsum.photos/seed/dogfood2/400/300',
    description: 'A complete and balanced meal for your adult dog, packed with chicken and vegetable goodness for a healthy immune system.',
    weight: '10kg',
    brandId: 2,
    rating: 4.7,
    reviews: [],
  },
  {
    id: 6,
    name: 'Royal Canin Persian Adult Cat Food',
    category: 'Cat Food',
    price: 2200,
    imageUrl: 'https://picsum.photos/seed/catfood3/400/300',
    description: 'Tailor-made nutrition for Persian cats to maintain their long, beautiful coats and digestive health. Almond-shaped kibble for easy grasping.',
    weight: '2kg',
    brandId: 1,
    rating: 4.9,
    reviews: [ { id: 4, author: "Sadia A.", rating: 5, comment: "The only food my Persian will eat. Her coat has never looked better!", date: new Date().toISOString() } ],
  },
  {
    id: 7,
    name: 'Interactive Feather Wand for Cats',
    category: 'Cat Supplies',
    price: 450,
    imageUrl: 'https://picsum.photos/seed/cattoy1/400/300',
    description: 'Engage your cat in hours of fun with this interactive feather wand. Great for exercise and bonding.',
    weight: '50g',
    brandId: 4,
    rating: 4.4,
    reviews: [],
  },
  {
    id: 8,
    name: 'Durable Rubber Chew Bone for Dogs',
    category: 'Dog Supplies',
    price: 600,
    imageUrl: 'https://picsum.photos/seed/dogtoy1/400/300',
    description: 'A tough, durable chew toy designed to withstand even the most enthusiastic chewers. Promotes dental health.',
    weight: '200g',
    brandId: 3,
    rating: 4.6,
    reviews: [],
  },
  {
    id: 9,
    name: 'Herbal Pet Shampoo for Dogs & Cats',
    category: 'Grooming',
    price: 750,
    imageUrl: 'https://picsum.photos/seed/shampoo1/400/300',
    description: 'A gentle, all-natural herbal shampoo that cleans, soothes, and moisturizes your pet\'s skin and coat.',
    weight: '500ml',
    brandId: 2,
    rating: 4.7,
    reviews: [],
  },
   {
    id: 11,
    name: 'Heavy-Duty Nylon Dog Leash',
    category: 'Dog Supplies',
    price: 850,
    imageUrl: 'https://picsum.photos/seed/dogleash1/400/300',
    description: 'A strong and reliable 6-foot nylon leash, perfect for daily walks and training sessions.',
    weight: '150g',
    brandId: 3,
    rating: 4.9,
    reviews: [],
  },
];


const MOCK_ORDERS: Order[] = [
    {
        orderId: 'PB-1678886400',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        total: 2300,
        items: [
            { id: 1, name: 'Me-O Adult Cat Food Tuna', category: 'Cat Food', price: 1850, imageUrl: 'https://picsum.photos/seed/catfood1/400/300', description: '', weight: '7kg', brandId: 4, rating: 4.8, reviews: [], quantity: 1 },
            { id: 7, name: 'Interactive Feather Wand for Cats', category: 'Cat Supplies', price: 450, imageUrl: 'https://picsum.photos/seed/cattoy1/400/300', description: '', weight: '50g', brandId: 4, rating: 4.4, reviews: [], quantity: 1 }
        ]
    }
];

export const MOCK_USERS: User[] = [
    { id: 1, name: "Aisha Rahman", email: "aisha@example.com", password: "password123", profilePictureUrl: "https://picsum.photos/seed/aisha/200", wishlist: [2, 4], orderHistory: MOCK_ORDERS, favorites: [1, 3] },
    { id: 2, name: "Jamal Khan", email: "jamal@example.com", password: "password123", profilePictureUrl: "https://picsum.photos/seed/jamal/200", wishlist: [], orderHistory: [], favorites: [] },
];

const MOCK_COMMENTS: Comment[] = [
    { 
        id: 1, 
        author: { id: 2, name: "Jamal Khan", profilePictureUrl: "https://picsum.photos/seed/jamal/200" }, 
        text: "Great advice! I was wondering about this for my cat.",
        replies: [
            { id: 101, author: { id: 1, name: "Aisha Rahman", profilePictureUrl: "https://picsum.photos/seed/aisha/200" }, text: "Same here, thanks for sharing!" }
        ]
    }
];


export const MOCK_POSTS: Post[] = [
    {
        id: 1,
        author: { id: 1, name: "Aisha Rahman", profilePictureUrl: "https://picsum.photos/seed/aisha/200" },
        content: "Just switched my cat to Royal Canin and her coat has never been shinier! Anyone else have good experiences with this brand?",
        imageUrl: "https://picsum.photos/seed/post1/600/400",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 15,
        comments: MOCK_COMMENTS,
    },
];

const MOCK_VET_REVIEWS: VetReview[] = [
    {id: 1, author: 'Aisha R.', rating: 5, comment: 'Dr. Ahmed was so gentle with my cat and very knowledgeable. Highly recommend!', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()},
    {id: 2, author: 'Jamal K.', rating: 5, comment: 'Excellent online consultation. Dr. Islam gave me clear advice for my senior cat\'s diet.', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()},
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
        qualifications: ['DVM, Chittagong Veterinary and Animal Sciences University', 'Advanced Certification in Canine Surgery'],
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
];

export const MOCK_ARTICLES: Article[] = [
    {
        id: 4,
        title: "A Guide to Cat Care in Bangladesh: Health, Diet, and Happiness",
        excerpt: "Everything a new cat owner in Bangladesh needs to know, from choosing the right food in our climate to essential grooming and health check-ups.",
        imageUrl: "https://picsum.photos/seed/blog4/600/400",
        author: "Dr. Nazia Islam",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
    },
    {
        id: 5,
        title: "Essential Vaccination Schedule for Dogs in Bangladesh",
        excerpt: "Protect your canine companion from common diseases. Here's a complete vaccination timeline every dog owner in Bangladesh should follow.",
        imageUrl: "https://picsum.photos/seed/blog5/600/400",
        author: "Dr. Kabir Hossain",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    },
    {
        id: 6,
        title: "What is FIP? A Guide for Cat Owners in Bangladesh",
        excerpt: "Feline Infectious Peritonitis (FIP) is a serious concern. Learn about the symptoms, diagnosis, and current state of treatment to be an informed cat parent.",
        imageUrl: "https://picsum.photos/seed/blog6/600/400",
        author: "PetBhai Team",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 7,
        title: "Rabies Prevention: Protecting Your Pet and Your Family",
        excerpt: "Rabies is a critical public health issue. Understand the importance of the rabies vaccine for your pets and what to do in case of a bite.",
        imageUrl: "https://picsum.photos/seed/blog7/600/400",
        author: "Dr. Fatima Ahmed",
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 5
    },
    {
        id: 8,
        title: "The Importance of Spaying and Neutering Your Pet",
        excerpt: "Discover the health and behavioral benefits of spaying or neutering your cat or dog. It's a responsible choice for a happier, healthier pet and community.",
        imageUrl: "https://picsum.photos/seed/blog8/600/400",
        author: "PetBhai Team",
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    },
    {
        id: 1,
        title: "The Ultimate Guide to Choosing the Right Food for Your Pet",
        excerpt: "Nutrition is the cornerstone of your pet's health. Learn how to decipher labels and select the best diet for your furry friend's age, breed, and lifestyle.",
        imageUrl: "https://picsum.photos/seed/blog1/600/400",
        author: "Dr. Nazia Islam",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 2,
        title: "5 Essential Grooming Tips for a Healthy Coat",
        excerpt: "Regular grooming is more than just about looking good. Discover five simple tips to keep your pet's coat healthy, shiny, and free from mats and tangles.",
        imageUrl: "https://picsum.photos/seed/blog2/600/400",
        author: "Aisha Rahman",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 5
    },
    {
        id: 3,
        title: "Interactive Toys: Keeping Your Pet Mentally Stimulated",
        excerpt: "Boredom can lead to behavioral issues. Find out how interactive toys can provide essential mental stimulation for a happier, more well-behaved companion.",
        imageUrl: "https://picsum.photos/seed/blog3/600/400",
        author: "PetBhai Team",
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    }
];

export const MOCK_ANIMALS: Animal[] = [
    { id: 1, name: 'Milo', breed: 'Golden Retriever Mix', age: 'Young', gender: 'Male', size: 'Large', status: 'Available', description: 'Milo is a friendly and energetic boy who loves to play fetch. He gets along well with other dogs and kids.', imageUrl: 'https://picsum.photos/seed/dog1/400/300' },
    { id: 2, name: 'Luna', breed: 'Domestic Shorthair', age: 'Puppy/Kitten', gender: 'Female', size: 'Small', status: 'Available', description: 'Luna is a curious and playful kitten. She loves cuddling and chasing after her favorite toy mouse.', imageUrl: 'https://picsum.photos/seed/cat1/400/300' },
    { id: 3, name: 'Charlie', breed: 'Beagle', age: 'Adult', gender: 'Male', size: 'Medium', status: 'Pending', description: 'Charlie is a sweet and gentle soul. He enjoys long walks and snoozing on a comfy bed.', imageUrl: 'https://picsum.photos/seed/dog2/400/300' },
    { id: 4, name: 'Bella', breed: 'Siamese', age: 'Senior', gender: 'Female', size: 'Medium', status: 'Adopted', description: 'Bella is a calm and affectionate senior cat looking for a quiet home to spend her golden years.', imageUrl: 'https://picsum.photos/seed/cat2/400/300' },
];

export const MOCK_DONATION_TIERS: DonationTier[] = [
    { id: 1, amount: 500, title: 'Feed a Friend', description: 'Provides a week of nutritious food for one rescued animal.' },
    { id: 2, amount: 1500, title: 'Vaccinate & Protect', description: 'Covers the cost of essential vaccinations for a new rescue.' },
    { id: 3, amount: 3000, title: 'Shelter & Comfort', description: 'Helps us provide safe shelter and cozy bedding for an animal for a month.' },
    { id: 4, amount: 5000, title: 'Sponsor a Rescue', description: 'Covers the full initial care for a newly rescued animal, including vet checks.' },
];

export const MOCK_SUCCESS_STORIES: SuccessStory[] = [
    { id: 1, animalName: 'Buddy', adoptionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), story: 'Buddy was found scared and alone, but quickly warmed up to our volunteers. He found his forever home with the Smith family and now spends his days chasing squirrels in their backyard.', animalImageUrl: 'https://picsum.photos/seed/success1/600/400' },
    { id: 2, animalName: 'Cleo', adoptionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), story: 'Cleo, a shy senior cat, was overlooked for months. But the perfect person came along who saw her gentle spirit. Now she has a warm lap to sleep on and all the love she deserves.', animalImageUrl: 'https://picsum.photos/seed/success2/600/400' },
];

export const BANGLADESH_DISTRICTS: string[] = [
    "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura",
    "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga",
    "Cumilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni",
    "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore",
    "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj",
    "Kurigram", "Kushtia", "Lakshmirpur", "Lalmonirhat", "Madaripur", "Magura",
    "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh",
    "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona",
    "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur",
    "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur",
    "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export const BANGLADESH_DIVISIONS: string[] = [
    "Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"
];