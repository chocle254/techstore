import { supabase } from '@/db/supabase';
import type { Product, Category, Order, WishlistItem, Review, BlogPost, Profile, OrderItem } from '@/types/types';

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(opts: {
  categorySlug?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isDeal?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ products: Product[]; total: number }> {
  const { page = 1, limit = 12 } = opts;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, category:categories!category_id(*)', { count: 'exact' });

  if (opts.categorySlug) {
    const cat = await getCategoryBySlug(opts.categorySlug);
    if (cat) query = query.eq('category_id', cat.id);
  }
  if (opts.brand) query = query.eq('brand', opts.brand);
  if (opts.search) query = query.ilike('name', `%${opts.search}%`);
  if (opts.minPrice != null) query = query.gte('price', opts.minPrice);
  if (opts.maxPrice != null) query = query.lte('price', opts.maxPrice);
  if (opts.minRating != null) query = query.gte('rating', opts.minRating);
  if (opts.isFeatured) query = query.eq('is_featured', true);
  if (opts.isNew) query = query.eq('is_new', true);
  if (opts.isDeal) query = query.eq('is_deal', true);

  switch (opts.sortBy) {
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    default: query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { products: Array.isArray(data) ? data : [], total: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)')
    .eq('is_featured', true)
    .order('rating', { ascending: false })
    .limit(limit);
  return Array.isArray(data) ? data : [];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20);
  return Array.isArray(data) ? data : [];
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await supabase
    .from('wishlists')
    .select('*, product:products!product_id(*, category:categories!category_id(*))')
    .order('created_at', { ascending: false })
    .limit(100);
  return Array.isArray(data) ? data : [];
}

export async function addToWishlist(productId: string): Promise<void> {
  await supabase
    .from('wishlists')
    .upsert({ product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('wishlists').delete().eq('product_id', productId).eq('user_id', user.id);
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(orderData: {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal: string;
  shipping_country: string;
  payment_method: string;
  items: { product_id: string; product_name: string; product_image: string; price: number; quantity: number }[];
}): Promise<Order> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to place orders');

  const { items, ...orderFields } = orderData;
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ ...orderFields, user_id: user.id })
    .select()
    .maybeSingle();
  if (error || !order) throw error || new Error('Failed to create order');

  await supabase.from('order_items').insert(
    items.map(item => ({ ...item, order_id: order.id }))
  );
  return order;
}

export async function getUserOrders(): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50);
  return Array.isArray(data) ? data : [];
}

// ─── Admin: Orders ─────────────────────────────────────────────────────────────
export async function getAdminOrders(page = 1, limit = 20): Promise<{ orders: Order[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { orders: Array.isArray(data) ? data : [], total: count ?? 0 };
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

// ─── Admin: Products ───────────────────────────────────────────────────────────
export async function adminGetProducts(page = 1, limit = 20): Promise<{ products: Product[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from('products')
    .select('*, category:categories!category_id(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { products: Array.isArray(data) ? data : [], total: count ?? 0 };
}

export async function createProduct(product: Partial<Product>): Promise<void> {
  const { error } = await supabase.from('products').insert(product);
  if (error) throw error;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ─── Admin: Categories ─────────────────────────────────────────────────────────
export async function createCategory(cat: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').insert(cat);
  if (error) throw error;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ─── Admin: Customers ──────────────────────────────────────────────────────────
export async function getAdminCustomers(page = 1, limit = 20): Promise<{ profiles: Profile[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { profiles: Array.isArray(data) ? data : [], total: count ?? 0 };
}

// ─── Admin: Analytics ──────────────────────────────────────────────────────────
export async function getAdminAnalytics(): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: { name: string; total: number; count: number }[];
}> {
  const [ordersRes, customersRes, productsRes, recentRes] = await Promise.all([
    supabase.from('orders').select('total, status'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5),
  ]);

  const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'shipped');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers: customersRes.count ?? 0,
    totalProducts: productsRes.count ?? 0,
    recentOrders: Array.isArray(recentRes.data) ? recentRes.data : [],
    topProducts: [],
  };
}

export async function getSalesData(period: 'daily' | 'weekly' | 'monthly'): Promise<{ label: string; revenue: number; orders: number }[]> {
  const now = new Date();
  let startDate: Date;
  let points: { label: string; date: Date }[] = [];

  if (period === 'daily') {
    startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      points.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, date: d });
    }
  } else if (period === 'weekly') {
    startDate = new Date(now.getTime() - 11 * 7 * 24 * 60 * 60 * 1000);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      points.push({ label: `Wk ${12 - i}`, date: d });
    }
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({ label: d.toLocaleString('default', { month: 'short' }), date: d });
    }
  }

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
    .limit(1000);

  const orders = Array.isArray(data) ? data : [];

  return points.map((point, idx) => {
    const next = points[idx + 1];
    const periodOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return next ? d >= point.date && d < next.date : d >= point.date;
    });
    return {
      label: point.label,
      revenue: periodOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      orders: periodOrders.length,
    };
  });
}

// ─── Blog ─────────────────────────────────────────────────────────────────────
export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20);
  return Array.isArray(data) ? data : [];
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data;
}

export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) throw error;
}
