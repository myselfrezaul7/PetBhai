import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_ANIMALS, MOCK_PRODUCTS, MOCK_POSTS } from '../constants';
import AnimalCard from '../components/AnimalCard';
import ProductCard from '../components/ProductCard';
import PostCard from '../components/PostCard';

const HomePage: React.FC = () => {
  const featuredAnimals = MOCK_ANIMALS.slice(0, 3);
  const featuredProducts = MOCK_PRODUCTS.slice(0, 3);
  const featuredPost = MOCK_POSTS[0];

  return (
    <div className="w-full animate-fade-in">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center text-white min-h-[65vh] flex items-center justify-center" 
        style={{ backgroundImage: "url('https://picsum.photos/seed/hero/1200/800')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
        <div className="relative text-center z-10 p-4">
          <h1 className="text-5xl md:text-7xl font-extrabold drop-shadow-2xl">Welcome to PetBhai</h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-lg">
            Giving Paws a Second Chance. Your one-stop destination for animal adoption, community support, and pet supplies in Bangladesh.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/adopt"
              className="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
            >
              Find a Pet
            </Link>
             <Link
              to="/report"
              className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white hover:text-slate-800 transition-all transform hover:scale-105 duration-300 shadow-lg"
            >
              Report a Rescue
            </Link>
          </div>
        </div>
      </section>

      {/* Shop Preview Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Shop For a Cause</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            Every purchase you make helps us provide food, shelter, and medical care to animals in need. Shop our curated selection of quality pet products.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredProducts.map(product => (
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
      
      {/* Community Preview Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Join Our Community Hub</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            Connect with fellow pet lovers, share your adoption stories, ask for advice, and stay updated with our latest rescue missions.
          </p>
          <div className="max-w-3xl mx-auto">
            {featuredPost && <PostCard post={featuredPost} />}
          </div>
          <Link
            to="/community"
            className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
          >
            Visit the Community
          </Link>
        </div>
      </section>

      {/* Adoption Preview Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Meet Our Animals</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-12">
            These wonderful souls are looking for their forever homes. Open your heart and home to a new best friend today.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredAnimals.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
          <Link
            to="/adopt"
            className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-orange-600 transition-all transform hover:scale-105 duration-300 shadow-lg"
          >
            View All Adoptable Pets
          </Link>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-6">Our Mission</h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            PetBhai is dedicated to providing a safe haven for stray, abandoned, and abused animals. We offer medical care, nourishment, and a loving environment, with the ultimate goal of finding them a forever family. We are a community-powered organization, and your support makes all the difference.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
