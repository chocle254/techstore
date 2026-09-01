import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Package, Settings, LogOut, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getUserOrders, updateProfile } from '@/lib/api';
import type { Order } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  processing: 'bg-blue-500/10 text-primary',
  shipped: 'bg-purple-500/10 text-purple-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    if (profile) setProfileForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      getUserOrders().then(data => { setOrders(data); setOrdersLoading(false); });
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm);
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to view your account.</p>
        <Button asChild><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Account</h1>

      <Tabs defaultValue={activeTab}>
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
          <TabsTrigger value="orders" className="gap-2"><Package className="w-4 h-4" /> Orders</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Profile Information</h2>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-2 border border-border">
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveProfile} className="gap-1"><Check className="w-3 h-3" /> Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1 border border-border"><X className="w-3 h-3" /> Cancel</Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground block mb-1">Email</Label>
                <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground block mb-1">Full Name</Label>
                {editing ? (
                  <Input
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    className="bg-muted border-border"
                  />
                ) : (
                  <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">{profile?.full_name || '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground block mb-1">Phone</Label>
                {editing ? (
                  <Input
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="bg-muted border-border"
                    placeholder="+1 555 000 0000"
                  />
                ) : (
                  <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">{profile?.phone || '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground block mb-1">Member Since</Label>
                <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            <div className="border-t border-border mt-6 pt-4">
              <Button variant="ghost" className="text-destructive gap-2 hover:bg-destructive/10" onClick={signOut}>
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No orders yet</p>
                <p className="text-muted-foreground text-sm">Start shopping to see your orders here.</p>
                <Button className="mt-4" asChild><Link to="/shop">Shop Now</Link></Button>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground')}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">${order.total.toFixed(2)}</p>
                  </div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {order.order_items.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">{item.product_name}</span>
                        <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <span className="text-xs text-muted-foreground self-center">+{order.order_items.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
