import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from '../components/icons';
import { MOCK_PRODUCTS } from '../constants';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(currentUser?.profilePictureUrl || null);
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState<'profile' | 'wishlist' | 'orders'>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to login page
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const wishlistedProducts = useMemo(() => {
    if (!currentUser) return [];
    return MOCK_PRODUCTS.filter(product => currentUser.wishlist.includes(product.id));
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let updatedData: { name?: string; profilePictureUrl?: string } = {};

      if (name !== currentUser.name) {
        updatedData.name = name;
      }
      
      if (newProfilePictureFile && profilePicture) {
        updatedData.profilePictureUrl = profilePicture;
      }

      if (Object.keys(updatedData).length > 0) {
        await updateProfile(updatedData);
        setSuccessMessage('Profile updated successfully!');
      } else {
        setSuccessMessage('No changes to save.');
      }

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  const TabButton: React.FC<{ tabId: typeof activeTab, children: React.ReactNode}> = ({ tabId, children }) => (
    <button 
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${activeTab === tabId ? 'bg-white/30 dark:bg-slate-800/30 border-b-2 border-orange-500 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}
    >{children}</button>
  );

  return (
    <div className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-6 glass-card p-6 mb-8">
                 <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-orange-200 dark:ring-orange-500/30">
                    {currentUser.profilePictureUrl ? (
                        <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-16 h-16 text-slate-600 dark:text-slate-300" />
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{currentUser.name}</h1>
                    <p className="text-slate-600 dark:text-slate-300">{currentUser.email}</p>
                </div>
            </div>

            <div className="border-b border-slate-300/50 dark:border-slate-600/50 mb-6">
                <TabButton tabId="profile">Edit Profile</TabButton>
                <TabButton tabId="wishlist">My Wishlist ({wishlistedProducts.length})</TabButton>
                <TabButton tabId="orders">Order History ({currentUser.orderHistory.length})</TabButton>
            </div>
            
            <div className="glass-card p-8 md:p-10">
                {activeTab === 'profile' && (
                     <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="flex flex-col items-center space-y-4">
                             <div className="relative">
                                 <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                     {profilePicture ? (
                                         <img src={profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
                                     ) : (
                                         <UserIcon className="w-20 h-20 text-slate-600 dark:text-slate-300" />
                                     )}
                                 </div>
                                 <button
                                     type="button"
                                     onClick={() => fileInputRef.current?.click()}
                                     className="absolute -bottom-2 -right-2 bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 shadow-md"
                                     aria-label="Change profile picture"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                 </button>
                                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                             </div>
                             <p className="text-sm text-slate-500 dark:text-slate-400">Click the pencil to change your photo.</p>
                         </div>
                         <div>
                             <label htmlFor="name" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Name</label>
                             <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" />
                         </div>
                         {successMessage && <p className="bg-green-100/80 text-green-800 p-3 rounded-lg text-center">{successMessage}</p>}
                         {errorMessage && <p className="bg-red-100/80 text-red-700 p-3 rounded-lg text-center">{errorMessage}</p>}
                         <div>
                             <button type="submit" disabled={isLoading} className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300">
                                 {isLoading ? 'Saving Changes...' : 'Save Changes'}
                             </button>
                         </div>
                     </form>
                )}
                {activeTab === 'wishlist' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">My Wishlist</h2>
                        {wishlistedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {wishlistedProducts.map(product => (
                                    <Link to={`/product/${product.id}`} key={product.id} className="block border border-slate-300/50 dark:border-slate-600/50 rounded-lg overflow-hidden hover:shadow-md">
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover" />
                                        <div className="p-3">
                                            <p className="font-bold text-slate-800 dark:text-white">{product.name}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">৳{product.price}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-300">Your wishlist is empty. <Link to="/shop" className="text-orange-600 hover:underline">Explore products!</Link></p>
                        )}
                    </div>
                )}
                {activeTab === 'orders' && (
                     <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">My Order History</h2>
                        {currentUser.orderHistory.length > 0 ? (
                            <div className="space-y-4">
                                {currentUser.orderHistory.map(order => (
                                    <div key={order.orderId} className="border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-bold text-slate-800 dark:text-white">Order: {order.orderId}</p>
                                            <p className="font-semibold text-slate-800 dark:text-white">Total: ৳{order.total.toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Date: {new Date(order.date).toLocaleDateString()}</p>
                                        <ul className="text-sm space-y-1">
                                            {order.items.map(item => (
                                                <li key={item.id} className="flex justify-between text-slate-600 dark:text-slate-300">
                                                    <span>{item.name} (x{item.quantity})</span>
                                                    <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-slate-600 dark:text-slate-300">You haven't made any purchases yet. <Link to="/shop" className="text-orange-600 hover:underline">Visit the shop!</Link></p>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ProfilePage;