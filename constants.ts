

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
        title: "কুকুরের পারভোভাইরাস: বাংলাদেশের কুকুরদের জন্য এক মারাত্মক হুমকি",
        content: `কুকুরের পারভোভাইরাস (CPV) একটি অত্যন্ত গুরুতর এবং সংক্রামক ভাইরাল রোগ যা মূলত টিকা না দেওয়া কুকুর এবং কুকুরছানাদের প্রভাবিত করে। বাংলাদেশের একজন পশুচিকিৎসক হিসেবে, আমি এর ভয়াবহ প্রভাব নিজের চোখে দেখেছি। এই রোগের প্রধান লক্ষণগুলির মধ্যে রয়েছে شدید বমি, রক্তযুক্ত ডায়রিয়া, অলসতা এবং ক্ষুধামন্দা।

**কিভাবে ছড়ায়?**
এই ভাইরাসটি সংক্রমিত কুকুরের সংস্পর্শে বা তার মল, দূষিত পরিবেশ, এমনকি মানুষের হাত এবং পোশাকের মাধ্যমেও ছড়াতে পারে। এর ভাইরাস পরিবেশে অনেকদিন পর্যন্ত সক্রিয় থাকতে পারে, যা একে আরও বিপজ্জনক করে তোলে।

**লক্ষণ দেখা দিলে করণীয়:**
যদি আপনার কুকুরের মধ্যে উপরের কোনো লক্ষণ দেখা যায়, তাহলে **এক মুহূর্তও দেরি না করে দ্রুত একজন অভিজ্ঞ পশুচিকিৎসকের সাথে যোগাযোগ করুন।** পারভোভাইরাসের ক্ষেত্রে সময়মতো চিকিৎসা জীবন এবং মৃত্যুর মধ্যে পার্থক্য গড়ে দিতে পারে। সঠিক সাপোর্টিভ কেয়ার, যেমন শিরায় তরল প্রদান এবং অ্যান্টিবায়োটিক সংক্রমণের বিরুদ্ধে লড়াই করতে সাহায্য করে।

**প্রতিরোধই সর্বোত্তম উপায়:**
পারভোভাইরাস প্রতিরোধের সবচেয়ে কার্যকর উপায় হলো সময়মতো এবং সম্পূর্ণ টিকাদান। আপনার কুকুরছানাকে পশুচিকিৎসকের পরামর্শ অনুযায়ী সঠিক সময়ে টিকার সম্পূর্ণ কোর্স সম্পন্ন করানো আবশ্যক। একটি টিকা আপনার পোষা প্রাণীকে এই মারাত্মক রোগ থেকে সুরক্ষিত রাখতে পারে। আপনার পোষ্যের সুরক্ষা শুরু হয় এই মারাত্মক হুমকি সম্পর্কে সঠিক জ্ঞান অর্জনের মাধ্যমে।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article10/600/400',
        author: "ডঃ ফাতিমা আহমেদ",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
    },
    {
        id: 9,
        title: "কুকুরছানা বা বিড়ালছানাকে পটি ট্রেনিং করানোর সহজ উপায়",
        content: `একটি নতুন কুকুরছানা বা বিড়ালছানা ঘরে আনা নিঃসন্দেহে আনন্দের, কিন্তু একটি শান্তিপূর্ণ সংসারের জন্য সঠিক পটি ট্রেনিং অপরিহার্য। পশুচিকিৎসকদের আচরণগত নীতির উপর ভিত্তি করে তৈরি এই নির্দেশিকা আপনাকে প্রয়োজনীয় পদক্ষেপগুলি সম্পর্কে জানাবে।

**ধাপ ১: একটি নির্দিষ্ট রুটিন তৈরি করুন:**
প্রতিদিন একই সময়ে, বিশেষ করে ঘুম থেকে ওঠার পর, খাওয়ার পর এবং খেলার পর আপনার পোষ্যকে নির্দিষ্ট স্থানে (লিটার বক্স বা বাইরে) নিয়ে যান। ধারাবাহিকতা তাদের দ্রুত শিখতে সাহায্য করে।

**ধাপ ২: সংকেত চিনতে শিখুন:**
আপনার পোষ্য যখন ঘুরতে থাকে, মেঝের গন্ধ নিতে থাকে বা অস্থির আচরণ করে, তখন বুঝতে হবে তার 'বাইরে' যাওয়ার সময় হয়েছে। এই সংকেতগুলো চিনে দ্রুত তাকে নির্দিষ্ট স্থানে নিয়ে যান।

**ধাপ ৩: ইতিবাচক মনোভাব দেখান:**
সঠিক জায়গায় মলত্যাগ করলে তাকে প্রচুর প্রশংসা করুন এবং ছোট পুরস্কার (ট্রিট) দিন। এটি তাদের ভালো আচরণ মনে রাখতে উৎসাহিত করবে। মনে রাখবেন, বকাঝকা বা শাস্তি দিলে হিতে বিপরীত হতে পারে। ধৈর্য এবং ইতিবাচক মনোভাবই সাফল্যের চাবিকাঠি।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article9/600/400',
        author: "ডঃ নাজিয়া ইসলাম",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 9
    },
    {
        id: 4,
        title: "বাংলাদেশে বিড়ালের যত্ন: স্বাস্থ্য, খাদ্য এবং 행복",
        content: `বাংলাদেশে একটি বিড়াল পোষা তার নিজস্ব আনন্দ এবং চ্যালেঞ্জ নিয়ে আসে। এখানকার মালিকদের জন্য কিছু প্রয়োজনীয় টিপস নিচে দেওয়া হলো।

**খাদ্য:** গরম এবং আর্দ্র আবহাওয়ার কারণে, আপনার বিড়ালের জন্য সর্বদা তাজা এবং পরিষ্কার জলের ব্যবস্থা রাখুন। তাদের হাইড্রেশন বাড়ানোর জন্য শুকনো খাবারের পাশাপাশি ভেজা খাবারও দিন। বিড়ালের স্বাস্থ্যের জন্য অপরিহার্য অ্যামিনো অ্যাসিড 'টরিণ' সমৃদ্ধ খাবার বেছে নিন। রান্না করা হাড়, পেঁয়াজ বা চকোলেট খাওয়ানো থেকে বিরত থাকুন, কারণ এগুলো তাদের জন্য বিষাক্ত।

**স্বাস্থ্য:** নিয়মিত পশুচিকিৎসকের কাছে চেকআপ অত্যন্ত গুরুত্বপূর্ণ। আমাদের অঞ্চলে সাধারণ সমস্যাগুলির মধ্যে রয়েছে মাছি, এঁটেল পোকা এবং হিটস্ট্রোক। দিনের সবচেয়ে গরম সময়ে আপনার বিড়ালকে ঘরের ভিতরে রাখুন। মূত্রনালীর সমস্যা প্রতিরোধের জন্য একটি পরিষ্কার লিটার বক্স অপরিহার্য।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article4/600/400',
        author: "ডঃ নাজিয়া ইসলাম",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 10
    },
    {
        id: 5,
        title: "বাংলাদেশে কুকুরের জন্য প্রয়োজনীয় টিকার সময়সূচী",
        content: `বাংলাদেশে প্রচলিত জীবনঘাতী রোগ থেকে আপনার কুকুরকে রক্ষা করার সবচেয়ে কার্যকর উপায় হলো টিকা। এখানে একটি সাধারণ সময়সূচী দেওয়া হলো, তবে ব্যক্তিগত সময়সূচীর জন্য সর্বদা আপনার পশুচিকিৎসকের সাথে পরামর্শ করুন।

**মূল টিকা:**
*   **৬-৮ সপ্তাহ:** ডিসটেম্পার, পারভোভাইরাস (DHLPPi)।
*   **১০-১২ সপ্তাহ:** দ্বিতীয় DHLPPi বুস্টার।
*   **১৪-১৬ সপ্তাহ:** তৃতীয় DHLPPi বুস্টার এবং প্রথম জলাতঙ্ক (Rabies) টিকা।

**বার্ষিক বুস্টার:** জলাতঙ্ক সহ সমস্ত মূল টিকার রোগ প্রতিরোধ ক্ষমতা বজায় রাখার জন্য বার্ষিক বুস্টার প্রয়োজন। আপনার কুকুরকে রক্ষা করা একটি আজীবনের অঙ্গীকার। সঠিক সময়ে টিকা না দিলে মারাত্মক রোগের ঝুঁকি বেড়ে যায়, তাই এই বিষয়ে অবহেলা করবেন না।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article5/600/400',
        author: "ডঃ কবির হোসেন",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
    },
    {
        id: 6,
        title: "FIP কী? বাংলাদেশের বিড়াল মালিকদের জন্য একটি নির্দেশিকা",
        content: `ফেলাইন ইনফেকশাস পেরিটোনাইটিস (FIP) হলো একটি ভাইরাল রোগ যা ফেলাইন করোনাভাইরাস দ্বারা সৃষ্ট। যদিও বেশিরভাগ ফেলাইন করোনাভাইরাস নিরীহ, কিছু বিড়ালের ক্ষেত্রে ভাইরাসটি পরিবর্তিত হয়ে FIP সৃষ্টি করতে পারে, যা সাধারণত মারাত্মক হয়।

**লক্ষণ:** এর লক্ষণগুলি অস্পষ্ট হতে পারে এবং এর মধ্যে অলসতা, ওজন হ্রাস এবং জ্বর অন্তর্ভুক্ত। 'ওয়েট' ফর্মে পেট বা বুকে তরল জমা হয়, আর 'ড্রাই' ফর্মে বিভিন্ন অঙ্গে প্রদাহ দেখা যায়। রোগ নির্ণয় বেশ জটিল এবং একাধিক পরীক্ষার প্রয়োজন হয়। যদিও ঐতিহাসিকভাবে এটিকে смертный приговор হিসেবে বিবেচনা করা হতো, নতুন অ্যান্টিভাইরাল চিকিৎসা আশা জাগাচ্ছে, তবে বাংলাদেশে এগুলি ব্যয়বহুল এবং সহজলভ্য নয়। একাধিক বিড়াল আছে এমন বাড়িতে ভালো স্বাস্থ্যবিধি এবং মানসিক চাপ কমানোই প্রতিরোধের মূল চাবিকাঠি।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article6/600/400',
        author: "পেটভাই টিম",
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 9
    },
    {
        id: 7,
        title: "জলাতঙ্ক প্রতিরোধ: আপনার পোষ্য এবং পরিবারকে সুরক্ষিত রাখুন",
        content: `জলাতঙ্ক একটি মারাত্মক ভাইরাল রোগ যা টিকার মাধ্যমে ১০০% প্রতিরোধযোগ্য। বাংলাদেশে, যেখানে পথকুকুর সাধারণ, এটি একটি বড় জনস্বাস্থ্য উদ্বেগ। ভাইরাসটি সংক্রমিত প্রাণীর লালার মাধ্যমে, সাধারণত কামড়ের মাধ্যমে ছড়ায়।

**আপনার পোষ্যের জন্য:** সমস্ত কুকুর এবং বিড়াল মালিকদের জন্য জলাতঙ্ক টিকা একটি আইনি এবং নৈতিক প্রয়োজনীয়তা। এটি কেবল আপনার পোষ্যকে রক্ষা করে না, বরং মানুষের মধ্যে রোগ ছড়ানো প্রতিরোধে একটি বাধা তৈরি করে।

**আপনার পরিবারের জন্য:** কখনও অজানা বা বন্য প্রাণীর কাছে যাবেন না। শিশুদেরও একই শিক্ষা দিন। কামড়ালে, ক্ষতস্থানটি অবিলম্বে ১৫ মিনিট ধরে সাবান ও জল দিয়ে ধুয়ে ফেলুন এবং পোস্ট-এক্সপোজার প্রোফিল্যাক্সিস (PEP) পেতে সঙ্গে সঙ্গে ডাক্তারের কাছে যান।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article7/600/400',
        author: "ডঃ ফাতিমা আহমেদ",
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 8,
        title: "আপনার পোষ্যকে স্পে বা নিউটার করার গুরুত্ব",
        content: `স্পেয়িং (স্ত্রী প্রাণীর জন্য) এবং নিউটারিং (পুরুষ প্রাণীর জন্য) হলো অস্ত্রোপচার পদ্ধতি যা পোষ্যদের প্রজনন থেকে বিরত রাখে। এই একটি সিদ্ধান্তের অনেক সুবিধা রয়েছে।

**স্বাস্থ্যগত সুবিধা:** এটি স্তন এবং অণ্ডকোষের ক্যান্সারের মতো নির্দিষ্ট ক্যান্সারের ঝুঁকি উল্লেখযোগ্যভাবে হ্রাস করে। এটি স্ত্রী প্রাণীদের জরায়ুর সংক্রমণ (পায়োমেট্রা) এর ঝুঁকিও দূর করে।

**আচরণগত সুবিধা:** নিউটার করা পুরুষরা কম ঘুরে বেড়ায়, এলাকা চিহ্নিত করে না বা আগ্রাসন দেখায় না। স্পে করা স্ত্রীরা হিটে আসে না, যা চিৎকার এবং নোংরা চক্র এড়াতে সাহায্য করে।

**সামাজিক প্রভাব:** সবচেয়ে গুরুত্বপূর্ণ হলো, এটি পথপ্রাণীর অতিরিক্ত জনসংখ্যা নিয়ন্ত্রণে সহায়তা করে, যার ফলে রাস্তায় কষ্ট পাওয়া গৃহহীন পোষ্যের সংখ্যা হ্রাস পায়। এটি একজন পোষ্য মালিকের সবচেয়ে দায়িত্বশীল পছন্দ।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article8/600/400',
        author: "পেটভাই টিম",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
    },
    {
        id: 1,
        title: "আপনার পোষ্যের জন্য সঠিক খাবার বেছে নেওয়ার চূড়ান্ত নির্দেশিকা",
        content: `পুষ্টি আপনার পোষ্যের স্বাস্থ্যের ভিত্তি। বাজারে এত বিকল্পের মধ্যে সঠিক খাবার বেছে নেওয়া কঠিন মনে হতে পারে। এখানে কিছু বিষয় লক্ষ্য রাখা প্রয়োজন।

**লেবেল পড়ুন:** প্রথম উপাদানটি সর্বদা একটি নির্দিষ্ট মাংসের উৎস হওয়া উচিত (যেমন, 'চিকেন', 'মিট বাই-প্রোডাক্ট' নয়)। কৃত্রিম রঙ, স্বাদ এবং প্রিজারভেটিভযুক্ত খাবার এড়িয়ে চলুন।

**বয়স-নির্দিষ্ট ফর্মুলা:** কুকুরছানা এবং বিড়ালছানাদের পুষ্টির চাহিদা প্রাপ্তবয়স্ক বা বয়স্ক পোষ্যদের থেকে ভিন্ন। সর্বদা আপনার পোষ্যের বয়সের জন্য উপযুক্ত খাবার বেছে নিন।

**জাত ও আকার:** বড় জাতের কুকুরের জয়েন্টের স্বাস্থ্য সহায়তার জন্য ছোট জাতের থেকে ভিন্ন প্রয়োজনীয়তা রয়েছে। কিছু ব্র্যান্ড তাদের অনন্য প্রয়োজনের জন্য জাত-নির্দিষ্ট ফর্মুলা সরবরাহ করে। সন্দেহের ক্ষেত্রে, সর্বদা আপনার পশুচিকিৎসকের সাথে পরামর্শ করুন।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article1/600/400',
        author: "ডঃ নাজিয়া ইসলাম",
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 9
    },
    {
        id: 2,
        title: "একটি স্বাস্থ্যকর কোটের জন্য ৫টি প্রয়োজনীয় গ্রুমিং টিপস",
        content: `গ্রুমিং কেবল দেখতে সুন্দর লাগার জন্য নয়; এটি আপনার পোষ্যের স্বাস্থ্যের জন্য অত্যাবশ্যক।

১. **নিয়মিত ব্রাশ করুন:** ব্রাশ করা আলগা পশম দূর করে, জট বাঁধা প্রতিরোধ করে এবং প্রাকৃতিক তেল বিতরণ করে, যা কোটকে চকচকে রাখে। ব্রাশের ধরন আপনার পোষ্যের কোটের দৈর্ঘ্যের উপর নির্ভর করে।
২. **নখ ছাঁটা:** অতিরিক্ত লম্বা নখ অস্বস্তিকর এবং জয়েন্টের সমস্যা সৃষ্টি করতে পারে। প্রতি ৩-৪ সপ্তাহে তাদের নখ ছাঁটুন।
৩. **কান পরিষ্কার করা:** কানে ময়লা জমা বা গন্ধ সংক্রমণের লক্ষণ হতে পারে। প্রতি সপ্তাহে কান পরীক্ষা করুন এবং পশুচিকিৎসক-অনুমোদিত সলিউশন দিয়ে পরিষ্কার করুন।
৪. **স্নান করানো:** আপনার পোষ্যকে শুধুমাত্র প্রয়োজনে স্নান করান, এবং ত্বক শুকিয়ে যাওয়া এড়াতে পোষ্য-নির্দিষ্ট শ্যাম্পু ব্যবহার করুন।
৫. **দাঁতের যত্ন:** প্লাক এবং দাঁতের রোগ প্রতিরোধের জন্য প্রতিদিন আপনার পোষ্যের দাঁত ব্রাশ করুন।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article2/600/400',
        author: "আয়েশা রহমান",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 7
    },
    {
        id: 3,
        title: "ইন্টারেক্টিভ খেলনা: আপনার পোষ্যকে মানসিকভাবে উদ্দীপিত রাখা",
        content: `একটি উদাস পোষ্য প্রায়শই ধ্বংসাত্মক হয়ে ওঠে। শারীরিক ব্যায়ামের মতোই মানসিক উদ্দীপনাও গুরুত্বপূর্ণ। ইন্টারেক্টিভ খেলনা আপনার পোষ্যের মস্তিষ্ককে সক্রিয় রাখার একটি চমৎকার উপায়।

**ফুড পাজল:** এই খেলনাগুলিতে আপনার পোষ্যকে একটি ট্রিট পেতে একটি সমস্যা সমাধান করতে হয়। এটি তাদের খাওয়া ধীর করে এবং মানসিক ব্যায়াম প্রদান করে।

**লিকিম্যাট:** একটি লিকিম্যাটে পোষ্য-নিরাপদ ট্রিট ছড়িয়ে দেওয়া উদ্বিগ্ন পোষ্যদের জন্য একটি শান্তিদায়ক কার্যকলাপ হতে পারে।

**ফেদার ওয়ান্ড এবং লেজার পয়েন্টার (বিড়ালের জন্য):** এই খেলনাগুলি শিকারের অনুকরণ করে এবং বিড়ালের প্রাকৃতিক শিকারের প্রবৃত্তি জাগিয়ে তোলে। হতাশা এড়াতে লেজার পয়েন্টার সেশনের শেষে সর্বদা একটি শারীরিক ট্রিট দিন।`,
        // FIX: Added missing imageUrl property
        imageUrl: 'https://picsum.photos/seed/article3/600/400',
        author: "পেটভাই টিম",
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: 8
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