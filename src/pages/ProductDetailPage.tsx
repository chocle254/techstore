import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, ChevronRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/common/ProductCard';
import { YouMayAlsoLike } from '@/components/common/YouMayAlsoLike';
import { getProductBySlug, getReviewsByProduct, getProducts } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import type { Product, Review } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setQty(1);
    setActiveImg(0);
    getProductBySlug(slug).then(async (p) => {
      if (!p) { navigate('/shop'); return; }
      setProduct(p);
      const [revs, rel] = await Promise.all([
        getReviewsByProduct(p.id),
        getProducts({ categorySlug: p.category?.slug, limit: 4, page: 1 }).then(r => r.products.filter(x => x.id !== p.id).slice(0, 4)),
      ]);
      setReviews(revs);
      setRelated(rel);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-80 aspect-square rounded-lg bg-muted" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4 bg-muted" />
            <Skeleton className="h-6 w-24 bg-muted" />
            <Skeleton className="h-10 w-32 bg-muted" />
            <Skeleton className="h-20 w-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const inWishlist = wishlistIds.has(product.id);
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;
  const allImages = product.images?.length ? product.images : [product.image_url];

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[120px]">{product.name}</span>
      </nav>

      {/* Product detail */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Images */}
        <div className="w-full md:w-80 lg:w-96 shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border mb-3">
            <img
              src={allImages[activeImg]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                    i === activeImg ? 'border-primary' : 'border-border hover:border-primary/50'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{product.name}</h1>
            </div>
            <button onClick={() => toggleWishlist(product.id)} className="shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary transition-colors">
              <Heart className={cn('w-5 h-5', inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={cn('w-4 h-4', i <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted')} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.review_count} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-foreground">${product.price.toFixed(2)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-lg text-muted-foreground line-through">${product.original_price.toFixed(2)}</span>
            )}
            {discount && <span className="badge-sale">-{discount}%</span>}
            {product.is_new && <span className="badge-new">New</span>}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <p className={cn('text-sm font-medium mb-4', product.stock > 0 ? 'text-green-400' : 'text-destructive')}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
          </p>

          {/* Qty + Add to cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 h-10 flex items-center justify-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Specs + Reviews */}
      <Tabs defaultValue="specs" className="mb-12">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-6">
            {Object.entries(product.specs || {}).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground capitalize w-36 shrink-0">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-foreground font-medium">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No specifications available.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No reviews yet.</p>
            ) : reviews.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.reviewer_name}</p>
                    {r.title && <p className="text-sm text-muted-foreground">{r.title}</p>}
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn('w-3.5 h-3.5', i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted')} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Related products */}
      <YouMayAlsoLike products={related} />
    </div>
  );
}
