import React, { useState } from 'react';

// WhatsApp Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '8801712345678',
  defaultMessage = 'Hi PetBhai! I have a question about...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const handleSendMessage = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  const quickMessages = [
    { label: '🛒 Order Status', text: 'Hi! I want to check my order status.' },
    { label: '🐕 Pet Adoption', text: 'Hi! I am interested in adopting a pet.' },
    { label: '👨‍⚕️ Vet Consultation', text: 'Hi! I need to consult a vet for my pet.' },
    { label: '📦 Product Inquiry', text: 'Hi! I have a question about a product.' },
  ];

  return (
    <>
      {/* WhatsApp Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-80 max-w-[calc(100vw-40px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-[#075E54] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">PetBhai Support</h4>
                <p className="text-green-200 text-xs">Usually replies within minutes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="p-4 bg-[#ECE5DD] dark:bg-slate-900/50 min-h-[120px]">
            {/* Welcome Message Bubble */}
            <div className="bg-white dark:bg-slate-800 rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%]">
              <p className="text-sm text-slate-700 dark:text-slate-200">আসসালামু আলাইকুম! 👋</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                How can we help you today?
              </p>
              <p className="text-[10px] text-slate-400 mt-1 text-right">PetBhai Team</p>
            </div>
          </div>

          {/* Quick Messages */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
              Quick Messages:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickMessages.map((qm, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(qm.text)}
                  className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  {qm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-100 dark:bg-slate-700 border-none rounded-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center hover:bg-[#128C7E] transition-colors shadow-md"
                aria-label="Send message"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-40 right-5 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl z-30 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-600 hover:bg-slate-700' : 'bg-[#25D366] hover:bg-[#128C7E]'
        }`}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
      >
        {isOpen ? (
          <CloseIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
        ) : (
          <>
            <WhatsAppIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white animate-pulse">
              1
            </span>
          </>
        )}
      </button>

      {/* Tooltip when not open */}
      {!isOpen && (
        <div className="fixed bottom-[178px] right-20 bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-30 hidden md:block animate-fade-in">
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-800 dark:border-l-slate-700"></div>
          Need help? Chat with us!
        </div>
      )}
    </>
  );
};

export default WhatsAppButton;
