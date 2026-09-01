import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, getStoreSettings, updateStoreSettings } from '@/lib/api';
import { supabase } from '@/db/supabase';
import type { StoreSettings } from '@/types/types';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { profile, refreshProfile } = useAuth();
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
    </div>
  );
}
