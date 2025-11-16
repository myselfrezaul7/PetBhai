import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import type { Order } from '../types';
import { useToast } from '../contexts/ToastContext';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { isAuthenticated, currentUser, socialLogin, addOrderToHistory } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  useEffect(() => {
    // Redirect to shop if cart is empty
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, navigate]);
  
  // Pre-fill form if user is logged in
  useEffect(() => {
    if (currentUser) {
        setFormData(prev => ({
            ...prev,
            name: currentUser.name || prev.name,
            email: currentUser.email || prev.email,
        }));
    }
  }, [currentUser]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isAuthenticated) {
        const newOrder: Order = {
            orderId: `PB-${Date.now()}`,
            date: new Date().toISOString(),
            total: cartTotal,
            items: cartItems
        }
        addOrderToHistory(newOrder);
    }
    
    toast.success('Thank you for your order! It has been placed successfully.');
    clearCart();
    navigate('/');
  };
  
  const handleSocialLogin = async () => {
    setIsSocialLoading(true);
    try {
        const socialUser = await signInWithGoogle();
        await socialLogin(socialUser);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`Google Sign-In failed`, error);
        toast.error(`Failed to sign in with Google: ${message}`);
    } finally {
        setIsSocialLoading(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-4xl font-bold text-center text-slate-800 dark:text-white mb-10">Checkout</h1>
      <div className="flex flex-col-reverse lg:flex-row gap-12 max-w-5xl mx-auto">
        
        {/* Customer Form */}
        <div className="glass-card p-8 lg:w-[58%]">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{isAuthenticated ? 'Confirm Shipping Details' : 'Guest Checkout'}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">We'll use this information for delivery.</p>
             
            {!isAuthenticated && (
              <>
                <div className="space-y-3 mb-6">
                    <button onClick={handleSocialLogin} disabled={isSocialLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                        <GoogleIcon className="w-6 h-6" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{isSocialLoading ? 'Continuing...' : 'Continue with Google'}</span>
                    </button>
                </div>
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold">OR</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                </div>
              </>
            )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Contact & Shipping</h2>
            <div>
                <label htmlFor="name" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
                />
            </div>
            <div>
              <label htmlFor="phone" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                pattern="(\+8801|01)[3-9]\d{8}"
                placeholder="+8801..."
                required
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              />
            </div>
             <div>
              <label htmlFor="address" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Delivery Address <span className="text-red-500">*</span></label>
              <textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="e.g. House No, Road No, Area, District"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              ></textarea>
            </div>
             <div>
              <label htmlFor="email" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">(For order confirmation)</span></label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              />
            </div>
            <div className="pt-4">
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Payment Method</h2>
               <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-orange-500 ring-2 ring-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="h-5 w-5 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200">Cash on Delivery</span>
                    </label>
                    <label className={`flex items-center p-4 border rounded-lg cursor-not-allowed transition-all opacity-50 ${paymentMethod === 'card' ? 'border-orange-500 ring-2 ring-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        <input type="radio" name="paymentMethod" value="card" disabled checked={paymentMethod === 'card'} onChange={e => setPaymentMethod(e.target.value)} className="h-5 w-5 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200">Card <span className="text-sm text-slate-500">(Unavailable)</span></span>
                    </label>
                     <label className={`flex items-center p-4 border rounded-lg cursor-not-allowed transition-all opacity-50 ${paymentMethod === 'mobile' ? 'border-orange-500 ring-2 ring-orange-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        <input type="radio" name="paymentMethod" value="mobile" disabled checked={paymentMethod === 'mobile'} onChange={e => setPaymentMethod(e.target.value)} className="h-5 w-5 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200">Mobile Banking <span className="text-sm text-slate-500">(Unavailable)</span></span>
                    </label>
               </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors">
                Place Order
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="glass-card p-8 h-fit lg:w-[42%]">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Order Summary</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Quantity: {item.quantity}</p>
                    </div>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-right shrink-0 ml-4">৳{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-300/50 dark:border-slate-600/50 mt-6 pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-slate-800 dark:text-white">Total:</span>
              <span className="text-slate-800 dark:text-white">৳{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
