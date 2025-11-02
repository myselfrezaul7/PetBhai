import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_BRANDS } from '../constants';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, ShoppingCartIcon } from '../components/icons';
import ProductCard from '../components/ProductCard';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = MOCK_PRODUCTS.find(p => p.id === Number(id));
  
  const { addToCart } = useCart();
  const { isAuthenticated, currentUser, addToWishlist, removeFromWishlist } = useAuth();

  const [isAdding, setIsAdding] = useState(false);

  const brand = useMemo(() => {
    return MOCK_BRANDS.find(b => b.id === product?.brandId);
  }, [product]);

  const isWishlisted = useMemo(() => {
    return currentUser?.wishlist.includes(product?.id ?? -1) ?? false;
  }, [currentUser, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return MOCK_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <div className="text-center py-20 animate-fade-in container mx-auto px-6">
        <div className="glass-card p-12">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Product not found!</h1>
            <p className="text-slate-700 dark:text-slate-200 mt-4">The product you are looking for might be out of stock or the link is incorrect.</p>
            <Link to="/shop" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
                Back to Shop
            </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
        navigate('/login');
        return;
    }
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="glass-card overflow-hidden lg:flex">
            <div className="lg:w-1/2 p-4">
                <img src={product.imageUrl} alt={product.name} className="w-full h-auto object-cover rounded-lg" />
            </div>
            <div className="p-8 lg:w-1/2 flex flex-col">
                <div>
                    {brand && <img src={brand.logoUrl} alt={brand.name} className="h-8 mb-2" />}
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">{product.name}</h1>
                    <div className="flex items-center space-x-2 mt-2">
                        <StarRating rating={product.rating} />
                        <span className="text-slate-600 dark:text-slate-300">({product.reviews.length} reviews)</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-800 dark:text-white my-4">৳{product.price}</p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="mt-6 bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <p className="font-bold text-slate-700 dark:text-slate-200">Auto-Ship Subscription</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Never run out! Get this item delivered automatically and save 5%.</p>
                    <button className="mt-2 text-sm font-bold text-orange-600 hover:underline">Learn More</button>
                </div>
                
                <div className="mt-8 flex items-center space-x-4">
                     <button 
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-orange-600 transition-all duration-300 flex items-center justify-center space-x-3 disabled:bg-green-500"
                    >
                        <ShoppingCartIcon className="w-6 h-6" />
                        <span>{isAdding ? 'Added!' : 'Add to Cart'}</span>
                    </button>
                    <button 
                        onClick={handleWishlistClick} 
                        className={`p-4 rounded-lg transition-colors border-2 
                        ${isWishlisted 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:border-red-500/20'}`}
                        aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                        <HeartIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-card mt-12 p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Customer Reviews</h2>
            {product.reviews.length > 0 ? (
                <div className="space-y-6">
                    {product.reviews.map(review => (
                        <div key={review.id} className="border-b border-white/20 dark:border-slate-700/50 pb-4">
                            <div className="flex items-center mb-1">
                                <StarRating rating={review.rating} />
                                <p className="ml-3 font-bold text-slate-700 dark:text-slate-200">{review.author}</p>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{new Date(review.date).toLocaleDateString()}</p>
                            <p className="text-slate-600 dark:text-slate-300">{review.comment}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-600 dark:text-slate-300">No reviews yet. Be the first to write one!</p>
            )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
            <div className="mt-16">
                <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailPage;