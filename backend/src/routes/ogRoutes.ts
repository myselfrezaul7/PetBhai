import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

const PRODUCTION_DOMAIN = 'https://www.petbhai.com';
const DEFAULT_IMAGE = `${PRODUCTION_DOMAIN}/landing-hero.png?v=20260215`;

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const toAbsoluteUrl = (pathOrUrl?: string): string => {
  if (!pathOrUrl) return DEFAULT_IMAGE;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
};

interface MetaData {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  type: string;
}

const resolveMetadataForPath = (rawPath: string): MetaData => {
  let cleanPath = rawPath.trim();
  // Strip domain if provided
  cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/i, '');
  // Strip hash routing if provided (#/shop/1 -> /shop/1)
  if (cleanPath.startsWith('#/')) {
    cleanPath = cleanPath.substring(1);
  }
  // Strip query string
  cleanPath = cleanPath.split('?')[0];

  const segments = cleanPath.split('/').filter(Boolean);
  const section = segments[0]?.toLowerCase();
  const idOrSlug = segments[1];

  // Default fallback
  let title = "PetBhai - Bangladesh's Trusted Pet Care & Supplies";
  let description =
    'Adopt rescued pets, book licensed vet consultations, and shop premium pet supplies across Bangladesh.';
  let imageUrl = DEFAULT_IMAGE;
  let type = 'website';
  const canonicalUrl = `${PRODUCTION_DOMAIN}/${segments.join('/')}`;

  if (!section || segments.length === 0) {
    return { title, description, imageUrl, canonicalUrl: PRODUCTION_DOMAIN, type };
  }

  // 1. Blog Articles (/blog/:slug or /blog/:id)
  if (section === 'blog' && idOrSlug) {
    const article = db.articles.find((a) => a.slug === idOrSlug || a.id.toString() === idOrSlug);
    if (article) {
      title = `${article.title} | PetBhai Blog`;
      const plainText = (article.excerpt || article.content || '')
        .replace(/[#*`_[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      description = plainText.length > 155 ? `${plainText.substring(0, 155)}...` : plainText;
      imageUrl = toAbsoluteUrl(article.imageUrl || (article as any).image);
      type = 'article';
      return { title, description, imageUrl, canonicalUrl, type };
    }
  }

  // 2. Shop Products (/shop/:id or /product/:id or /products/:id)
  if ((section === 'shop' || section === 'product' || section === 'products') && idOrSlug) {
    const product = db.products.find(
      (p) => p.id.toString() === idOrSlug || (p as any).slug === idOrSlug
    );
    if (product) {
      const priceFormatted = `৳${product.price.toLocaleString('en-BD')}`;
      title = `${product.name} - ${priceFormatted} | PetBhai`;
      const plainDesc = (product.description || '')
        .replace(/[#*`_[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      description =
        plainDesc.length > 140
          ? `${plainDesc.substring(0, 140)}... Buy now with fast home delivery in Bangladesh.`
          : `${plainDesc || product.name}. Authentic pet supplies with fast home delivery in Bangladesh.`;
      imageUrl = toAbsoluteUrl(product.imageUrl || (product as any).image);
      type = 'product';
      return { title, description, imageUrl, canonicalUrl, type };
    }
  }

  // 3. Adoption Pets (/adopt/:id or /animals/:id)
  if ((section === 'adopt' || section === 'animals') && idOrSlug) {
    const animal = db.animals.find(
      (a) => a.id.toString() === idOrSlug || (a as any).slug === idOrSlug
    );
    if (animal) {
      title = `Adopt ${animal.name} (${animal.breed || animal.species}) | PetBhai Adoption`;
      description = `Meet ${animal.name}, a friendly ${animal.age || ''} ${animal.breed || animal.species} looking for a loving home in ${animal.location || 'Dhaka, Bangladesh'}.`;
      imageUrl = toAbsoluteUrl(animal.imageUrl || (animal as any).image);
      type = 'article';
      return { title, description, imageUrl, canonicalUrl, type };
    }
  }

  // 4. Vets (/vets/:id)
  if (section === 'vets' && idOrSlug) {
    const vet = db.vets.find((v) => v.id.toString() === idOrSlug || (v as any).slug === idOrSlug);
    if (vet) {
      title = `${vet.name} (${vet.specialization || 'Veterinarian'}) | PetBhai`;
      description = `Book an online or in-clinic consultation with ${vet.name} at ${vet.clinicName || 'PetBhai Partner Clinics'}. Certified pet healthcare in Bangladesh.`;
      imageUrl = toAbsoluteUrl(vet.imageUrl || (vet as any).image);
      type = 'profile';
      return { title, description, imageUrl, canonicalUrl, type };
    }
  }

  // 5. Special Landing Pages
  if (section === 'plus' || section === 'membership') {
    title = 'PetBhai+ VIP Membership | Free Delivery & Exclusive Perks';
    description =
      'Join PetBhai+ for unlimited free delivery, monthly free vet consultations, surprise perks, and exclusive member discounts.';
    return { title, description, imageUrl: DEFAULT_IMAGE, canonicalUrl, type: 'website' };
  }

  if (section === 'adopt') {
    title = 'Pet Adoption in Bangladesh | Dogs, Cats & Rescues | PetBhai';
    description =
      'Give a loving forever home to rescued dogs and cats in Dhaka and across Bangladesh. Browse vaccinated pets ready for adoption.';
    return { title, description, imageUrl: DEFAULT_IMAGE, canonicalUrl, type: 'website' };
  }

  if (section === 'shop') {
    title = 'Pet Supplies & Food Online Shop Bangladesh | PetBhai';
    description =
      'Shop authentic dog food, cat food, litter, cages, medicines, and toys. 100% genuine products delivered right to your door.';
    return { title, description, imageUrl: DEFAULT_IMAGE, canonicalUrl, type: 'website' };
  }

  if (section === 'blog') {
    title = 'Expert Pet Care Blog, Nutrition & Vet Advice | PetBhai';
    description =
      'Read veterinarian-reviewed articles on puppy care, cat vaccination schedules, nutrition guides, and pet health in Bangladesh.';
    return { title, description, imageUrl: DEFAULT_IMAGE, canonicalUrl, type: 'website' };
  }

  return { title, description, imageUrl, canonicalUrl, type };
};

export const handleOgPreview = (req: Request, res: Response): void => {
  const targetPath =
    (req.query.path as string) ||
    (req.query.targetPath as string) ||
    (req.query.url as string) ||
    (req.headers['x-forwarded-uri'] as string) ||
    req.path ||
    '/';

  const meta = resolveMetadataForPath(targetPath);

  // Set caching: 1 day for CDN, stale-while-revalidate for 7 days
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">

  <!-- Open Graph / Facebook / WhatsApp / Telegram / LinkedIn -->
  <meta property="fb:app_id" content="106952955493913">
  <meta property="og:site_name" content="PetBhai">
  <meta property="og:type" content="${escapeHtml(meta.type)}">
  <meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:image" content="${escapeHtml(meta.imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(meta.imageUrl)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(meta.title)}">
  <meta property="og:locale" content="en_US">
  <meta property="og:locale:alternate" content="bn_BD">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@petbhai">
  <meta name="twitter:creator" content="@petbhai">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(meta.title)}">

  <!-- Client Redirection: Humans who land here are immediately redirected to the client page -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(meta.canonicalUrl)}">
  <script>
    window.location.replace(${JSON.stringify(meta.canonicalUrl)});
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #fffaf5; color: #334155;">
  <div style="max-width: 480px; margin: 0 auto; padding: 24px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">${escapeHtml(meta.title)}</h1>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">${escapeHtml(meta.description)}</p>
    <a href="${escapeHtml(meta.canonicalUrl)}" style="display: inline-block; background: #f97316; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">
      Open in PetBhai
    </a>
  </div>
</body>
</html>`;

  res.status(200).send(html);
};

// Handle both /api/og and subpaths
router.get('/', handleOgPreview);
router.get('/preview', handleOgPreview);
router.get('/:type/:slug?', (req, res) => {
  const compositePath = `/${req.params.type}${req.params.slug ? `/${req.params.slug}` : ''}`;
  req.query.path = compositePath;
  return handleOgPreview(req, res);
});

export default router;
