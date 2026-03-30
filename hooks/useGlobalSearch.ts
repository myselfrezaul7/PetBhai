import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Article, Animal, Product, Vet } from '../types';

export interface PageResult {
  name: string;
  path: string;
  keywords: string[];
}

export interface GlobalSearchResults {
  products: Product[];
  pages: PageResult[];
  articles: Article[];
  vets: Vet[];
  animals: Animal[];
}

type UseGlobalSearchArgs = {
  query: string;
  products: Product[];
  pages: PageResult[];
  articles: Article[];
  vets: Vet[];
  animals: Animal[];
  limits?: {
    products?: number;
    pages?: number;
    articles?: number;
    vets?: number;
    animals?: number;
  };
};

const MIN_QUERY_LENGTH = 1;

export function useGlobalSearch({
  query,
  products,
  pages,
  articles,
  vets,
  animals,
  limits,
}: UseGlobalSearchArgs): GlobalSearchResults {
  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const limitedArticles = useMemo(() => {
    if (!shouldSearch) {
      return [] as Article[];
    }

    // Avoid indexing full article bodies (can be very large); keep a reasonably sized slice.
    return articles.map((a) => ({
      ...a,
      content: a.content.slice(0, 2500),
    }));
  }, [articles, shouldSearch]);

  const productFuse = useMemo(() => {
    if (!shouldSearch) {
      return null;
    }

    return new Fuse(products, {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      keys: ['name', 'category', 'searchTags'],
    });
  }, [products, shouldSearch]);

  const pageFuse = useMemo(() => {
    if (!shouldSearch) {
      return null;
    }

    return new Fuse(pages, {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      keys: ['name', 'keywords'],
    });
  }, [pages, shouldSearch]);

  const vetFuse = useMemo(() => {
    if (!shouldSearch) {
      return null;
    }

    return new Fuse(vets, {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      keys: ['name', 'specialization', 'clinicName'],
    });
  }, [vets, shouldSearch]);

  const articleFuse = useMemo(() => {
    if (!shouldSearch) {
      return null;
    }

    return new Fuse(limitedArticles, {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      keys: ['title', 'content', 'author'],
    });
  }, [limitedArticles, shouldSearch]);

  const animalFuse = useMemo(() => {
    if (!shouldSearch) {
      return null;
    }

    return new Fuse(animals, {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      keys: ['name', 'breed', 'description'],
    });
  }, [animals, shouldSearch]);

  return useMemo(() => {
    if (!shouldSearch || !productFuse || !pageFuse || !vetFuse || !articleFuse || !animalFuse) {
      return { products: [], pages: [], articles: [], vets: [], animals: [] };
    }

    return {
      products: productFuse
        .search(trimmedQuery)
        .slice(0, limits?.products ?? 4)
        .map((r) => r.item),
      pages: pageFuse
        .search(trimmedQuery)
        .slice(0, limits?.pages ?? 3)
        .map((r) => r.item),
      vets: vetFuse
        .search(trimmedQuery)
        .slice(0, limits?.vets ?? 3)
        .map((r) => r.item),
      articles: articleFuse
        .search(trimmedQuery)
        .slice(0, limits?.articles ?? 3)
        .map((r) => r.item),
      animals: animalFuse
        .search(trimmedQuery)
        .slice(0, limits?.animals ?? 3)
        .map((r) => r.item),
    };
  }, [
    shouldSearch,
    trimmedQuery,
    productFuse,
    pageFuse,
    vetFuse,
    articleFuse,
    animalFuse,
    limits?.products,
    limits?.pages,
    limits?.vets,
    limits?.articles,
    limits?.animals,
  ]);
}
