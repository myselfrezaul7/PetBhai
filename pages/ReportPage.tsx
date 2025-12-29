import React, { useState, useRef, useCallback } from 'react';
import { MapPinIcon, VideoCameraIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';
import { analyzeRescueImage } from '../services/geminiService';
import { sanitizeInput } from '../lib/security';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ReportPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [animalType, setAnimalType] = useState('Dog');
  const [condition, setCondition] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setStatus('Locating...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('Location found!');
        setLocation(
          `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
        );
        setIsLocating(false);
      },
      () => {
        setStatus('Unable to retrieve your location. Please enter it manually.');
        setIsLocating(false);
      }
    );
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError('File is too large. Please select a file under 10MB.');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setFileError('');
        setFile(selectedFile);
      }
    }
  }, []);

  const handleAnalyzeImage = useCallback(async () => {
    if (!file) {
      setFileError('Please select an image first.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFileError('Analysis is only available for images.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeRescueImage(file);
      if (result.type) setAnimalType(result.type);
      if (result.condition) setCondition(result.condition);
      toast.success('Image analyzed successfully! Details updated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze image. Please fill details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, toast]);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(sanitizeInput(e.target.value));
  }, []);

  const handleConditionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCondition(sanitizeInput(e.target.value));
  }, []);

  const handleAnimalTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnimalType(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      toast.success('Thank you! Your rescue report has been submitted.');
      // Reset form state
      setLocation('');
      setStatus('');
      setFile(null);
      setFileError('');
      setCondition('');
      setAnimalType('Dog');
      formRef.current?.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [toast]
  );

  return (
    <main className="container mx-auto px-4 py-8 sm:py-12 flex-grow flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl glass-card p-5 sm:p-8 md:p-12">
        <header className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-2 sm:mb-4">
            Report a Rescue
          </h1>
          <p className="text-sm sm:text-lg text-slate-700 dark:text-slate-200">
            See an animal that needs help? Fill out the form below, and our rescue team will be
            alerted.
          </p>
        </header>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Upload Photo/Video
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-manipulation active:scale-95"
                >
                  Choose File
                </label>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {file && <p className="truncate max-w-32 sm:max-w-full">{file.name}</p>}
                  {!file && <p>No file selected.</p>}
                </div>
              </div>
              {file && file.type.startsWith('image/') && (
                <button
                  type="button"
                  onClick={handleAnalyzeImage}
                  disabled={isAnalyzing}
                  className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs sm:text-sm font-bold py-2 px-3 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center touch-manipulation active:scale-95 disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center">
                      <span
                        className="w-3 h-3 bg-orange-500 rounded-full animate-pulse mr-2"
                        aria-hidden="true"
                      ></span>
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Auto-Fill with AI
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
              Max file size: 10MB. Videos and images are accepted.
            </p>
            {fileError && (
              <p className="text-xs sm:text-sm text-red-600 mt-2" role="alert">
                {fileError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="animal-type"
              className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Type of Animal
            </label>
            <select
              id="animal-type"
              value={animalType}
              onChange={handleAnimalTypeChange}
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200 touch-manipulation cursor-pointer"
            >
              <option>Dog</option>
              <option>Cat</option>
              <option>Bird</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Description of Condition
            </label>
            <textarea
              id="condition"
              rows={4}
              required
              value={condition}
              onChange={handleConditionChange}
              placeholder="e.g., Injured leg, looks lost and scared, etc."
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200 text-sm sm:text-base"
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Location (Address or Coordinates)
            </label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                id="location"
                value={location}
                onChange={handleLocationChange}
                required
                placeholder="e.g., Near City Park, 123 Main St"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200 text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center justify-center bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-400 touch-manipulation active:scale-95 text-sm sm:text-base"
              >
                <MapPinIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                {isLocating ? 'Locating...' : 'Use My Location'}
              </button>
            </div>
            {status && (
              <p role="status" className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                {status}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg text-base sm:text-lg hover:bg-orange-600 transition-colors transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              Submit Rescue Report
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ReportPage;
