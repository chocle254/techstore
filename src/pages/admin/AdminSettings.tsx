import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/api';
import { supabase } from '@/db/supabase';
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
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-foreground">Store Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Store Name', value: 'TechStore' },
            { label: 'Currency', value: 'USD' },
            { label: 'Support Email', value: 'support@techstore.com' },
            { label: 'Free Shipping Threshold', value: '$99.00' },
          ].map(item => (
            <div key={item.label} className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
