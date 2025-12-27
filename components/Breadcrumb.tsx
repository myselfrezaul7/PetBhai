import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Generate breadcrumbs from current path
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

  // Map of path segments to display labels
  const labelMap: Record<string, string> = {
    shop: 'Shop',
    product: 'Product',
    blog: 'Blog',
    services: 'Services',
    community: 'Community',
    adopt: 'Adopt a Pet',
    profile: 'Profile',
    checkout: 'Checkout',
    login: 'Login',
    signup: 'Sign Up',
    'plus-membership': 'PetBhai+',
    faq: 'FAQ',
    safety: 'Safety & Trust',
    terms: 'Terms & Conditions',
    vet: 'Veterinarian',
    report: 'Report',
    volunteer: 'Volunteer',
    'thumbnail-generator': 'AI Thumbnail Generator',
  };

  let currentPath = '';
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === paths.length - 1;

    // Skip numeric IDs but keep the path building
    if (!isNaN(Number(segment))) {
      return;
    }

    breadcrumbs.push({
      label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  // Don't render on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`py-3 px-4 md:px-6 ${className}`}>
      <ol
        className="flex items-center flex-wrap gap-1 text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbItems.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <svg
                className="w-4 h-4 mx-2 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.path ? (
              <Link
                to={item.path}
                className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span
                className="text-slate-800 dark:text-slate-200 font-medium"
                itemProp="name"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Compact version for mobile or tight spaces
export const BreadcrumbCompact: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (location.pathname === '/' || breadcrumbItems.length <= 1) {
    return null;
  }

  const parentItem = breadcrumbItems[breadcrumbItems.length - 2];

  return (
    <nav aria-label="Breadcrumb" className={`py-2 ${className}`}>
      <Link
        to={parentItem.path || '/'}
        className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to {parentItem.label}
      </Link>
    </nav>
  );
};

// Breadcrumb with custom items for detail pages
export const DetailPageBreadcrumb: React.FC<{
  category: string;
  categoryPath: string;
  itemName: string;
  className?: string;
}> = ({ category, categoryPath, itemName, className = '' }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: category, path: categoryPath },
    { label: itemName },
  ];

  return <Breadcrumb items={items} className={className} />;
};

export default Breadcrumb;
