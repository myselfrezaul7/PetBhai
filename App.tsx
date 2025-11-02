import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import MessengerPlugin from './components/MessengerPlugin';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import CookieConsentBanner from './components/CookieConsentBanner';

// Lazy load all page components
const HomePage = lazy(() => import('./pages/HomePage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const VetDetailPage = lazy(() => import('./pages/VetDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const PlusMembershipPage = lazy(() => import('./pages/PlusMembershipPage'));
const AdoptPage = lazy(() => import('./pages/AdoptPage'));
const AnimalDetailPage = lazy(() => import('./pages/AnimalDetailPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const VolunteerPage = lazy(() => import('./pages/VolunteerPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ProfessionalDetailPage = lazy(() => import('./pages/ProfessionalDetailPage'));


const AppLoader: React.FC = () => (
  <div className="flex justify-center items-center h-[calc(100vh-144px)] w-full">
    <div className="border-4 border-slate-200 border-t-orange-500 rounded-full w-12 h-12 animate-spin"></div>
  </div>
);


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:text-slate-200">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<AppLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/professional/:id" element={<ProfessionalDetailPage />} />
                    <Route path="/vet/:id" element={<VetDetailPage />} />
                    <Route path="/ai-assistant" element={<AIAssistantPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/plus-membership" element={<PlusMembershipPage />} />
                    <Route path="/adopt" element={<AdoptPage />} />
                    <Route path="/adopt/:id" element={<AnimalDetailPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/volunteer" element={<VolunteerPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <MessengerPlugin />
              <ScrollToTop />
              <Footer />
              <CookieConsentBanner />
            </div>
          </HashRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;