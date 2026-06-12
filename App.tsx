import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import BlogErrorBoundary from './components/BlogErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import { useCart } from './contexts/CartContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';
import CookieConsentBanner, { useCookieConsent } from './components/CookieConsentBanner';
import ToastContainer from './components/ToastContainer';
import ConfirmationModal from './components/ConfirmationModal';
import { PawIcon, ShoppingCartIcon, HeartIcon } from './components/icons';
import CartSidebar from './components/CartSidebar';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallBanner from './components/PWAInstallBanner';
import { SwipeNavigationProvider } from './hooks/useSwipeNavigation';
import { SpeedInsights } from '@vercel/speed-insights/react';
import SEO, {
  HomePageSEO,
  ShopPageSEO,
  AdoptPageSEO,
  BlogPageSEO,
  ServicesPageSEO,
} from './components/SEO';
import AppProviders from './components/AppProviders';
import { useAuth } from './contexts/AuthContext';

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
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PetDashboardPage = lazy(() => import('./pages/PetDashboardPage'));
const PetCompatibilityPage = lazy(() => import('./pages/PetCompatibilityPage'));
const ServicesBookingPage = lazy(() => import('./pages/ServicesBookingPage'));
const AdoptionQuizPage = lazy(() => import('./pages/AdoptionQuizPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WhatsAppButton = lazy(() => import('./components/WhatsAppButton'));
const MessengerPlugin = lazy(() => import('./components/MessengerPlugin'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));

const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdminUser =
    currentUser?.role === 'admin' ||
    currentUser?.email?.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;

  if (!isAdminUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const prefetchLikelyRoutes = () => {
  void import('./pages/ShopPage');
  void import('./pages/ServicesPage');
  void import('./pages/BlogPage');
  void import('./pages/AdoptPage');
};

const PawHeartLoader: React.FC<{ message?: string }> = React.memo(({ message }) => (
  <div className="flex flex-col justify-center items-center h-[calc(100vh-144px)] min-h-[calc(100dvh-144px)] w-full">
    <div className="relative w-20 h-20 motion-safe:animate-heartbeat motion-reduce:animate-none">
      <HeartIcon className="w-full h-full text-orange-500" />
      <PawIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white dark:text-slate-900" />
    </div>
    <p className="mt-4 text-orange-500 font-semibold motion-safe:animate-pulse motion-reduce:animate-none tracking-wide">
      {message || 'Loading...'}
    </p>
  </div>
));
PawHeartLoader.displayName = 'PawHeartLoader';

const GlobalCartElements: React.FC = () => {
  const { isCartOpen, closeCart, openCart, cartCount, lastActionTimestamp } = useCart();
  const location = useLocation();

  // The cart button should be visible if:
  // 1. There are items in the cart (cartCount > 0)
  // 2. OR the user is on the Shop page (location.pathname === '/shop'), allowing them to access the cart even if empty.
  const isShopPage = location.pathname === '/shop';
  const isVisible = cartCount > 0 || isShopPage;

  useEffect(() => {
    closeCart();
  }, [location.pathname, closeCart]);

  return (
    <>
      <button
        key={lastActionTimestamp || 'initial'}
        onClick={openCart}
        className={`fixed right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) animate-badge-pop focus:outline-none focus:ring-4 focus:ring-orange-300 hover:scale-110 active:scale-95 md:bottom-24 md:h-14 md:w-14 ${
          isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-20 opacity-0 pointer-events-none'
        } bottom-[calc(8.75rem+var(--safe-bottom))]`}
        aria-label={`Open shopping cart with ${cartCount} items`}
      >
        <ShoppingCartIcon className="w-6 h-6 md:w-8 md:h-8" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
            {cartCount}
          </span>
        )}
      </button>
      <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};

const RouteSEO: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/') return <HomePageSEO />;
  if (path === '/shop') return <ShopPageSEO />;
  if (path === '/services') return <ServicesPageSEO />;
  if (path === '/adopt') return <AdoptPageSEO />;
  if (path === '/blog') return <BlogPageSEO />;
  if (path === '/community') {
    return (
      <SEO
        title="Community Hub"
        description="Join PetBhai's community to share pet stories, get expert advice, and connect with pet lovers across Bangladesh."
        keywords={['pet community', 'pet lovers bangladesh', 'pet stories', 'pet advice']}
      />
    );
  }
  if (path === '/plus-membership') {
    return (
      <SEO
        title="Plus Membership"
        description="Unlock exclusive perks with PetBhai Plus membership including free delivery, discounts, and vet consultations."
        keywords={['petbhai plus', 'pet membership', 'pet perks']}
      />
    );
  }
  if (path === '/faq') {
    return (
      <SEO
        title="Frequently Asked Questions"
        description="Find answers to common PetBhai questions about orders, deliveries, adoption, and services."
        keywords={['petbhai faq', 'pet care questions', 'pet services help']}
      />
    );
  }
  if (path === '/ai-assistant') {
    return (
      <SEO
        title="AI Vet Assistant"
        description="Chat with PetBhai's AI assistant for helpful guidance on pet health, behavior, and care."
        keywords={['ai vet', 'pet health advice', 'petbhai ai', 'pet care assistant']}
      />
    );
  }
  if (path === '/safety') {
    return (
      <SEO
        title="Safety & Trust"
        description="Learn about PetBhai safety standards, verified services, and trusted pet care policies."
        keywords={['pet safety', 'trusted pet services', 'petbhai trust']}
      />
    );
  }
  if (path === '/terms') {
    return (
      <SEO
        title="Terms & Conditions"
        description="Review PetBhai's terms and conditions for services, purchases, and community participation."
        keywords={['petbhai terms', 'terms and conditions']}
      />
    );
  }
  if (path === '/report') {
    return (
      <SEO
        title="Report a Concern"
        description="Report pet welfare concerns or issues and help us keep the community safe."
        keywords={['report pet', 'animal welfare', 'pet safety report']}
      />
    );
  }
  if (path === '/volunteer') {
    return (
      <SEO
        title="Volunteer"
        description="Join PetBhai's volunteer community to support pet welfare initiatives across Bangladesh."
        keywords={['volunteer', 'animal welfare bangladesh', 'pet rescue']}
      />
    );
  }
  if (path === '/compatibility-quiz') {
    return (
      <SEO
        title="Pet Compatibility Quiz"
        description="Find the perfect pet companion with our quick compatibility quiz."
        keywords={['pet compatibility', 'pet quiz', 'adopt a pet']}
      />
    );
  }
  if (path === '/services/booking') {
    return (
      <SEO
        title="Book a Service"
        description="Book trusted pet services including grooming, training, and vet appointments with PetBhai."
        keywords={['book pet service', 'pet grooming booking', 'vet appointment']}
      />
    );
  }
  if (path.startsWith('/product/')) {
    return (
      <SEO
        title="Product Details"
        description="Explore premium pet products and supplies available on PetBhai."
        type="product"
      />
    );
  }
  if (path.startsWith('/blog/')) {
    return (
      <SEO
        title="Article"
        description="Read expert pet care tips and stories from the PetBhai blog."
        type="article"
      />
    );
  }
  if (path.startsWith('/adopt/')) {
    return (
      <SEO
        title="Adoption Listing"
        description="Meet pets looking for a loving home and start the adoption process."
        keywords={['adopt a pet', 'pet adoption listing']}
      />
    );
  }
  if (path.startsWith('/vet/') || path.startsWith('/services/professional/')) {
    return (
      <SEO
        title="Service Provider"
        description="View verified vet and service provider profiles on PetBhai."
        keywords={['pet services', 'vet profile', 'pet grooming']}
      />
    );
  }
  if (path === '/checkout') return <SEO title="Checkout" noindex />;
  if (path === '/login') return <SEO title="Login" noindex />;
  if (path === '/signup') return <SEO title="Sign Up" noindex />;
  if (path === '/profile') return <SEO title="My Profile | PetBhai" noindex />;
  if (path === '/dashboard') return <SEO title="Dashboard" noindex />;
  if (path === '/admin-dashboard') return <SEO title="Admin Dashboard" noindex />;
  if (path === '/thumbnail-generator') {
    return (
      <SEO
        title="Thumbnail Generator"
        description="Create pet-friendly thumbnails quickly with PetBhai's generator."
        keywords={['thumbnail generator', 'pet design tools']}
        noindex
      />
    );
  }

  return <SEO title="PetBhai" />;
};

const AppContent: React.FC = () => {
  const { consent } = useCookieConsent();
  const location = useLocation();

  useEffect(() => {
    // Robust Service Worker Registration
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const swUrl = '/service-worker.js';
          const swProbe = await fetch(swUrl, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
          });

          if (!swProbe.ok) {
            console.warn('SW script not found, skipping registration:', swUrl);
            return;
          }

          const registration = await navigator.serviceWorker.register(swUrl);
          console.log('SW registered with scope:', registration.scope);
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const runPrefetch = () => {
      prefetchLikelyRoutes();
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => runPrefetch(), { timeout: 2000 });
    } else {
      timeoutId = setTimeout(runPrefetch, 1200) as unknown as number;
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col app-shell text-slate-800 dark:text-slate-200">
      <RouteSEO />
      <OfflineIndicator />
      <Header />
      <main className="flex-grow app-main pb-24 pt-24 md:pb-0 md:pt-28">
        <SwipeNavigationProvider>
          <ErrorBoundary>
            <Suspense fallback={<PawHeartLoader />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, scale: 0.99, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.99, filter: 'blur(2px)' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route
                      path="/services/professional/:id"
                      element={<ProfessionalDetailPage />}
                    />
                    <Route path="/vet/:id" element={<VetDetailPage />} />
                    <Route path="/thumbnail-generator" element={<ThumbnailGeneratorPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/blog/*" element={
                    <BlogErrorBoundary>
                      <Routes>
                        <Route path="/" element={<BlogPage />} />
                        <Route path="/:slug" element={<ArticleDetailPage />} />
                      </Routes>
                    </BlogErrorBoundary>
                  } />
                    <Route path="/plus-membership" element={<PlusMembershipPage />} />
                    <Route path="/adopt" element={<AdoptPage />} />
                    <Route path="/adopt/quiz" element={<AdoptionQuizPage />} />
                    <Route path="/adopt/:id" element={<AnimalDetailPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/volunteer" element={<VolunteerPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/safety" element={<TrustPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/dashboard" element={<PetDashboardPage />} />
                    <Route path="/compatibility-quiz" element={<PetCompatibilityPage />} />
                    <Route path="/services/booking" element={<ServicesBookingPage />} />
                    <Route path="/ai-assistant" element={<AIAssistantPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </SwipeNavigationProvider>
      </main>
      <GlobalCartElements />
      <Suspense fallback={null}>
        <WhatsAppButton />
        {consent === 'all' && <MessengerPlugin />}
      </Suspense>
      <PWAInstallBanner />
      <BottomNav />
      <ScrollToTop />
      <ScrollToTopOnNavigate />
      <Footer />
      <SpeedInsights />
      <ToastContainer />
      <ConfirmationModal />
      <CookieConsentBanner />
    </div>
  );
};

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
