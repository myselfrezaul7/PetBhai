import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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
    nav_shop: { en: 'Shop', bn: 'কেনাকাটা' },
    nav_community: { en: 'Community', bn: 'কমিউনিটি' },
    nav_services: { en: 'Services', bn: 'সেবাসমূহ' },
    nav_ai_vet: { en: 'AI Vet', bn: 'এআই ভেট' },
    nav_blog: { en: 'Blog', bn: 'ব্লগ' },
    nav_plus: { en: 'PetBhai+', bn: 'পেটভাই+' },
    nav_login: { en: 'Login', bn: 'লগইন' },
    nav_signup: { en: 'Sign Up', bn: 'সাইন আপ' },
    nav_logout: { en: 'Logout', bn: 'লগআউট' },
    nav_profile: { en: 'My Profile', bn: 'প্রোফাইল' },
    search_placeholder: { en: 'Search products...', bn: 'পছন্দের পণ্য খুঁজুন...' },

    // Home Page
    hero_title: { en: 'A Loving Home For Every Animal', bn: 'প্রতিটি প্রাণীর জন্য একটি নিরাপদ আশ্রয়' },
    hero_subtitle: { 
        en: 'Your trusted partner in animal welfare. Adopt, find expert services, and shop premium essentials to give them the life they deserve.', 
        bn: 'আপনার পোষা প্রাণীর সব প্রয়োজনে আমরা আছি পাশে। নতুন বন্ধু খুঁজে নিন, বিশেষজ্ঞের পরামর্শ নিন, আর সেরা মানের খাবার ও পণ্য কিনুন - সবই এক জায়গায়।' 
    },
    btn_adopt: { en: 'Find a Friend', bn: 'বন্ধু খুঁজুন' },
    btn_shop: { en: 'Shop Supplies', bn: 'শপ ভিজিট করুন' },
    
    section_best_sellers: { en: 'Our Best Sellers', bn: 'জনপ্রিয় পণ্যসমূহ' },
    section_best_sellers_sub: { en: 'Loved by pets and their parents.', bn: 'শহরের সেরা সব পেট প্রোডাক্টস, যা আপনার ও আপনার পোষ্যের মন জয় করবে।' },
    
    section_services_title: { en: 'All The Care In One Place', bn: 'পোষ্যের সম্পূর্ণ যত্ন এক ঠিকানায়' },
    section_services_desc: { 
        en: 'From expert veterinarians to trusted groomers and trainers, find and book all the professional services your pet deserves.', 
        bn: 'অভিজ্ঞ পশুচিকিৎসক, গ্রুমার কিংবা ট্রেইনার - আপনার আদরের পোষ্যের জন্য প্রয়োজনীয় যেকোনো সেবা খুঁজে নিন সহজেই।' 
    },
    btn_explore_services: { en: 'Explore All Services', bn: 'সবগুলো সেবা দেখুন' },
    
    section_brands: { en: 'Shop by Brand', bn: 'জনপ্রিয় ব্র্যান্ড' },
    
    section_new_arrivals: { en: 'New Arrivals', bn: 'নতুন কালেকশন' },
    section_new_arrivals_sub: { en: 'The latest and greatest products, fresh in our store.', bn: 'আমাদের স্টোরে আসা একদম নতুন এবং সেরা মানের সব পণ্য।' },
    btn_explore_shop: { en: 'Explore the Full Shop', bn: 'আরও পণ্য দেখুন' },
    
    section_plus_title: { en: 'Upgrade to PetBhai+', bn: 'পেটভাই+ মেম্বার হোন' },
    section_plus_desc: { 
        en: 'Unlock exclusive benefits like free delivery, member-only discounts, and free vet consultations.', 
        bn: 'ফ্রি ডেলিভারি, এক্সক্লুসিভ ডিসকাউন্ট এবং ফ্রি ভেট কনসালটেশনসহ দারুণ সব সুবিধা উপভোগ করতে আজই মেম্বারশিপ নিন।' 
    },
    btn_join_plus: { en: 'Learn More & Join', bn: 'বিস্তারিত জানুন' }
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
        return (stored === 'en' || stored === 'bn') ? stored : 'en';
    });

    useEffect(() => {
        localStorage.setItem('petbhai_language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'bn' : 'en');
    };

    const t = (key: string): string => {
        if (!translations[key]) return key;
        return translations[key][language];
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};