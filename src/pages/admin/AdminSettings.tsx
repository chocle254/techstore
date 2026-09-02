import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, MessageCircle, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { updateProfile, getStoreSettings, updateStoreSettings } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { StoreSettings } from '@/types/types';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [storeForm, setStoreForm] = useState({
    store_name: '', contact_email: '', currency: '', low_stock_threshold: '',
    about_us: '', facebook_url: '', twitter_url: '', instagram_url: '', whatsapp_url: '',
  });
  const [storeLoading, setStoreLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    getStoreSettings()
      .then(data => {
        setStoreSettings(data);
        if (data) {
          setStoreForm({
            store_name: data.store_name || '',
            contact_email: data.contact_email || '',
            currency: data.currency || '',
            low_stock_threshold: String(data.low_stock_threshold ?? ''),
            about_us: data.about_us || '',
            facebook_url: data.facebook_url || '',
            twitter_url: data.twitter_url || '',
            instagram_url: data.instagram_url || '',
            whatsapp_url: data.whatsapp_url || '',
          });
        }
      })
      .catch(err => toast.error(err.message || 'Failed to load store settings'))
      .finally(() => setStoreLoading(false));
  }, []);

  const handleSaveStoreSettings = async () => {
    if (!storeSettings) return;
    const threshold = parseInt(storeForm.low_stock_threshold);
    if (!storeForm.store_name.trim()) { toast.error('Store name is required'); return; }
    if (isNaN(threshold) || threshold < 0) { toast.error('Low stock threshold must be a valid number'); return; }
    setSavingStore(true);
    try {
      const updates = {
        store_name: storeForm.store_name.trim(),
        contact_email: storeForm.contact_email.trim(),
        currency: storeForm.currency.trim().toUpperCase(),
        low_stock_threshold: threshold,
        about_us: storeForm.about_us.trim() || null,
        facebook_url: storeForm.facebook_url.trim() || null,
        twitter_url: storeForm.twitter_url.trim() || null,
        instagram_url: storeForm.instagram_url.trim() || null,
        whatsapp_url: storeForm.whatsapp_url.trim() || null,
      };
      await updateStoreSettings(storeSettings.id, updates);
      setStoreSettings(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Store information updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update store information');
    } finally {
      setSavingStore(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: profileForm.full_name });
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passwordForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
      setPasswordForm({ password: '', confirm: '' });
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-bold text-foreground mb-4">Appearance</h2>
        <div className="flex items-center justify-between gap-4 bg-muted rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
            <p className="text-xs text-muted-foreground">Choose how the admin dashboard looks on this device.</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Admin Profile */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Admin Profile</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Full Name</Label>
            <Input
              value={profileForm.full_name}
              onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
              className="bg-muted border-border"
              placeholder="Admin Name"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Email</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted border-border opacity-60" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Role</Label>
            <Input value={profile?.role || ''} disabled className="bg-muted border-border opacity-60 capitalize" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">New Password</Label>
            <Input
              type="password"
              value={passwordForm.password}
              onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
              className="bg-muted border-border"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Confirm Password</Label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              className="bg-muted border-border"
              placeholder="Repeat password"
            />
          </div>
          <Button type="submit" disabled={changingPw || !passwordForm.password}>
            {changingPw ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Store Info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Store Information</h2>
        {storeLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !storeSettings ? (
          <p className="text-sm text-muted-foreground">Store settings could not be loaded.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Store Name</Label>
                <Input
                  value={storeForm.store_name}
                  onChange={e => setStoreForm(f => ({ ...f, store_name: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="TechStore"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Currency</Label>
                <Input
                  value={storeForm.currency}
                  onChange={e => setStoreForm(f => ({ ...f, currency: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Support Email</Label>
                <Input
                  type="email"
                  value={storeForm.contact_email}
                  onChange={e => setStoreForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="support@techstore.com"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Low Stock Threshold (units)</Label>
                <Input
                  type="number"
                  min="0"
                  value={storeForm.low_stock_threshold}
                  onChange={e => setStoreForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="10"
                />
              </div>
            </div>
            <Button onClick={handleSaveStoreSettings} disabled={savingStore}>
              {savingStore ? 'Saving...' : 'Save Store Information'}
            </Button>
          </>
        )}
      </div>

      {/* About Us & Social Links */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-bold text-foreground">About Us & Social Links</h2>
        <p className="text-sm text-muted-foreground -mt-2">Shown in the site footer for every visitor.</p>
        {!storeLoading && storeSettings && (
          <>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">About Us</Label>
              <Textarea
                value={storeForm.about_us}
                onChange={e => setStoreForm(f => ({ ...f, about_us: e.target.value }))}
                className="bg-muted border-border min-h-[90px]"
                placeholder="A short blurb about your store..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </Label>
                <Input
                  value={storeForm.facebook_url}
                  onChange={e => setStoreForm(f => ({ ...f, facebook_url: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="https://facebook.com/yourstore"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <XIcon className="w-3.5 h-3.5" /> X (Twitter)
                </Label>
                <Input
                  value={storeForm.twitter_url}
                  onChange={e => setStoreForm(f => ({ ...f, twitter_url: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="https://x.com/yourstore"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </Label>
                <Input
                  value={storeForm.instagram_url}
                  onChange={e => setStoreForm(f => ({ ...f, instagram_url: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="https://instagram.com/yourstore"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </Label>
                <Input
                  value={storeForm.whatsapp_url}
                  onChange={e => setStoreForm(f => ({ ...f, whatsapp_url: e.target.value }))}
                  className="bg-muted border-border"
                  placeholder="https://wa.me/15550000000"
                />
              </div>
            </div>
            <Button onClick={handleSaveStoreSettings} disabled={savingStore}>
              {savingStore ? 'Saving...' : 'Save About Us & Social Links'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
