import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const VolunteerPage: React.FC = () => {
    const toast = useToast();
    
    // State for form fields
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        availability: 'Weekdays',
        address: '',
        experience: '',
        interests: [] as string[]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            if (checked) {
                return { ...prev, interests: [...prev.interests, value] };
            } else {
                return { ...prev, interests: prev.interests.filter(item => item !== value) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Construct Email Body
        const subject = encodeURIComponent(`New Volunteer Application: ${formData.fullName}`);
        const body = encodeURIComponent(
`Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}
Availability: ${formData.availability}

Areas of Interest:
${formData.interests.length > 0 ? formData.interests.join(', ') : 'None selected'}

Experience:
${formData.experience}
`
        );

        // Open Mail Client
        window.location.href = `mailto:petbhaibd@gmail.com?subject=${subject}&body=${body}`;

        toast.success('Opening your email client to send the application...');
        
        // Reset form
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            availability: 'Weekdays',
            address: '',
            experience: '',
            interests: []
        });
    };

    const interestOptions = [
        "Shelter Care", "Adoption Events", "Rescue Transport",
        "Fundraising", "Photography", "Spot Treatment"
    ];

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
                                <input 
                                    type="text" 
                                    id="fullName" 
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required 
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" 
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required 
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" 
                                />
                            </div>
                             <div>
                                <label htmlFor="phone" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone Number <span className="text-red-500">*</span></label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required 
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50" 
                                />
                            </div>
                             <div>
                                <label htmlFor="availability" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Availability <span className="text-red-500">*</span></label>
                                <select 
                                    id="availability" 
                                    value={formData.availability}
                                    onChange={handleInputChange}
                                    required 
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                                >
                                    <option>Weekdays</option>
                                    <option>Weekends</option>
                                    <option>Flexible</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Address <span className="text-red-500">*</span></label>
                            <textarea 
                                id="address" 
                                rows={3} 
                                value={formData.address}
                                onChange={handleInputChange}
                                required 
                                placeholder="Your full address for coordination purposes" 
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Areas of Interest (Select all that apply)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {interestOptions.map(interest => (
                                    <label key={interest} className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox" 
                                            value={interest}
                                            checked={formData.interests.includes(interest)}
                                            onChange={handleCheckboxChange}
                                            className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500" 
                                        /> 
                                        <span>{interest}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="experience" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Relevant Experience</label>
                            <textarea 
                                id="experience" 
                                rows={4} 
                                value={formData.experience}
                                onChange={handleInputChange}
                                placeholder="Tell us about any previous experience with animals or volunteering." 
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50"
                            ></textarea>
                        </div>
                        
                        <div>
                            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors transform hover:scale-105">
                                Send Application via Email
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VolunteerPage;