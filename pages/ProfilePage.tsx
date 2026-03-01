import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { Order } from '../types';
import { useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import { usePetManagement } from '../contexts/PetManagementContext';
import { useVaccination } from '../contexts/VaccinationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import ProductCard from '../components/ProductCard';
import VaccinationReminder from '../components/VaccinationReminder';
import PetTools from '../components/PetTools';
import Avatar from '../components/Avatar';
import { sanitizeInput, sanitizeUrl } from '../lib/security';

const REORDER_THRESHOLD_DAYS = 15;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

type ProfileTab =
  | 'overview'
  | 'profile'
  | 'address'
  | 'security'
  | 'pets'
  | 'vaccinations'
  | 'tools'
  | 'wishlist'
  | 'orders';

const ProfilePage: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    isAuthenticated,
    fetchProfile,
    changePassword,
    deleteAccount,
  } = useAuth();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { pets } = usePetManagement();
  const { getUpcomingVaccinations } = useVaccination();
  const { confirm } = useConfirmation();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(
    currentUser?.profilePictureUrl || null
  );
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);

  const [addressFullName, setAddressFullName] = useState(
    currentUser?.defaultShippingAddress?.fullName || ''
  );
  const [addressLine, setAddressLine] = useState(
    currentUser?.defaultShippingAddress?.address || ''
  );
  const [addressCity, setAddressCity] = useState(currentUser?.defaultShippingAddress?.city || '');
  const [addressPhone, setAddressPhone] = useState(
    currentUser?.defaultShippingAddress?.phone || ''
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated && !isRefreshing) {
      navigate('/login');
    }
  }, [isAuthenticated, isRefreshing, navigate]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
    setProfilePicture(currentUser.profilePictureUrl || null);
    setAddressFullName(currentUser.defaultShippingAddress?.fullName || '');
    setAddressLine(currentUser.defaultShippingAddress?.address || '');
    setAddressCity(currentUser.defaultShippingAddress?.city || '');
    setAddressPhone(currentUser.defaultShippingAddress?.phone || '');
  }, [currentUser]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchProfile();
    } catch {
      // intentionally silent; page already has user data from context/local storage
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProfile, isAuthenticated]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshProfile();
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [refreshProfile]);

  const wishlistedProducts = useMemo(() => {
    if (!currentUser) return [];
    return products.filter((product) => currentUser.wishlist.includes(product.id));
  }, [currentUser, products]);

  const recentOrders = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.orderHistory.slice(0, 3);
  }, [currentUser]);

  const reorderSuggestions = useMemo(() => {
    if (!currentUser) return [];
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - REORDER_THRESHOLD_DAYS);
    return currentUser.orderHistory.filter((order) => new Date(order.date) < thresholdDate);
  }, [currentUser]);

  const upcomingVaccinations = useMemo(() => {
    return getUpcomingVaccinations(30).slice(0, 5);
  }, [getUpcomingVaccinations]);

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

  const validatePhone = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.length < 6) return 'Phone must be at least 6 characters';
    if (trimmed.length > 30) return 'Phone is too long (max 30 characters)';
    return undefined;
  }, []);

  const validateShippingAddress = useCallback(
    (data: {
      fullName: string;
      address: string;
      city: string;
      phone: string;
    }): string | undefined => {
      if (data.fullName.length < 2) return 'Full name must be at least 2 characters';
      if (data.address.length < 5) return 'Address must be at least 5 characters';
      if (data.city.length < 2) return 'City must be at least 2 characters';
      if (data.phone.length < 6) return 'Phone must be at least 6 characters';
      if (data.fullName.length > 120) return 'Full name is too long (max 120 characters)';
      if (data.address.length > 240) return 'Address is too long (max 240 characters)';
      if (data.city.length > 80) return 'City is too long (max 80 characters)';
      if (data.phone.length > 30) return 'Phone is too long (max 30 characters)';
      return undefined;
    },
    []
  );

  const handleNameBlur = useCallback(() => {
    setNameError(validateName(name));
  }, [name, validateName]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

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

  const clearMessagesSoon = useCallback(() => {
    setTimeout(() => setSuccessMessage(''), 3000);
    setTimeout(() => setErrorMessage(''), 5000);
  }, []);

  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedPhone = sanitizeInput(phone.trim());
      const sanitizedBio = sanitizeInput(bio.trim());
      const nameValidationError = validateName(sanitizedName);
      const phoneValidationError = validatePhone(sanitizedPhone);

      if (nameValidationError) {
        setNameError(nameValidationError);
        return;
      }

      if (phoneValidationError) {
        setErrorMessage(phoneValidationError);
        clearMessagesSoon();
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const payload: {
          name?: string;
          profilePictureUrl?: string;
          phone?: string;
          bio?: string;
        } = {};

        if (sanitizedName !== currentUser.name) {
          payload.name = sanitizedName;
        }

        if (sanitizedPhone !== (currentUser.phone || '')) {
          payload.phone = sanitizedPhone;
        }

        if (sanitizedBio !== (currentUser.bio || '')) {
          payload.bio = sanitizedBio;
        }

        if (newProfilePictureFile && profilePicture) {
          const sanitizedImage = sanitizeUrl(profilePicture) || profilePicture;
          payload.profilePictureUrl = sanitizedImage;
        }

        if (Object.keys(payload).length > 0) {
          await updateProfile(payload);
          setSuccessMessage('Profile updated successfully!');
          setNewProfilePictureFile(null);
        } else {
          setSuccessMessage('No changes to save.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save profile';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
        clearMessagesSoon();
      }
    },
    [
      bio,
      clearMessagesSoon,
      currentUser,
      name,
      newProfilePictureFile,
      phone,
      profilePicture,
      updateProfile,
      validateName,
    ]
  );

  const handleSaveAddress = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      const sanitizedAddress = {
        fullName: sanitizeInput(addressFullName.trim()),
        address: sanitizeInput(addressLine.trim()),
        city: sanitizeInput(addressCity.trim()),
        phone: sanitizeInput(addressPhone.trim()),
      };

      const validationError = validateShippingAddress(sanitizedAddress);
      if (validationError) {
        setErrorMessage(validationError);
        clearMessagesSoon();
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        await updateProfile({
          defaultShippingAddress: sanitizedAddress,
        });

        setSuccessMessage('Address saved successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save address';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
        clearMessagesSoon();
      }
    },
    [
      addressCity,
      addressFullName,
      addressLine,
      addressPhone,
      clearMessagesSoon,
      currentUser,
      updateProfile,
      validateShippingAddress,
    ]
  );

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPassword || !newPassword || !confirmPassword) {
        setErrorMessage('Please fill out all password fields');
        clearMessagesSoon();
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation do not match');
        clearMessagesSoon();
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        await changePassword(currentPassword, newPassword);
        setSuccessMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to change password';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
        clearMessagesSoon();
      }
    },
    [changePassword, clearMessagesSoon, confirmPassword, currentPassword, newPassword]
  );

  const handleDeleteAccount = useCallback(async () => {
    const approved = await confirm({
      title: 'Delete Account',
      message: 'This action is permanent and cannot be undone. Do you want to continue?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!approved) {
      return;
    }

    const password = currentUser?.socialProvider ? undefined : currentPassword;

    setIsLoading(true);
    try {
      await deleteAccount(password);
      toast.success('Your account has been deleted');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      setErrorMessage(message);
      clearMessagesSoon();
    } finally {
      setIsLoading(false);
    }
  }, [
    clearMessagesSoon,
    confirm,
    currentPassword,
    currentUser?.socialProvider,
    deleteAccount,
    navigate,
    toast,
  ]);

  const handleReorder = useCallback(
    (order: Order) => {
      order.items.forEach((item) => {
        for (let count = 0; count < item.quantity; count += 1) {
          addToCart(item);
        }
      });
      toast.success('Items from your past order were added to your cart!');
    },
    [addToCart, toast]
  );

  const handleProfilePictureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!currentUser) {
    return null;
  }

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Edit Profile' },
    { id: 'address', label: 'Address' },
    { id: 'security', label: 'Security' },
    { id: 'pets', label: `My Pets (${pets.length})` },
    { id: 'vaccinations', label: '🐾 Vaccinations' },
    { id: 'tools', label: '✨ Tools' },
    { id: 'wishlist', label: `Wishlist (${wishlistedProducts.length})` },
    { id: 'orders', label: `Orders (${currentUser.orderHistory.length})` },
  ];

  const memberSince = new Date(Number(currentUser.id) || Date.now()).toLocaleDateString();

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="glass-card-ios p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="relative w-fit mx-auto lg:mx-0">
              <button
                type="button"
                onClick={handleProfilePictureClick}
                className="rounded-full focus:outline-none ring-2 ring-transparent hover:ring-orange-400 transition-all"
                aria-label="Change profile picture"
              >
                <Avatar
                  src={profilePicture || currentUser.profilePictureUrl}
                  name={currentUser.name}
                  size="xl"
                  showPlusBadge={currentUser.isPlusMember}
                />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0 text-center lg:text-left">
              <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white truncate">
                  {currentUser.name}
                </h1>
                {currentUser.socialProvider === 'google' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Google Account
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 truncate">{currentUser.email}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Member since {memberSince}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {currentUser.orderHistory.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Orders</p>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {wishlistedProducts.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Wishlist</p>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-white">{pets.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pets</p>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {upcomingVaccinations.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming Shots</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => void refreshProfile()}
              disabled={isRefreshing}
              className="text-sm px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
          <aside className="glass-card-ios p-2 sm:p-3 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          <div className="glass-card-ios p-4 sm:p-6 md:p-8 transition-all duration-300">
            {successMessage && (
              <p className="mb-4 bg-green-100/80 text-green-800 dark:bg-green-500/30 dark:text-green-200 p-3 rounded-lg text-center text-sm">
                {successMessage}
              </p>
            )}
            {errorMessage && (
              <p className="mb-4 bg-red-100/80 text-red-700 dark:bg-red-500/30 dark:text-red-200 p-3 rounded-lg text-center text-sm">
                {errorMessage}
              </p>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                    Overview
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Your latest activity and quick actions in one place.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500">Recent Orders</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {recentOrders.length}
                    </p>
                  </div>
                  <div className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500">Wishlist Items</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {wishlistedProducts.length}
                    </p>
                  </div>
                  <div className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500">My Pets</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {pets.length}
                    </p>
                  </div>
                  <div className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
                    <p className="text-xs text-slate-500">Vaccinations (30d)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {upcomingVaccinations.length}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <Link
                    to="/shop"
                    className="block text-center bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Shop Now
                  </Link>
                  <Link
                    to="/services"
                    className="block text-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Book Vet
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block text-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Manage Pets
                  </Link>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-white">Latest Orders</h3>
                  {recentOrders.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      No recent orders yet.
                    </p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.orderId}
                        className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center gap-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                            {order.orderId}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            ৳{order.total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5" noValidate>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Profile</h2>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 ${
                      nameError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}

            {activeTab === 'address' && (
              <form onSubmit={handleSaveAddress} className="space-y-5">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Shipping Address
                </h2>

                <input
                  value={addressFullName}
                  onChange={(e) => setAddressFullName(e.target.value)}
                  placeholder="Full Name"
                  required
                  minLength={2}
                  maxLength={120}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                />
                <input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Address"
                  required
                  minLength={5}
                  maxLength={240}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="City"
                    required
                    minLength={2}
                    maxLength={80}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                  <input
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    placeholder="Phone"
                    required
                    minLength={6}
                    maxLength={30}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                >
                  {isLoading ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Security</h2>

                  {currentUser.socialProvider ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      You signed up with Google. Password change may not apply unless you also use
                      email/password login.
                    </p>
                  ) : null}

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                  >
                    {isLoading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>

                <div className="border border-red-300/60 dark:border-red-500/40 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                  <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    Deleting your account is permanent.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAccount()}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Pets</h2>
                  <Link
                    to="/dashboard"
                    className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Manage in Dashboard
                  </Link>
                </div>

                {pets.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    No pet profiles yet. Add your first pet in the dashboard.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pets.map((pet) => (
                      <div
                        key={pet.id}
                        className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={pet.imageUrl} name={pet.name} size="lg" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white truncate">
                              {pet.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {pet.breed || pet.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                  My Wishlist
                </h2>
                {wishlistedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {wishlistedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                    Your wishlist is empty.{' '}
                    <Link to="/shop" className="text-orange-600 hover:underline">
                      Explore products!
                    </Link>
                  </p>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Orders</h2>

                {reorderSuggestions.length > 0 && (
                  <div className="rounded-lg border border-orange-300/50 bg-orange-50/60 dark:bg-orange-900/20 dark:border-orange-500/30 p-3">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Smart reorder available for {reorderSuggestions.length} previous orders.
                    </p>
                  </div>
                )}

                {currentUser.orderHistory.length > 0 ? (
                  <div className="space-y-3">
                    {currentUser.orderHistory.map((order) => (
                      <div
                        key={order.orderId}
                        className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4"
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
                        <div className="flex justify-between items-center mb-3 text-xs sm:text-sm">
                          <p className="text-slate-500 dark:text-slate-400">
                            Date: {new Date(order.date).toLocaleDateString()}
                          </p>
                          {order.status && (
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : order.status === 'cancelled' || order.status === 'refunded'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          )}
                        </div>
                        <ul className="text-xs sm:text-sm space-y-1 mb-3">
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
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="w-full sm:w-auto bg-orange-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                        >
                          Reorder Items
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                    You haven't made any purchases yet.{' '}
                    <Link to="/shop" className="text-orange-600 hover:underline">
                      Visit the shop!
                    </Link>
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
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
