import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, BarChart3, Settings, Menu, X,
  ChevronLeft, ShoppingCart, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const adminNav = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: Tag },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Stock', path: '/admin/stock', icon: AlertCircle },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className={cn('p-4 border-b border-border flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">TechStore Admin</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setCollapsed(p => !p)}>
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {adminNav.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('p-3 border-t border-border', collapsed && 'flex justify-center')}>
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground mb-2">
            <p className="font-medium text-foreground">{profile?.full_name || 'Admin'}</p>
            <p>{profile?.email}</p>
          </div>
        )}
        <Link to="/">
          <Button variant="ghost" className={cn('w-full text-sm', collapsed ? 'px-2' : 'justify-start')}>
            {collapsed ? '←' : '← Back to Store'}
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col shrink-0 bg-card border-r border-border transition-all duration-300 sticky top-0 h-screen overflow-hidden',
        collapsed ? 'w-16' : 'w-56'
      )}>
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-bold text-sm">Admin Dashboard</span>
          <div className="w-9" />
        </div>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
