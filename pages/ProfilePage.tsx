import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import { usePetManagement } from '../contexts/PetManagementContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useAnimals } from '../contexts/AnimalContext';
import { useRecentlyViewed } from '../contexts/RecentlyViewedContext';
import ProductCard from '../components/ProductCard';
import PostCard from '../components/PostCard';
import type { Post } from '../types';
import * as postService from '../services/postService';
import { ChatBubbleIcon } from '../components/icons';
import AnimalCard from '../components/AnimalCard';
import Avatar from '../components/Avatar';
import PetTools from '../components/PetTools';
import DeliveryAreaChecker from '../components/DeliveryAreaChecker';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageIcon, HeartIcon, SettingsIcon, UserIcon, LogOutIcon, EditIcon, LoaderIcon, BookmarkIcon } from '../components/icons';

type ProfileTab = 'overview' | 'orders' | 'wishlist' | 'saved' | 'posts' | 'settings';

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

  useEffect(() => { setCurrentValue(value); }, [value]);

  const handleSave = async () => {
    if (currentValue === value || (!currentValue.trim() && !value)) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(currentValue);
      setIsEditing(false);
    } catch (err) {
      setCurrentValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleSave();
    if (e.key === 'Escape') { setCurrentValue(value); setIsEditing(false); }
  };

  return (
    <div className="group flex flex-col gap-1 transition-all">
      <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-start gap-2 max-w-lg">
        {isEditing ? (
          <div className="relative flex-1 flex items-center gap-2 animate-fade-in">
            {multiline ? (
              <textarea autoFocus value={currentValue} onChange={(e) => setCurrentValue((e.target as HTMLTextAreaElement).value)} onBlur={handleSave} onKeyDown={handleKeyDown} disabled={isSaving} className="w-full rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50" rows={3} />
            ) : (
              <input autoFocus type={type} value={currentValue} onChange={(e) => setCurrentValue((e.target as HTMLInputElement).value)} onBlur={handleSave} onKeyDown={handleKeyDown} disabled={isSaving} className="w-full rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50" />
            )}
            {isSaving && <div className="absolute right-3"><LoaderIcon className="w-4 h-4 animate-spin text-amber-500" /></div>}
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors">
            <span className={`text-sm ${currentValue ? 'text-slate-800 dark:text-zinc-200' : 'text-slate-400 italic'}`}>{currentValue || 'Click to add ' + label.toLowerCase()}</span>
            <EditIcon className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, isAuthenticated, fetchProfile, logout, deleteAccount } = useAuth();
  const { products } = useProducts();
  const { pets } = usePetManagement();
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
  useEffect(() => {
    if (activeTab === 'posts' && currentUser) {
      setIsLoadingPosts(true);
      setPostsError(null);
      postService.fetchPostsPage(undefined, 20, currentUser.id)
        .then(res => setUserPosts(res.items))
        .catch((err: any) => setPostsError(err.message || 'Failed to load posts.'))
        .finally(() => setIsLoadingPosts(false));
    }
  }, [activeTab, currentUser]);

  const toggleOrder = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => { 
    if (!isAuthenticated) navigate('/login'); 
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Only fetch if profile data feels stale or missing, to avoid redundant fetches
    fetchProfile().catch(err => {
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
    // recentlyViewed is Product[], map ID back to updated product if possible
    return recentlyViewed
      .map((item) => products.find((p) => p.id === item.id) || item)
      .slice(0, 4);
  }, [recentlyViewed, products]);

  const recentOrders = useMemo(() => currentUser?.orderHistory || [], [currentUser]);

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><LoaderIcon className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  const handleUpdate = async (field: string, value: string, isAddress = false) => {
    try {
      const payload = isAddress ? { defaultShippingAddress: { ...currentUser.defaultShippingAddress, [field]: value } } : { [field]: value };
      const updatedUser = await updateProfile(payload as any);
      if (updatedUser) toast.success(`${field} updated successfully`);
    } catch {
      toast.error('Failed to update. Try again.');
    }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Account',
      message: 'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data, orders, and pet profiles.',
      confirmText: 'Yes, Delete My Account',
      cancelText: 'Cancel',
      intent: 'danger'
    });

    if (isConfirmed) {
      try {
        await deleteAccount();
        toast.success('Account deleted successfully');
        navigate('/');
      } catch (err) {
        toast.error('Failed to delete account. Please try again.');
      }
    }
  };

  const navItems = [
    { id: 'overview', icon: <UserIcon />, label: 'Overview' },
    { id: 'orders', icon: <PackageIcon />, label: 'Orders', badge: recentOrders.length },
    { id: 'wishlist', icon: <HeartIcon />, label: 'Wishlist', badge: wishlistedProducts.length },
    { id: 'saved', icon: <BookmarkIcon />, label: 'Saved' },
      { id: 'posts', icon: <ChatBubbleIcon />, label: 'Community' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' }
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 lg:gap-10">

        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2 relative">
          <div className="flex md:hidden items-center gap-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shadow-sm mb-2">
             <Avatar src={currentUser.profilePictureUrl} name={currentUser.name} size="md" className="ring-2 ring-amber-100 dark:ring-amber-500/20" />
             <div className="flex-1 min-w-0">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</h2>
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
                    className={`relative shrink-0 snap-start flex items-center justify-between px-4 py-2.5 md:py-3 rounded-2xl text-sm font-medium transition-colors ${isActive ? 'text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profile-tab-active"
                        className="absolute inset-0 bg-amber-100/70 dark:bg-amber-500/10 rounded-2xl z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2.5 relative z-10 w-full md:w-auto">
                      <span className={`[&>svg]:w-4 [&>svg]:h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
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
            <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15, ease: "easeOut" }} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-8 shadow-sm">
              
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <header className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800/50">
                    <Avatar src={currentUser.profilePictureUrl} name={currentUser.name} size="xl" className="ring-4 ring-slate-50 dark:ring-zinc-800" />
                    <div>
                      <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{currentUser.name}</h1>
                      <div className="flex items-center gap-3 mt-1.5 opacity-80">
                        <span className="inline-flex py-0.5 px-2.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {currentUser.role === 'admin' ? 'Admin' : currentUser.isPlusMember ? 'PetBhai Plus' : 'Customer'}
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{currentUser.email}</span>
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-6">
                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">Personal Details</h3>
                        <div className="space-y-4">
                          <InlineEditField label="Full Name" value={currentUser.name} onSave={(val) => handleUpdate('name', val)} />
                          <InlineEditField label="Phone" value={currentUser.phone || ''} type="tel" onSave={(val) => handleUpdate('phone', val)} />
                          <InlineEditField label="Bio" value={currentUser.bio || ''} multiline onSave={(val) => handleUpdate('bio', val)} />
                        </div>
                      </div>

                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between mb-4 pl-1">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Alerts & Notifications</h3>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-zinc-800">Caught up</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-zinc-400 py-6 text-center bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100/50 dark:border-zinc-800">
                          <p>No new notifications right now.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">Shipping Address</h3>
                        <div className="space-y-4 pt-1">
                          <InlineEditField label="Recipient Name" value={currentUser.defaultShippingAddress?.fullName || currentUser.name} onSave={(val) => handleUpdate('fullName', val, true)} />
                          <InlineEditField label="Address" value={currentUser.defaultShippingAddress?.address || ''} multiline onSave={(val) => handleUpdate('address', val, true)} />
                          <InlineEditField label="City" value={currentUser.defaultShippingAddress?.city || ''} onSave={(val) => handleUpdate('city', val, true)} />
                          <InlineEditField label="Contact Phone" value={currentUser.defaultShippingAddress?.phone || ''} type="tel" onSave={(val) => handleUpdate('phone', val, true)} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
                           <DeliveryAreaChecker compact />
                        </div>
                      </div>

                      <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 pl-1">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <Link to="/services" className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-amber-700 dark:text-amber-500 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm">
                             Book Vet
                          </Link>
                          <button onClick={() => setActiveTab('settings')} className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm">
                             Manage Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Order History</h2>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                      <PackageIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <p className="text-sm text-slate-500 dark:text-zinc-400">You haven't placed any orders yet.</p>
                      <Link to="/shop" className="inline-block mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">Start Shopping</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order, i) => {
                        const orderId = order.orderId || (order as any)._id || (order as any).id || `ORD-${i}`;
                        const isExpanded = expandedOrderIds[orderId];
                        return (
                          <div key={i} className="p-5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-800/20 flex flex-col gap-4 transition-transform hover:shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">Order #{orderId}</p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
                                    ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                                    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}
                                  >
                                    {order.status || 'Processing'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{new Date(order.date).toLocaleDateString()}</p>
                                <div className="text-xs mt-3 flex items-center gap-2 opacity-80">
                                  <span className="font-medium text-slate-600 dark:text-zinc-300">{order.items.length} items</span>
                                </div>
                              </div>
                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:gap-2">
                                <span className="font-black text-lg text-slate-800 dark:text-emerald-400">৳{order.total.toFixed(2)}</span>
                                <button onClick={() => toggleOrder(orderId)} className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:underline">
                                  {isExpanded ? 'Hide details \u2191' : 'View details \u2193'}
                                </button>
                              </div>
                            </div>

                            {/* Expanded items view */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80">
                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Order Items</h4>
                                <div className="space-y-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900/50 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                          <img src={item.imageUrl || item.image} alt={item.name} className="object-cover w-full h-full mix-blend-multiply dark:mix-blend-normal" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 line-clamp-1">{item.name}</p>
                                          <p className="text-[10px] text-slate-500 dark:text-zinc-500">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-emerald-400">৳{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                  ))}
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

              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Your Wishlist</h2>
                  {wishlistedProducts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                      <HeartIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Your wishlist is empty.</p>
                      <Link to="/shop" className="inline-block mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">Explore Products</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {wishlistedProducts.map(p => (<ProductCard key={p.id} product={p} />))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-zinc-800/80">Saved Animals</h2>
                    {savedAnimals.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <HeartIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">You haven't saved any adoption animals.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {savedAnimals.map(a => (<AnimalCard key={a.id} animal={a} />))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-zinc-800/80">Recently Viewed Products</h2>
                    {recentProducts.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <PackageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">Your viewing history is empty.</p>
                      </div>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {recentProducts.map(p => (
                          <div key={p.id} className="min-w-[160px] md:min-w-[200px] snap-center shrink-0">
                            <ProductCard product={p} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Your Posts</h2>
                  {isLoadingPosts ? (
                    <div className="flex justify-center py-8"><LoaderIcon className="w-8 h-8 text-amber-500 animate-spin" /></div>
                  ) : postsError ? (
                    <div className="text-center py-12 rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                      <p className="text-red-500 dark:text-red-400">{postsError}</p>
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                       <ChatBubbleIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-4" />
                       <h3 className="text-lg font-medium text-slate-800 dark:text-zinc-200 mb-2">No posts yet</h3>
                       <p className="text-slate-500 dark:text-zinc-400">You haven\'t posted anything in the community.</p>
                       <Link to="/community" className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-medium transition-colors">Go to Community</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {userPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Account Settings</h2>
                  <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Danger Zone</h3>
                    <p className="text-xs text-red-600/80 dark:text-red-300/70 mt-1 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors">Delete Account</button>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-400">
                     <button onClick={async () => { await logout(); navigate('/'); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                        <LogOutIcon className="w-4 h-4" /> Sign Out
                     </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {activeTab === 'overview' && pets && pets.length > 0 && (
             <div className="mt-4"><PetTools /></div>
          )}
        </section>

      </div>
    </main>
  );
};
export default ProfilePage;
