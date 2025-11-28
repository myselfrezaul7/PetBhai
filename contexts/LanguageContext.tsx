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
    search_placeholder: { en: 'Search products...', bn: 'পণ্য খুঁজুন...' },

    // Home Page
    hero_title: { en: 'A Loving Home For Every Animal', bn: 'প্রতিটি প্রাণীর জন্য একটি ভালোবাসার আশ্রয়' },
    hero_subtitle: { 
        en: 'Your trusted partner in animal welfare. Adopt, find expert services, and shop premium essentials to give them the life they deserve.', 
        bn: 'প্রাণী কল্যাণে আপনার বিশ্বস্ত সঙ্গী। দত্তক নিন, বিশেষজ্ঞ সেবা গ্রহণ করুন এবং তাদের একটি সুন্দর জীবন দিতে প্রয়োজনীয় সামগ্রী কিনুন।' 
    },
    btn_adopt: { en: 'Find a Friend', bn: 'বন্ধু খুঁজুন' },
    btn_shop: { en: 'Shop Supplies', bn: 'কেনাকাটা করুন' },
    
    section_best_sellers: { en: 'Our Best Sellers', bn: 'আমাদের সেরা পণ্যসমূহ' },
    section_best_sellers_sub: { en: 'Loved by pets and their parents.', bn: 'পোষা প্রাণী এবং তাদের অভিভাবকদের পছন্দ।' },
    
    section_services_title: { en: 'All The Care In One Place', bn: 'সব ধরণের সেবা এক ছাদের নিচে' },
    section_services_desc: { 
        en: 'From expert veterinarians to trusted groomers and trainers, find and book all the professional services your pet deserves.', 
        bn: 'বিশেষজ্ঞ পশুচিকিৎসক থেকে শুরু করে বিশ্বস্ত গ্রুমার এবং প্রশিক্ষক—আপনার পোষা প্রাণীর জন্য প্রয়োজনীয় সকল সেবা এখান থেকেই বুক করুন।' 
    },
    btn_explore_services: { en: 'Explore All Services', bn: 'সকল সেবা দেখুন' },
    
    section_brands: { en: 'Shop by Brand', bn: 'ব্র্যান্ড অনুযায়ী কিনুন' },
    
    section_new_arrivals: { en: 'New Arrivals', bn: 'নতুন আগমন' },
    section_new_arrivals_sub: { en: 'The latest and greatest products, fresh in our store.', bn: 'আমাদের স্টোরে আসা নতুন এবং সেরা সব পণ্য।' },
    btn_explore_shop: { en: 'Explore the Full Shop', bn: 'পুরো শপ দেখুন' },
    
    section_plus_title: { en: 'Upgrade to PetBhai+', bn: 'পেটভাই+ এ আপগ্রেড করুন' },
    section_plus_desc: { 
        en: 'Unlock exclusive benefits like free delivery, member-only discounts, and free vet consultations.', 
        bn: 'ফ্রি ডেলিভারি, বিশেষ ডিসকাউন্ট এবং ফ্রি ভেট কনসালটেশনের মতো এক্সক্লুসিভ সুবিধা উপভোগ করুন।' 
    },
    btn_join_plus: { en: 'Learn More & Join', bn: 'আরও জানুন ও যোগ দিন' }
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
