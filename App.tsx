import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AIAssistantPage from './pages/AIAssistantPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { AuthProvider } from './contexts/AuthContext';
import ConsultVetPage from './pages/ConsultVetPage';
import ShopPage from './pages/ShopPage';
import MessengerPlugin from './components/MessengerPlugin';
import { CartProvider } from './contexts/CartContext';
import CheckoutPage from './pages/CheckoutPage';
import { ThemeProvider } from './contexts/ThemeContext';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTop from './components/ScrollToTop';
import CookieConsentBanner from './components/CookieConsentBanner';
import ProductDetailPage from './pages/ProductDetailPage';
import BlogPage from './pages/BlogPage';
import VetDetailPage from './pages/VetDetailPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:text-slate-200">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/consult-a-vet" element={<ConsultVetPage />} />
                  <Route path="/consult-a-vet/:id" element={<VetDetailPage />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
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