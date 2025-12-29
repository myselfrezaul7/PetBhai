import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { sanitizeInput } from '../lib/security';

// Validation utilities
const validatePhone = (phone: string): boolean => {
  // Bangladesh phone number format
  const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateAddress = (address: string): boolean => {
  return address.trim().length >= 10 && address.trim().length <= 500;
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
}

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

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to shop if cart is empty
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, navigate]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
      }));
    }
  }, [currentUser]);

  const validateField = useCallback((field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (!validateName(value)) return 'Name must be 2-100 characters';
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!validatePhone(value)) return 'Invalid Bangladesh phone number';
        return undefined;
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (!validateAddress(value)) return 'Address must be 10-500 characters';
        return undefined;
      case 'email':
        if (value && !validateEmail(value)) return 'Invalid email format';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;

      // Sanitize input
      const sanitizedValue = sanitizeInput(value);

      setFormData((prev) => ({ ...prev, [id]: sanitizedValue }));

      // Clear error on change
      setFormErrors((prev) => ({ ...prev, [id]: undefined }));
    },
    []
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      const error = validateField(id, value);
      if (error) {
        setFormErrors((prev) => ({ ...prev, [id]: error }));
      }
    },
    [validateField]
  );

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {
      name: validateField('name', formData.name),
      phone: validateField('phone', formData.phone),
      address: validateField('address', formData.address),
      email: validateField('email', formData.email),
    };

    // Remove undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([, v]) => v !== undefined)
    ) as FormErrors;

    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  }, [formData, validateField]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error('Please fix the errors in the form');
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        // Sanitize all form data before submission
        const sanitizedFormData = {
          name: sanitizeInput(formData.name.trim()),
          phone: sanitizeInput(formData.phone.trim()),
          address: sanitizeInput(formData.address.trim()),
          email: sanitizeInput(formData.email.trim()),
        };

        const orderData = {
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: Math.min(Math.max(1, item.quantity), 99), // Clamp quantity
            imageUrl: item.imageUrl,
          })),
          total: cartTotal,
          userId: currentUser?.id,
          shippingDetails: sanitizedFormData,
          paymentMethod,
        };

        // Use relative path for API
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to place order');
        }

        const newOrder = await response.json();

        if (isAuthenticated) {
          addOrderToHistory(newOrder);
        }

        toast.success('Thank you for your order! It has been placed successfully.');
        clearCart();
        navigate('/');
      } catch (error) {
        console.error('Order placement error:', error);
        if (error instanceof Error && error.name === 'AbortError') {
          toast.error('Request timed out. Please try again.');
        } else {
          toast.error(
            error instanceof Error ? error.message : 'Failed to place order. Please try again.'
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validateForm,
      isSubmitting,
      formData,
      cartItems,
      cartTotal,
      currentUser,
      paymentMethod,
      isAuthenticated,
      addOrderToHistory,
      clearCart,
      navigate,
      toast,
    ]
  );

  const handleSocialLogin = useCallback(async () => {
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
  }, [socialLogin, toast]);

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-4xl font-bold text-center text-slate-800 dark:text-white mb-10">
        Checkout
      </h1>
      <div className="flex flex-col-reverse lg:flex-row gap-12 max-w-5xl mx-auto">
        {/* Customer Form */}
        <div className="glass-card p-8 lg:w-[58%]">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isAuthenticated ? 'Confirm Shipping Details' : 'Guest Checkout'}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            We'll use this information for delivery.
          </p>

          {!isAuthenticated && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleSocialLogin}
                  disabled={isSocialLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
                >
                  <GoogleIcon className="w-6 h-6" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {isSocialLoading ? 'Continuing...' : 'Continue with Google'}
                  </span>
                </button>
              </div>
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold">
                  OR
                </span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Contact & Shipping
            </h2>
            <div>
              <label
                htmlFor="name"
                className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                required
                maxLength={100}
                autoComplete="name"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation ${
                  formErrors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {formErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="+8801..."
                required
                maxLength={20}
                autoComplete="tel"
                aria-invalid={!!formErrors.phone}
                aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation ${
                  formErrors.phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {formErrors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-500" role="alert">
                  {formErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Full Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                required
                maxLength={500}
                autoComplete="street-address"
                placeholder="e.g. House No, Road No, Area, District"
                aria-invalid={!!formErrors.address}
                aria-describedby={formErrors.address ? 'address-error' : undefined}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation resize-none ${
                  formErrors.address
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              ></textarea>
              {formErrors.address && (
                <p id="address-error" className="mt-1 text-sm text-red-500" role="alert">
                  {formErrors.address}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Email Address{' '}
                <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                  (For order confirmation)
                </span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                maxLength={255}
                autoComplete="email"
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation ${
                  formErrors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="pt-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'cod' ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200">
                    Cash on Delivery
                  </span>
                </label>
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'bkash' ? 'border-pink-500 ring-2 ring-pink-500 bg-pink-50/50 dark:bg-pink-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bkash"
                    checked={paymentMethod === 'bkash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    bKash
                    <img
                      src="https://i.ibb.co/27wH07C/bkash.png"
                      alt="bKash"
                      className="h-5 ml-2"
                      loading="lazy"
                    />
                  </span>
                </label>
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'nagad' ? 'border-orange-600 ring-2 ring-orange-600 bg-orange-50/50 dark:bg-orange-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nagad"
                    checked={paymentMethod === 'nagad'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-600"
                  />
                  <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    Nagad
                    <img
                      src="https://i.ibb.co/qjqBcf5/nagad.png"
                      alt="Nagad"
                      className="h-5 ml-2"
                      loading="lazy"
                    />
                  </span>
                </label>
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'rocket' ? 'border-purple-600 ring-2 ring-purple-600 bg-purple-50/50 dark:bg-purple-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="rocket"
                    checked={paymentMethod === 'rocket'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    Rocket
                    <img
                      src="https://i.ibb.co/6wLmMYy/rocket.png"
                      alt="Rocket"
                      className="h-5 ml-2"
                      loading="lazy"
                    />
                  </span>
                </label>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-300/50 dark:border-slate-600/50">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                  We Accept
                </p>
                <div className="flex items-center space-x-4">
                  <img
                    src="https://i.ibb.co/27wH07C/bkash.png"
                    alt="bKash"
                    className="h-6 grayscale hover:grayscale-0 transition-all duration-300"
                    title="bKash"
                  />
                  <img
                    src="https://i.ibb.co/qjqBcf5/nagad.png"
                    alt="Nagad"
                    className="h-6 grayscale hover:grayscale-0 transition-all duration-300"
                    title="Nagad"
                  />
                  <img
                    src="https://i.ibb.co/6wLmMYy/rocket.png"
                    alt="Rocket"
                    className="h-6 grayscale hover:grayscale-0 transition-all duration-300"
                    title="Rocket"
                  />
                  <img
                    src="https://i.ibb.co/p3y5M3D/bank.png"
                    alt="Bank"
                    className="h-6 grayscale hover:grayscale-0 transition-all duration-300"
                    title="Bank Transfer"
                  />
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 text-white font-bold py-3.5 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors touch-manipulation active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="glass-card p-6 sm:p-8 h-fit lg:w-[42%]">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Order Summary</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 overscroll-contain" role="list" aria-label="Cart items">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start" role="listitem">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-slate-200 dark:bg-slate-700"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-right shrink-0 ml-4 tabular-nums">
                  ৳{(item.price * item.quantity).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-300/50 dark:border-slate-600/50 mt-6 pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-slate-800 dark:text-white">Total:</span>
              <span className="text-slate-800 dark:text-white tabular-nums">
                ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
