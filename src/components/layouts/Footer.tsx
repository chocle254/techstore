import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MessageCircle, XIcon, Cpu } from 'lucide-react';
import { getStoreSettings } from '@/lib/api';
import type { StoreSettings } from '@/types/types';

export function Footer() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    getStoreSettings().then(setSettings).catch(() => {});
  }, []);

  const socialLinks = [
    { url: settings?.facebook_url, label: 'Facebook', Icon: Facebook },
    { url: settings?.twitter_url, label: 'X (Twitter)', Icon: XIcon },
    { url: settings?.instagram_url, label: 'Instagram', Icon: Instagram },
    { url: settings?.whatsapp_url, label: 'WhatsApp', Icon: MessageCircle },
  ].filter(link => !!link.url);

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* About */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-3 w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-foreground">{settings?.store_name || 'TechStore'}</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {settings?.about_us || 'Your destination for the latest tech gadgets and accessories at unbeatable prices.'}
          </p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {socialLinks.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Shop</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/shop" className="hover:text-primary transition-colors w-fit">All Products</Link>
            <Link to="/deals" className="hover:text-primary transition-colors w-fit">Deals</Link>
            <Link to="/new-arrivals" className="hover:text-primary transition-colors w-fit">New Arrivals</Link>
            <Link to="/brands" className="hover:text-primary transition-colors w-fit">Brands</Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Support</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/contact" className="hover:text-primary transition-colors w-fit">Contact Us</Link>
            <Link to="/account" className="hover:text-primary transition-colors w-fit">My Account</Link>
            <Link to="/account?tab=orders" className="hover:text-primary transition-colors w-fit">Track Order</Link>
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="hover:text-primary transition-colors w-fit">
                {settings.contact_email}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 md:px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.store_name || 'TechStore'}. All rights reserved.
      </div>
    </footer>
  );
}
