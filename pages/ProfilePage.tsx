import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { UserIcon } from '../components/icons';
import type { Order } from '../types';
import { useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import ProductCard from '../components/ProductCard';
import VaccinationReminder from '../components/VaccinationReminder';
import PetTools from '../components/PetTools';
import { sanitizeInput, sanitizeUrl } from '../lib/security';

const REORDER_THRESHOLD_DAYS = 15;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(
    currentUser?.profilePictureUrl || null
  );
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'wishlist' | 'orders' | 'reorder' | 'vaccinations' | 'tools'
  >('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Sync name state when currentUser changes
  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
    if (currentUser?.profilePictureUrl) {
      setProfilePicture(currentUser.profilePictureUrl);
    }
  }, [currentUser]);

  const wishlistedProducts = useMemo(() => {
    if (!currentUser) return [];
    return products.filter((product) => currentUser.wishlist.includes(product.id));
  }, [currentUser, products]);

  const reorderSuggestions = useMemo(() => {
    if (!currentUser) return [];
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - REORDER_THRESHOLD_DAYS);
    return currentUser.orderHistory.filter((order) => new Date(order.date) < thresholdDate);
  }, [currentUser]);

  // Validate name
  const validateName = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (trimmed.length > 100) return 'Name is too long (max 100 characters)';
    if (!/^[\p{L}\p{M}\s'-]+$/u.test(trimmed)) {
      return 'Name contains invalid characters';
    }
    return undefined;
  }, []);

  const handleNameBlur = useCallback(() => {
    const error = validateName(name);
    setNameError(error);
  }, [name, validateName]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Image file is too large (max 5MB)');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setNewProfilePictureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the image file');
      setTimeout(() => setErrorMessage(''), 5000);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      // Sanitize and validate name
      const sanitizedName = sanitizeInput(name.trim());
      const nameValidationError = validateName(sanitizedName);

      if (nameValidationError) {
        setNameError(nameValidationError);
        return;
      }

      setIsLoading(true);
      setSuccessMessage('');
      setErrorMessage('');
      setNameError(undefined);

      try {
        let updatedData: { name?: string; profilePictureUrl?: string } = {};

        if (sanitizedName !== currentUser.name) {
          updatedData.name = sanitizedName;
        }

        if (newProfilePictureFile && profilePicture) {
          // Sanitize the data URL
          const sanitizedUrl = sanitizeUrl(profilePicture);
          if (sanitizedUrl) {
            updatedData.profilePictureUrl = sanitizedUrl;
          }
        }

        if (Object.keys(updatedData).length > 0) {
          await updateProfile(updatedData);
          setSuccessMessage('Profile updated successfully!');
          setNewProfilePictureFile(null); // Reset file state after save
        } else {
          setSuccessMessage('No changes to save.');
        }

        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, name, newProfilePictureFile, profilePicture, updateProfile, validateName]
  );

  const handleReorder = useCallback(
    (order: Order) => {
      order.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(item);
        }
      });
      toast.success('Items from your past order have been added to your cart!');
    },
    [addToCart, toast]
  );

  const handleTabChange = useCallback((tabId: typeof activeTab) => {
    setActiveTab(tabId);
  }, []);

  const handleProfilePictureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!currentUser) {
    return null;
  }

  const TabButton: React.FC<{ tabId: typeof activeTab; children: React.ReactNode }> = ({
    tabId,
    children,
  }) => (
    <button
      onClick={() => handleTabChange(tabId)}
      className={`px-3 sm:px-4 py-2 font-semibold rounded-t-lg transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap touch-manipulation active:scale-95 ${activeTab === tabId ? 'bg-white/30 dark:bg-slate-800/30 border-b-2 border-orange-500 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'}`}
      aria-selected={activeTab === tabId}
      role="tab"
    >
      {children}
    </button>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-orange-200 dark:ring-orange-500/30">
              {currentUser.profilePictureUrl ? (
                <img
                  src={currentUser.profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white truncate">
                {currentUser.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 truncate">
                {currentUser.email}
              </p>
            </div>
            {currentUser.isPlusMember ? (
              <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-lg px-3 sm:px-4 py-2 text-center flex-shrink-0">
                <p className="font-bold text-base sm:text-lg">PLUS Member</p>
                <p className="text-xs">Enjoying exclusive benefits!</p>
              </div>
            ) : (
              <Link
                to="/plus-membership"
                className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg px-3 sm:px-4 py-2 text-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0 touch-manipulation active:scale-95"
              >
                <p className="font-bold text-base sm:text-lg">Join PetBhai+</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">Unlock Benefits</p>
              </Link>
            )}
          </div>
        </div>

        <div
          className="border-b border-slate-300/50 dark:border-slate-600/50 mb-4 sm:mb-6 flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
          role="tablist"
        >
          <TabButton tabId="profile">Edit Profile</TabButton>
          <TabButton tabId="vaccinations">🐾 Vaccinations</TabButton>
          <TabButton tabId="tools">✨ Tools</TabButton>
          <TabButton tabId="wishlist">Wishlist ({wishlistedProducts.length})</TabButton>
          <TabButton tabId="orders">Orders ({currentUser.orderHistory.length})</TabButton>
          <TabButton tabId="reorder">Reorder</TabButton>
        </div>

        <div className="glass-card p-4 sm:p-6 md:p-10" role="tabpanel">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-slate-600 dark:text-slate-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleProfilePictureClick}
                    className="absolute -bottom-2 -right-2 bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 shadow-md touch-manipulation active:scale-95"
                    aria-label="Change profile picture"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload profile picture"
                    title="Choose a profile picture"
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Click the pencil to change your photo. (Max 5MB)
                </p>
              </div>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  required
                  autoComplete="name"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation text-base ${
                    nameError
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'name-error' : undefined}
                />
                {nameError && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {nameError}
                  </p>
                )}
              </div>
              {successMessage && (
                <p
                  role="status"
                  aria-live="polite"
                  className="bg-green-100/80 text-green-800 dark:bg-green-500/30 dark:text-green-200 p-3 rounded-lg text-center text-sm sm:text-base"
                >
                  {successMessage}
                </p>
              )}
              {errorMessage && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="bg-red-100/80 text-red-700 dark:bg-red-500/30 dark:text-red-200 p-3 rounded-lg text-center text-sm sm:text-base"
                >
                  {errorMessage}
                </p>
              )}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-base sm:text-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
                  aria-label={isLoading ? 'Saving changes, please wait' : 'Save Changes'}
                >
                  {isLoading && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                My Wishlist
              </h2>
              {wishlistedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {wishlistedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  Your wishlist is empty.{' '}
                  <Link to="/shop" className="text-orange-600 hover:underline touch-manipulation">
                    Explore products!
                  </Link>
                </p>
              )}
            </div>
          )}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                My Order History
              </h2>
              {currentUser.orderHistory.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {currentUser.orderHistory.map((order) => (
                    <div
                      key={order.orderId}
                      className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-1">
                        <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white truncate">
                          Order: {order.orderId}
                        </p>
                        <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white tabular-nums">
                          Total: ৳
                          {order.total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Date: {new Date(order.date).toLocaleDateString()}
                      </p>
                      <ul className="text-xs sm:text-sm space-y-1">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between text-slate-600 dark:text-slate-300"
                          >
                            <span className="truncate mr-2">
                              {item.name} (x{item.quantity})
                            </span>
                            <span className="flex-shrink-0 tabular-nums">
                              ৳
                              {(item.price * item.quantity).toLocaleString('en-BD', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  You haven't made any purchases yet.{' '}
                  <Link to="/shop" className="text-orange-600 hover:underline touch-manipulation">
                    Visit the shop!
                  </Link>
                </p>
              )}
            </div>
          )}
          {activeTab === 'reorder' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                Smart Reorder Suggestions
              </h2>
              {reorderSuggestions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reorderSuggestions.map((order) => (
                    <div
                      key={order.orderId}
                      className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-3 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                        From your order on {new Date(order.date).toLocaleDateString()}:
                      </p>
                      <ul className="text-xs sm:text-sm space-y-1 mb-4">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center text-slate-600 dark:text-slate-300"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-8 rounded-sm object-cover mr-2 flex-shrink-0"
                              loading="lazy"
                            />
                            <span className="truncate">
                              {item.name} (x{item.quantity})
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleReorder(order)}
                        className="w-full sm:w-auto bg-orange-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
                        aria-label={`Add items from order ${order.orderId} to cart`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                  No reorder suggestions right now. We'll suggest items here when it's time to
                  restock!
                </p>
              )}
            </div>
          )}
          {activeTab === 'vaccinations' && (
            <div>
              <VaccinationReminder />
            </div>
          )}
          {activeTab === 'tools' && (
            <div>
              <PetTools />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
