import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
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
  image = 'https://petbhai.com/og-image.jpg',
  url,
  type = 'website',
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
}) => {
  const siteTitle = 'PetBhai';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl =
    url || (typeof window !== 'undefined' ? window.location.href : 'https://petbhai.com');

  // Schema.org structured data
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebSite',
      name: title || siteTitle,
      description,
      url: currentUrl,
      image,
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
            url: 'https://petbhai.com/logo.png',
          },
        },
      };
    }

    return {
      ...baseData,
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://petbhai.com/#/shop?q={search_term_string}',
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

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="bn_BD" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
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
      <script type="application/ld+json">{JSON.stringify(getStructuredData())}</script>

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PetBhai',
          url: 'https://petbhai.com',
          logo: 'https://petbhai.com/logo.png',
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
