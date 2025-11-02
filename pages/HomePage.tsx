import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PRODUCTS, MOCK_BRANDS } from '../constants';
import ProductCard from '../components/ProductCard';
import { VideoCameraIcon } from '../components/icons';

const HomePage: React.FC = () => {
  const bestSellers = [...MOCK_PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const newArrivals = [...MOCK_PRODUCTS].sort((a, b) => b.id - a.id).slice(0, 4);

  return (
    <div className="w-full animate-fade-in">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center text-white min-h-[70vh] flex items-center" 
        style={{ backgroundImage: "url('https://picsum.photos/seed/hero/1200/800')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30"></div>
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-2xl">A Loving Home For Every Animal</h1>
            <p className="mt-4 text-lg md:text-xl max-w-lg drop-shadow-lg">
              Your trusted partner in animal welfare. Adopt, find expert services, and shop premium supplies to give them the life they deserve.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-start items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/adopt"
                className="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
              >
                Find a Friend
              </Link>
               <Link
                to="/shop"
                className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white hover:text-slate-800 transition-all transform hover:scale-105 duration-300 shadow-lg"
              >
                Shop Supplies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Our Best Sellers</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            Loved by pets and their parents. Check out our top-rated products.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Vet Consultation CTA -> Services CTA */}
      <section className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2">
                    <img src="https://picsum.photos/seed/services-cta/600/400" alt="Professional Pet Services" className="rounded-2xl shadow-lg" loading="lazy" />
                </div>
                <div className="md:w-1/2 text-center md:text-left">
                    <h2 className="text-4xl font-bold text-slate-800 dark:text-white">All The Care In One Place</h2>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mt-4">
                        From expert veterinarians to trusted groomers and trainers, find and book all the professional services your pet deserves.
                    </p>
                    <Link
                      to="/services"
                      className="mt-8 inline-flex items-center space-x-3 bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
                    >
                      <span>Explore All Services</span>
                    </Link>
                </div>
            </div>
        </div>
      </section>
      
      {/* Shop by Brand Section */}
      <section className="py-20">
          <div className="container mx-auto px-6 text-center">
              <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-12">Shop by Brand</h2>
              <div className="flex flex-wrap justify-center items-center gap-8">
                  {MOCK_BRANDS.map(brand => (
                      <Link key={brand.id} to="/shop" state={{ brand: brand.name }} className="grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-110">
                          <img src={brand.logoUrl} alt={brand.name} className="h-12" />
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">New Arrivals</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            The latest and greatest products, fresh in our store.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Link
            to="/shop"
            className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
          >
            Explore the Full Shop
          </Link>
        </div>
      </section>

      {/* PetBhai+ CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="glass-card text-center p-10 md:p-16">
            <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white drop-shadow-lg">Upgrade to PetBhai+</h2>
            <p className="max-w-3xl mx-auto text-lg mt-4 text-slate-700 dark:text-slate-200 drop-shadow-md">
              Unlock exclusive benefits like free delivery, member-only discounts, and free vet consultations. Give your pet the best with our premium membership.
            </p>
            <Link
              to="/plus-membership"
              className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-xl"
            >
              Learn More & Join
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;