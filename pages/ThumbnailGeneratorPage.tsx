import React, { useState } from 'react';
import { generateVlogThumbnail } from '../services/geminiService';
import { VideoCameraIcon, ImageIcon, CloseIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';

const ThumbnailGeneratorPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('My Pet');
  const [mood, setMood] = useState('Fun & Energetic');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateVlogThumbnail(title, subject, mood);
      setGeneratedImage(imageUrl);
      toast.success('Thumbnail generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
            <VideoCameraIcon className="w-10 h-10 text-orange-500" />
            Vlog Thumbnail Creator
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-200 mt-4">
            Create stunning, customized thumbnails for your pet vlogs using our AI (powered by Nano
            Banana).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="glass-card p-8 h-fit">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Vlog Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., My Cat's 5th Birthday!"
                  required
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Main Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Golden Retriever puppy, Grumpy Cat"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Mood / Style
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-white"
                >
                  <option>Fun & Energetic</option>
                  <option>Cinematic & Dramatic</option>
                  <option>Cute & Cozy</option>
                  <option>Minimalist & Clean</option>
                  <option>Surprised & Shocking</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Generating...
                  </span>
                ) : (
                  'Generate Thumbnail'
                )}
              </button>
            </form>
          </div>

          {/* Preview Section */}
          <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[300px] bg-slate-100/50 dark:bg-slate-800/50 relative overflow-hidden">
            {generatedImage ? (
              <div className="w-full flex flex-col items-center animate-fade-in">
                <div className="relative group w-full aspect-video shadow-2xl rounded-lg overflow-hidden">
                  <img
                    src={generatedImage}
                    alt="Generated Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={generatedImage}
                      download={`petbhai-thumbnail-${Date.now()}.png`}
                      className="bg-white text-slate-900 font-bold py-2 px-6 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Right-click or tap button to save
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500">
                {isGenerating ? (
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-300">
                      Creating your masterpiece...
                    </p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Your thumbnail will appear here.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGeneratorPage;
