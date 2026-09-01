import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/api';
import { useAuth } from './AuthContext';
import type { WishlistItem } from '@/types/types';
import { toast } from 'sonner';

interface WishlistContextType {
  items: WishlistItem[];
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const data = await getWishlist();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const wishlistIds = new Set(items.map(i => i.product_id));

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) { toast.error('Please sign in to save items to wishlist'); return; }
    if (wishlistIds.has(productId)) {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(i => i.product_id !== productId));
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(productId);
      await fetchWishlist();
      toast.success('Added to wishlist');
    }
  }, [user, wishlistIds, fetchWishlist]);

  return (
    <WishlistContext.Provider value={{ items, wishlistIds, toggleWishlist, loading, refetch: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
