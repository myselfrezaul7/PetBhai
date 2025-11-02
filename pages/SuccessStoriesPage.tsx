import React from 'react';
import { MOCK_SUCCESS_STORIES } from '../constants';
import type { SuccessStory } from '../types';

const SuccessStoryCard: React.FC<{ story: SuccessStory }> = ({ story }) => (
    <div className="glass-card overflow-hidden flex flex-col md:flex-row items-center">
        <img src={story.animalImageUrl} alt={story.animalName} className="w-full md:w-1/3 h-64 md:h-full object-cover" />
        <div className="p-8">
            <p className="text-sm uppercase tracking-widest text-orange-600 dark:text-orange-400 font-bold">
                Adopted on {new Date(story.adoptionDate).toLocaleDateString()}
            </p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{story.animalName}'s New Beginning</h3>
            <p className="text-slate-700 dark:text-slate-300 mt-4 text-base leading-relaxed">{story.story}</p>
        </div>
    </div>
);


const SuccessStoriesPage: React.FC = () => {
    return (
        <div className="container mx-auto px-6 py-16 animate-fade-in">
             <div className="text-center mb-12 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">Success Stories</h1>
                <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
                    Every adoption marks a new chapter of love and companionship. Read the heartwarming stories of animals who have found their forever homes thanks to supporters like you.
                </p>
            </div>
            <div className="space-y-10 max-w-5xl mx-auto">
                {MOCK_SUCCESS_STORIES.map(story => (
                    <SuccessStoryCard key={story.id} story={story} />
                ))}
            </div>
        </div>
    );
};

export default SuccessStoriesPage;