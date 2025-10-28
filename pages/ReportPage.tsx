import React, { useState, useRef } from 'react';
import { MapPinIcon } from '../components/icons';

const ReportPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }
    
    setIsLocating(true);
    setStatus('Locating...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('Location found!');
        setLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        setIsLocating(false);
      },
      () => {
        setStatus('Unable to retrieve your location. Please enter it manually.');
        setIsLocating(false);
      }
    );
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
        if (selectedFile.size > MAX_FILE_SIZE) {
            setFileError('File is too large. Please select a file under 5MB.');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } else {
            setFileError('');
            setFile(selectedFile);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let alertMessage = 'Thank you! Your report has been submitted. Our team will look into it shortly.';
    if(file) {
        alertMessage += `\nFile "${file.name}" was included.`
    }
    alert(alertMessage);
    // Reset form state
    setLocation('');
    setStatus('');
    setFile(null);
    setFileError('');
    formRef.current?.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex-grow flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-4">Report an Animal in Need</h1>
        <p className="text-lg text-center text-slate-600 mb-10">
          See an animal that needs help? Fill out the form below, and our rescue team will be alerted.
        </p>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="animal-type" className="block text-base font-semibold text-slate-700 mb-2">Type of Animal</label>
            <select id="animal-type" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <option>Dog</option>
              <option>Cat</option>
              <option>Bird</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="condition" className="block text-base font-semibold text-slate-700 mb-2">Description of Condition</label>
            <textarea id="condition" rows={4} required placeholder="e.g., Injured leg, looks lost and scared, etc." className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"></textarea>
          </div>
          
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">Upload Photo/Video</label>
            <div className="flex items-center space-x-4">
                <input type="file" id="file-upload" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                    Choose File
                </label>
                <div className="text-sm text-slate-600">
                    {file && <p>{file.name}</p>}
                    {!file && <p>No file selected.</p>}
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-2 ml-1">Max file size: 5MB. Videos and images are accepted.</p>
             {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-base font-semibold text-slate-700 mb-2">Location (Address or Coordinates)</label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input 
                type="text" 
                id="location" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required 
                placeholder="e.g., Near City Park, 123 Main St"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button 
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center justify-center bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-400"
              >
                <MapPinIcon className="w-5 h-5 mr-2" />
                {isLocating ? 'Locating...' : 'Use My Location'}
              </button>
            </div>
            {status && <p className="text-sm text-gray-500 mt-2">{status}</p>}
          </div>

          <div>
            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors transform hover:scale-105">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;