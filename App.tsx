import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { useProducts } from './contexts/ProductContext';
import { useArticles } from './contexts/ArticleContext';
import { useVets } from './contexts/VetContext';
import { usePetManagement } from './contexts/PetManagementContext';
import { useDynamicIsland } from './contexts/DynamicIslandContext';
import { useHaptics } from './hooks/useHaptics';
import { realtimeService } from './services/realtimeService';
import { safeSessionStorage } from './lib/storage';

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

const ADMIN_EMAILS = ['petbhaibd@gmail.com', 'rsrezaul55@gmail.com'];

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdminUser =
    currentUser?.role === 'super_admin' ||
    (currentUser?.role as string) === 'admin' ||
    ADMIN_EMAILS.includes(currentUser?.email?.trim().toLowerCase() || '');

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
        className={`fixed right-5 z-30 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) animate-badge-pop focus:outline-none focus:ring-4 focus:ring-orange-300 hover:scale-110 active:scale-95 md:bottom-44 md:h-14 md:w-14 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        } bottom-[calc(10rem+var(--safe-bottom))]`}
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
  if (path === '/admin') return <SEO title="Admin Dashboard" noindex />;
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
  if (path === '/privacy' || path === '/delete-account') {
    return (
      <SEO
        title="Privacy Policy & Data Safety"
        description="Review PetBhai's privacy policy, data safety practices, and account deletion instructions."
      />
    );
  }

  return <SEO title="PetBhai" />;
};

const TOP_LEVEL_TABS = ['/shop', '/blog', '/community', '/services', '/profile', '/adopt'];

const isNativeApp = (): boolean => {
  try {
    return Boolean(
      (
        window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
      ).Capacitor?.isNativePlatform?.()
    );
  } catch {
    return false;
  }
};

const MEDICINE_ALERT_SESSION_KEY = 'petbhai_due_reminder_alerted';

const AppContent: React.FC = () => {
  const { consent } = useCookieConsent();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isCartOpen, closeCart } = useCart();
  const { refetch: refetchProducts } = useProducts();
  const { refetch: refetchArticles } = useArticles();
  const { refetch: refetchVets } = useVets();
  const { pets, medicineReminders } = usePetManagement();
  const { showNotification, showLoading, showSuccess } = useDynamicIsland();
  const { hapticLight, hapticSuccess } = useHaptics();
  const isRefreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    const win = window as unknown as { __petbhaiHandleBack?: () => string };
    win.__petbhaiHandleBack = () => {
      const backEvent = new CustomEvent('petbhai-back-button', { cancelable: true });
      const notPrevented = window.dispatchEvent(backEvent);
      if (!notPrevented) {
        return 'handled';
      }
      if (isCartOpen) {
        closeCart();
        return 'handled';
      }
      if (location.pathname !== '/') {
        if (TOP_LEVEL_TABS.includes(location.pathname)) {
          navigate('/', { replace: true });
        } else {
          navigate(-1);
        }
        return 'handled';
      }
      return 'exit';
    };
    return () => {
      delete win.__petbhaiHandleBack;
    };
  }, [isCartOpen, closeCart, location.pathname, navigate]);

  // Verified Android App Links & Deep Link receiver
  useEffect(() => {
    const win = window as unknown as {
      __petbhaiNavigate?: (path: string) => void;
      __petbhaiDeepLink?: string | null;
      PetBhaiNative?: { consumeDeepLink?: () => string };
    };

    const handleDeepLinkPath = (rawPath: string) => {
      if (!rawPath || typeof rawPath !== 'string') return;
      const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      navigate(normalized);
    };

    win.__petbhaiNavigate = handleDeepLinkPath;

    if (win.__petbhaiDeepLink) {
      const pending = win.__petbhaiDeepLink;
      win.__petbhaiDeepLink = null;
      handleDeepLinkPath(pending);
    } else if (win.PetBhaiNative?.consumeDeepLink) {
      try {
        const nativePending = win.PetBhaiNative.consumeDeepLink();
        if (nativePending) {
          handleDeepLinkPath(nativePending);
        }
      } catch {
        // Ignore native deep link read errors
      }
    }

    return () => {
      delete win.__petbhaiNavigate;
    };
  }, [navigate]);

  // Mobile / Native pull-to-refresh gesture with haptics and Dynamic Island status
  useEffect(() => {
    const shouldEnablePull =
      isNativeApp() || (typeof window !== 'undefined' && window.innerWidth <= 1024);
    if (!shouldEnablePull) return;

    let active = false;
    let startY = 0;
    let startX = 0;
    let lastY = 0;
    let lastX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (
        e.touches.length !== 1 ||
        window.scrollY > 2 ||
        isRefreshingRef.current ||
        document.body.style.overflow === 'hidden' ||
        Boolean(document.querySelector('[role="dialog"], dialog[open]'))
      ) {
        active = false;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(target.tagName)) {
        active = false;
        return;
      }

      let node: HTMLElement | null = target;
      while (node && node !== document.body) {
        if (node.scrollTop > 0) {
          active = false;
          return;
        }
        node = node.parentElement;
      }

      const touch = e.touches[0];
      active = true;
      startY = touch.clientY;
      startX = touch.clientX;
      lastY = touch.clientY;
      lastX = touch.clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!active) return;
      if (e.touches.length !== 1 || window.scrollY > 4) {
        active = false;
        return;
      }
      const touch = e.touches[0];
      lastY = touch.clientY;
      lastX = touch.clientX;
    };

    const resetTouch = () => {
      active = false;
    };

    const handleTouchEnd = () => {
      if (!active) return;
      active = false;

      const dy = lastY - startY;
      const dx = Math.abs(lastX - startX);
      if (dy < 110 || dx > 55 || window.scrollY > 2) {
        return;
      }

      const now = Date.now();
      if (isRefreshingRef.current || now - lastRefreshAtRef.current < 4000) {
        return;
      }

      isRefreshingRef.current = true;
      lastRefreshAtRef.current = now;
      hapticLight();
      showLoading('Refreshing PetBhai...');
      window.dispatchEvent(new CustomEvent('petbhai-refresh'));

      void Promise.allSettled([refetchProducts(true), refetchArticles(true), refetchVets(true)])
        .then(() => {
          hapticSuccess();
          showSuccess('Updated');
        })
        .finally(() => {
          isRefreshingRef.current = false;
        });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', resetTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', resetTouch);
    };
  }, [
    hapticLight,
    hapticSuccess,
    refetchArticles,
    refetchProducts,
    refetchVets,
    showLoading,
    showSuccess,
  ]);

  // Real-time order status updates
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe('ORDER_UPDATED', (payload) => {
      if (!payload || !currentUser?.id) return;

      const ownerId = payload.userId ?? payload.customerId ?? payload.user?.id;
      if (ownerId && String(ownerId) !== String(currentUser.id)) {
        return;
      }

      const payloadEmail = payload.customerEmail ?? payload.email;
      if (
        !ownerId &&
        payloadEmail &&
        currentUser.email &&
        String(payloadEmail).toLowerCase() !== currentUser.email.toLowerCase()
      ) {
        return;
      }

      const rawId = payload.id ?? payload.orderId;
      const shortId = rawId ? `#${String(rawId).slice(-6)}` : 'Update';
      const statusText = payload.status
        ? `Status: ${String(payload.status)}`
        : 'Your order status was updated';

      hapticSuccess();
      showNotification(`Order ${shortId}`, statusText, 5000);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, currentUser?.email, hapticSuccess, showNotification]);

  // Smart reminder alert when a pet medicine dose is due today or overdue (once per session)
  useEffect(() => {
    if (!currentUser?.id || medicineReminders.length === 0) return;
    if (safeSessionStorage.getItem(MEDICINE_ALERT_SESSION_KEY) === '1') return;

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dueReminders = medicineReminders.filter((reminder) => {
      if (!reminder.isActive || !reminder.notificationEnabled || !reminder.nextDueDate) {
        return false;
      }
      const dueTime = new Date(reminder.nextDueDate).getTime();
      return !Number.isNaN(dueTime) && dueTime <= endOfToday.getTime();
    });

    if (dueReminders.length === 0) return;

    const timerId = window.setTimeout(() => {
      if (safeSessionStorage.getItem(MEDICINE_ALERT_SESSION_KEY) === '1') return;
      safeSessionStorage.setItem(MEDICINE_ALERT_SESSION_KEY, '1');
      const primaryReminder = dueReminders[0];
      const matchingPet = pets.find((pet) => pet.id === primaryReminder.petId);
      const title =
        dueReminders.length > 1
          ? `${dueReminders.length} Medicine Reminders Due`
          : 'Medicine Reminder Due';
      const subtitle = `${matchingPet ? `${matchingPet.name}: ` : ''}${primaryReminder.medicineName}`;
      hapticLight();
      showNotification(title, subtitle, 5500);
    }, 1600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [currentUser?.id, medicineReminders, pets, hapticLight, showNotification]);

  useEffect(() => {
    // Skip Service Worker registration inside Capacitor native apps (Android/iOS)
    try {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor;
      if (cap?.isNativePlatform?.()) {
        return;
      }
    } catch {
      // ignore
    }

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
      <main className="flex-grow app-main pt-[calc(4.75rem+var(--safe-top))] pb-[calc(5.75rem+var(--safe-bottom))] md:pt-28 md:pb-0">
        <SwipeNavigationProvider>
          <ErrorBoundary>
            <Suspense fallback={<PawHeartLoader />}>
              <div key={location.pathname} className="route-transition-container">
                <Routes location={location}>
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/find-vet" element={<Navigate to="/services" replace />} />
                  <Route path="/consult-vet" element={<Navigate to="/services" replace />} />
                  <Route path="/services/professional/:id" element={<ProfessionalDetailPage />} />
                  <Route path="/vet/:id" element={<VetDetailPage />} />
                  <Route path="/thumbnail-generator" element={<ThumbnailGeneratorPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/blog"
                    element={
                      <BlogErrorBoundary>
                        <BlogPage />
                      </BlogErrorBoundary>
                    }
                  />
                  <Route
                    path="/blog/:slug"
                    element={
                      <BlogErrorBoundary>
                        <ArticleDetailPage />
                      </BlogErrorBoundary>
                    }
                  />
                  <Route path="/plus-membership" element={<PlusMembershipPage />} />
                  <Route path="/adopt" element={<AdoptPage />} />
                  <Route path="/adopt/quiz" element={<AdoptionQuizPage />} />
                  <Route path="/adopt/:id" element={<AnimalDetailPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/volunteer" element={<VolunteerPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/safety" element={<TrustPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<TermsPage />} />
                  <Route path="/delete-account" element={<TermsPage />} />
                  <Route path="/dashboard" element={<PetDashboardPage />} />
                  <Route path="/compatibility-quiz" element={<PetCompatibilityPage />} />
                  <Route path="/services/booking" element={<ServicesBookingPage />} />
                  <Route path="/ai-assistant" element={<Navigate to="/services" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
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
      {!isNativeApp() && <SpeedInsights />}
      <ToastContainer />
      <ConfirmationModal />
      {!isNativeApp() && <CookieConsentBanner />}
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
