import React from 'react';

const VolunteerPage: React.FC = () => {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Thank you for your interest in volunteering! Your application has been submitted, and we will get in touch with you soon.');
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="container mx-auto px-4 py-12 flex-grow flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">Join Our Volunteer Team</h1>
                    <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
                        Volunteers are the heart of our organization. By giving your time and skills, you can make a direct impact on the lives of animals.
                    </p>
                </div>
                <div className="glass-card p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fullName" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" id="fullName" required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" id="email" required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" />
                            </div>
                             <div>
                                <label htmlFor="phone" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone Number <span className="text-red-500">*</span></label>
                                <input type="tel" id="phone" required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" />
                            </div>
                             <div>
                                <label htmlFor="availability" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Availability <span className="text-red-500">*</span></label>
                                <select id="availability" required className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50">
                                    <option>Weekdays</option>
                                    <option>Weekends</option>
                                    <option>Flexible</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Address <span className="text-red-500">*</span></label>
                            <textarea id="address" rows={3} required placeholder="Your full address for coordination purposes" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"></textarea>
                        </div>

                        <div>
                            <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Areas of Interest (Select all that apply)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Shelter Care</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Adoption Events</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Rescue Transport</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Fundraising</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Photography</span></label>
                                <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" /> <span>Spot Treatment</span></label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="experience" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Relevant Experience</label>
                            <textarea id="experience" rows={4} placeholder="Tell us about any previous experience with animals or volunteering." className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"></textarea>
                        </div>
                        
                        <div>
                            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors transform hover:scale-105">
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VolunteerPage;
