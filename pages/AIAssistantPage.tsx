import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { getVetAssistantResponse, isAiConfigured } from '../services/geminiService';
import { PawIcon, SendIcon, CloseIcon, TrashIcon } from '../components/icons';
import { useConfirmation } from '../contexts/ConfirmationContext';

const CHAT_HISTORY_STORAGE_KEY = 'petbhai_ai_chat_history';
const WARNING_DISMISSED_KEY = 'petbhai_ai_warning_dismissed';

// A simple component to parse and render basic Markdown from the AI
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let currentList: React.ReactNode[] = [];

  const formatText = (textLine: string) => {
    // Regex to match bold (**text**) and links ([text](url))
    const parts = textLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const [label, url] = part.slice(1, -1).split('](');
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 underline hover:text-orange-800"
          >
            {label}
          </a>
        );
      }
      return part;
    });
  };

  const pushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 mt-2">
          {currentList}
        </ul>
      );
      currentList = [];
    }
    inList = false;
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('* ')) {
      const listItemText = line.trim().substring(2);
      currentList.push(<li key={index}>{formatText(listItemText)}</li>);
      inList = true;
    } else {
      if (inList) {
        pushList(index);
      }
      if (line.trim() !== '') {
        elements.push(
          <p key={index} className="mt-2 first:mt-0">
            {formatText(line)}
          </p>
        );
      }
    }
  });

  if (inList) {
    pushList(lines.length);
  }

  return <>{elements}</>;
};

const getInitialChatHistory = (): ChatMessage[] => {
  try {
    const storedHistory = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading chat history from localStorage', error);
    window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  }
  return [];
};

const AIAssistantPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(getInitialChatHistory);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirmation();
  const aiAvailable = isAiConfigured();

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(WARNING_DISMISSED_KEY);
    if (!isDismissed) {
      setIsWarningVisible(true);
    }
  }, []);

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
      console.error('Error saving chat history to localStorage', error);
    }
  }, [chatHistory]);

  const handleDismissWarning = () => {
    sessionStorage.setItem(WARNING_DISMISSED_KEY, 'true');
    setIsWarningVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await getVetAssistantResponse(userInput);
      const newAiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
      setChatHistory((prev) => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        sender: 'ai',
        text: 'Oops! Something went wrong. Please try again.',
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    const shouldClear = await confirm({
      title: 'Clear Chat History?',
      message:
        'Are you sure you want to clear the entire chat history? This action cannot be undone.',
    });
    if (shouldClear) {
      setChatHistory([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] container mx-auto p-4 max-w-3xl animate-fade-in">
      <div className="text-center mb-6 pt-4">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">AI Vet</h1>
        <p className="text-lg text-slate-700 dark:text-slate-200">
          Ask general questions about pet health and care.
        </p>
      </div>

      {isWarningVisible && (
        <div className="animate-fade-in glass-card p-4 mb-4 flex items-start space-x-4 bg-orange-100/50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/30">
          <div className="flex-shrink-0 text-orange-500 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.233 11.916c.638 1.213-.466 2.735-1.744 2.735H3.768c-1.278 0-2.382-1.522-1.744-2.735L8.257 3.099zM10 12a1 1 0 110-2 1 1 0 010 2zm0-5a1 1 0 011 1v2a1 1 0 11-2 0V8a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-orange-800 dark:text-orange-200">
              For First-Aid & Info Only
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              This is an AI assistant, NOT a real veterinarian. The advice provided is for general
              guidance and emergency first-aid purposes only. For any health concerns, you{' '}
              <strong>must</strong> consult a licensed, in-person veterinarian.
            </p>
          </div>
          <button
            onClick={handleDismissWarning}
            className="p-1 rounded-full text-orange-600 dark:text-orange-300 hover:bg-orange-200/50 dark:hover:bg-orange-800/50"
            aria-label="Dismiss warning"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="glass-card flex-grow flex flex-col overflow-hidden">
        {!aiAvailable && (
          <div className="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100">
            <strong>AI Assistant is unavailable for this deployment.</strong> The AI feature
            requires a server-side configuration (GEMINI API key) or a secure proxy. Please contact
            the site administrator or see the project README for setup instructions.
          </div>
        )}
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="space-y-6" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="bg-orange-500 p-2 rounded-full text-white flex-shrink-0">
                <PawIcon className="w-6 h-6" />
              </div>
              <div className="bg-slate-100/70 dark:bg-slate-700/70 p-4 rounded-xl rounded-tl-none max-w-lg">
                <p className="text-slate-800 dark:text-slate-200">
                  Hello! I'm PetBhai's AI Vet. How can I help you with your pet today?
                </p>
              </div>
            </div>

            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
              >
                {message.sender === 'ai' && (
                  <div className="bg-orange-500 p-2 rounded-full text-white flex-shrink-0">
                    <PawIcon className="w-6 h-6" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-xl max-w-lg ${
                    message.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-slate-100/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <FormattedMessage text={message.text} />
                  ) : (
                    <p>{message.text}</p>
                  )}
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
                    <span>Thinking & Searching...</span>
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
              <button
                onClick={handleClearChat}
                className="inline-flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors px-3 py-1 rounded-md hover:bg-red-500/10"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Clear Chat</span>
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
              disabled={isLoading || !aiAvailable}
            />
            <button
              type="submit"
              disabled={!aiAvailable || isLoading || !userInput.trim()}
              className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
