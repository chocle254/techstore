import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton, EmptyState } from '@/components/common/SharedComponents';
import { getProducts, getCategories } from '@/lib/api';
import type { Product, Category } from '@/types/types';
import { cn } from '@/lib/utils';

const BRANDS = ['Apple', 'Samsung', 'Sony', 'ASUS', 'Bose', 'LG', 'Microsoft', 'Dell'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
];

function FilterPanel({
  priceRange, setPriceRange, selectedBrands, setSelectedBrands, minRating, setMinRating, onClear
}: {
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  selectedBrands: string[];
  setSelectedBrands: (v: string[]) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground h-7">
          Clear All
        </Button>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Price Range</p>
        <Slider
          min={0} max={3000} step={10}
          value={priceRange}
          onValueChange={v => setPriceRange(v as [number, number])}
          className="mb-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Brand</p>
        <div className="space-y-2">
          {BRANDS.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer min-h-8">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={checked => {
                  setSelectedBrands(checked
                    ? [...selectedBrands, brand]
                    : selectedBrands.filter(b => b !== brand)
                  );
                }}
              />
              <span className="text-sm text-muted-foreground">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Minimum Rating</p>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer min-h-8">
              <Checkbox
                checked={minRating === r}
                onCheckedChange={checked => setMinRating(checked ? r : 0)}
              />
              <span className="text-sm text-muted-foreground">{'★'.repeat(r)} & up</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const categorySlug = searchParams.get('category') || undefined;
  const searchQuery = searchParams.get('search') || undefined;
  const LIMIT = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products: data, total: t } = await getProducts({
        categorySlug,
        search: searchQuery,
        brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 3000 ? priceRange[1] : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
        page,
        limit: LIMIT,
      });
      setProducts(data);
      setTotal(t);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, searchQuery, selectedBrands, priceRange, minRating, sortBy, page]);

  useEffect(() => { setPage(1); }, [categorySlug, searchQuery, selectedBrands, priceRange, minRating, sortBy]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(setCategories); }, []);

  const clearFilters = () => {
    setPriceRange([0, 3000]);
    setSelectedBrands([]);
    setMinRating(0);
  };

  const currentCategory = categories.find(c => c.slug === categorySlug);
  const totalPages = Math.ceil(total / LIMIT);

  const filterProps = { priceRange, setPriceRange, selectedBrands, setSelectedBrands, minRating, setMinRating, onClear: clearFilters };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Filter Sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-border p-4 min-h-full overflow-y-auto">
        <FilterPanel {...filterProps} />
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 p-4 md:p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {currentCategory?.name || searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
            </h1>
            <p className="text-sm text-muted-foreground">{total} products found</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden gap-2 border border-border">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-card border-border w-72 p-4">
                <FilterPanel {...filterProps} />
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-sm bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters */}
        {(categorySlug || searchQuery || selectedBrands.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categorySlug && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {currentCategory?.name}
                <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('category'); setSearchParams(p); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                "{searchQuery}"
                <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBrands.map(b => (
              <span key={b} className="flex items-center gap-1 text-xs bg-muted text-foreground px-2 py-1 rounded-full">
                {b}
                <button onClick={() => setSelectedBrands(selectedBrands.filter(x => x !== b))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(LIMIT).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your filters or search terms."
            action={<Button onClick={clearFilters}>Clear Filters</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="border border-border"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={page === p ? 'default' : 'ghost'}
                  onClick={() => setPage(p)}
                  className={cn('w-8 h-8 p-0', page !== p && 'border border-border')}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border border-border"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
