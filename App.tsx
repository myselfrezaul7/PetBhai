import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AdoptPage from './pages/AdoptPage';
import ReportPage from './pages/ReportPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { AuthProvider } from './contexts/AuthContext';
import OnlineVetPage from './pages/OnlineVetPage';
import ShopPage from './pages/ShopPage';
import MessengerPlugin from './components/MessengerPlugin';
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/adopt" element={<AdoptPage />} />
                <Route path="/adopt/:id" element={<AnimalDetailPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/online-vet" element={<OnlineVetPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/shop" element={<ShopPage />} />
              </Routes>
            </main>
            <MessengerPlugin />
            <Footer />
          </div>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;