import {
  getCleanShareUrl,
  formatSocialShareText,
  getPlatformShareLinks,
  PRODUCTION_DOMAIN,
} from '../../lib/shareUtils';

describe('shareUtils', () => {
  describe('getCleanShareUrl', () => {
    it('returns canonical production URL for relative paths', () => {
      const url = getCleanShareUrl('/blog/cat-care');
      expect(url).toBe(`${PRODUCTION_DOMAIN}/blog/cat-care`);
    });

    it('strips query strings and trailing slashes', () => {
      const url = getCleanShareUrl('https://localhost:3000/shop/12?utm_source=test#section');
      expect(url).toBe(`${PRODUCTION_DOMAIN}/shop/12`);
    });

    it('converts hash router paths to clean URLs', () => {
      const url = getCleanShareUrl('https://www.petbhai.com/#/adopt/3');
      expect(url).toBe(`${PRODUCTION_DOMAIN}/adopt/3`);
    });

    it('appends utm/referral source cleanly when specified', () => {
      const url = getCleanShareUrl('/shop/15', 'whatsapp');
      expect(url).toBe(`${PRODUCTION_DOMAIN}/shop/15?ref=whatsapp`);
    });
  });

  describe('formatSocialShareText', () => {
    it('formats WhatsApp message with price and direct order link for products', () => {
      const text = formatSocialShareText(
        {
          title: 'Royal Canin Maxi Adult',
          price: 4250,
          category: 'Dog Food',
          path: '/shop/10',
          type: 'product',
        },
        'whatsapp'
      );

      expect(text).toContain('*Royal Canin Maxi Adult*');
      expect(text).toContain('4,250');
      expect(text).toContain('Dog Food');
      expect(text).toContain('https://www.petbhai.com/shop/10?ref=whatsapp');
    });

    it('formats WhatsApp message for pet adoption', () => {
      const text = formatSocialShareText(
        {
          title: 'Whiskers',
          description: 'A friendly 6-month-old kitten looking for a warm home.',
          path: '/adopt/5',
          type: 'pet',
        },
        'whatsapp'
      );

      expect(text).toContain('*Adopt Me: Whiskers*');
      expect(text).toContain('Give this pet a loving home');
      expect(text).toContain('https://www.petbhai.com/adopt/5?ref=whatsapp');
    });

    it('formats Twitter message with hashtags', () => {
      const text = formatSocialShareText(
        {
          title: 'Essential Cat Vaccinations in Bangladesh',
          path: '/blog/vaccines',
          type: 'article',
        },
        'twitter'
      );

      expect(text).toContain('Essential Cat Vaccinations');
      expect(text).toContain('#PetBhai');
      expect(text).toContain('#PetCareBD');
    });
  });

  describe('getPlatformShareLinks', () => {
    it('generates encoded URLs for all major platforms', () => {
      const links = getPlatformShareLinks({
        title: 'Pet Care Tips',
        description: 'Read our latest tips.',
        path: '/blog/tips',
      });

      expect(links.whatsapp).toContain('https://wa.me/?text=');
      expect(links.facebook).toContain('https://www.facebook.com/sharer/sharer.php?u=');
      expect(links.twitter).toContain('https://twitter.com/intent/tweet?text=');
      expect(links.telegram).toContain('https://t.me/share/url?url=');
      expect(links.cleanUrl).toBe(`${PRODUCTION_DOMAIN}/blog/tips`);
    });
  });
});
