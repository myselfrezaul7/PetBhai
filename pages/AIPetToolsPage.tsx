import React, { useState, useRef } from 'react';
import { generateText, analyzeRescueImage } from '../services/geminiService';
import { PawIcon, HeartIcon, RefreshIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';

type ToolType = 'symptom' | 'breed' | 'behavior' | 'food';

const AIPetToolsPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('symptom');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);

    try {
      let prompt = '';
      let response = '';

      if (activeTool === 'symptom') {
        if (!textInput.trim()) {
          toast.error('Please describe the symptoms.');
          setLoading(false);
          return;
        }
        const fullPrompt = `Act as a veterinary triage assistant. A user is reporting these symptoms for their pet: "${textInput}". 
                Provide a preliminary assessment and 3 potential causes. 
                IMPORTANT: Start with a disclaimer that this is AI advice and they should see a vet for serious issues. 
                Focus on common issues in Bangladesh (heat stroke, ticks, food poisoning).`;
        response = await generateText(fullPrompt);
      } else if (activeTool === 'behavior') {
        if (!textInput.trim()) {
          toast.error('Please describe the behavior.');
          setLoading(false);
          return;
        }
        const fullPrompt = `Analyze this pet behavior: "${textInput}". Explain why the pet might be doing this and suggest how to manage it positively.`;
        response = await generateText(fullPrompt);
      } else if (activeTool === 'breed') {
        if (!imageFile) {
          toast.error('Please upload an image for breed identification.');
          setLoading(false);
          return;
        }
        // Use the rescue image analyzer but repurpose for breed ID
        const analysis = await analyzeRescueImage(imageFile);
        response = `Based on the image analysis:
                Type: ${analysis.type}
                
                This appears to be a ${analysis.type}. Note that visual identification is not 100% accurate, especially for mixed breeds.`;
      } else if (activeTool === 'food') {
        if (!textInput.trim() && !imageFile) {
          toast.error('Please provide ingredients text or upload a label image.');
          setLoading(false);
          return;
        }
        if (imageFile) {
          // In a real implementation, we'd OCR the proper label image
          const analysis = await analyzeRescueImage(imageFile); // Mocking for now as we don't have OCR endpoint
          response = `Label Analysis (Simulated): The image shows pet food content. Ideally, check for "By-products" or "Corn syrup" - these are red flags. Look for whole meat as the first ingredient.`;
        } else {
          const fullPrompt = `Analyze this pet food ingredient list: "${textInput}". 
                     Flag any harmful or low-quality ingredients (like artificial colors, excessive fillers, xylitol). Give a safety rating out of 10.`;
          response = await generateText(fullPrompt);
        }
      }

      setResult(response);
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    { id: 'symptom', name: 'Symptom Checker', icon: '🩺', desc: 'Check health issues early' },
    { id: 'breed', name: 'Breed Identifier', icon: '🐕', desc: 'Identify any dog/cat breed' },
    { id: 'behavior', name: 'Behavior Analyst', icon: '🧠', desc: 'Understand why they do that' },
    { id: 'food', name: 'Food Scanner', icon: '🍖', desc: 'Check ingredients safety' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
            AI Pet Specialist
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Advanced diagnostic tools powered by Gemini AI to help you take better care of your
            furry friends.
          </p>
        </header>

        <div className="grid md:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as ToolType);
                  setResult(null);
                  setImageFile(null);
                  setImagePreview(null);
                  setTextInput('');
                }}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center space-x-4 border-2 ${
                  activeTool === tool.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md transform scale-[1.02]'
                    : 'border-transparent bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{tool.name}</h3>
                  <p className="text-xs text-slate-500">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Tool Interface */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 min-h-[500px]">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">{tools.find((t) => t.id === activeTool)?.icon}</span>
              {tools.find((t) => t.id === activeTool)?.name}
            </h2>

            <div className="space-y-6">
              {/* Input Section */}
              {(activeTool === 'symptom' || activeTool === 'behavior' || activeTool === 'food') && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                    {activeTool === 'symptom' &&
                      'Describe the symptoms (e.g., vomiting, lethargy):'}
                    {activeTool === 'behavior' &&
                      'Describe the behavior (e.g., constantly scratching door):'}
                    {activeTool === 'food' && 'Paste ingredients list (or upload label photo):'}
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full h-32 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="Type here..."
                  />
                </div>
              )}

              {(activeTool === 'breed' || activeTool === 'food') && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                    Upload Photo
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-64 rounded-lg shadow-md"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <PawIcon className="w-12 h-12 mb-2 opacity-50" />
                        <p>Click to upload image</p>
                        <p className="text-xs mt-1">JPG, PNG, WebP supported</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                }`}
              >
                {loading && <RefreshIcon className="w-6 h-6 animate-spin" />}
                {loading ? 'Analyzing...' : 'Analyze Now'}
              </button>

              {/* Results Section */}
              {result && (
                <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 animate-fade-in">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center text-lg">
                    <HeartIcon className="w-6 h-6 mr-2 text-indigo-500" />
                    AI Analysis Result
                  </h3>
                  <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {result}
                  </div>

                  {activeTool === 'symptom' && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                      ⚠️ <strong>Disclaimer:</strong> AI is not a substitute for a professional
                      veterinarian. If your pet is in distress, please visit a clinic immediately.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPetToolsPage;
