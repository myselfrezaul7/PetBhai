import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface ShopFilters {
  category: string;
  brand: string;
  search: string;
  sort: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page: number;
}

const defaultFilters: ShopFilters = {
  category: 'All',
  brand: 'All',
  search: '',
  sort: 'default',
  page: 1,
};

export const useShopFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse current filters from URL
  const filters = useMemo<ShopFilters>(() => {
    return {
      category: searchParams.get('category') || defaultFilters.category,
      brand: searchParams.get('brand') || defaultFilters.brand,
      search: searchParams.get('q') || defaultFilters.search,
      sort: searchParams.get('sort') || defaultFilters.sort,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      page: Number(searchParams.get('page')) || defaultFilters.page,
    };
  }, [searchParams]);

  // Update a single filter
  const setFilter = useCallback(
    <K extends keyof ShopFilters>(key: K, value: ShopFilters[K]) => {
      const newParams = new URLSearchParams(searchParams);

      // Map filter keys to URL param names
      const paramMap: Record<keyof ShopFilters, string> = {
        category: 'category',
        brand: 'brand',
        search: 'q',
        sort: 'sort',
        minPrice: 'minPrice',
        maxPrice: 'maxPrice',
        inStock: 'inStock',
        page: 'page',
      };

      const paramName = paramMap[key];

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === defaultFilters[key] ||
        (key === 'page' && value === 1)
      ) {
        newParams.delete(paramName);
      } else {
        newParams.set(paramName, String(value));
      }

      // Reset page when changing filters (except when changing page itself)
      if (key !== 'page') {
        newParams.delete('page');
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Update multiple filters at once
  const setFilters = useCallback(
    (newFilters: Partial<ShopFilters>) => {
      const newParams = new URLSearchParams();

      const combined = { ...filters, ...newFilters };

      if (combined.category && combined.category !== 'All') {
        newParams.set('category', combined.category);
      }
      if (combined.brand && combined.brand !== 'All') {
        newParams.set('brand', combined.brand);
      }
      if (combined.search) {
        newParams.set('q', combined.search);
      }
      if (combined.sort && combined.sort !== 'default') {
        newParams.set('sort', combined.sort);
      }
      if (combined.minPrice !== undefined) {
        newParams.set('minPrice', String(combined.minPrice));
      }
      if (combined.maxPrice !== undefined) {
        newParams.set('maxPrice', String(combined.maxPrice));
      }
      if (combined.inStock) {
        newParams.set('inStock', 'true');
      }
      if (combined.page && combined.page > 1) {
        newParams.set('page', String(combined.page));
      }

      setSearchParams(newParams, { replace: true });
    },
    [filters, setSearchParams]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== 'All' ||
      filters.brand !== 'All' ||
      filters.search !== '' ||
      filters.sort !== 'default' ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStock !== undefined
    );
  }, [filters]);

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.brand !== 'All') count++;
    if (filters.search) count++;
    if (filters.sort !== 'default') count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.inStock) count++;
    return count;
  }, [filters]);

  // Navigate to shop with filters
  const navigateToShop = useCallback(
    (newFilters?: Partial<ShopFilters>) => {
      const params = new URLSearchParams();
      const combined = { ...defaultFilters, ...newFilters };

      if (combined.category !== 'All') params.set('category', combined.category);
      if (combined.brand !== 'All') params.set('brand', combined.brand);
      if (combined.search) params.set('q', combined.search);
      if (combined.sort !== 'default') params.set('sort', combined.sort);

      navigate(`/shop?${params.toString()}`);
    },
    [navigate]
  );

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFiltersCount,
    navigateToShop,
  };
};

// Hook for blog page filters
interface BlogFilters {
  search: string;
  tag?: string;
  author?: string;
  page: number;
}

export const useBlogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<BlogFilters>(() => {
    return {
      search: searchParams.get('q') || '',
      tag: searchParams.get('tag') || undefined,
      author: searchParams.get('author') || undefined,
      page: Number(searchParams.get('page')) || 1,
    };
  }, [searchParams]);

  const setFilter = useCallback(
    <K extends keyof BlogFilters>(key: K, value: BlogFilters[K]) => {
      const newParams = new URLSearchParams(searchParams);
      const paramMap: Record<keyof BlogFilters, string> = {
        search: 'q',
        tag: 'tag',
        author: 'author',
        page: 'page',
      };

      if (!value || (key === 'page' && value === 1)) {
        newParams.delete(paramMap[key]);
      } else {
        newParams.set(paramMap[key], String(value));
      }

      if (key !== 'page') {
        newParams.delete('page');
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, resetFilters };
};

// Hook for adoption page filters
interface AdoptionFilters {
  species: string;
  age: string;
  gender: string;
  size: string;
  status: string;
  search: string;
}

export const useAdoptionFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<AdoptionFilters>(() => {
    return {
      species: searchParams.get('species') || 'All',
      age: searchParams.get('age') || 'All',
      gender: searchParams.get('gender') || 'All',
      size: searchParams.get('size') || 'All',
      status: searchParams.get('status') || 'Available',
      search: searchParams.get('q') || '',
    };
  }, [searchParams]);

  const setFilter = useCallback(
    <K extends keyof AdoptionFilters>(key: K, value: AdoptionFilters[K]) => {
      const newParams = new URLSearchParams(searchParams);

      if (!value || value === 'All' || (key === 'status' && value === 'Available')) {
        newParams.delete(key === 'search' ? 'q' : key);
      } else {
        newParams.set(key === 'search' ? 'q' : key, value);
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.species !== 'All' ||
      filters.age !== 'All' ||
      filters.gender !== 'All' ||
      filters.size !== 'All' ||
      filters.status !== 'Available' ||
      filters.search !== ''
    );
  }, [filters]);

  return { filters, setFilter, resetFilters, hasActiveFilters };
};

export default useShopFilters;
