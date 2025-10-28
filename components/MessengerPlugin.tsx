import React, { useState } from 'react';
import { MessageCircleIcon, CloseIcon, SendIcon } from './icons';

const MessengerPlugin: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-5 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-40 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center p-4 bg-orange-500 text-white rounded-t-2xl">
          <h3 className="font-bold text-lg">Chat with PetBhai</h3>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 h-80 overflow-y-auto bg-slate-50">
           <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                    <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
                        <p className="text-sm font-normal text-gray-900">Hi there! How can we help you today?</p>
                    </div>
                </div>
                <div className="flex items-start gap-2.5">
                    <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
                        <p className="text-sm font-normal text-gray-900">Our support team is available from 9 AM to 6 PM.</p>
                    </div>
                </div>
           </div>
        </div>
        <div className="p-3 bg-white border-t border-slate-200 rounded-b-2xl">
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow p-2.5 border border-slate-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    disabled
                />
                <button disabled className="bg-orange-500 text-white rounded-full p-3 disabled:bg-orange-300">
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-16 h-16 bg-orange-500 rounded-full text-white shadow-xl z-40 flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-300"
        aria-label="Open chat"
      >
        {isOpen ? <CloseIcon className="w-8 h-8"/> : <MessageCircleIcon className="w-8 h-8" />}
      </button>
    </>
  );
};

export default MessengerPlugin;