import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import MessengerPlugin from './components/MessengerPlugin';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import { ProductProvider } from './contexts/ProductContext';
import CookieConsentBanner, { CookieConsentProvider, useCookieConsent } from './components/CookieConsentBanner';
import { ArticleProvider } from './contexts/ArticleContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import ConfirmationModal from './components/ConfirmationModal';
import { LanguageProvider } from './contexts/LanguageContext';
import { PawIcon } from './components/icons';

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
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
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
     <div className="text-orange-500 animate-[breathe_1.5s_ease-in-out_infinite]">
        <PawIcon className="w-16 h-16" />
     </div>
  </div>
);

const AppContent: React.FC = () => {
  const { consent } = useCookieConsent();

  useEffect(() => {
    // This function handles the service worker registration.
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        const swUrl = `${window.location.origin}/service-worker.js`;
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            // SW registration successful
          })
          .catch(error => {
            console.error('SW registration failed:', error);
          });
      }
    };

    // The 'load' event is the most reliable point to register a service worker.
    // It ensures the page is fully loaded and won't be competing for resources.
    window.addEventListener('load', registerServiceWorker);

    // Cleanup the event listener when the component unmounts.
    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []); // Empty dependency array ensures this runs only once.


  return (
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
            <Route path="/blog/:id" element={<ArticleDetailPage />} />
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
      {consent === 'all' && <MessengerPlugin />}
      <ScrollToTop />
      <Footer />
      <ToastContainer />
      <ConfirmationModal />
      <CookieConsentBanner />
    </div>
  );
}


function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConfirmationProvider>
          <ToastProvider>
            <ArticleProvider>
              <ProductProvider>
                <AuthProvider>
                  <CartProvider>
                    <CookieConsentProvider>
                      <HashRouter>
                        <ScrollToTop />
                        <AppContent />
                      </HashRouter>
                    </CookieConsentProvider>
                  </CartProvider>
                </AuthProvider>
              </ProductProvider>
            </ArticleProvider>
          </ToastProvider>
        </ConfirmationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;