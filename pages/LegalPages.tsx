import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-16 animate-fade-in max-w-4xl">
            <div className="glass-card p-8 md:p-12">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-8">Privacy Policy</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                    <p className="font-bold">Last Updated: October 2023</p>
                    <p>At PetBhai, we value your privacy and are committed to protecting your personal data. This policy explains how we collect and use your information when you visit our website.</p>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, make a purchase, apply for adoption, or contact our support team. This may include your name, email, phone number, and address.</p>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">2. How We Use Your Information</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>To facilitate pet adoptions and ensure animal welfare.</li>
                        <li>To process your orders and manage your account.</li>
                        <li>To communicate with you about our services and updates.</li>
                        <li>To improve our website and tools.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">3. Cookies</h2>
                    <p>We use cookies to enhance your experience. For more details, please see our <Link to="/faq" className="text-orange-600 underline">FAQ</Link>.</p>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">4. Contact Us</h2>
                    <p>If you have questions about this policy, please email us at <span className="font-bold">petbhaibd@gmail.com</span>.</p>
                </div>
                <div className="mt-12">
                    <Link to="/" className="text-orange-500 font-bold hover:underline">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export const TermsOfService: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-16 animate-fade-in max-w-4xl">
            <div className="glass-card p-8 md:p-12">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                    <p className="font-bold">Last Updated: October 2023</p>
                    <p>By accessing or using PetBhai, you agree to be bound by these terms.</p>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">1. Services Provided</h2>
                    <p>PetBhai provides a platform for animal welfare, including adoption listings, professional services, and an e-commerce shop.</p>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">2. User Conduct</h2>
                    <p>Users must provide accurate information when registering or reporting rescues. Any misuse of our platform for animal cruelty or fraudulent activities will result in immediate termination of access and potential legal action.</p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">3. Professional Services</h2>
                    <p>Professionals listed on our platform are independent contractors. PetBhai is not liable for any damages resulting from services booked through our platform.</p>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-8">4. Limitation of Liability</h2>
                    <p>PetBhai is not liable for any indirect or direct damages resulting from your use of the site. For support or questions, contact us at petbhaibd@gmail.com.</p>
                </div>
                <div className="mt-12">
                    <Link to="/" className="text-orange-500 font-bold hover:underline">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
};