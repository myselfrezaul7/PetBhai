/**
 * PetBhai Curated Link Sharing Utilities
 * Formats clean canonical URLs and curated platform-specific share messages (WhatsApp, Facebook, Twitter, Telegram)
 */

export interface ShareMetadata {
  title: string;
  description?: string;
  url?: string;
  path?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  type?: 'product' | 'article' | 'pet' | 'vet' | 'general';
  tags?: string[];
}

export const PRODUCTION_DOMAIN = 'https://www.petbhai.com';

/**
 * Normalizes any URL or route path to an absolute, clean canonical URL on the production domain.
 * Strips localhost, hash fragments, and tracking clutter.
 */
export const getCleanShareUrl = (rawUrlOrPath?: string, utmSource?: string): string => {
  let cleanPath = '/';

  if (rawUrlOrPath) {
    try {
      if (rawUrlOrPath.startsWith('http://') || rawUrlOrPath.startsWith('https://')) {
        const parsed = new URL(rawUrlOrPath);
        // If there's a hash routing like #/blog/slug, extract it
        if (parsed.hash && parsed.hash.startsWith('#/')) {
          cleanPath = parsed.hash.substring(1);
        } else {
          cleanPath = parsed.pathname;
        }
      } else {
        // It's a relative path like "/blog/cat-care" or "#/shop/12"
        if (rawUrlOrPath.startsWith('#/')) {
          cleanPath = rawUrlOrPath.substring(1);
        } else {
          cleanPath = rawUrlOrPath.startsWith('/') ? rawUrlOrPath : `/${rawUrlOrPath}`;
        }
      }
    } catch {
      cleanPath = rawUrlOrPath.startsWith('/') ? rawUrlOrPath : `/${rawUrlOrPath}`;
    }
  } else if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      cleanPath = hash.substring(1);
    } else {
      cleanPath = window.location.pathname;
    }
  }

  // Strip query params and trailing slashes for consistency
  const cleanPathOnly = cleanPath.split('?')[0].replace(/\/+$/, '');
  const finalPath = cleanPathOnly === '' ? '' : cleanPathOnly;

  const url = `${PRODUCTION_DOMAIN}${finalPath}`;

  if (utmSource) {
    return `${url}?ref=${encodeURIComponent(utmSource)}`;
  }
  return url;
};

/**
 * Formats platform-tailored share messages.
 * In Bangladesh, WhatsApp and Facebook Messenger respond best to clear emoji bullet points and direct prices.
 */
export const formatSocialShareText = (
  meta: ShareMetadata,
  platform: 'whatsapp' | 'twitter' | 'telegram' | 'general'
): string => {
  const cleanUrl = getCleanShareUrl(meta.url || meta.path, platform);
  const title = meta.title.trim();
  const desc = (meta.description || '').trim();

  switch (platform) {
    case 'whatsapp': {
      if (meta.type === 'product' && meta.price !== undefined) {
        return (
          `🐾 *${title}*\n` +
          `🏷️ Price: ৳${meta.price.toLocaleString('en-BD')}\n` +
          (meta.category ? `📦 Category: ${meta.category}\n` : '') +
          `\nOrder directly on PetBhai:\n👉 ${cleanUrl}`
        );
      }
      if (meta.type === 'pet') {
        return (
          `🐾 *Adopt Me: ${title}*\n` +
          (desc ? `${desc.slice(0, 120)}...\n` : '') +
          `\nGive this pet a loving home on PetBhai:\n👉 ${cleanUrl}`
        );
      }
      if (meta.type === 'article') {
        return (
          `📖 *${title}*\n` +
          (desc ? `${desc.slice(0, 140)}...\n` : '') +
          `\nRead the full guide on PetBhai:\n👉 ${cleanUrl}`
        );
      }
      return (
        `🐾 *${title}*\n` +
        (desc ? `${desc.slice(0, 120)}...\n` : '') +
        `\nCheck it out on PetBhai:\n👉 ${cleanUrl}`
      );
    }

    case 'twitter': {
      const hashtags = '#PetBhai #PetCareBD';
      // X has character limits; keep intro brief
      const shortDesc = desc ? ` - ${desc.slice(0, 80)}` : '';
      return `${title}${shortDesc}\n${cleanUrl} ${hashtags}`;
    }

    case 'telegram': {
      let body = `🐾 **${title}**\n\n`;
      if (meta.price !== undefined) {
        body += `🏷️ Price: ৳${meta.price.toLocaleString('en-BD')}\n`;
      }
      if (desc) {
        body += `${desc}\n\n`;
      }
      body += `🔗 ${cleanUrl}`;
      return body;
    }

    default:
      return `${title} - ${desc ? desc + ' ' : ''}${cleanUrl}`;
  }
};

/**
 * Returns formatted one-click share intent URLs for major social networks.
 */
export const getPlatformShareLinks = (meta: ShareMetadata) => {
  const cleanUrl = getCleanShareUrl(meta.url || meta.path);
  const waText = encodeURIComponent(formatSocialShareText(meta, 'whatsapp'));
  const twText = encodeURIComponent(formatSocialShareText(meta, 'twitter'));
  const tgText = encodeURIComponent(formatSocialShareText(meta, 'telegram'));
  const encodedUrl = encodeURIComponent(cleanUrl);
  const encodedTitle = encodeURIComponent(meta.title);

  return {
    whatsapp: `https://wa.me/?text=${waText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${twText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${tgText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    messenger: `fb-messenger://share/?link=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(
      `${meta.title}\n\n${meta.description || ''}\n\nView here: ${cleanUrl}`
    )}`,
    cleanUrl,
  };
};

/**
 * Trigger native mobile share sheet (iOS/Android) with automatic fallback.
 */
export const executeNativeShare = async (meta: ShareMetadata): Promise<boolean> => {
  const cleanUrl = getCleanShareUrl(meta.url || meta.path, 'mobile_share');

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: meta.title,
        text: meta.description || meta.title,
        url: cleanUrl,
      });
      return true;
    } catch (err: any) {
      // User cancelled native share sheet — not an error
      if (err?.name === 'AbortError') {
        return false;
      }
    }
  }

  // Fallback to clipboard
  return copyToClipboard(cleanUrl);
};

/**
 * Robust clipboard copy helper with fallbacks for insecure contexts or older mobile browsers.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }
  return false;
};
