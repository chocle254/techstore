import React, { Suspense } from 'react';
import type { ReactNode } from 'react';
import { lazyImport } from '@/lib/lazyImport';

// Storefront pages
const HomePage = lazyImport(() => import('./pages/HomePage'), 'HomePage');
const ShopPage = lazyImport(() => import('./pages/ShopPage'), 'ShopPage');
const ProductDetailPage = lazyImport(() => import('./pages/ProductDetailPage'), 'ProductDetailPage');
const CartPage = lazyImport(() => import('./pages/CartPage'), 'CartPage');
const CheckoutPage = lazyImport(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const WishlistPage = lazyImport(() => import('./pages/WishlistPage'), 'WishlistPage');
const DealsPage = lazyImport(() => import('./pages/DealsPage'), 'DealsPage');
const NewArrivalsPage = lazyImport(() => import('./pages/NewArrivalsPage'), 'NewArrivalsPage');
const BrandsPage = lazyImport(() => import('./pages/BrandsPage'), 'BrandsPage');
const BlogPage = lazyImport(() => import('./pages/BlogPage'), 'BlogPage');
const ContactPage = lazyImport(() => import('./pages/ContactPage'), 'ContactPage');
const AccountPage = lazyImport(() => import('./pages/AccountPage'), 'AccountPage');
const LoginPage = lazyImport(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyImport(() => import('./pages/RegisterPage'), 'RegisterPage');

// Admin pages
const AdminDashboard = lazyImport(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminAnalytics = lazyImport(() => import('./pages/admin/AdminAnalytics'), 'AdminAnalytics');
const AdminProducts = lazyImport(() => import('./pages/admin/AdminProducts'), 'AdminProducts');
const AdminCategories = lazyImport(() => import('./pages/admin/AdminCategories'), 'AdminCategories');
const AdminOrders = lazyImport(() => import('./pages/admin/AdminOrders'), 'AdminOrders');
const AdminStock = lazyImport(() => import('./pages/admin/AdminStock'), 'AdminStock');
const AdminCustomers = lazyImport(() => import('./pages/admin/AdminCustomers'), 'AdminCustomers');
const AdminSettings = lazyImport(() => import('./pages/admin/AdminSettings'), 'AdminSettings');

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
