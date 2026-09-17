import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import {
  usePetManagement,
  type PetProfile,
  type MedicineReminder,
} from '../contexts/PetManagementContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useAnimals } from '../contexts/AnimalContext';
import { useRecentlyViewed } from '../contexts/RecentlyViewedContext';
import ProductCard from '../components/ProductCard';
import PostCard from '../components/PostCard';
import type { Post, Order } from '../types';
import * as postService from '../services/postService';
import { apiRequest } from '../services/apiClient';
import { realtimeService } from '../services/realtimeService';
import { safeStorage } from '../lib/storage';
import AnimalCard from '../components/AnimalCard';
import Avatar from '../components/Avatar';
import PetTools from '../components/PetTools';
import DeliveryAreaChecker from '../components/DeliveryAreaChecker';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageIcon,
  HeartIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  EditIcon,
  LoaderIcon,
  BookmarkIcon,
  ChatBubbleIcon,
  PawIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/icons';

type ProfileTab =
  | 'overview'
  | 'orders'
  | 'pets'
  | 'reminders'
  | 'wishlist'
  | 'saved'
  | 'posts'
  | 'settings';

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'reminder' | 'urgent' | 'info';
  timestamp: string;
  isRead: boolean;
  linkTab?: ProfileTab;
}

const InlineEditField: React.FC<{
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: string;
  multiline?: boolean;
}> = ({ label, value, onSave, type = 'text', multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = async () => {
    if (isSaving) return;
    if (currentValue === value || (!currentValue.trim() && !value)) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(currentValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save field:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleSave();
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="group flex flex-col gap-1.5 transition-all">
      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1">
        {label}
      </label>
      <div className="flex items-start gap-2 max-w-lg min-h-[44px]">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: -5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative flex-1 flex items-center gap-2"
            >
              {multiline ? (
                <textarea
                  autoFocus
                  value={currentValue}
                  onChange={(e) => setCurrentValue((e.target as HTMLTextAreaElement).value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-slate-200 dark:border-zinc-700/50 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/50 shadow-sm disabled:opacity-50 transition-all resize-none"
                  rows={3}
                />
              ) : (
                <input
                  autoFocus
                  type={type}
                  value={currentValue}
                  onChange={(e) => setCurrentValue((e.target as HTMLInputElement).value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-slate-200 dark:border-zinc-700/50 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/50 shadow-sm disabled:opacity-50 transition-all"
                />
              )}
              {isSaving && (
                <div className="absolute right-4">
                  <LoaderIcon className="w-5 h-5 animate-spin text-amber-500" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-between px-4 py-3 -ml-4 rounded-2xl hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/50 backdrop-blur-sm"
            >
              <span
                className={`text-sm font-medium ${
                  currentValue ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400 italic'
                }`}
              >
                {currentValue || `Click to add ${label.toLowerCase()}`}
              </span>
              <div className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                <EditIcon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ORDER_TIMELINE_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const getStatusStepIndex = (status?: string): number => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
};

const calculatePetAge = (birthDate?: string): string => {
  if (!birthDate) return 'Age unknown';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 'Age unknown';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years <= 0 && months <= 0) return 'Newborn';
  if (years <= 0) return `${months} mo${months > 1 ? 's' : ''} old`;
  if (months === 0) return `${years} yr${years > 1 ? 's' : ''} old`;
  return `${years} yr${years > 1 ? 's' : ''}, ${months} mo${months > 1 ? 's' : ''}`;
};

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, isAuthenticated, fetchProfile, logout, deleteAccount } =
    useAuth();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const {
    pets,
    addPet,
    deletePet,
    medicineReminders,
    addMedicineReminder,
    deleteMedicineReminder,
    markMedicineGiven,
    getUpcomingReminders,
    getOverdueReminders,
  } = usePetManagement();
  const { animals } = useAnimals();
  const { recentlyViewed } = useRecentlyViewed();
  const { confirm } = useConfirmation();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [recentlyUpdatedOrderId, setRecentlyUpdatedOrderId] = useState<string | null>(null);

  // Modals state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Password Confirmation Modal for Non-Social Account Deletion
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState('');
  const [showDeletionPassword, setShowDeletionPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  // Add Pet Modal
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetType, setNewPetType] = useState<
    'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'other'
  >('dog');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetWeight, setNewPetWeight] = useState<string>('');
  const [newPetBirthDate, setNewPetBirthDate] = useState('');
  const [newPetGender, setNewPetGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [isSavingPet, setIsSavingPet] = useState(false);

  // Add Reminder Modal
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [reminderPetId, setReminderPetId] = useState('');
  const [reminderMedName, setReminderMedName] = useState('');
  const [reminderDosage, setReminderDosage] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'custom'
  >('daily');
  const [reminderNextDueDate, setReminderNextDueDate] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  // Notifications
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem(`petbhai_read_notifs_${currentUser?.id || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const markNotificationAsRead = useCallback(
    (id: string) => {
      setReadNotificationIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        try {
          safeStorage.setItem(
            `petbhai_read_notifs_${currentUser?.id || 'guest'}`,
            JSON.stringify(next)
          );
        } catch {
          // ignore storage error
        }
        return next;
      });
    },
    [currentUser?.id]
  );

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = activeNotifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      safeStorage.setItem(
        `petbhai_read_notifs_${currentUser?.id || 'guest'}`,
        JSON.stringify(allIds)
      );
    } catch {
      // ignore
    }
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load orders from API or fallback to currentUser.orderHistory
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoadingOrders(true);
      try {
        const fetched = await apiRequest<Order[]>('/orders/my-orders');
        if (Array.isArray(fetched)) {
          setOrders(fetched);
          return fetched;
        }
        throw new Error('Non-array orders returned');
      } catch {
        // Fallback to currentUser orderHistory
        if (currentUser?.orderHistory && Array.isArray(currentUser.orderHistory)) {
          setOrders(currentUser.orderHistory);
          return currentUser.orderHistory;
        }
      } finally {
        if (!silent) setIsLoadingOrders(false);
      }
      return [];
    },
    [currentUser?.orderHistory]
  );

  useEffect(() => {
    if (isAuthenticated) {
      void fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Real-time subscriptions & cross-tab synchronization
  useEffect(() => {
    // 1. Subscribe to realtimeService events (BroadcastChannel + local)
    const unsubscribe = realtimeService.subscribe('*', (envelope) => {
      if (
        envelope.event === 'order-updated' ||
        envelope.event === 'order-cancelled' ||
        envelope.event === 'order-created'
      ) {
        const payload = envelope.payload;
        if (payload?.orderId) {
          setRecentlyUpdatedOrderId(payload.orderId);
          setTimeout(() => {
            setRecentlyUpdatedOrderId((prev) => (prev === payload.orderId ? null : prev));
          }, 4500);

          setOrders((prev) => {
            const index = prev.findIndex((o) => o.orderId === payload.orderId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: payload.status || updated[index].status,
                trackingNumber: payload.trackingNumber || updated[index].trackingNumber,
                carrier: payload.carrier || updated[index].carrier,
                statusHistory: payload.statusHistory ||
                  updated[index].statusHistory || [
                    ...(updated[index].statusHistory || []),
                    {
                      status: payload.status,
                      timestamp: envelope.timestamp,
                      note: payload.note,
                    },
                  ],
              };
              return updated;
            } else if (payload.order) {
              return [payload.order, ...prev];
            }
            return prev;
          });
        }
        void fetchOrders(true);
      } else if (envelope.event === 'profile-updated') {
        void fetchProfile({ silent: true }).catch(() => undefined);
      }
    });

    // 2. Storage event listener for cross-tab sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'petbhai_currentUser' && e.newValue) {
        void fetchProfile({ silent: true }).catch(() => undefined);
      }
      if (e.key === 'petbhai_pet_management') {
        // Automatically handled through React context
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchOrders, fetchProfile]);

  // Community posts loading
  useEffect(() => {
    let ignore = false;
    if (activeTab === 'posts' && currentUser) {
      setIsLoadingPosts(true);
      setPostsError(null);
      postService
        .fetchPostsPage(undefined, 20, currentUser.id)
        .then((res) => {
          if (!ignore) setUserPosts(res.items);
        })
        .catch((err: any) => {
          if (!ignore) setPostsError(err.message || 'Failed to load posts.');
        })
        .finally(() => {
          if (!ignore) setIsLoadingPosts(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, currentUser]);

  const toggleOrder = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProfile().catch((err) => {
      console.error('Profile fetch failed silently:', err);
    });
  }, [isAuthenticated, fetchProfile]);

  const wishlistedProducts = useMemo(() => {
    if (!currentUser) return [];
    return products.filter((p) => currentUser.wishlist?.includes(p.id));
  }, [currentUser, products]);

  const savedAnimals = useMemo(() => {
    if (!currentUser) return [];
    const favorites = currentUser.favorites || [];
    return animals.filter((a) => favorites.includes(a.id));
  }, [animals, currentUser]);

  const recentProducts = useMemo(() => {
    return recentlyViewed.map((item) => products.find((p) => p.id === item.id) || item).slice(0, 4);
  }, [recentlyViewed, products]);

  // Dynamic Notifications calculation
  const activeNotifications = useMemo<UserNotification[]>(() => {
    const list: UserNotification[] = [];

    // Order status notifications
    orders.forEach((o) => {
      const orderId = o.orderId;
      if (o.status === 'shipped') {
        list.push({
          id: `order-shipped-${orderId}`,
          title: `Order #${orderId} Shipped!`,
          message: `Your items are on the way.${
            o.trackingNumber ? ` Tracking #: ${o.trackingNumber}` : ''
          }`,
          type: 'order',
          timestamp: o.date,
          isRead: readNotificationIds.includes(`order-shipped-${orderId}`),
          linkTab: 'orders',
        });
      } else if (o.status === 'confirmed') {
        list.push({
          id: `order-conf-${orderId}`,
          title: `Order #${orderId} Confirmed`,
          message: `Order verified and queued for dispatch.`,
          type: 'order',
          timestamp: o.date,
          isRead: readNotificationIds.includes(`order-conf-${orderId}`),
          linkTab: 'orders',
        });
      }
    });

    // Overdue Pet Reminders
    const overdue = getOverdueReminders();
    overdue.forEach((rem) => {
      const pet = pets.find((p) => p.id === rem.petId);
      list.push({
        id: `rem-overdue-${rem.id}`,
        title: `Overdue: ${rem.medicineName}`,
        message: `Medication for ${pet?.name || 'your pet'} is past due (${new Date(
          rem.nextDueDate
        ).toLocaleDateString()}).`,
        type: 'urgent',
        timestamp: rem.nextDueDate,
        isRead: readNotificationIds.includes(`rem-overdue-${rem.id}`),
        linkTab: 'reminders',
      });
    });

    // Upcoming reminders due in 48h
    const upcoming = getUpcomingReminders(2);
    upcoming.forEach((rem) => {
      const pet = pets.find((p) => p.id === rem.petId);
      list.push({
        id: `rem-due-${rem.id}`,
        title: `Reminder: ${rem.medicineName}`,
        message: `Scheduled dosage (${rem.dosage}) due on ${new Date(
          rem.nextDueDate
        ).toLocaleDateString()} for ${pet?.name || 'your pet'}.`,
        type: 'reminder',
        timestamp: rem.nextDueDate,
        isRead: readNotificationIds.includes(`rem-due-${rem.id}`),
        linkTab: 'reminders',
      });
    });

    // Sort: unread first, then by timestamp desc
    return list.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [orders, pets, getOverdueReminders, getUpcomingReminders, readNotificationIds]);

  const unreadNotificationCount = useMemo(
    () => activeNotifications.filter((n) => !n.isRead).length,
    [activeNotifications]
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleUpdate = async (field: string, value: string, isAddress = false) => {
    try {
      const payload = isAddress
        ? {
            defaultShippingAddress: {
              fullName: currentUser.defaultShippingAddress?.fullName || currentUser.name || '',
              address: currentUser.defaultShippingAddress?.address || '',
              city: currentUser.defaultShippingAddress?.city || '',
              phone: currentUser.defaultShippingAddress?.phone || '',
              [field]: value,
            },
          }
        : { [field]: value };
      const updatedUser = await updateProfile(payload as any);
      if (updatedUser) {
        toast.success(`Saved successfully`);
        realtimeService.broadcast('profile-updated', { user: updatedUser });
      }
    } catch {
      toast.error('Failed to save changes. Please check input values.');
    }
  };

  // Reorder / Buy Again
  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error('No items found in this order.');
      return;
    }
    order.items.forEach((item) => {
      addToCart(item);
    });
    toast.success(`Added ${order.items.length} items from Order #${order.orderId} to your cart!`);
  };

  // Cancel Order Modal Handlers
  const handleOpenCancelModal = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelReason('Changed my mind / Need to update items');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const res = await apiRequest<{ message: string; order: Order }>(
        `/orders/${encodeURIComponent(orderToCancel)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      toast.success(res?.message || 'Order cancelled successfully');
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderToCancel ? { ...o, status: 'cancelled' } : o))
      );
      realtimeService.broadcast('order-cancelled', {
        orderId: orderToCancel,
        status: 'cancelled',
        note: cancelReason,
      });
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Account Deletion Handlers
  const handleDeleteAccountClick = async () => {
    // If social provider, password is not required
    if (currentUser.socialProvider) {
      const isConfirmed = await confirm({
        title: 'Delete Account',
        message:
          'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data, orders, and pet profiles.',
        confirmText: 'Yes, Delete My Account',
        cancelText: 'Cancel',
      });

      if (isConfirmed) {
        try {
          await deleteAccount();
          toast.success('Account deleted successfully');
          navigate('/');
        } catch {
          toast.error('Failed to delete account. Please try again.');
        }
      }
    } else {
      // Non-social user: prompt password confirmation modal
      setDeletionPassword('');
      setDeletionError(null);
      setIsPasswordModalOpen(true);
    }
  };

  const handleConfirmPasswordDeletion = async () => {
    if (!deletionPassword) {
      setDeletionError('Please enter your password to confirm deletion.');
      return;
    }
    setIsDeletingAccount(true);
    setDeletionError(null);
    try {
      await deleteAccount(deletionPassword);
      toast.success('Account deleted successfully');
      setIsPasswordModalOpen(false);
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete account. Please check your password.';
      setDeletionError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Quick Add Pet Submit
  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) {
      toast.error('Pet name is required');
      return;
    }
    setIsSavingPet(true);
    try {
      const weightNum = parseFloat(newPetWeight);
      const createdPet = await addPet({
        name: newPetName.trim(),
        type: newPetType,
        breed: newPetBreed.trim() || undefined,
        weight: !isNaN(weightNum) ? weightNum : undefined,
        birthDate: newPetBirthDate || undefined,
        gender: newPetGender,
        activityLevel: 'medium',
      });

      toast.success(`${createdPet.name} has been added!`);
      realtimeService.broadcast('pet-added', { pet: createdPet });
      setIsAddPetOpen(false);
      setNewPetName('');
      setNewPetBreed('');
      setNewPetWeight('');
      setNewPetBirthDate('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add pet');
    } finally {
      setIsSavingPet(false);
    }
  };

  // Quick Add Reminder Submit
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderPetId) {
      toast.error('Please select a pet');
      return;
    }
    if (!reminderMedName.trim()) {
      toast.error('Medicine/Treatment name is required');
      return;
    }
    if (!reminderNextDueDate) {
      toast.error('Next due date is required');
      return;
    }
    setIsSavingReminder(true);
    try {
      const createdRem = await addMedicineReminder({
        petId: reminderPetId,
        medicineName: reminderMedName.trim(),
        dosage: reminderDosage.trim() || '1 dose',
        frequency: reminderFrequency,
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: reminderNextDueDate,
        notes: reminderNotes.trim() || undefined,
        isActive: true,
        notificationEnabled: true,
      });

      toast.success(`Reminder set for ${createdRem.medicineName}!`);
      realtimeService.broadcast('reminder-added', { reminder: createdRem });
      setIsAddReminderOpen(false);
      setReminderMedName('');
      setReminderDosage('');
      setReminderNextDueDate('');
      setReminderNotes('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add reminder');
    } finally {
      setIsSavingReminder(false);
    }
  };

  const navItems = [
    { id: 'overview', icon: <UserIcon />, label: 'Overview' },
    { id: 'orders', icon: <PackageIcon />, label: 'Orders', badge: orders.length },
    { id: 'pets', icon: <PawIcon />, label: 'My Pets', badge: pets.length },
    {
      id: 'reminders',
      icon: <ClockIcon />,
      label: 'Reminders',
      badge: medicineReminders.filter((r) => r.isActive).length,
    },
    { id: 'wishlist', icon: <HeartIcon />, label: 'Wishlist', badge: wishlistedProducts.length },
    { id: 'saved', icon: <BookmarkIcon />, label: 'Saved' },
    { id: 'posts', icon: <ChatBubbleIcon />, label: 'Community' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 lg:gap-10">
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2 relative">
          <div className="flex md:hidden items-center gap-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shadow-sm mb-2">
            <Avatar
              src={currentUser.profilePictureUrl}
              name={currentUser.name}
              size="md"
              className="ring-2 ring-amber-100 dark:ring-amber-500/20"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                {currentUser.name}
              </h2>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="sticky top-[4.5rem] z-30 md:static -mx-4 px-4 py-3 md:p-0 md:mx-0 bg-slate-50/90 dark:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b border-slate-200/50 dark:border-none md:border-transparent dark:bg-zinc-950/90 mb-4 md:mb-0 transition-all">
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide snap-x">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative shrink-0 snap-start flex items-center justify-between px-4 py-2.5 md:py-3 rounded-2xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-amber-800 dark:text-amber-300 font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profile-tab-active"
                        className="absolute inset-0 bg-amber-100/70 dark:bg-amber-500/10 rounded-2xl z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2.5 relative z-10 w-full md:w-auto">
                      <span
                        className={`[&>svg]:w-4 [&>svg]:h-4 ${
                          isActive ? 'opacity-100' : 'opacity-70'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {(item as any).badge !== undefined && (item as any).badge > 0 && (
                      <span className="relative z-10 ml-3 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 text-[10px] font-bold">
                        {(item as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col gap-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-8 shadow-sm"
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <header className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800/50">
                    <Avatar
                      src={currentUser.profilePictureUrl}
                      name={currentUser.name}
                      size="xl"
                      className="ring-4 ring-slate-50 dark:ring-zinc-800"
                    />
                    <div>
                      <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                        {(() => {
                          const hour = new Date().getHours();
                          if (hour < 12) return 'Good morning';
                          if (hour < 18) return 'Good afternoon';
                          return 'Good evening';
                        })()}
                        , <span className="text-amber-500">{currentUser.name.split(' ')[0]}</span>!
                      </h1>
                      <div className="flex items-center gap-3 mt-1.5 opacity-80">
                        <span className="inline-flex py-0.5 px-2.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {['super_admin', 'store_manager', 'moderator', 'admin'].includes(
                            currentUser.role || ''
                          )
                            ? 'Admin'
                            : currentUser.isPlusMember
                              ? 'PetBhai Plus'
                              : 'Customer'}
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-6">
                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">
                          Personal Details
                        </h3>
                        <div className="space-y-4">
                          <InlineEditField
                            label="Full Name"
                            value={currentUser.name}
                            onSave={(val) => handleUpdate('name', val)}
                          />
                          <InlineEditField
                            label="Phone"
                            value={currentUser.phone || ''}
                            type="tel"
                            onSave={(val) => handleUpdate('phone', val)}
                          />
                          <InlineEditField
                            label="Bio"
                            value={currentUser.bio || ''}
                            multiline
                            onSave={(val) => handleUpdate('bio', val)}
                          />
                        </div>
                      </div>

                      {/* DYNAMIC NOTIFICATION CENTER */}
                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between mb-4 pl-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                              Notification Center
                            </h3>
                            {unreadNotificationCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                                {unreadNotificationCount} new
                              </span>
                            )}
                          </div>
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {activeNotifications.length === 0 ? (
                          <div className="text-sm text-slate-500 dark:text-zinc-400 py-6 text-center bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100/50 dark:border-zinc-800">
                            <CheckCircleIcon className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                            <p>You're all caught up!</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                            {activeNotifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  markNotificationAsRead(n.id);
                                  if (n.linkTab) setActiveTab(n.linkTab);
                                }}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                  n.isRead
                                    ? 'bg-white/60 dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800/60 opacity-70 hover:opacity-100'
                                    : 'bg-white dark:bg-zinc-900 border-amber-200/80 dark:border-amber-500/30 shadow-xs'
                                }`}
                              >
                                <span
                                  className={`p-2 rounded-xl text-xs shrink-0 ${
                                    n.type === 'urgent'
                                      ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
                                      : n.type === 'order'
                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                                  }`}
                                >
                                  {n.type === 'urgent' ? '⚠️' : n.type === 'order' ? '📦' : '🔔'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                                      {n.title}
                                    </h4>
                                    {!n.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                    {n.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">
                          Shipping Address
                        </h3>
                        <div className="space-y-4 pt-1">
                          <InlineEditField
                            label="Recipient Name"
                            value={currentUser.defaultShippingAddress?.fullName || currentUser.name}
                            onSave={(val) => handleUpdate('fullName', val, true)}
                          />
                          <InlineEditField
                            label="Address"
                            value={currentUser.defaultShippingAddress?.address || ''}
                            multiline
                            onSave={(val) => handleUpdate('address', val, true)}
                          />
                          <InlineEditField
                            label="City"
                            value={currentUser.defaultShippingAddress?.city || ''}
                            onSave={(val) => handleUpdate('city', val, true)}
                          />
                          <InlineEditField
                            label="Contact Phone"
                            value={currentUser.defaultShippingAddress?.phone || ''}
                            type="tel"
                            onSave={(val) => handleUpdate('phone', val, true)}
                          />
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
                          <DeliveryAreaChecker compact />
                        </div>
                      </div>

                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">
                          Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <Link
                            to="/services"
                            className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-amber-700 dark:text-amber-500 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
                          >
                            Book Vet
                          </Link>
                          <Link
                            to="/dashboard"
                            className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-emerald-700 dark:text-emerald-500 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
                          >
                            AI Pet Health
                          </Link>
                          <button
                            onClick={() => setActiveTab('pets')}
                            className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
                          >
                            My Pets ({pets.length})
                          </button>
                          <button
                            onClick={() => setActiveTab('settings')}
                            className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
                          >
                            Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Order History & Real-Time Tracking
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Live synced updates across all active orders
                      </p>
                    </div>
                    <button
                      onClick={() => void fetchOrders()}
                      disabled={isLoadingOrders}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                      {isLoadingOrders ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> : '🔄'}{' '}
                      Refresh
                    </button>
                  </div>

                  {isLoadingOrders && orders.length === 0 ? (
                    <div className="py-16 text-center">
                      <LoaderIcon className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                      <PackageIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        You haven't placed any orders yet.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-block mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order, i) => {
                        const orderId =
                          order.orderId || (order as any)._id || (order as any).id || `ORD-${i}`;
                        const isExpanded = expandedOrderIds[orderId];
                        const isRecentlyUpdated = recentlyUpdatedOrderId === orderId;
                        const activeStepIdx = getStatusStepIndex(order.status);
                        const isCancelled = order.status === 'cancelled';
                        const isRefunded = order.status === 'refunded';
                        const canCancel =
                          order.status === 'pending' || order.status === 'confirmed';

                        return (
                          <div
                            key={orderId}
                            className={`p-5 rounded-3xl border transition-all duration-500 ${
                              isRecentlyUpdated
                                ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-lg'
                                : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/20 hover:shadow-sm'
                            }`}
                          >
                            {/* Order Header */}
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <p className="text-base font-black text-slate-800 dark:text-white">
                                    Order #{orderId}
                                  </p>
                                  <span
                                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      order.status === 'delivered'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : isCancelled || isRefunded
                                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                    }`}
                                  >
                                    {order.status || 'Pending'}
                                  </span>
                                  {isRecentlyUpdated && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-emerald-500 text-white animate-pulse">
                                      UPDATED JUST NOW
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                                  Placed on {new Date(order.date).toLocaleDateString()} at{' '}
                                  {new Date(order.date).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <div className="text-xs mt-2 flex items-center gap-3 opacity-80 flex-wrap">
                                  <span className="font-medium text-slate-600 dark:text-zinc-300">
                                    {order.items.length} items
                                  </span>
                                  <span>•</span>
                                  <span className="font-medium text-slate-600 dark:text-zinc-300">
                                    Payment: {order.paymentMethod || 'Cash on Delivery'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3">
                                <span className="font-black text-xl text-slate-800 dark:text-emerald-400">
                                  ৳{order.total.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleOrder(orderId)}
                                    className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:underline"
                                  >
                                    {isExpanded ? 'Hide details ↑' : 'View details ↓'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* INTERACTIVE TRACKING STEPPER */}
                            <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-zinc-800/80">
                              {isCancelled || isRefunded ? (
                                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
                                  <XCircleIcon className="w-5 h-5 shrink-0 text-red-500" />
                                  <div>
                                    <span className="font-bold">
                                      {isRefunded ? 'Order Refunded' : 'Order Cancelled'}:
                                    </span>{' '}
                                    {order.statusHistory?.[order.statusHistory.length - 1]?.note ||
                                      'This order has been cancelled.'}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center relative">
                                    {ORDER_TIMELINE_STEPS.map((step, idx) => {
                                      const isPassed = idx < activeStepIdx;
                                      const isCurrent = idx === activeStepIdx;
                                      const stepHistory = order.statusHistory?.find(
                                        (h) => h.status === step.key
                                      );

                                      return (
                                        <div
                                          key={step.key}
                                          className="flex flex-col items-center relative z-10"
                                        >
                                          <div
                                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                              isPassed
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : isCurrent
                                                  ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-500/20 animate-pulse'
                                                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                                            }`}
                                          >
                                            {isPassed ? '✓' : idx + 1}
                                          </div>
                                          <span
                                            className={`text-[10px] sm:text-xs font-bold mt-1.5 ${
                                              isCurrent
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : isPassed
                                                  ? 'text-slate-800 dark:text-zinc-200'
                                                  : 'text-slate-400 dark:text-zinc-500'
                                            }`}
                                          >
                                            {step.label}
                                          </span>
                                          {stepHistory?.timestamp && (
                                            <span className="hidden sm:block text-[9px] text-slate-400 mt-0.5">
                                              {new Date(stepHistory.timestamp).toLocaleDateString(
                                                [],
                                                { month: 'short', day: 'numeric' }
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Tracking Details Banner */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-600 dark:text-zinc-300">
                                        🚚 Courier:
                                      </span>
                                      {order.trackingNumber ? (
                                        <span className="font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-700/40">
                                          {order.carrier ? `${order.carrier}: ` : ''}
                                          {order.trackingNumber}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">
                                          Pending dispatch assignment
                                        </span>
                                      )}
                                    </div>
                                    {order.estimatedDelivery && (
                                      <div className="text-slate-500 dark:text-zinc-400 font-medium">
                                        📅 Est. Delivery:{' '}
                                        <span className="text-slate-700 dark:text-zinc-200 font-bold">
                                          {new Date(order.estimatedDelivery).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expanded items & actions view */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-4">
                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Order Items
                                </h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center bg-white dark:bg-zinc-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                          <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal"
                                          />
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 line-clamp-1">
                                            {item.name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 dark:text-zinc-500">
                                            Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-emerald-400">
                                        ৳{(item.price * item.quantity).toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                {/* Order Action Buttons */}
                                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                                  <button
                                    onClick={() => setReceiptOrder(order)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors shadow-xs"
                                  >
                                    🧾 Print Receipt / Invoice
                                  </button>

                                  <button
                                    onClick={() => handleReorder(order)}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                                  >
                                    🛒 Buy Again / Reorder
                                  </button>

                                  {canCancel && (
                                    <button
                                      onClick={() => handleOpenCancelModal(orderId)}
                                      className="px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition-colors border border-red-200/60 dark:border-red-900/40"
                                    >
                                      Cancel Order
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MY PETS */}
              {activeTab === 'pets' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        My Registered Pets
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Manage your pets' vitals, vaccines, and AI health insights
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/dashboard"
                        className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
                      >
                        ⚡ AI Health Dashboard
                      </Link>
                      <button
                        onClick={() => setIsAddPetOpen(true)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> Add New Pet
                      </button>
                    </div>
                  </div>

                  {pets.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                      <PawIcon className="w-12 h-12 mx-auto text-amber-400 mb-3" />
                      <h3 className="text-base font-bold text-slate-700 dark:text-zinc-200">
                        No pets added yet
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
                        Register your pet to receive customized nutrition suggestions, medication
                        reminders, and full AI health diagnostics!
                      </p>
                      <button
                        onClick={() => setIsAddPetOpen(true)}
                        className="px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        + Add Your First Pet
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="p-5 rounded-3xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/20 flex flex-col justify-between gap-4 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-2xl flex items-center justify-center shrink-0">
                              {pet.type === 'cat'
                                ? '🐱'
                                : pet.type === 'bird'
                                  ? '🦜'
                                  : pet.type === 'rabbit'
                                    ? '🐰'
                                    : pet.type === 'hamster'
                                      ? '🐹'
                                      : pet.type === 'fish'
                                        ? '🐠'
                                        : '🐶'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                                  {pet.name}
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                  {pet.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {pet.breed || 'Unknown breed'} • {pet.gender}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className="text-slate-600 dark:text-zinc-300 font-semibold">
                                  🎂 {calculatePetAge(pet.birthDate)}
                                </span>
                                {pet.weight && (
                                  <span className="text-slate-600 dark:text-zinc-300 font-semibold">
                                    ⚖️ {pet.weight} kg
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                            <Link
                              to="/dashboard"
                              className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1"
                            >
                              AI Health & Diagnostics →
                            </Link>
                            <button
                              onClick={async () => {
                                const ok = await confirm({
                                  title: `Remove ${pet.name}`,
                                  message: `Are you sure you want to remove ${pet.name} from your profile?`,
                                  confirmText: 'Delete Pet',
                                  cancelText: 'Cancel',
                                });
                                if (ok) {
                                  await deletePet(pet.id);
                                  toast.success(`${pet.name} removed`);
                                  realtimeService.broadcast('pet-deleted', { petId: pet.id });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete pet"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HEALTH & REMINDERS */}
              {activeTab === 'reminders' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Health, Vaccines & Medication Reminders
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Never miss a medication, deworming, or vaccination appointment
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (pets.length === 0) {
                          toast.error('Please add a pet first before scheduling reminders.');
                          setActiveTab('pets');
                          return;
                        }
                        setReminderPetId(pets[0].id);
                        setIsAddReminderOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Add Reminder
                    </button>
                  </div>

                  {/* Overdue Alerts Section */}
                  {getOverdueReminders().length > 0 && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                        <ExclamationIcon className="w-4 h-4" />
                        <span>Overdue Reminders ({getOverdueReminders().length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getOverdueReminders().map((rem) => {
                          const pet = pets.find((p) => p.id === rem.petId);
                          return (
                            <div
                              key={rem.id}
                              className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-3 shadow-xs"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                  {rem.medicineName} ({rem.dosage})
                                </p>
                                <p className="text-[11px] text-red-600 dark:text-red-400">
                                  For {pet?.name || 'Pet'} • Due{' '}
                                  {new Date(rem.nextDueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  await markMedicineGiven(rem.id);
                                  toast.success(`Marked as given for ${pet?.name || 'your pet'}!`);
                                  realtimeService.broadcast('reminder-updated', {
                                    reminderId: rem.id,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
                              >
                                ✓ Mark Given
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All / Upcoming Reminders */}
                  {medicineReminders.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                      <ClockIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <h3 className="text-base font-bold text-slate-700 dark:text-zinc-200">
                        No reminders scheduled
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
                        Set recurring medication schedules, deworming dates, and vet visit alerts
                        for your pets.
                      </p>
                      <button
                        onClick={() => {
                          if (pets.length === 0) {
                            toast.error('Please add a pet first.');
                            setActiveTab('pets');
                            return;
                          }
                          setReminderPetId(pets[0].id);
                          setIsAddReminderOpen(true);
                        }}
                        className="px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        + Create Reminder
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicineReminders.map((rem) => {
                        const pet = pets.find((p) => p.id === rem.petId);
                        const isOverdue = rem.isActive && new Date(rem.nextDueDate) < new Date();

                        return (
                          <div
                            key={rem.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isOverdue
                                ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                                : 'bg-slate-50/60 dark:bg-zinc-800/30 border-slate-200/70 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                  isOverdue
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                                }`}
                              >
                                💊
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                                    {rem.medicineName}
                                  </h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                                    {rem.frequency}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-500 text-white">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                  Pet: <span className="font-semibold">{pet?.name || 'Pet'}</span> •
                                  Dosage: {rem.dosage} • Next Due:{' '}
                                  <span className="font-bold text-slate-700 dark:text-zinc-200">
                                    {new Date(rem.nextDueDate).toLocaleDateString()}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={async () => {
                                  await markMedicineGiven(rem.id);
                                  toast.success(`Dose marked as given for ${pet?.name || 'Pet'}!`);
                                  realtimeService.broadcast('reminder-updated', {
                                    reminderId: rem.id,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs"
                              >
                                ✓ Mark Given
                              </button>
                              <button
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: 'Delete Reminder',
                                    message: `Delete reminder for ${rem.medicineName}?`,
                                    confirmText: 'Delete',
                                    cancelText: 'Cancel',
                                  });
                                  if (ok) {
                                    await deleteMedicineReminder(rem.id);
                                    toast.success('Reminder deleted');
                                    realtimeService.broadcast('reminder-deleted', {
                                      reminderId: rem.id,
                                    });
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: WISHLIST */}
              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                    Your Wishlist
                  </h2>
                  {wishlistedProducts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                      <HeartIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                        Your wishlist is empty.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-block mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                      >
                        Explore Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {wishlistedProducts.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                        >
                          <ProductCard product={p} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SAVED */}
              {activeTab === 'saved' && (
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                      Saved Animals
                    </h2>
                    {savedAnimals.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <HeartIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                          You haven't saved any adoption animals.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {savedAnimals.map((a, i) => (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                          >
                            <AnimalCard animal={a} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                      Recently Viewed Products
                    </h2>
                    {recentProducts.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <PackageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                          Your viewing history is empty.
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {recentProducts.map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className="min-w-[160px] md:min-w-[200px] snap-center shrink-0"
                          >
                            <ProductCard product={p} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: COMMUNITY POSTS */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                    Your Posts
                  </h2>
                  {isLoadingPosts ? (
                    <div className="flex justify-center py-8">
                      <LoaderIcon className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  ) : postsError ? (
                    <div className="text-center py-12 rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                      <p className="text-red-500 dark:text-red-400">{postsError}</p>
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                      <ChatBubbleIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-4" />
                      <h3 className="text-lg font-medium text-slate-800 dark:text-zinc-200 mb-2">
                        No posts yet
                      </h3>
                      <p className="text-slate-500 dark:text-zinc-400">
                        You haven't posted anything in the community.
                      </p>
                      <Link
                        to="/community"
                        className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-medium transition-colors"
                      >
                        Go to Community
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {userPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onAddComment={() => {}}
                          onAddReply={() => {}}
                          onUpdateReply={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                    Account Settings
                  </h2>
                  <div className="p-5 rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-400">
                      Danger Zone
                    </h3>
                    <p className="text-xs text-red-600/80 dark:text-red-300/70 mt-1 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteAccountClick}
                      className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      <LogOutIcon className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {activeTab === 'overview' && pets && pets.length > 0 && (
            <div className="mt-4">
              <PetTools />
            </div>
          )}
        </section>
      </div>

      {/* MODAL 1: PRINT RECEIPT / INVOICE */}
      <AnimatePresence>
        {receiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 my-8"
              id="printable-receipt"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-2">
                    🐾 PetBhai
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
                    Official Tax & Purchase Receipt
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                    #{receiptOrder.orderId}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(receiptOrder.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <p className="font-bold text-slate-500 uppercase">Customer Information</p>
                  <p className="font-bold text-slate-800 dark:text-white mt-1">
                    {currentUser.name}
                  </p>
                  <p className="text-slate-500">{currentUser.email}</p>
                  <p className="text-slate-500">
                    {currentUser.defaultShippingAddress?.address || 'Dhaka, Bangladesh'}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase">Payment & Status</p>
                  <p className="font-medium text-slate-800 dark:text-white mt-1">
                    Method: {receiptOrder.paymentMethod || 'Cash on Delivery'}
                  </p>
                  <p className="text-slate-500">
                    Status:{' '}
                    <span className="capitalize font-bold text-amber-600">
                      {receiptOrder.status || 'Pending'}
                    </span>
                  </p>
                  {receiptOrder.trackingNumber && (
                    <p className="text-slate-500">Tracking: {receiptOrder.trackingNumber}</p>
                  )}
                </div>
              </div>

              <div className="py-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase font-bold">
                      <th className="pb-2">Item</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {receiptOrder.items.map((item, idx) => (
                      <tr key={idx} className="py-2">
                        <td className="py-2.5 font-medium text-slate-800 dark:text-zinc-200">
                          {item.name}
                        </td>
                        <td className="py-2.5 text-center text-slate-600 dark:text-zinc-400">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 text-right text-slate-600 dark:text-zinc-400">
                          ৳{item.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-800 dark:text-zinc-100">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 flex justify-between items-center">
                <p className="text-xs text-slate-400">Thank you for choosing PetBhai!</p>
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase font-bold">Total Amount: </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    ৳{receiptOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  🖨️ Print Now
                </button>
                <button
                  onClick={() => setReceiptOrder(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CANCEL ORDER */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cancel Order</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Are you sure you want to cancel order #{orderToCancel}? This action cannot be
                undone.
              </p>

              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                  Reason for cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Changed my mind / Need to update items">
                    Changed my mind / Need to update items
                  </option>
                  <option value="Order placed by mistake">Order placed by mistake</option>
                  <option value="Shipping time too long">Shipping time too long</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isCancelling && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Cancellation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PASSWORD CONFIRMATION FOR NON-SOCIAL ACCOUNT DELETION */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                <ExclamationIcon className="w-6 h-6" />
                <h3 className="text-lg font-bold">Confirm Account Deletion</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                To permanently delete your PetBhai account, please enter your password. This action
                is irreversible.
              </p>

              {deletionError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-300">
                  {deletionError}
                </div>
              )}

              <div className="mt-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                  Account Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showDeletionPassword ? 'text' : 'password'}
                    value={deletionPassword}
                    onChange={(e) => setDeletionPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-red-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletionPassword(!showDeletionPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showDeletionPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPasswordDeletion}
                  disabled={isDeletingAccount || !deletionPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeletingAccount && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: QUICK ADD PET */}
      <AnimatePresence>
        {isAddPetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                🐾 Add New Pet
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Enter your pet's basic details to start tracking their health.
              </p>

              <form onSubmit={handleSavePet} className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="e.g. Charlie, Milo, Coco"
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Type
                    </label>
                    <select
                      value={newPetType}
                      onChange={(e) => setNewPetType(e.target.value as any)}
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="dog">🐕 Dog</option>
                      <option value="cat">🐱 Cat</option>
                      <option value="bird">🦜 Bird</option>
                      <option value="rabbit">🐰 Rabbit</option>
                      <option value="hamster">🐹 Hamster</option>
                      <option value="fish">🐠 Fish</option>
                      <option value="other">🐾 Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Gender
                    </label>
                    <select
                      value={newPetGender}
                      onChange={(e) => setNewPetGender(e.target.value as any)}
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                    placeholder="e.g. Golden Retriever, Persian"
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newPetWeight}
                      onChange={(e) => setNewPetWeight(e.target.value)}
                      placeholder="e.g. 5.5"
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={newPetBirthDate}
                      onChange={(e) => setNewPetBirthDate(e.target.value)}
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPetOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPet}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingPet && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                    Save Pet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: ADD REMINDER */}
      <AnimatePresence>
        {isAddReminderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                💊 Add Health Reminder
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Schedule medications, vaccines, or deworming cycles.
              </p>

              <form onSubmit={handleSaveReminder} className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Select Pet *
                  </label>
                  <select
                    value={reminderPetId}
                    onChange={(e) => setReminderPetId(e.target.value)}
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Medicine / Treatment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reminderMedName}
                    onChange={(e) => setReminderMedName(e.target.value)}
                    placeholder="e.g. NexGard, Rabies Vaccine, Dewormer"
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={reminderDosage}
                      onChange={(e) => setReminderDosage(e.target.value)}
                      placeholder="e.g. 1 chewable tablet"
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                      Frequency
                    </label>
                    <select
                      value={reminderFrequency}
                      onChange={(e) => setReminderFrequency(e.target.value as any)}
                      className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reminderNextDueDate}
                    onChange={(e) => setReminderNextDueDate(e.target.value)}
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase pl-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    placeholder="e.g. Give with morning food"
                    className="w-full mt-1 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddReminderOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReminder}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingReminder && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                    Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ProfilePage;
