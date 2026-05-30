import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { Product } from '../types';
import { PawIcon, HeartIcon } from './icons';
import { useCart } from '../contexts/CartContext';
import { useDynamicIsland } from '../contexts/DynamicIslandContext';
import { useHaptics } from '../hooks/useHaptics';

interface SwipeDiscoveryProps {
  products: Product[];
  onComplete: () => void;
}

const SwipeCard: React.FC<{
  product: Product;
  index: number;
  onSwipe: (direction: 'left' | 'right', product: Product) => void;
  active: boolean;
}> = ({ product, index, onSwipe, active }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right', product);
    } else if (info.offset.x < -100) {
      onSwipe('left', product);
    }
  };

  if (!active && index > 3) return null; // Only render top 3 for performance

  return (
    <motion.div
      style={active ? { x, rotate, opacity } : {}}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ 
        scale: active ? 1 : 1 - (index * 0.05), 
        y: active ? 0 : index * 10,
        opacity: 1 - (index * 0.2),
        zIndex: 100 - index
      }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }}
      className="absolute top-0 left-0 w-full h-[450px] origin-bottom rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 cursor-grab active:cursor-grabbing"
    >
      {/* Product Image */}
      <div className="w-full h-2/3 bg-slate-50 relative pointer-events-none">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-6" draggable={false} />
        
        {/* Swipe Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-4 left-4 border-4 border-emerald-500 rounded-lg px-4 py-1 transform -rotate-12">
           <span className="text-emerald-500 font-black text-2xl tracking-wider">WANT</span>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-4 right-4 border-4 border-rose-500 rounded-lg px-4 py-1 transform rotate-12">
           <span className="text-rose-500 font-black text-2xl tracking-wider">PASS</span>
        </motion.div>
      </div>

      {/* Product Details */}
      <div className="p-5 h-1/3 flex flex-col justify-between pointer-events-none bg-gradient-to-t from-white via-white to-transparent">
        <div>
           <div className="flex justify-between items-start">
             <h3 className="font-black text-xl text-slate-800 line-clamp-1">{product.name}</h3>
             <span className="font-bold text-lg text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">৳{product.price}</span>
           </div>
           <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
           <span className="uppercase tracking-widest">{product.category}</span>
           <span className="flex items-center text-amber-400"><HeartIcon className="w-4 h-4 mr-1" fill="currentColor"/> {product.rating}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({ products, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addItem } = useCart();
  const { showSuccess } = useDynamicIsland();
  const { hapticMedium, hapticSuccess } = useHaptics();

  const handleSwipe = (direction: 'left' | 'right', product: Product) => {
    if (direction === 'right') {
      addItem({ ...product, quantity: 1 });
      showSuccess('Added to Cart');
      hapticSuccess();
    } else {
      hapticMedium();
    }

    if (currentIndex + 1 >= products.length) {
      setTimeout(onComplete, 300);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentProducts = products.slice(currentIndex);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-[600px]">
      <div className="text-center mb-8">
         <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <PawIcon className="w-6 h-6 text-orange-500" />
            Discovery Mode
         </h2>
         <p className="text-sm text-slate-500 mt-2">Swipe Right to add to cart. Swipe Left to pass.</p>
      </div>

      <div className="relative w-full max-w-[340px] h-[450px]">
        <AnimatePresence>
          {currentProducts.map((product, i) => (
            <SwipeCard
              key={product.id}
              product={product}
              index={i}
              active={i === 0}
              onSwipe={handleSwipe}
            />
          ))}
        </AnimatePresence>
        
        {currentProducts.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="font-bold text-slate-800 dark:text-white">You're all caught up!</p>
             <button onClick={onComplete} className="mt-4 text-orange-500 font-bold text-sm hover:underline">Back to Shop</button>
          </div>
        )}
      </div>
      
      <div className="flex gap-6 mt-8">
         <button onClick={() => handleSwipe('left', currentProducts[0])} disabled={currentProducts.length === 0} className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-rose-500 border border-slate-100 hover:scale-110 transition-transform active:scale-95 disabled:opacity-50">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
         <button onClick={() => handleSwipe('right', currentProducts[0])} disabled={currentProducts.length === 0} className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-emerald-500 border border-slate-100 hover:scale-110 transition-transform active:scale-95 disabled:opacity-50">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
         </button>
      </div>
    </div>
  );
};
