import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/types';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const inWishlist = wishlistIds.has(product.id);

  const [heartPop, setHeartPop] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discountPct = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;
  const isHot = product.is_deal && !!discountPct;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0 || justAdded) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 450);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        'product-card group block',
        isHot && 'ring-1 ring-[hsl(var(--ember))]/30',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && <span className="badge-new">New</span>}
          {discountPct && (
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded text-white',
                isHot ? 'bg-hot glow-hot' : 'bg-destructive'
              )}
            >
              -{discountPct}%
            </span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center transition-colors hover:bg-background/60"
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              heartPop && 'animate-heart-pop',
              inWishlist ? 'fill-[hsl(var(--hot-pink))] text-[hsl(var(--hot-pink))]' : 'text-muted-foreground'
            )}
          />
        </button>
        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                className={cn('w-3 h-3', i <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted')}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.review_count})</span>
        </div>

        {/* Price */}
       <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className={cn('text-sm sm:text-base font-bold truncate', isHot ? 'text-spectrum' : 'text-foreground')}>
              ${product.price.toFixed(2)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through truncate">${product.original_price.toFixed(2)}</span>
            )}
          </div>
          <Button
            size="sm"
            className={cn(
              'h-8 px-2 sm:px-3 text-xs shrink-0 transition-colors',
              justAdded && 'animate-cart-pop bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]',
              isHot && !justAdded && 'bg-hot hover:opacity-90'
            )}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {justAdded ? <Check className="w-3 h-3 sm:mr-1" /> : <ShoppingCart className="w-3 h-3 sm:mr-1" />}
            <span className="hidden sm:inline">{justAdded ? 'Added' : 'Add'}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
