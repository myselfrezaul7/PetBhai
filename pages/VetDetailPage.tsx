import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_VETS } from '../constants';
import { MapPinIcon, VideoCameraIcon, CloseIcon } from '../components/icons';
import VetBookingModal from '../components/VetBookingModal';

const VetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vet = MOCK_VETS.find(v => v.id === Number(id));
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  if (!vet) {
    return (
      <div className="text-center py-20 animate-fade-in container mx-auto px-6">
        <div className="glass-card p-12">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Veterinarian not found!</h1>
            <p className="text-slate-700 dark:text-slate-200 mt-4">The vet you are looking for might not be in our network or the link is incorrect.</p>
            <Link to="/services" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
                Back to Services Page
            </Link>
        </div>
      </div>
    );
  }

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
      <div className="container mx-auto px-4 py-12 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="glass-card p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
            <img src={vet.imageUrl} alt={vet.name} className="w-40 h-40 rounded-full object-cover ring-4 ring-orange-500/30 flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-white">{vet.name}</h1>
              <p className="text-xl font-semibold text-orange-600 dark:text-orange-400 mt-1">{vet.specialization}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-slate-600 dark:text-slate-300">
                {vet.qualifications.map(q => <span key={q}>{q}</span>)}
              </div>
              <a href={`tel:${vet.phone}`} className="inline-block mt-4 bg-slate-200/50 dark:bg-slate-700/50 px-4 py-2 rounded-full font-semibold hover:bg-slate-300/50">{vet.phone}</a>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">About Dr. {vet.name.split(' ').pop()}</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{vet.bio}</p>
              </div>
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Services</h2>
                <ul className="space-y-3">
                  {vet.services.map(service => (
                    <li key={service.name} className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {service.type === 'online' ? <VideoCameraIcon className="w-5 h-5 text-orange-500"/> : <MapPinIcon className="w-5 h-5 text-orange-500"/>}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{service.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">৳{service.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
               <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Patient Reviews</h2>
                {vet.reviews.length > 0 ? (
                    <div className="space-y-6">
                        {vet.reviews.map(review => (
                            <div key={review.id} className="border-b border-white/20 dark:border-slate-700/50 pb-4 last:border-b-0 last:pb-0">
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
                    <p className="text-slate-600 dark:text-slate-300">No reviews yet for this veterinarian.</p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Book a Consultation</h2>
                 <p className="text-center text-slate-600 dark:text-slate-300 text-sm mb-5">Book through PetBhai to connect with trusted vets instantly.</p>
                 <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    disabled={vet.availability === 'Offline'}
                    className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <VideoCameraIcon className="w-6 h-6"/>
                    <span>Book Online Now</span>
                </button>
                 <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                    <span className="flex-shrink mx-2 text-slate-500 dark:text-slate-400 font-semibold text-xs">OR</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                 <div className="text-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{vet.clinicName}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-start space-x-2">
                        <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{vet.address}</span>
                    </p>
                    <a href={`tel:${vet.phone}`} className="mt-3 inline-block w-full bg-slate-200/50 dark:bg-slate-700/50 px-4 py-2 rounded-full font-semibold hover:bg-slate-300/50">Call Clinic</a>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <VetBookingModal 
        vet={vet}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  );
};

export default VetDetailPage;