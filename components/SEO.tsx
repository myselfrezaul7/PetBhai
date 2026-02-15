import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  // Product-specific
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  // Article-specific
  section?: string;
  tags?: string[];
  // Twitter specific
  twitterCard?: 'summary' | 'summary_large_image' | 'player';
  twitterCreator?: string;
  // Custom Structured Data
  structuredData?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = 'PetBhai - Your one-stop destination for all pet needs in Bangladesh. Shop for pet food, supplies, find vets, adopt pets, and join our community of pet lovers.',
  keywords = [
    'pet shop bangladesh',
    'pet food dhaka',
    'vet near me',
    'pet adoption bangladesh',
    'পোষা প্রাণী',
  ],
  image,
  url,
  type = 'website',
  noindex = false,
  author,
  publishedTime,
  modifiedTime,
  price,
  currency = 'BDT',
  availability,
  brand,
  section,
  tags,
  twitterCard = 'summary_large_image',
  twitterCreator = '@petbhai_bd',
  structuredData,
}) => {
  const siteTitle = 'PetBhai';
  // Always use production URL for canonical tags to avoid duplicate indexing issues
  const productionUrl = 'https://www.petbhai.com/';
  const baseUrl =
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${import.meta.env.BASE_URL}`
      : productionUrl);
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const assetVersion = '20260215';
  const defaultImage = new URL(`landing-hero.png?v=${assetVersion}`, productionUrl).toString();
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  // Generate clean canonical URL without query params or hash fragments
  const getCanonicalUrl = () => {
    if (url) {
      // If explicit URL provided, ensure it uses production domain
      return url.startsWith('http') ? url : `${productionUrl}${url.replace(/^\//, '')}`;
    }
    if (typeof window !== 'undefined') {
      // Extract path from hash router (e.g., /#/shop -> /shop/)
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        const path = hash.substring(2).split('?')[0]; // Remove #/ prefix and query params
        const cleanPath = path.endsWith('/') || path === '' ? path : `${path}/`;
        return `${productionUrl}${cleanPath}`;
      }
      // For non-hash URLs, use pathname without query params
      const pathname = window.location.pathname.replace(/\/index\.html$/, '/');
      const cleanPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
      return `${productionUrl.slice(0, -1)}${cleanPath}`;
    }
    return productionUrl;
  };

  const currentUrl = getCanonicalUrl();
  const resolvedImage = image || defaultImage;
  const robotsValue = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const googleBotValue = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  // Schema.org structured data
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebSite',
      name: title || siteTitle,
      description,
      url: currentUrl,
      image: resolvedImage,
    };

    if (type === 'product' && price) {
      return {
        ...baseData,
        '@type': 'Product',
        brand: brand ? { '@type': 'Brand', name: brand } : undefined,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability:
            availability === 'in stock'
              ? 'https://schema.org/InStock'
              : availability === 'out of stock'
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/PreOrder',
        },
      };
    }

    if (type === 'article') {
      return {
        ...baseData,
        '@type': 'Article',
        author: author ? { '@type': 'Person', name: author } : undefined,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        articleSection: section,
        keywords: tags?.join(', '),
        publisher: {
          '@type': 'Organization',
          name: siteTitle,
          logo: {
            '@type': 'ImageObject',
            url: `${productionUrl}icon-192x192.png?v=${assetVersion}`,
          },
        },
      };
    }

    return {
      ...baseData,
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${productionUrl}shop/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content={robotsValue} />
      <meta name="googlebot" content={googleBotValue} />
      <link rel="alternate" hrefLang="en-BD" href={currentUrl} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:secure_url" content={resolvedImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="bn_BD" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:site" content="@petbhai_bd" />
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && <meta property="article:author" content={author} />}
      {type === 'article' && section && <meta property="article:section" content={section} />}
      {type === 'article' &&
        tags &&
        tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Product specific */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={String(price)} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}
      {type === 'product' && availability && (
        <meta property="product:availability" content={availability} />
      )}
      {type === 'product' && brand && <meta property="product:brand" content={brand} />}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || getStructuredData())}
      </script>

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PetBhai',
          url: normalizedBaseUrl,
          logo: new URL(`icon-192x192.png?v=${assetVersion}`, normalizedBaseUrl).toString(),
          sameAs: [
            'https://www.facebook.com/petbhaibd',
            'https://www.instagram.com/petbhai_bd',
            'https://twitter.com/petbhai_bd',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+880-1XXX-XXXXXX',
            contactType: 'customer service',
            availableLanguage: ['English', 'Bengali'],
          },
        })}
      </script>
    </Helmet>
  );
};

// Predefined SEO configurations for common pages
export const HomePageSEO: React.FC = () => (
  <SEO
    title="Home"
    description="PetBhai - Bangladesh's #1 pet care platform. Shop premium pet food, supplies, find trusted vets, adopt pets, and connect with pet lovers across Bangladesh."
    keywords={[
      'pet shop bangladesh',
      'pet food dhaka',
      'buy pet supplies online',
      'pet bhai',
      'পেটভাই',
    ]}
  />
);

export const ShopPageSEO: React.FC = () => (
  <SEO
    title="Shop Pet Food & Supplies"
    description="Browse our collection of premium pet food, toys, accessories, and grooming products. Free delivery in Dhaka on orders over ৳2000."
    keywords={[
      'buy pet food online bangladesh',
      'dog food dhaka',
      'cat food bangladesh',
      'pet supplies',
    ]}
  />
);

export const AdoptPageSEO: React.FC = () => (
  <SEO
    title="Adopt a Pet"
    description="Give a loving home to dogs and cats in need. Browse our adoption listings and find your new furry family member today."
    keywords={['pet adoption bangladesh', 'adopt dog dhaka', 'adopt cat bangladesh', 'rescue pets']}
  />
);

export const BlogPageSEO: React.FC = () => (
  <SEO
    title="Pet Care Blog"
    description="Expert tips and advice on pet care, nutrition, health, and training. Learn how to keep your furry friends happy and healthy."
    keywords={['pet care tips', 'dog training bangladesh', 'cat health advice', 'pet nutrition']}
    type="website"
  />
);

export const ServicesPageSEO: React.FC = () => (
  <SEO
    title="Pet Services - Vets, Grooming & Training"
    description="Find trusted veterinarians, professional groomers, and expert trainers near you. Online and in-person consultations available."
    keywords={[
      'vet near me dhaka',
      'pet grooming bangladesh',
      'dog trainer dhaka',
      'veterinary services',
    ]}
  />
);

export default SEO;
