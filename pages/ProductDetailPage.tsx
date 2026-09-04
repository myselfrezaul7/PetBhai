import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBrands } from '../contexts/BrandContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, ShoppingCartIcon } from '../components/icons';
import ProductCard from '../components/ProductCard';
import type { BundleOffer, Review } from '../types';
import { useProducts } from '../contexts/ProductContext';
import { sanitizeInput } from '../lib/security';
import SEO from '../components/SEO';
import { fetchBundleOffer } from '../services/ecommerceService';
import ApiStateCard from '../components/ApiStateCard';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addProductReview, loading, error, refetch } = useProducts();
  const { brands } = useBrands();

  const product = useMemo(() => products.find((p) => p.id === Number(id)), [id, products]);

  const { addToCart, cartItems } = useCart();
  const { isAuthenticated, currentUser, addToWishlist, removeFromWishlist } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [isAutoShip, setIsAutoShip] = useState(false);
  const [autoShipFrequency, setAutoShipFrequency] = useState('1 Month');

  // State for the new review form
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [bundleOffer, setBundleOffer] = useState<BundleOffer | null>(null);
  const [bundleLoading, setBundleLoading] = useState(false);

  const brand = useMemo(() => {
    return brands.find((b) => b.id === product?.brandId);
  }, [product, brands]);

  const isWishlisted = useMemo(() => {
    return currentUser?.wishlist.includes(product?.id ?? -1) ?? false;
  }, [currentUser, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  // Check if item is in cart
  const cartItem = useMemo(() => {
    if (!product) return undefined;
    return cartItems.find((item) => item.id === product.id);
  }, [cartItems, product]);

  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product?.stockStatus === 'out-of-stock';

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        role="status"
        aria-label="Loading product"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <span className="sr-only">Loading product...</span>
      </div>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-16">
        <ApiStateCard
          title="Product details are unavailable"
          message={error}
          actionLabel="Reload"
          onAction={refetch}
        />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="text-center py-16 sm:py-20 container mx-auto px-4 sm:px-6">
        <div className="glass-card-ios p-8 sm:p-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            Product not found!
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mt-4">
            The product you are looking for might be out of stock or the link is incorrect.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-block bg-orange-500 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = useCallback(() => {
    setIsAdding(true);
    let finalProduct = product;
    if (isAutoShip) {
      finalProduct = {
        ...product,
        id: parseInt(`${product.id}9999`), // Pseudo ID to separate autoship items from normal items in cart
        name: `${product.name} (Auto-Ship: ${autoShipFrequency})`,
        price: product.price * 0.95, // 5% discount
        isAutoShip: true,
        autoShipFrequency: autoShipFrequency,
      };
    }
    addToCart(finalProduct);
    setTimeout(() => setIsAdding(false), 1000);
  }, [addToCart, product, isAutoShip, autoShipFrequency]);

  const handleWishlistClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  }, [isAuthenticated, isWishlisted, navigate, removeFromWishlist, addToWishlist, product?.id]);

  const handleReviewSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (newRating === 0) {
        setReviewError('Please select a star rating.');
        return;
      }
      const sanitizedComment = sanitizeInput(newComment.trim());
      if (!sanitizedComment) {
        setReviewError('Please write a comment for your review.');
        return;
      }
      if (!currentUser) {
        setReviewError('You must be logged in to post a review.');
        return;
      }

      const newReview: Review = {
        id: Date.now(),
        author: currentUser.name,
        rating: newRating,
        comment: sanitizedComment,
        date: new Date().toISOString(),
      };

      try {
        await addProductReview(product.id, newReview);
      } catch {
        setReviewError('Failed to submit review. Please try again.');
        return;
      }

      // Reset form
      setNewRating(0);
      setNewComment('');
      setReviewError('');
    },
    [newRating, newComment, currentUser, addProductReview, product?.id]
  );

  useEffect(() => {
    if (!product) {
      setBundleOffer(null);
      return;
    }

    let mounted = true;
    setBundleLoading(true);
    fetchBundleOffer(product.id)
      .then((offer) => {
        if (mounted) {
          setBundleOffer(offer);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch bundle offer', error);
        if (mounted) {
          setBundleOffer(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setBundleLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [product]);

  const handleAddBundleToCart = useCallback(() => {
    if (!product || !bundleOffer?.items?.length) {
      return;
    }

    let finalProduct = product;
    if (isAutoShip) {
      finalProduct = {
        ...product,
        id: parseInt(`${product.id}9999`), // Pseudo ID to separate autoship items from normal items in cart
        name: `${product.name} (Auto-Ship: ${autoShipFrequency})`,
        price: product.price * 0.95, // 5% discount
        isAutoShip: true,
        autoShipFrequency: autoShipFrequency,
      };
    }
    addToCart(finalProduct);
    bundleOffer.items.forEach((bundleItem) => addToCart(bundleItem));
  }, [addToCart, bundleOffer, product, isAutoShip, autoShipFrequency]);

  const StarRatingDisplay = memo(
    ({ rating, className = 'w-5 h-5' }: { rating: number; className?: string }) => (
      <div className="flex items-center" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${className} ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  );
  StarRatingDisplay.displayName = 'StarRatingDisplay';

  const StarRatingInput: React.FC = () => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center" role="group" aria-label="Select rating">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <button
              key={starValue}
              type="button"
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setNewRating(starValue)}
              className="text-3xl transition-transform transform hover:scale-125 touch-manipulation active:scale-95"
              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
              aria-pressed="false"
              data-pressed={newRating === starValue}
            >
              <svg
                className={`w-8 h-8 transition-colors ${starValue <= (hoverRating || newRating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 pb-32 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
      <SEO
        title={`${product.name} - Shop`}
        description={product.description}
        image={product.imageUrl}
        type="product"
        price={product.price}
        currency="BDT"
        availability={product.stockStatus === 'in-stock' ? 'in stock' : 'out of stock'}
        brand={brand?.name}
        ratingValue={product.rating}
        reviewCount={product.reviews?.length}
      />
      <article className="glass-card-ios overflow-hidden lg:flex border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl shadow-2xl">
        <div className="lg:w-1/2 p-4 sm:p-6">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-auto object-cover rounded-2xl"
            loading="lazy"
            decoding="async"
            sizes={getResponsiveImageSizes('detail')}
            onError={handleImageError}
          />
        </div>
        <div className="p-6 sm:p-8 lg:w-1/2 flex flex-col">
          <header>
            <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-300 mb-3">
              Premium Pick
            </span>
            {brand && (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-6 sm:h-8 mb-2"
                loading="lazy"
              />
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">
              {product.name}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <StarRatingDisplay rating={product.rating} />
              <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                ({product.reviews.length} reviews)
              </span>
            </div>
            <div className="flex items-baseline space-x-3 my-4">
              <p className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">
                ৳{product.price.toLocaleString('en-BD')}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg sm:text-xl text-slate-400 dark:text-slate-500 line-through">
                    ৳{product.originalPrice.toLocaleString('en-BD')}
                  </span>
                  <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
                    {Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              {product.description}
            </p>
          </header>

          <div className="mt-6 glass-card-ios bg-white/45 dark:bg-slate-900/40 border border-white/35 dark:border-white/10 p-4 rounded-2xl">
            <p className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200">
              Auto-Ship Subscription
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Never run out! Get this item delivered automatically and save 5%.
            </p>
            <button className="mt-2 text-xs sm:text-sm font-bold text-orange-600 hover:underline touch-manipulation">
              Learn More
            </button>
          </div>

          <div className="mt-6 hidden items-center space-x-3 sm:mt-8 sm:flex sm:space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-base sm:text-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 disabled:from-green-500 disabled:to-green-500 touch-manipulation active:scale-95 shadow-lg hover:shadow-orange-500/30"
            >
              <ShoppingCartIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              <span>
                {isOutOfStock
                  ? 'Out of Stock'
                  : isAdding
                    ? 'Added!'
                    : quantityInCart > 0
                      ? `Add More (${quantityInCart} in Cart)`
                      : 'Add to Cart'}
              </span>
            </button>
            <button
              onClick={handleWishlistClick}
              className={`p-3 sm:p-4 rounded-xl transition-colors border-2 touch-manipulation active:scale-95
                      ${
                        isWishlisted
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:border-red-500/20'
                      }`}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-pressed="false"
              data-pressed={isWishlisted}
            >
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      {/* Reviews Section */}
      {(bundleLoading || (bundleOffer && bundleOffer.items.length > 0)) && (
        <section
          className="glass-card-ios mt-8 sm:mt-12 p-6 sm:p-8 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl"
          aria-labelledby="bundle-heading"
        >
          <h2
            id="bundle-heading"
            className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-4"
          >
            Bundle & Save
          </h2>

          {bundleLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">Loading bundle offer...</p>
          ) : (
            bundleOffer &&
            bundleOffer.items.length > 0 && (
              <>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4">
                  Buy this item with recommended essentials and save {bundleOffer.discountPercent}%
                  on the bundle total.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[product, ...bundleOffer.items].map((bundleItem) => (
                    <ProductCard key={`bundle-${bundleItem.id}`} product={bundleItem} />
                  ))}
                </div>
                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200">
                    <span className="line-through text-slate-400 dark:text-slate-300 mr-2">
                      ৳{bundleOffer.originalTotal.toLocaleString('en-BD')}
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      ৳{bundleOffer.bundleTotal.toLocaleString('en-BD')}
                    </span>
                  </p>
                  <button
                    onClick={handleAddBundleToCart}
                    className="bg-orange-500 text-white font-bold py-2.5 px-6 rounded-full hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
                  >
                    Add Bundle to Cart
                  </button>
                </div>
              </>
            )
          )}
        </section>
      )}

      <section
        className="glass-card-ios mt-8 sm:mt-12 p-6 sm:p-8 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl"
        aria-labelledby="reviews-heading"
      >
        <h2
          id="reviews-heading"
          className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-6"
        >
          Customer Reviews
        </h2>

        {/* Review Submission Form */}
        {isAuthenticated && currentUser ? (
          <form
            onSubmit={handleReviewSubmit}
            className="mb-8 p-4 sm:p-6 bg-white/50 dark:bg-slate-800/55 rounded-2xl border border-white/40 dark:border-white/10"
          >
            <div className="flex items-start space-x-3 sm:space-x-4">
              <img
                src={currentUser.profilePictureUrl}
                alt={currentUser.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                loading="lazy"
                decoding="async"
                sizes={getResponsiveImageSizes('search')}
                onError={handleImageError}
              />
              <div className="flex-grow">
                <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                  Write a review
                </h3>
                <div className="my-2">
                  <StarRatingInput />
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-sm sm:text-base"
                  rows={3}
                  required
                  aria-label="Review comment"
                />
                {reviewError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1" role="alert">
                    {reviewError}
                  </p>
                )}
                <button
                  type="submit"
                  className="mt-2 bg-orange-500 text-white font-bold py-2 px-4 sm:px-6 rounded-lg hover:bg-orange-600 text-sm sm:text-base touch-manipulation active:scale-95"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 sm:p-6 bg-white/50 dark:bg-slate-800/55 rounded-2xl text-center border border-white/40 dark:border-white/10">
            <p className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200">
              <Link
                to="/login"
                className="text-orange-600 hover:underline touch-manipulation active:scale-95"
              >
                Log in
              </Link>{' '}
              to share your thoughts and write a review.
            </p>
          </div>
        )}

        {/* Existing Reviews List */}
        {product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <article
                key={review.id}
                className="border-b border-white/20 dark:border-slate-700/50 pb-4 last:border-b-0"
              >
                <div className="flex items-center mb-1">
                  <StarRatingDisplay rating={review.rating} />
                  <p className="ml-3 font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200">
                    {review.author}
                  </p>
                  {review.verifiedPurchase && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-[10px] sm:text-xs font-semibold">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mb-2">
                  <time dateTime={review.date}>{new Date(review.date).toLocaleDateString()}</time>
                </p>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 text-center">
            No reviews yet. Be the first to write one!
          </p>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 sm:mt-16" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="text-2xl sm:text-3xl font-bold text-center text-slate-800 dark:text-white mb-6 sm:mb-8"
          >
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/65 bg-white/90 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/88 sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
          <div className="min-w-[6.8rem] rounded-xl border border-white/70 bg-white/75 px-2.5 py-2 dark:border-slate-700/70 dark:bg-slate-800/75">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Price
            </p>
            <p className="text-base font-bold text-slate-800 dark:text-white">
              ৳{product.price.toLocaleString('en-BD')}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            className="min-h-[48px] flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:from-slate-400 disabled:to-slate-500"
          >
            {isOutOfStock
              ? 'Out of Stock'
              : isAdding
                ? 'Added!'
                : quantityInCart > 0
                  ? `Add More (${quantityInCart})`
                  : 'Add to Cart'}
          </button>

          <button
            onClick={handleWishlistClick}
            className={`min-h-[48px] min-w-[48px] rounded-xl border-2 transition-colors active:scale-[0.98] ${
              isWishlisted
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-slate-300 bg-white/80 text-slate-600 dark:border-slate-600 dark:bg-slate-800/75 dark:text-slate-300'
            }`}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <HeartIcon className="mx-auto h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;
