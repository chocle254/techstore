import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const [heartAnimating, setHeartAnimating] = useState(false);
  const [burst, setBurst] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [flyUp, setFlyUp] = useState(false);

  const discountPct = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);

    setJustAdded(true);
    setFlyUp(false);
    // restart the fly-up animation on every click
    requestAnimationFrame(() => setFlyUp(true));
    window.setTimeout(() => setJustAdded(false), 900);
    window.setTimeout(() => setFlyUp(false), 700);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const adding = !inWishlist;
    toggleWishlist(product.id);

    setHeartAnimating(true);
    window.setTimeout(() => setHeartAnimating(false), 500);
    if (adding) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className={cn('product-card group block', className)}>
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
          {product.is_deal ? (
            <span className="hot-badge"><Flame className="w-3 h-3" />{discountPct ? `-${discountPct}%` : 'Hot Deal'}</span>
          ) : discountPct && (
            <span className="badge-sale">-{discountPct}%</span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center transition-colors hover:bg-background/60 overflow-visible"
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground',
              heartAnimating && 'animate-heart-pop'
            )}
          />
          {burst && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-4 h-4 fill-destructive text-destructive animate-burst" />
            </span>
          )}
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
            <span className="text-sm sm:text-base font-bold text-foreground truncate">${product.price.toFixed(2)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through truncate">${product.original_price.toFixed(2)}</span>
            )}
          </div>
          <div className="relative shrink-0">
            {flyUp && (
              <span className="absolute -top-1 right-1/2 translate-x-1/2 text-xs font-bold text-primary pointer-events-none animate-fly-up-fade">
                +1
              </span>
            )}
            <Button
              size="sm"
              className={cn('h-8 px-2 sm:px-3 text-xs btn-press', justAdded && 'animate-cart-bounce bg-green-600 hover:bg-green-600')}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {justAdded ? <Check className="w-3 h-3 sm:mr-1" /> : <ShoppingCart className="w-3 h-3 sm:mr-1" />}
              <span className="hidden sm:inline">{justAdded ? 'Added' : 'Add'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
