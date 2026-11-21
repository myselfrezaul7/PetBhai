import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../types';
import {
  getVetAssistantResponse,
  isAiConfigured,
  analyzeRescueImage,
} from '../services/geminiService';
import { PawIcon, SendIcon, CloseIcon, TrashIcon } from '../components/icons';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useToast } from '../contexts/ToastContext';
import { sanitizeUrl } from '../lib/security';
import { safeStorage, safeSessionStorage } from '../lib/storage';

const CHAT_HISTORY_STORAGE_KEY = 'petbhai_ai_chat_history';
const WARNING_DISMISSED_KEY = 'petbhai_ai_warning_dismissed';

// Markdown Renderer
const FormattedMessage: React.FC<{ text: string }> = React.memo(({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let currentList: React.ReactNode[] = [];

  const formatText = (textLine: string) => {
    const parts = textLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-orange-500 font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const [label, url] = part.slice(1, -1).split('](');
        const safeUrl = sanitizeUrl(url);
        if (!safeUrl) return <span key={i}>{label}</span>;
        return (
          <a
            key={i}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-orange-400 underline hover:text-orange-300"
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
      currentList.push(<li key={index}>{formatText(line.trim().substring(2))}</li>);
      inList = true;
    } else {
      if (inList) pushList(index);
      if (line.trim() !== '')
        elements.push(
          <p key={index} className="mt-2 first:mt-0">
            {formatText(line)}
          </p>
        );
    }
  });
  if (inList) pushList(lines.length);

  return <>{elements}</>;
});

// The Futuristic Reactive Avatar
const DynamicAvatar: React.FC<{
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  compactOnMobile?: boolean;
}> = ({ state, compactOnMobile = false }) => {
  return (
    <>
      {compactOnMobile && (
        <div className="flex md:hidden items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
              <PawIcon className="h-5 w-5 text-white" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                  state === 'thinking'
                    ? 'bg-amber-400 animate-ping'
                    : state === 'listening'
                      ? 'bg-red-500 animate-pulse'
                      : state === 'speaking'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-emerald-500'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">PetBhai AI Vet</p>
              <p className="text-[11px] text-slate-400 capitalize">{state}</p>
            </div>
          </div>
          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-400">
            24/7 First-Aid Guide
          </span>
        </div>
      )}
      <div
        className={`${
          compactOnMobile ? 'hidden md:flex' : 'flex'
        } relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 items-center justify-center`}
      >
        {/* Outer Glow Ring */}
        <motion.div
          animate={{
            scale: state === 'listening' ? [1, 1.2, 1] : state === 'speaking' ? [1, 1.05, 1] : 1,
            opacity: state === 'listening' ? [0.5, 0.8, 0.5] : 0.3,
            borderColor: state === 'thinking' ? ['#ff6b35', '#004e64', '#ff6b35'] : '#ff6b35',
          }}
          transition={{
            duration: state === 'speaking' ? 0.4 : 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full border-4 border-orange-500 blur-sm"
        />
        {/* Core Orb */}
        <motion.div
          animate={{
            scale: state === 'listening' ? 1.1 : state === 'thinking' ? [0.9, 1, 0.9] : 1,
            boxShadow:
              state === 'speaking'
                ? '0 0 40px rgba(255, 107, 53, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5)'
                : '0 0 20px rgba(255, 107, 53, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)',
            rotate: state === 'thinking' ? 360 : 0,
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center z-10"
        >
          <PawIcon className="w-10 h-10 text-white opacity-90" />
        </motion.div>

        {/* Waveforms when speaking/listening */}
        <AnimatePresence>
          {(state === 'speaking' || state === 'listening') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-6 flex space-x-1 items-end h-6"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height:
                      state === 'listening'
                        ? ['4px', `${Math.random() * 20 + 4}px`, '4px']
                        : ['10px', `${Math.random() * 24 + 4}px`, '10px'],
                  }}
                  transition={{
                    duration: Math.random() * 0.5 + 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 bg-orange-500 rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const AIAssistantPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const stored = safeStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [userInput, setUserInput] = useState('');
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>(
    'idle'
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { confirm } = useConfirmation();
  const toast = useToast();
  const aiAvailable = isAiConfigured();
  const [reportedIndices, setReportedIndices] = useState<number[]>([]);

  const handleReportAiMessage = useCallback(
    async (index: number) => {
      if (reportedIndices.includes(index)) return;
      const shouldReport = await confirm({
        title: 'Report AI Response?',
        message:
          'Flag this AI-generated response as inaccurate, harmful, or inappropriate for review by our team?',
        confirmText: 'Report Response',
        cancelText: 'Cancel',
      });
      if (!shouldReport) return;
      setReportedIndices((prev) => [...prev, index]);
      toast.success('Thank you. This AI response has been flagged for safety review.');
    },
    [confirm, reportedIndices, toast]
  );

  useEffect(() => {
    if (!safeSessionStorage.getItem(WARNING_DISMISSED_KEY)) setIsWarningVisible(true);

    // Check Speech Recognition support
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setAvatarState((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current.onerror = () => {
        setAvatarState('idle');
        toast.error('Microphone access denied or unavailable.');
      };
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!uploadedImage) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(uploadedImage);
    setImagePreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [uploadedImage]);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatHistory]);
  useEffect(() => {
    safeStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (avatarState === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setAvatarState('idle');
    } else {
      setUserInput('');
      try {
        recognitionRef.current.start();
        setAvatarState('listening');
      } catch {
        setAvatarState('idle');
        toast.error('Microphone access denied or unavailable.');
      }
    }
  };

  const speakResponse = (text: string) => {
    setAvatarState('idle');
    if (isVoiceMuted) {
      return;
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    ) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[\*\#_]/g, ''));
        utterance.onstart = () => setAvatarState('speaking');
        utterance.onend = () => setAvatarState('idle');
        utterance.onerror = () => setAvatarState('idle');
        window.speechSynthesis.speak(utterance);
      } catch {
        setAvatarState('idle');
      }
    }
  };

  const toggleVoiceMute = () => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setAvatarState((s) => (s === 'speaking' ? 'idle' : s));
      }
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (avatarState === 'listening' && recognitionRef.current) recognitionRef.current.stop();
    if ((!userInput.trim() && !uploadedImage) || avatarState === 'thinking') return;

    let userMessageText = userInput;
    if (uploadedImage) {
      userMessageText = `[Image Attached] ${userInput}`;
    }

    const newUserMessage: ChatMessage = { sender: 'user', text: userMessageText };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setUserInput('');
    setAvatarState('thinking');

    try {
      let aiResponseText = '';
      if (uploadedImage) {
        // Vision branch
        const visionResult = await analyzeRescueImage(uploadedImage);
        aiResponseText = `I analyzed the image. It appears to be a **${visionResult.type}**. \n\nCondition: ${visionResult.condition}\n\n*Note: I am an AI. Please verify with a real vet.*`;
        setUploadedImage(null);
      } else {
        // Standard text branch
        aiResponseText = await getVetAssistantResponse(userMessageText);
      }

      setChatHistory((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
      speakResponse(aiResponseText);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: 'Oops! I had trouble connecting. Please try again.' },
      ]);
      setAvatarState('idle');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4.75rem-var(--safe-top)-var(--safe-bottom))] md:h-[calc(100dvh-7rem)] bg-slate-950 text-slate-200">
      <div className="container mx-auto p-3 sm:p-4 max-w-4xl flex flex-col h-full">
        {isWarningVisible && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card-ios p-3.5 sm:p-4 mb-3 sm:mb-4 flex items-start space-x-3 bg-orange-900/30 border-orange-500/30"
          >
            <div className="flex-grow">
              <h3 className="font-bold text-sm sm:text-base text-orange-400">
                Emergency & First-Aid Info Only
              </h3>
              <p className="text-xs sm:text-sm text-orange-200 mt-0.5">
                This AI is not a real vet. Always consult an in-person professional for emergencies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                safeSessionStorage.setItem(WARNING_DISMISSED_KEY, 'true');
                setIsWarningVisible(false);
              }}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-orange-300"
              aria-label="Dismiss warning"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* HUD Area */}
        <div className="flex-shrink-0 pt-1 pb-1">
          <DynamicAvatar state={avatarState} compactOnMobile={chatHistory.length > 0} />
        </div>

        {/* Chat Stream */}
        <div className="flex-grow overflow-y-auto px-2 pb-4 space-y-6 scrollbar-hide">
          {chatHistory.length === 0 && (
            <div className="text-center text-slate-400 mt-10 opacity-70">
              <p className="mb-2">Try saying or typing:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span
                  className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs cursor-pointer hover:bg-slate-800"
                  onClick={() => setUserInput('What human foods are toxic to dogs?')}
                >
                  What human foods are toxic to dogs?
                </span>
                <span
                  className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs cursor-pointer hover:bg-slate-800"
                  onClick={() => setUserInput('My kitten has diarrhea, what should I do?')}
                >
                  My kitten has diarrhea...
                </span>
              </div>
            </div>
          )}

          {chatHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl ${msg.sender === 'user' ? 'bg-orange-500 text-white rounded-br-sm' : 'glass-card-ios bg-slate-900/80 border-slate-700 text-slate-200 rounded-bl-sm shadow-xl'}`}
              >
                {msg.sender === 'ai' ? (
                  <>
                    <FormattedMessage text={msg.text} />
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>AI-generated • Verify with a licensed vet</span>
                      <button
                        type="button"
                        onClick={() => void handleReportAiMessage(idx)}
                        disabled={reportedIndices.includes(idx)}
                        className="text-slate-400 hover:text-red-400 disabled:text-emerald-400 transition-colors font-medium"
                      >
                        {reportedIndices.includes(idx) ? '✓ Flagged' : '⚑ Report'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </motion.div>
          ))}
          {avatarState === 'thinking' && (
            <div className="flex justify-start">
              <div className="glass-card-ios bg-slate-900/80 p-4 rounded-3xl rounded-bl-sm flex space-x-2">
                <motion.div
                  className="w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
                />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Spatial Input Area */}
        <div className="pt-3 mt-auto border-t border-slate-800">
          {uploadedImage && (
            <div className="mb-2.5 inline-flex items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-1.5">
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="Attached pet preview"
                  className="h-9 w-9 rounded-lg object-cover"
                />
              )}
              <span className="max-w-[180px] truncate text-xs font-medium text-slate-200">
                {uploadedImage.name}
              </span>
              <button
                type="button"
                onClick={() => setUploadedImage(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Remove attached photo"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="relative flex items-center glass-card-ios bg-slate-900/90 rounded-full p-1.5 pl-4 border border-slate-700 shadow-2xl"
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                avatarState === 'listening'
                  ? 'Listening...'
                  : uploadedImage
                    ? 'Add optional note about this photo...'
                    : 'Ask your AI Vet...'
              }
              className="flex-grow bg-transparent border-none focus:ring-0 text-base sm:text-sm text-white placeholder-slate-500 outline-none"
              disabled={avatarState === 'thinking' || !aiAvailable}
            />

            {/* Image Upload Button */}
            <label
              className="min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer text-slate-400 hover:text-orange-400 transition-colors"
              title="Upload pet photo for analysis"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedImage(e.target.files[0]);
                  }
                }}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </label>

            {/* Voice Dictation Button */}
            {isVoiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full mx-1 transition-colors ${avatarState === 'listening' ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-400'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={
                !aiAvailable || avatarState === 'thinking' || (!userInput.trim() && !uploadedImage)
              }
              className="bg-orange-500 text-white rounded-full p-2.5 ml-1 hover:bg-orange-600 disabled:opacity-50 transition-all"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>

          <div className="flex justify-between items-center mt-2.5 px-2 sm:px-4">
            <span className="text-xs text-slate-500">AI responses can be inaccurate.</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleVoiceMute}
                className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
                aria-pressed={isVoiceMuted}
              >
                {isVoiceMuted ? '🔇 Voice Muted' : '🔊 Voice On'}
              </button>
              {chatHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    confirm({ title: 'Clear Chat?', message: 'Delete all history?' }).then(
                      (res) => res && setChatHistory([])
                    )
                  }
                  className="text-xs text-red-400 hover:text-red-300 flex items-center"
                >
                  <TrashIcon className="w-3 h-3 mr-1" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
