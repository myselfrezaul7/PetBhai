import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShareMetadata,
  getCleanShareUrl,
  getPlatformShareLinks,
  copyToClipboard,
  executeNativeShare,
  PRODUCTION_DOMAIN,
} from '../lib/shareUtils';
import { useToast } from '../contexts/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ShareMetadata;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, metadata }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const links = getPlatformShareLinks(metadata);
  const cleanUrl = getCleanShareUrl(metadata.url || metadata.path);
  const displayImage = metadata.imageUrl || `${PRODUCTION_DOMAIN}/landing-hero.png`;

  const handleCopy = async () => {
    const success = await copyToClipboard(cleanUrl);
    if (success) {
      setCopied(true);
      toast.success('Curated link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleNative = async () => {
    await executeNativeShare(metadata);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 z-10"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </span>
              <div>
                <h3
                  id="share-modal-title"
                  className="font-bold text-base text-zinc-900 dark:text-zinc-100"
                >
                  Share Curated Link
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Optimized for WhatsApp, Messenger & Social Cards
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              aria-label="Close share dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Social Preview Mockup (What others will see) */}
          <div className="mt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 block">
              Social Card Preview
            </span>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 shadow-inner">
              <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <img
                  src={displayImage}
                  alt={metadata.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${PRODUCTION_DOMAIN}/landing-hero.png`;
                  }}
                />
                {metadata.price !== undefined && (
                  <span className="absolute bottom-2 left-2 rounded-lg bg-orange-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-black text-white shadow-md">
                    ৳{metadata.price.toLocaleString('en-BD')}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[11px] uppercase font-bold text-orange-600 dark:text-orange-400 truncate">
                  petbhai.com • {metadata.category || 'Pet Care Bangladesh'}
                </p>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 mt-0.5">
                  {metadata.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                  {metadata.description ||
                    'Authentic pet supplies, vet help & animal adoption in Bangladesh.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Copy Field */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 p-1.5 pl-3 border border-zinc-200/80 dark:border-zinc-700/60">
            <svg
              className="w-4 h-4 text-zinc-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <input
              type="text"
              readOnly
              value={cleanUrl}
              className="w-full bg-transparent text-xs text-zinc-700 dark:text-zinc-200 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Platform Share Actions */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {/* WhatsApp */}
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                WhatsApp
              </span>
            </a>

            {/* Facebook */}
            <a
              href={links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all hover:bg-blue-50 dark:hover:bg-blue-950/30 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Facebook
              </span>
            </a>

            {/* Telegram */}
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all hover:bg-sky-50 dark:hover:bg-sky-950/30 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0088cc] text-white shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Telegram
              </span>
            </a>

            {/* Native Mobile Share / More */}
            <button
              onClick={handleNative}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800 dark:bg-zinc-700 text-white shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                More
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
