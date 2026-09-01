import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import IntersectObserver from '@/components/common/IntersectObserver';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

import { StorefrontLayout } from '@/components/layouts/StorefrontLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

import { storefrontRoutes, adminRoutes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <IntersectObserver />
            <Routes>
              {/* Storefront — wrapped in StorefrontLayout */}
              <Route element={<StorefrontLayout />}>
                {storefrontRoutes.map(route => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>

              {/* Admin — wrapped in AdminLayout */}
              <Route element={<AdminLayout />}>
                {adminRoutes.map(route => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster richColors position="top-right" />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
