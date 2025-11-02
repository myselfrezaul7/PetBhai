import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { getVetAssistantResponse } from '../services/geminiService';
import { PawIcon, SendIcon } from '../components/icons';

const CHAT_HISTORY_STORAGE_KEY = 'petbhai_ai_chat_history';

const getInitialChatHistory = (): ChatMessage[] => {
  try {
    const storedHistory = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      // Basic validation to ensure it's an array
      if (Array.isArray(parsed)) {
          return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading chat history from localStorage", error);
    // If parsing fails, remove the corrupted item to prevent future errors
    window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  }
  return []; // Return empty array if nothing is stored or if there's an error
};

const AIAssistantPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(getInitialChatHistory);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  useEffect(() => {
    try {
        if (chatHistory.length > 0) {
            window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
        } else {
            window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Error saving chat history to localStorage", error);
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await getVetAssistantResponse(userInput);
      const newAiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
      setChatHistory(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'ai', text: "Oops! Something went wrong. Please try again." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
      setChatHistory([]);
  };

  return (
    // The container height is calculated to fill the viewport minus the header's height (approx. 72px).
    <div className="flex flex-col h-[calc(100vh-72px)] container mx-auto p-4 max-w-3xl animate-fade-in">
      <div className="text-center mb-6 pt-4">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">AI Vet Assistant</h1>
        <p className="text-lg text-slate-700 dark:text-slate-200">Ask general questions about pet health and care.</p>
      </div>
      <div className="glass-card flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="space-y-6" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="bg-orange-500 p-2 rounded-full text-white flex-shrink-0">
                  <PawIcon className="w-6 h-6" />
              </div>
              <div className="bg-slate-100/70 dark:bg-slate-700/70 p-4 rounded-xl rounded-tl-none max-w-lg">
                <p className="text-slate-800 dark:text-slate-200">Hello! I'm PetBhai's AI Assistant. How can I help you with your pet today?</p>
              </div>
            </div>

            {chatHistory.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="bg-orange-500 p-2 rounded-full text-white flex-shrink-0">
                    <PawIcon className="w-6 h-6" />
                  </div>
                )}
                <div className={`p-4 rounded-xl max-w-lg whitespace-pre-wrap ${
                  message.sender === 'user' 
                  ? 'bg-orange-500 text-white rounded-br-none' 
                  : 'bg-slate-100/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 p-2 rounded-full text-white">
                  <PawIcon className="w-6 h-6" />
                </div>
                <div className="bg-slate-100/70 dark:bg-slate-700/70 p-4 rounded-xl rounded-tl-none">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
        <div className="p-4 bg-black/5 dark:bg-black/10 border-t border-white/20 dark:border-slate-700/50">
           {chatHistory.length > 0 && (
             <div className="text-center mb-2">
                <button onClick={handleClearChat} className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 hover:underline">
                  Clear Chat
                </button>
             </div>
           )}
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about pet care..."
              className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;