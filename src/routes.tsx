import React, { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

// Storefront pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminStock = lazy(() => import('./pages/admin/AdminStock'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const storefrontRoutes: RouteConfig[] = [
  { name: 'Home', path: '/', element: <S><HomePage /></S>, public: true },
  { name: 'Shop', path: '/shop', element: <S><ShopPage /></S>, public: true },
  { name: 'Product Detail', path: '/product/:slug', element: <S><ProductDetailPage /></S>, public: true },
  { name: 'Cart', path: '/cart', element: <S><CartPage /></S>, public: true },
  { name: 'Checkout', path: '/checkout', element: <S><CheckoutPage /></S> },
  { name: 'Wishlist', path: '/wishlist', element: <S><WishlistPage /></S> },
  { name: 'Deals', path: '/deals', element: <S><DealsPage /></S>, public: true },
  { name: 'New Arrivals', path: '/new-arrivals', element: <S><NewArrivalsPage /></S>, public: true },
  { name: 'Brands', path: '/brands', element: <S><BrandsPage /></S>, public: true },
  { name: 'Blog', path: '/blog', element: <S><BlogPage /></S>, public: true },
  { name: 'Contact', path: '/contact', element: <S><ContactPage /></S>, public: true },
  { name: 'Account', path: '/account', element: <S><AccountPage /></S> },
  { name: 'Login', path: '/login', element: <S><LoginPage /></S>, public: true },
  { name: 'Register', path: '/register', element: <S><RegisterPage /></S>, public: true },
];

export const adminRoutes: RouteConfig[] = [
  { name: 'Admin Dashboard', path: '/admin', element: <S><AdminDashboard /></S> },
  { name: 'Admin Analytics', path: '/admin/analytics', element: <S><AdminAnalytics /></S> },
  { name: 'Admin Products', path: '/admin/products', element: <S><AdminProducts /></S> },
  { name: 'Admin Categories', path: '/admin/categories', element: <S><AdminCategories /></S> },
  { name: 'Admin Orders', path: '/admin/orders', element: <S><AdminOrders /></S> },
  { name: 'Admin Stock', path: '/admin/stock', element: <S><AdminStock /></S> },
  { name: 'Admin Customers', path: '/admin/customers', element: <S><AdminCustomers /></S> },
  { name: 'Admin Settings', path: '/admin/settings', element: <S><AdminSettings /></S> },
];

// Combined for backward compat
export const routes: RouteConfig[] = [...storefrontRoutes, ...adminRoutes];
