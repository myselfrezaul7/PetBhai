import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

type Language = 'en' | 'bn';

type Translations = {
  [key: string]: {
    en: string;
    bn: string;
  };
};

const translations: Translations = {
  // Navigation
  nav_home: { en: 'Home', bn: 'হোম' },
  nav_shop: { en: 'Shop', bn: 'শপ' },
  nav_community: { en: 'Community', bn: 'কমিউনিটি' },
  nav_services: { en: 'Services', bn: 'সেবাসমূহ' },
  nav_ai_vet: { en: 'AI Vet', bn: 'এআই ভেট' },
  nav_blog: { en: 'Blog', bn: 'ব্লগ' },
  nav_plus: { en: 'PetBhai+', bn: 'পেটভাই+' },
  nav_login: { en: 'Login', bn: 'লগইন' },
  nav_signup: { en: 'Sign Up', bn: 'সাইন আপ' },
  nav_logout: { en: 'Logout', bn: 'লগআউট' },
  nav_profile: { en: 'My Profile', bn: 'আমার প্রোফাইল' },
  search_placeholder: {
    en: 'Search for products, vets, blogs...',
    bn: 'পণ্য, ভেট বা ব্লগ খুঁজুন...',
  },
  search_results_found: { en: 'results found.', bn: 'টি ফলাফল পাওয়া গেছে।' },
  search_no_results: { en: 'No results found for', bn: 'কোনো ফলাফল পাওয়া যায়নি' },
  search_recent: { en: 'Recent Searches', bn: 'সাম্প্রতিক সার্চ' },
  search_clear_history: { en: 'Clear History', bn: 'ইতিহাস মুছুন' },
  search_quick_links: { en: 'Quick Links', bn: 'দ্রুত লিংক' },
  search_products: { en: 'Products', bn: 'পণ্যসমূহ' },
  search_vets: { en: 'Veterinarians', bn: 'পশুচিকিৎসক' },
  search_adoption: { en: 'Adoption', bn: 'দত্তক' },
  search_blog: { en: 'Blog & Tips', bn: 'ব্লগ ও টিপস' },
  search_view_all: { en: 'View all results', bn: 'সব ফলাফল দেখুন' },
  search_clear: { en: 'Clear search', bn: 'সার্চ মুছুন' },
  search_searching: { en: 'Searching...', bn: 'সার্চ হচ্ছে...' },
  search_navigation_tip: {
    en: 'Use ↑↓ to navigate, Enter to select',
    bn: '↑↓ দিয়ে নেভিগেট করুন, Enter দিয়ে সিলেক্ট করুন',
  },
  search_in_cart: { en: 'In Cart', bn: 'কার্টে আছে' },
  search_by: { en: 'By', bn: 'লিখেছেন' },

  // Home Page
  hero_title: {
    en: 'A Loving Home For Every Animal',
    bn: 'আদরের পোষ্যের জন্য ভালোবাসা ও নিরাপদ আশ্রয়',
  },
  hero_subtitle: {
    en: 'Your trusted partner in animal welfare. Adopt, find expert services, and shop premium essentials to give them the life they deserve.',
    bn: 'আপনার পোষা প্রাণীর সব প্রয়োজনে আমরা আছি পাশে। নতুন সঙ্গী দত্তক নেওয়া, বিশেষজ্ঞের পরামর্শ, কিংবা সেরা মানের খাবার—সবই পাবেন এখানে।',
  },
  btn_adopt: { en: 'Find a Friend', bn: 'নতুন সঙ্গী খুঁজুন' },
  btn_shop: { en: 'Shop Supplies', bn: 'কেনাকাটা করুন' },
  btn_ai_vet: { en: 'Ask AI Vet', bn: 'এআই ভেট' },

  section_best_sellers: { en: 'Our Best Sellers', bn: 'সবার পছন্দের শীর্ষে' },
  section_best_sellers_sub: {
    en: 'Loved by pets and their parents.',
    bn: 'প্যারেন্টস এবং তাদের আদরের পোষ্যদের পছন্দের তালিকায় সেরা পণ্যগুলো।',
  },

  section_services_title: {
    en: 'All The Care In One Place',
    bn: 'পোষ্যের সম্পূর্ণ যত্ন এক ঠিকানায়',
  },
  section_services_desc: {
    en: 'From expert veterinarians to trusted groomers and trainers, find and book all the professional services your pet deserves.',
    bn: 'অভিজ্ঞ ভেট, গ্রুমার কিংবা ট্রেইনার—আপনার আদরের পোষ্যের যেকোনো প্রয়োজনে বিশেষজ্ঞ সেবা নিন সহজেই।',
  },
  btn_explore_services: { en: 'Explore All Services', bn: 'সকল সেবা দেখুন' },

  section_brands: { en: 'Shop by Brand', bn: 'শীর্ষস্থানীয় ব্র্যান্ডসমূহ' },

  section_new_arrivals: { en: 'New Arrivals', bn: 'নতুন কালেকশন' },
  section_new_arrivals_sub: {
    en: 'The latest and greatest products, fresh in our store.',
    bn: 'আমাদের সংগ্রহে সদ্য যোগ হওয়া এক্সক্লুসিভ সব পণ্য।',
  },
  btn_explore_shop: { en: 'Explore the Full Shop', bn: 'পুরো শপ ঘুরে দেখুন' },

  section_plus_title: { en: 'Upgrade to PetBhai+', bn: 'পেটভাই+ ক্লাবে যোগ দিন' },
  section_plus_desc: {
    en: 'Unlock exclusive benefits like free delivery, member-only discounts, and free vet consultations.',
    bn: 'ফ্রি ডেলিভারি, মেম্বার-অনলি ডিসকাউন্ট এবং ফ্রি ভেট কনসালটেশনসহ দারুণ সব সুবিধা উপভোগ করতে আজই মেম্বারশিপ নিন।',
  },
  btn_join_plus: { en: 'Learn More & Join', bn: 'সুবিধাগুলো জানুন' },

  // Blog Page
  blog_page_title: { en: 'PetBhai Blog', bn: 'পেটভাই ব্লগ' },
  blog_page_subtitle: {
    en: 'Get expert advice on pet care, nutrition, training, and new product news.',
    bn: 'বিশেষজ্ঞদের পরামর্শ, টিপস আর নতুন সব খবর জানুন—আপনার পোষ্যের সুস্থ জীবনের জন্য।',
  },
  blog_latest_post: { en: 'Latest Post', bn: 'সর্বশেষ লেখা' },
  blog_min_read: { en: 'min read', bn: 'মিনিট সময় লাগবে' },

  // Article Detail
  article_not_found: { en: 'Article not found!', bn: 'আর্টিকেলটি পাওয়া যায়নি!' },
  article_not_found_desc: {
    en: 'The article you are looking for might have been removed or the link is incorrect.',
    bn: 'আপনি যে লেখাটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা লিংকটি ভুল।',
  },
  btn_back_blog: { en: 'Back to Blog', bn: 'ব্লগ-এ ফিরে যান' },
  article_written_by: { en: 'Written by:', bn: 'লিখেছেন:' },
  recent_articles: { en: 'Recent Articles', bn: 'সাম্প্রতিক লেখা' },

  // Trust Page
  trust_title: { en: 'Your Trust, Our Priority', bn: 'আপনার বিশ্বাস, আমাদের অগ্রাধিকার' },
  trust_subtitle: {
    en: 'At PetBhai, we are committed to creating a safe, transparent, and loving community for pets and their parents. Here is how we ensure quality and safety in everything we do.',
    bn: 'পেটভাই-এ আমরা পোষা প্রাণী এবং তাদের অভিভাবকদের জন্য একটি নিরাপদ, স্বচ্ছ এবং ভালোবাসাপূর্ণ কমিউনিটি তৈরি করতে প্রতিশ্রুতিবদ্ধ। আমরা প্রতিটি পদক্ষেপে গুণমান এবং নিরাপত্তা নিশ্চিত করি।',
  },
  trust_pillar_1_title: { en: 'Vetted Products', bn: 'যাচাইকৃত পণ্য' },
  trust_pillar_1_desc: {
    en: 'Every product in our shop is hand-picked and reviewed for safety. We only partner with authentic brands and suppliers to ensure your pet gets the best nutrition and care.',
    bn: 'আমাদের শপের প্রতিটি পণ্য নিরাপত্তা এবং গুণমানের জন্য যাচাই করা হয়। আপনার পোষ্যের সেরা পুষ্টি এবং যত্ন নিশ্চিত করতে আমরা শুধুমাত্র আসল ব্র্যান্ড এবং সরবরাহকারীদের সাথে কাজ করি।',
  },
  trust_pillar_2_title: { en: 'Verified Professionals', bn: 'নিবন্ধিত বিশেষজ্ঞ' },
  trust_pillar_2_desc: {
    en: 'All vets, groomers, and trainers on our platform undergo a verification process. We check their certifications and track record to ensure your pet is in safe hands.',
    bn: 'আমাদের প্ল্যাটফর্মের সকল ভেট, গ্রুমার এবং ট্রেইনার একটি যাচাইকরণ প্রক্রিয়ার মধ্য দিয়ে যান। আপনার পোষ্য নিরাপদ হাতে আছে কিনা তা নিশ্চিত করতে আমরা তাদের সনদ এবং অভিজ্ঞতার রেকর্ড পরীক্ষা করি।',
  },
  trust_pillar_3_title: { en: 'Community Safety', bn: 'কমিউনিটি নিরাপত্তা' },
  trust_pillar_3_desc: {
    en: 'Our adoption and community forums are moderated to prevent scams and ensure animal welfare. We have a zero-tolerance policy for animal cruelty or neglect.',
    bn: 'প্রতারণা রোধ এবং প্রাণী কল্যাণ নিশ্চিত করতে আমাদের দত্তক এবং কমিউনিটি ফোরামগুলো নিয়মিত পর্যবেক্ষণ করা হয়। প্রাণীর প্রতি নিষ্ঠুরতা বা অবহেলার ক্ষেত্রে আমাদের জিরো-টলারেন্স নীতি রয়েছে।',
  },
  trust_vet_title: { en: 'How We Verify Vets', bn: 'কিভাবে আমরা ভেট যাচাই করি' },
  trust_delivery_title: { en: 'Secure Shopping & Delivery', bn: 'নিরাপদ কেনাকাটা ও ডেলিভারি' },

  // Shop Page
  shop_title: { en: 'Shop For Your Buddy', bn: 'আপনার প্রিয় বন্ধুর কেনাকাটা' },
  shop_subtitle: {
    en: 'Find everything you need to keep your pet happy and healthy, from premium food to fun toys.',
    bn: 'আপনার পোষা প্রাণীর সুস্বাস্থ্য ও আনন্দের জন্য প্রয়োজনীয় খাবার ও খেলনা—সবকিছুই পাবেন এখানে।',
  },
  shop_search_placeholder: { en: 'Search products...', bn: 'পণ্য খুঁজুন...' },
  shop_search_label: { en: 'Search products', bn: 'পণ্য খুঁজুন' },
  cat_all: { en: 'All', bn: 'সব' },
  cat_dog_food: { en: 'Dog Food', bn: 'কুকুরের খাবার' },
  cat_cat_food: { en: 'Cat Food', bn: 'বিড়ালের খাবার' },
  cat_dog_supplies: { en: 'Dog Supplies', bn: 'কুকুরের সামগ্রী' },
  cat_cat_supplies: { en: 'Cat Supplies', bn: 'বিড়ালের সামগ্রী' },
  cat_grooming: { en: 'Grooming', bn: 'গ্রুমিং' },
  filter_brand: { en: 'Brand:', bn: 'ব্র্যান্ড:' },
  filter_brand_all: { en: 'All Brands', bn: 'সব ব্র্যান্ড' },
  filter_sort: { en: 'Sort by:', bn: 'সাজান:' },
  filter_sort_default: { en: 'Default', bn: 'ডিফল্ট' },
  filter_sort_price_asc: { en: 'Price: Low to High', bn: 'দাম: কম থেকে বেশি' },
  filter_sort_price_desc: { en: 'Price: High to Low', bn: 'দাম: বেশি থেকে কম' },
  filter_sort_rating: { en: 'Highest Rated', bn: 'সেরা রেটিং' },
  filter_sort_top_sold: { en: 'Top Sold', bn: 'সর্বাধিক বিক্রিত' },
  filter_price_range: { en: 'Price Range (BDT):', bn: 'মূল্য সীমা (টাকা):' },
  filter_weight: { en: 'Size/Weight:', bn: 'সাইজ/ওজন:' },
  filter_weight_all: { en: 'All Sizes', bn: 'সব সাইজ' },
  filter_min_rating: { en: 'Min Rating:', bn: 'ন্যূনতম রেটিং:' },
  filter_min_rating_all: { en: 'All Ratings', bn: 'সব রেটিং' },
  filter_active_count: { en: 'Active Filters', bn: 'সক্রিয় ফিল্টার' },
  shop_products_found: { en: 'products found', bn: 'টি পণ্য পাওয়া গেছে' },
  shop_loading: { en: 'Loading products...', bn: 'পণ্য লোড হচ্ছে...' },
  shop_no_results: {
    en: 'No products found matching your criteria.',
    bn: 'আপনার অনুসন্ধানের সাথে কোনো পণ্য মেলেনি।',
  },
  shop_clear_filters: { en: 'Clear Filters', bn: 'ফিল্টার মুছুন' },

  // Product Card
  btn_out_of_stock: { en: 'Out of Stock', bn: 'স্টক শেষ' },
  btn_added: { en: 'Added!', bn: 'যুক্ত হয়েছে!' },
  btn_add_more: { en: 'Add More', bn: 'আরও যোগ করুন' },
  btn_add_to_cart: { en: 'Add to Cart', bn: 'কার্টে যোগ করুন' },
  aria_out_of_stock: { en: 'Out of stock', bn: 'স্টক নেই' },
  // Product Quick View
  aria_close_modal: { en: 'Close modal', bn: 'বন্ধ করুন' },
  label_reviews: { en: 'reviews', bn: 'রিভিউ' },
  label_weight: { en: 'Weight:', bn: 'ওজন:' },
  btn_added_full: { en: 'Added to Cart', bn: 'কার্টে যুক্ত হয়েছে' },
  text_in_cart: { en: 'in Cart', bn: 'টি আছে' },
  btn_view_full_details: { en: 'View Full Details', bn: 'বিস্তারিত দেখুন' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('petbhai_language');
    return stored === 'en' || stored === 'bn' ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem('petbhai_language', language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  const t = useCallback(
    (key: string): string => {
      if (!translations[key]) return key;
      return translations[key][language];
    },
    [language]
  );

  const value = useMemo(() => ({ language, toggleLanguage, t }), [language, toggleLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
