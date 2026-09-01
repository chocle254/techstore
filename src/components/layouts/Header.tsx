import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, ChevronDown, Laptop, Smartphone, Tablet, Headphones, Volume2, Watch, Gamepad2, Camera, Monitor, HardDrive, Flame, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ElementType> = {
  Laptop, Smartphone, Tablet, Headphones, Volume2, Watch, Gamepad2, Camera, Monitor, HardDrive,
};

const sidebarCategories = [
  { name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
  { name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone' },
  { name: 'Tablets', slug: 'tablets', icon: 'Tablet' },
  { name: 'Accessories', slug: 'accessories', icon: 'Headphones' },
  { name: 'Audio', slug: 'audio', icon: 'Volume2' },
  { name: 'Smartwatches', slug: 'smartwatches', icon: 'Watch' },
  { name: 'Gaming', slug: 'gaming', icon: 'Gamepad2' },
  { name: 'Cameras', slug: 'cameras', icon: 'Camera' },
  { name: 'Monitors', slug: 'monitors', icon: 'Monitor' },
  { name: 'Storage', slug: 'storage', icon: 'HardDrive' },
];

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'Deals', path: '/deals' },
  { name: 'New Arrivals', path: '/new-arrivals' },
  { name: 'Brands', path: '/brands' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' },
];

interface HeaderProps {
  showSidebar?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function Header({ showSidebar = true, sidebarOpen, onSidebarToggle }: HeaderProps) {
  const { totalItems } = useCart();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">TechStore</span>
        </Link>

        {/* Desktop sidebar toggle */}
        {showSidebar && (
          <Button variant="ghost" size="icon" className="hidden md:flex shrink-0" onClick={onSidebarToggle}>
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-0 max-w-xl">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for products, brands..."
            className="flex-1 bg-muted border-border rounded-r-none h-10 text-sm"
          />
          <Button type="submit" className="rounded-l-none h-10 px-4 bg-primary hover:bg-primary/90">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
            <Link to="/wishlist">
              <Heart className="w-5 h-5" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative flex sm:hidden" asChild>
  <Link to="/cart">
    <ShoppingCart className="w-5 h-5" />
    {totalItems > 0 && (
      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
        {totalItems}
      </Badge>
    )}
  </Link>
</Button>

<Button variant="ghost" className="relative hidden sm:flex items-center gap-1" asChild>
  <Link to="/cart">
    <ShoppingCart className="w-5 h-5" />
    <span className="text-sm">Cart</span>
    {totalItems > 0 && (
      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
        {totalItems}
      </Badge>
    )}
  </Link>
</Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex items-center gap-1">
                  <User className="w-5 h-5" />
                  <span className="text-sm max-w-[80px] truncate">{profile?.full_name || 'Account'}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border w-48">
                <DropdownMenuItem asChild>
                  <Link to="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account?tab=orders">My Orders</Link>
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="hidden sm:flex items-center gap-1" asChild>
              <Link to="/login">
                <User className="w-5 h-5" />
                <span className="text-sm">Account</span>
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-border w-72 p-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold">TechStore</span>
                </Link>
              </div>
              <nav className="p-4 flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      location.pathname === link.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
              <div className="px-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Categories</p>
                {sidebarCategories.map(cat => {
                  const Icon = categoryIcons[cat.icon] ?? Laptop;
                  return (
                    <Link
                      key={cat.slug}
                      to={`/shop?category=${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/account" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="w-4 h-4" /> My Account
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Top nav bar */}
      <nav className="hidden md:flex items-center gap-6 px-6 py-2 border-t border-border">
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              'text-sm font-medium transition-colors',
              location.pathname === link.path
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function CategorySidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'shrink-0 bg-card border-r border-border flex-col hidden md:flex transition-all duration-300',
        isOpen ? 'w-52' : 'w-0 overflow-hidden'
      )}
    >
      <div className="p-3">
        <Link
          to="/shop"
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors mb-1',
            !location.search
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          <Grid3x3 className="w-4 h-4" />
          All Categories
        </Link>

        <div className="flex flex-col gap-0.5 mt-2">
          {sidebarCategories.map(cat => {
            const Icon = categoryIcons[cat.icon] ?? Laptop;
            const isActive = location.search.includes(`category=${cat.slug}`);
            return (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-2 border-t border-border pt-2">
          <Link
            to="/deals"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-orange-400 hover:bg-orange-400/10 transition-colors font-medium"
          >
            <Flame className="w-4 h-4" />
            Deals & Offers
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  const tabs = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Categories', path: '/shop', icon: 'grid' },
    { name: 'Deals', path: '/deals', icon: 'flame' },
    { name: 'Wishlist', path: '/wishlist', icon: 'heart' },
    { name: 'Account', path: '/account', icon: 'user' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border flex">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors relative',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {tab.icon === 'home' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            {tab.icon === 'grid' && <Grid3x3 className="w-5 h-5" />}
            {tab.icon === 'flame' && <Flame className="w-5 h-5" />}
            {tab.icon === 'heart' && <Heart className="w-5 h-5" />}
            {tab.icon === 'user' && <User className="w-5 h-5" />}
            {tab.name}
            {tab.name === 'Account' && totalItems > 0 && (
              <span className="absolute top-1 right-1/4 w-4 h-4 bg-primary rounded-full text-[9px] flex items-center justify-center text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
