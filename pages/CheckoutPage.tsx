import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { BANGLADESH_DISTRICTS, BANGLADESH_DIVISIONS } from '../constants';
import { GoogleIcon, AppleIcon, FacebookIcon } from '../components/icons';
import { signInWithGoogle, signInWithApple, signInWithFacebook } from '../services/authService';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    division: '',
    postalCode: '',
    streetAddress: '',
    email: '',
  });
  
  const [district, setDistrict] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | 'facebook' | null>(null);

  useEffect(() => {
    // Redirect to shop if cart is empty
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDistrict(value);
    if (value.length > 0) {
        const filteredSuggestions = BANGLADESH_DISTRICTS.filter(d =>
            d.toLowerCase().startsWith(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setIsSuggestionsVisible(true);
    } else {
        setSuggestions([]);
        setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
      setDistrict(suggestion);
      setSuggestions([]);
      setIsSuggestionsVisible(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, you would process the payment and order here.
    alert('Thank you for your order! Your items will be delivered soon. We will contact you for confirmation.');
    clearCart();
    navigate('/');
  };
  
  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsSocialLoading(provider);
    try {
        let user;
        if (provider === 'google') {
            user = await signInWithGoogle();
        } else if (provider === 'apple') {
            user = await signInWithApple();
        } else {
            user = await signInWithFacebook();
        }

        setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        }));
    } catch (error) {
        console.error(`${provider} Sign-In failed`, error);
        alert(`Failed to sign in with ${provider}. Please try again.`);
    } finally {
        setIsSocialLoading(null);
    }
  };


  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center text-slate-800 dark:text-white mb-10">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        
        {/* Customer Form */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Guest Checkout</h2>
             <div className="space-y-3 mb-6">
                <button onClick={() => handleSocialLogin('google')} disabled={!!isSocialLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <GoogleIcon className="w-6 h-6" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{isSocialLoading === 'google' ? 'Continuing...' : 'Continue with Google'}</span>
                </button>
                 <button onClick={() => handleSocialLogin('apple')} disabled={!!isSocialLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-900 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <AppleIcon className="w-6 h-6" />
                    <span className="font-semibold">{isSocialLoading === 'apple' ? 'Continuing...' : 'Continue with Apple'}</span>
                </button>
                 <button onClick={() => handleSocialLogin('facebook')} disabled={!!isSocialLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-[#1877F2] bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <FacebookIcon className="w-6 h-6" />
                    <span className="font-semibold">{isSocialLoading === 'facebook' ? 'Continuing...' : 'Continue with Facebook'}</span>
                </button>
            </div>
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold">OR</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Contact & Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label htmlFor="firstName" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">First Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
                    />
                </div>
                 <div>
                    <label htmlFor="lastName" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Last Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
                    />
                </div>
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
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="division" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Division <span className="text-red-500">*</span></label>
                    <select id="division" value={formData.division} onChange={handleInputChange} required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700">
                        <option value="" disabled>Select Division</option>
                        {BANGLADESH_DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="district" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">District <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            id="district"
                            value={district}
                            onChange={handleDistrictChange}
                            onFocus={() => { if (district) setIsSuggestionsVisible(true); }}
                            onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
                            required
                            autoComplete="off"
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
                        />
                        {isSuggestionsVisible && suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {suggestions.map(suggestion => (
                                    <li
                                        key={suggestion}
                                        onMouseDown={() => handleSuggestionClick(suggestion)}
                                        className="p-3 hover:bg-orange-100 dark:hover:bg-slate-600 cursor-pointer"
                                    >
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="postalCode" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Postal Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
                    />
                </div>
             </div>
             <div>
              <label htmlFor="streetAddress" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Street Address / Details <span className="text-red-500">*</span></label>
              <textarea
                id="streetAddress"
                rows={3}
                value={formData.streetAddress}
                onChange={handleInputChange}
                required
                placeholder="e.g. House No, Road No, Area"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
              ></textarea>
            </div>
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">(For order confirmation)</span></label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700"
              />
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors">
                Place Order
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl h-fit">
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
          <div className="border-t border-slate-200 dark:border-slate-600 mt-6 pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>৳{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;