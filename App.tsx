import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import MessengerPlugin from './components/MessengerPlugin';
import { CartProvider, useCart } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';
import { ProductProvider } from './contexts/ProductContext';
import CookieConsentBanner, {
  CookieConsentProvider,
  useCookieConsent,
} from './components/CookieConsentBanner';
import { ArticleProvider } from './contexts/ArticleContext';
import { VetProvider } from './contexts/VetContext';
import { AnimalProvider } from './contexts/AnimalContext';
import { BrandProvider } from './contexts/BrandContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import ConfirmationModal from './components/ConfirmationModal';
import { LanguageProvider } from './contexts/LanguageContext';
import { PawIcon, ShoppingCartIcon, HeartIcon } from './components/icons';
import CartSidebar from './components/CartSidebar';

// Lazy load all page components
const HomePage = lazy(() => import('./pages/HomePage'));
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
const ThumbnailGeneratorPage = lazy(() => import('./pages/ThumbnailGeneratorPage'));
const TrustPage = lazy(() => import('./pages/TrustPage'));

const PawHeartLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col justify-center items-center h-[calc(100vh-144px)] w-full">
    <div className="relative w-20 h-20 animate-heartbeat">
      <HeartIcon className="w-full h-full text-orange-500" />
      <PawIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white dark:text-slate-900" />
    </div>
    <p className="mt-4 text-orange-500 font-semibold animate-pulse tracking-wide">
      {message || 'Loading...'}
    </p>
  </div>
);

const GlobalCartElements: React.FC = () => {
  const { isCartOpen, closeCart, openCart, cartCount } = useCart();
  const location = useLocation();

  // The cart button should be visible if:
  // 1. There are items in the cart (cartCount > 0)
  // 2. OR the user is on the Shop page (location.pathname === '/shop'), allowing them to access the cart even if empty.
  const isShopPage = location.pathname === '/shop';
  const isVisible = cartCount > 0 || isShopPage;

  return (
    <>
      <button
        onClick={openCart}
        className={`fixed bottom-24 right-5 w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-full text-white shadow-xl shadow-orange-500/30 z-30 flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) focus:outline-none focus:ring-4 focus:ring-orange-300 hover:scale-110 active:scale-95 ${
          isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-20 opacity-0 scale-50 pointer-events-none'
        }`}
        aria-label={`Open shopping cart with ${cartCount} items`}
      >
        <ShoppingCartIcon className="w-7 h-7 md:w-8 md:h-8" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white dark:border-slate-800 animate-scale-in shadow-md">
            {cartCount}
          </span>
        )}
      </button>
      <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};

const AppContent: React.FC = () => {
  const { consent } = useCookieConsent();

  useEffect(() => {
    // Robust Service Worker Registration
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // In a React app, components mount after the basic DOM is ready.
          // We can register immediately without waiting for 'load' event,
          // which avoids the "document in invalid state" error if the event has already passed.
          const registration = await navigator.serviceWorker.register('./service-worker.js');
          console.log('SW registered with scope:', registration.scope);
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:text-slate-200">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<PawHeartLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/professional/:id" element={<ProfessionalDetailPage />} />
            <Route path="/vet/:id" element={<VetDetailPage />} />
            <Route path="/thumbnail-generator" element={<ThumbnailGeneratorPage />} />
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
            <Route path="/safety" element={<TrustPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <GlobalCartElements />
      {consent === 'all' && <MessengerPlugin />}
      <ScrollToTop />
      <ScrollToTopOnNavigate />
      <Footer />
      <ToastContainer />
      <ConfirmationModal />
      <CookieConsentBanner />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConfirmationProvider>
          <ToastProvider>
            <ArticleProvider>
              <ProductProvider>
                <VetProvider>
                  <AnimalProvider>
                    <BrandProvider>
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
                    </BrandProvider>
                  </AnimalProvider>
                </VetProvider>
              </ProductProvider>
            </ArticleProvider>
          </ToastProvider>
        </ConfirmationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
