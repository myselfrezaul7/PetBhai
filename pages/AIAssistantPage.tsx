import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { getVetAssistantResponse } from '../services/geminiService';
import { PawIcon, SendIcon } from '../components/icons';

const AIAssistantPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] container mx-auto p-4 max-w-3xl">
      <div className="text-center mb-6 pt-4">
        <h1 className="text-4xl font-bold text-slate-800">AI Vet Assistant</h1>
        <p className="text-lg text-slate-600">Ask general questions about pet health and care.</p>
      </div>
      <div className="flex-grow bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="bg-orange-500 p-2 rounded-full text-white flex-shrink-0">
                  <PawIcon className="w-6 h-6" />
              </div>
              <div className="bg-slate-100 p-4 rounded-xl rounded-tl-none max-w-lg">
                <p className="text-slate-800">Hello! I'm KUTTAWAALA's AI Assistant. How can I help you with your pet today?</p>
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
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
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
                <div className="bg-slate-100 p-4 rounded-xl rounded-tl-none">
                  <div className="flex items-center space-x-2 text-slate-700">
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
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about pet care..."
              className="flex-grow p-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors">
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
