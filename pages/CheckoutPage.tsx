import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { apiRequest, getErrorMessage } from '../services/apiClient';
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
  const { cartItems, clearCart } = useCart();
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

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

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

      if (cartItems.length === 0) {
        toast.error('Your cart is empty. Please add items before checkout.');
        navigate('/shop');
        return;
      }

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

        const normalizedCartItems = cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: Math.min(Math.max(1, Math.floor(item.quantity)), 99),
          imageUrl: item.imageUrl,
          price: Number.isFinite(item.price) && item.price >= 0 ? item.price : 0,
        }));

        if (normalizedCartItems.some((item) => item.price <= 0)) {
          throw new Error(
            'One or more cart items has an invalid price. Please refresh and try again.'
          );
        }

        let cartPriceAdjusted = false;

        const latestProducts =
          await apiRequest<
            Array<{ id: number; price?: number; stockStatus?: string; stockQuantity?: number }>
          >('/products');

        if (!Array.isArray(latestProducts)) {
          throw new Error('Unable to validate cart items right now. Please try again.');
        }

        const latestById = new Map<number, (typeof latestProducts)[number]>(
          latestProducts
            .filter((product) => product && typeof product.id === 'number')
            .map((product) => [product.id, product])
        );

        normalizedCartItems.forEach((item) => {
          const latest = latestById.get(item.id);
          if (!latest) {
            throw new Error(`\"${item.name}\" is no longer available.`);
          }

          if (latest.stockStatus === 'out-of-stock') {
            throw new Error(`\"${item.name}\" is currently out of stock.`);
          }

          if (typeof latest.stockQuantity === 'number' && item.quantity > latest.stockQuantity) {
            throw new Error(
              `Only ${latest.stockQuantity} unit(s) of \"${item.name}\" are available right now.`
            );
          }

          if (
            typeof latest.price === 'number' &&
            Number.isFinite(latest.price) &&
            latest.price > 0 &&
            item.price !== latest.price
          ) {
            cartPriceAdjusted = true;
            item.price = latest.price;
          }
        });

        const computedTotal = normalizedCartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        if (!Number.isFinite(computedTotal) || computedTotal <= 0) {
          throw new Error('Order total is invalid. Please review your cart and try again.');
        }

        const orderData = {
          items: normalizedCartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          total: computedTotal,
          userId: currentUser?.id,
          shippingAddress: sanitizedFormData,
          paymentMethod,
        };

        const responsePayload = await apiRequest<{ order?: unknown } | unknown>('/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
          timeoutMs: 30000,
        });
        const newOrder = (responsePayload as any)?.order ?? responsePayload;

        if (isAuthenticated) {
          addOrderToHistory(newOrder);
        }

        toast.success(
          cartPriceAdjusted
            ? 'Order placed successfully. Some item prices were updated to current values.'
            : 'Thank you for your order! It has been placed successfully.'
        );
        clearCart();
        navigate('/');
      } catch (error) {
        console.error('Order placement error:', error);
        toast.error(getErrorMessage(error, 'Failed to place order. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validateForm,
      isSubmitting,
      formData,
      cartItems,
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
    <main className="container mx-auto px-4 pb-32 pt-8 sm:pb-12 sm:pt-12">
      <header className="text-center mb-6 sm:mb-10 glass-card-ios border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl p-5 md:p-8 max-w-5xl mx-auto">
        <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 px-3 py-1 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-300 mb-3">
          Secure Checkout
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-white">Checkout</h1>
      </header>
      <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12 max-w-5xl mx-auto">
        {/* Customer Form */}
        <section
          className="glass-card-ios p-5 sm:p-8 lg:w-[58%] border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl"
          aria-label="Shipping and payment"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isAuthenticated ? 'Confirm Shipping Details' : 'Guest Checkout'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6">
            We'll use this information for delivery.
          </p>

          {!isAuthenticated && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleSocialLogin}
                  disabled={isSocialLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-white/60 dark:border-white/10 rounded-xl bg-white/70 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/70 transition-colors disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
                >
                  <GoogleIcon className="w-6 h-6" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {isSocialLoading ? 'Continuing...' : 'Continue with Google'}
                  </span>
                </button>
              </div>
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-300 font-semibold">
                  OR
                </span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              </div>
            </>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
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
                data-invalid={Boolean(formErrors.name)}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
                className={`h-14 w-full rounded-lg border bg-white/50 px-4 text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700/50 touch-manipulation ${
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
                inputMode="tel"
                enterKeyHint="next"
                data-invalid={Boolean(formErrors.phone)}
                aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                className={`h-14 w-full rounded-lg border bg-white/50 px-4 text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700/50 touch-manipulation ${
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
                enterKeyHint="next"
                placeholder="e.g. House No, Road No, Area, District"
                data-invalid={Boolean(formErrors.address)}
                aria-describedby={formErrors.address ? 'address-error' : undefined}
                className={`min-h-[112px] w-full resize-none rounded-lg border bg-white/50 px-4 py-3 text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700/50 touch-manipulation ${
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
                <span className="text-sm text-slate-500 dark:text-slate-300 font-normal">
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
                inputMode="email"
                enterKeyHint="done"
                data-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
                className={`h-14 w-full rounded-lg border bg-white/50 px-4 text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700/50 touch-manipulation ${
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
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'cod' ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50/60 dark:bg-orange-900/25' : 'border-white/45 dark:border-white/10 bg-white/55 dark:bg-slate-800/45'}`}
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
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'bkash' ? 'border-pink-500 ring-2 ring-pink-500 bg-pink-50/60 dark:bg-pink-900/25' : 'border-white/45 dark:border-white/10 bg-white/55 dark:bg-slate-800/45'}`}
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
                    
                  </span>
                </label>
                <label
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all touch-manipulation active:scale-[0.99] ${paymentMethod === 'nagad' ? 'border-orange-600 ring-2 ring-orange-600 bg-orange-50/60 dark:bg-orange-900/25' : 'border-white/45 dark:border-white/10 bg-white/55 dark:bg-slate-800/45'}`}
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
                    
                  </span>
                </label>
              </div>
            </div>
            <div className="hidden pt-4 md:block">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl text-lg hover:from-orange-600 hover:to-amber-600 transition-all touch-manipulation active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-lg hover:shadow-orange-500/30"
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
        </section>

        {/* Order Summary */}
        <aside
          className="glass-card-ios p-5 sm:p-8 h-fit lg:w-[42%] lg:sticky lg:top-24 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl"
          aria-label="Order summary"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-6">
            Order Summary
          </h2>
          <div
            className="space-y-4 max-h-80 overflow-y-auto pr-2 overscroll-contain"
            role="list"
            aria-label="Cart items"
          >
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
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-right shrink-0 ml-4 tabular-nums">
                  ৳
                  {(item.price * item.quantity).toLocaleString('en-BD', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-300/50 dark:border-slate-600/50 mt-6 pt-4">
            <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
              <span className="text-slate-800 dark:text-white">Total:</span>
              <span className="text-slate-800 dark:text-white tabular-nums">
                ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-[8rem] rounded-xl border border-white/70 bg-white/75 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Total
            </p>
            <p className="text-base font-bold text-slate-800 dark:text-white">
              ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="min-h-[50px] flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
