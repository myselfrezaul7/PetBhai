

import type { User, Post, Vet, Product, Order, Comment, Brand, Review, Article, VetReview, Groomer, Trainer, PetSitter, Animal } from './types';

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
            { ...MOCK_PRODUCTS[0], quantity: 1 },
            { ...MOCK_PRODUCTS[4], quantity: 1 }
        ]
    },
    {
        orderId: 'PB-1679886400',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        total: 1500,
        items: [
            { ...MOCK_PRODUCTS[2], quantity: 1 },
        ]
    }
];

export const MOCK_USERS: User[] = [
    { id: 1, name: "Aisha Rahman", email: "aisha@example.com", password: "password123", profilePictureUrl: "https://picsum.photos/seed/aisha/200", wishlist: [2, 4], orderHistory: MOCK_ORDERS, favorites: [1, 3], isPlusMember: true },
    { id: 2, name: "Jamal Khan", email: "jamal@example.com", password: "password123", profilePictureUrl: "https://picsum.photos/seed/jamal/200", wishlist: [], orderHistory: [], favorites: [], isPlusMember: false },
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
        id: 10,
        title: "Canine Parvovirus: A Deadly Threat to Dogs in Bangladesh",
        content: "Canine Parvovirus (CPV) is a severe, highly contagious viral illness that primarily affects unvaccinated dogs and puppies. As a veterinarian in Bangladesh, I see its devastating effects firsthand. Key symptoms include severe vomiting, bloody diarrhea, lethargy, and loss of appetite. Transmission occurs through direct contact with an infected dog or contaminated feces, environments, or even on people's hands and clothing. **Immediate veterinary intervention is critical for survival.** This article breaks down the signs to watch for, the science behind the virus, and underscores the single most effective prevention method: timely and complete vaccination. Protecting your puppy starts with understanding this deadly threat.",
        imageUrl: "https://picsum.photos/seed/blog-parvo-prevention/600/400",
        author: "Dr. Fatima Ahmed",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    },
    {
        id: 9,
        title: "Potty Training Your Puppy or Kitten: A Step-by-Step Guide",
        content: "Bringing a new puppy or kitten home is a joyous occasion, but successful potty training is key to a harmonious household. This guide, based on proven veterinary behavioral principles, will walk you through the essential steps. We'll cover establishing a consistent routine, recognizing your pet's 'I have to go' signals, the power of positive reinforcement with treats and praise, and common mistakes to avoid. Whether you're crate training a puppy or litter box training a kitten, these fundamental, humane techniques will set you and your new companion up for success.",
        imageUrl: "https://picsum.photos/seed/blog-potty-guide/600/400",
        author: "Dr. Nazia Islam",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 4,
        title: "A Guide to Cat Care in Bangladesh: Health, Diet, and Happiness",
        content: "Owning a cat in Bangladesh comes with its unique set of joys and challenges. This guide provides essential tips for local cat owners.\n\n**Diet:** Given the hot and humid climate, ensure your cat has constant access to fresh, clean water. Opt for high-quality wet food to supplement their hydration. Look for foods rich in taurine, an essential amino acid for feline health. Avoid feeding them cooked bones, onions, or chocolate, which are toxic.\n\n**Health:** Regular vet check-ups are crucial. Common issues in our region include fleas, ticks, and heatstroke. Keep your cat indoors during the hottest parts of the day. A clean litter box is non-negotiable for preventing urinary tract issues.",
        imageUrl: "https://picsum.photos/seed/blog4/600/400",
        author: "Dr. Nazia Islam",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
    },
    {
        id: 5,
        title: "Essential Vaccination Schedule for Dogs in Bangladesh",
        content: "Vaccinations are the most effective way to protect your dog from life-threatening diseases prevalent in Bangladesh. Here is a general timeline, but always consult your vet for a personalized schedule.\n\n**Core Vaccines:**\n- **6-8 weeks:** Distemper, Parvovirus (DHLPPi).\n- **10-12 weeks:** Second DHLPPi booster.\n- **14-16 weeks:** Third DHLPPi booster and first Rabies vaccine.\n\n**Annual Boosters:** All core vaccines, including Rabies, require annual boosters to maintain immunity. Protecting your dog is a lifelong commitment.",
        imageUrl: "https://picsum.photos/seed/blog5/600/400",
        author: "Dr. Kabir Hossain",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    },
    {
        id: 6,
        title: "What is FIP? A Guide for Cat Owners in Bangladesh",
        content: "Feline Infectious Peritonitis (FIP) is a viral disease caused by a feline coronavirus. While most strains of feline coronavirus are harmless, in some cats, the virus can mutate and cause FIP, which is progressive and often fatal.\n\n**Symptoms:** Symptoms can be vague and include lethargy, weight loss, and fever. The 'wet' form is characterized by fluid accumulation in the abdomen or chest, while the 'dry' form involves inflammatory lesions in organs. Diagnosis is complex and often requires a combination of tests. While historically considered a death sentence, new antiviral treatments are showing promise, but they can be expensive and hard to access in Bangladesh. Prevention through good hygiene and reducing stress in multi-cat households is key.",
        imageUrl: "https://picsum.photos/seed/blog6/600/400",
        author: "PetBhai Team",
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 7,
        title: "Rabies Prevention: Protecting Your Pet and Your Family",
        content: "Rabies is a deadly viral disease that is 100% preventable through vaccination. In Bangladesh, where stray dogs are common, it is a significant public health concern. The virus is transmitted through the saliva of infected animals, usually via a bite.\n\n**For Your Pet:** The rabies vaccine is a legal and ethical requirement for all dog and cat owners. It protects not only your pet but also creates a barrier to prevent the disease from spreading to humans.\n\n**For Your Family:** Never approach an unknown or wild animal. Teach children to do the same. If bitten, immediately wash the wound with soap and water for 15 minutes and seek medical attention from a doctor right away to receive post-exposure prophylaxis (PEP).",
        imageUrl: "https://picsum.photos/seed/blog7/600/400",
        author: "Dr. Fatima Ahmed",
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 5
    },
    {
        id: 8,
        title: "The Importance of Spaying and Neutering Your Pet",
        content: "Spaying (for females) and neutering (for males) are surgical procedures that prevent pets from reproducing. This single decision has numerous benefits for your pet and the community.\n\n**Health Benefits:** It significantly reduces the risk of certain cancers, like mammary and testicular cancer. It also eliminates the risk of uterine infections (pyometra) in females.\n\n**Behavioral Benefits:** Neutered males are less likely to roam, mark territory, or display aggression. Spayed females won't go into heat, avoiding yowling and messy cycles.\n\n**Community Impact:** Most importantly, it helps control the overpopulation of stray animals, reducing the number of homeless pets suffering on the streets. It is the most responsible choice a pet owner can make.",
        imageUrl: "https://picsum.photos/seed/blog8/600/400",
        author: "PetBhai Team",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 6
    },
    {
        id: 1,
        title: "The Ultimate Guide to Choosing the Right Food for Your Pet",
        content: "Nutrition is the foundation of your pet's health. With so many options available, choosing the right food can feel overwhelming. Here's what to look for.\n\n**Read the Label:** The first ingredient should always be a named meat source (e.g., 'Chicken', not 'Meat By-product'). Avoid foods with artificial colors, flavors, and preservatives. \n\n**Age-Specific Formulas:** Puppies and kittens have different nutritional needs than adult or senior pets. Always choose a food that is appropriate for your pet's life stage. \n\n**Breed & Size:** Large breed dogs have different requirements than small breeds to support their joint health. Some brands offer breed-specific formulas tailored to their unique needs. When in doubt, always consult your veterinarian.",
        imageUrl: "https://picsum.photos/seed/blog1/600/400",
        author: "Dr. Nazia Islam",
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 2,
        title: "5 Essential Grooming Tips for a Healthy Coat",
        content: "Grooming is about more than just good looks; it's vital for your pet's health.\n\n1. **Brush Regularly:** Brushing removes loose fur, prevents matting, and distributes natural oils, keeping the coat shiny. The type of brush depends on your pet's coat length.\n2. **Nail Trims:** Overlong nails are uncomfortable and can cause joint problems. Trim them every 3-4 weeks.\n3. **Ear Cleaning:** Check ears weekly for wax buildup or odor, which can signal infection. Clean with a vet-approved solution.\n4. **Bathing:** Bathe your pet only when necessary, using a pet-specific shampoo to avoid drying out their skin.\n5. **Dental Care:** Brush your pet's teeth daily to prevent plaque and dental disease.",
        imageUrl: "https://picsum.photos/seed/blog2/600/400",
        author: "Aisha Rahman",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 5
    },
    {
        id: 3,
        title: "Interactive Toys: Keeping Your Pet Mentally Stimulated",
        content: "A bored pet is often a destructive pet. Mental stimulation is just as important as physical exercise. Interactive toys are a fantastic way to engage your pet's brain.\n\n**Food Puzzles:** These toys require your pet to solve a problem to get a treat. They slow down eating and provide a mental workout.\n\n**LickiMats:** Spreading a pet-safe treat on a LickiMat can be a calming activity for anxious pets.\n\n**Feather Wands & Laser Pointers (for cats):** These toys mimic prey and engage a cat's natural hunting instincts. Always end a laser pointer session with a physical treat to avoid frustration.",
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

export const MOCK_GROOMERS: Groomer[] = [
    { id: 101, category: 'Groomer', name: 'Posh Paws Grooming', imageUrl: 'https://picsum.photos/seed/groomer1/200/200', bio: 'Certified Master Groomer with a gentle touch. We offer a calm, cage-free environment to make your pet\'s spa day a treat.', location: 'Gulshan', rating: 4.9, specialties: ['Long-haired Breeds', 'Creative Grooming', 'Cat Grooming'], services: [{ name: 'Full Groom', price: 2500, description: 'Bath, haircut, nail trim, ear cleaning.' }, { name: 'Bath & Brush', price: 1500, description: 'For in-between grooming sessions.' }] },
    { id: 102, category: 'Groomer', name: 'The Dapper Dog', imageUrl: 'https://picsum.photos/seed/groomer2/200/200', bio: 'Specializing in all dog breeds, from Chihuahuas to Great Danes. We focus on a positive and stress-free experience.', location: 'Dhanmondi', rating: 4.8, specialties: ['Breed Standard Cuts', 'De-shedding Treatments'], services: [{ name: 'Puppy\'s First Groom', price: 1200, description: 'A gentle introduction to grooming.' }, { name: 'Medicated Bath', price: 1800, description: 'For skin issues and allergies.' }] },
];

export const MOCK_TRAINERS: Trainer[] = [
    { id: 201, category: 'Trainer', name: 'GoodBoy Dog Training', imageUrl: 'https://picsum.photos/seed/trainer1/200/200', bio: 'Certified professional dog trainer focused on building a strong, positive bond between you and your dog.', location: 'Banani', rating: 5.0, certifications: ['CPDT-KA'], methods: 'Positive Reinforcement', services: [{ name: 'Puppy Socialization Class', price: 5000, description: '5-week group course.' }, { name: 'Private Obedience Training', price: 2000, description: 'Per one-hour session.' }] },
    { id: 202, category: 'Trainer', name: 'Pawsitive Steps', imageUrl: 'https://picsum.photos/seed/trainer2/200/200', bio: 'Behavioral consultant specializing in leash reactivity and separation anxiety. Let\'s build your dog\'s confidence!', location: 'Uttara', rating: 4.9, certifications: ['KPA-CTP'], methods: 'Clicker Training, Positive Reinforcement', services: [{ name: 'Behavioral Consultation', price: 2500, description: 'Initial 90-minute assessment.' }, { name: 'Leash Manners Workshop', price: 'Varies', description: 'Group and private sessions available.' }] },
];

export const MOCK_PET_SITTERS: PetSitter[] = [
    { id: 301, category: 'Pet Sitter', name: 'Home Comforts Pet Sitting', imageUrl: 'https://picsum.photos/seed/sitter1/200/200', bio: 'Experienced and reliable pet sitter offering in-your-home care so your pets can stay in their familiar environment.', location: 'Mirpur', rating: 4.9, servicesOffered: ['House Sitting', 'Drop-in Visits'], petTypes: ['Dogs', 'Cats'], services: [{ name: 'Overnight House Sitting', price: 2000, description: 'Per night, includes walks and feeding.' }, { name: '30-Min Drop-in Visit', price: 500, description: 'For feeding, potty breaks, and playtime.' }] },
    { id: 302, category: 'Pet Sitter', name: 'The Pet Palace BD', imageUrl: 'https://picsum.photos/seed/sitter2/200/200', bio: 'Your pet\'s home away from home! We offer premium boarding with spacious play areas and 24/7 supervision.', location: 'Bashundhara R/A', rating: 4.8, servicesOffered: ['Boarding'], petTypes: ['Dogs', 'Cats', 'Small Animals'], services: [{ name: 'Dog Boarding (Small Breed)', price: 1000, description: 'Per night.' }, { name: 'Cat Boarding (Luxury Suite)', price: 1200, description: 'Per night.' }] },
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