import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getAdminAnalytics, getSalesData } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Order } from '@/types/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  processing: 'text-primary',
  shipped: 'text-purple-400',
  delivered: 'text-green-400',
  cancelled: 'text-destructive',
};

type Period = 'daily' | 'weekly' | 'monthly';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminAnalytics(), getSalesData(period)]).then(([s, d]) => {
      setStats(s);
      setSalesData(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getSalesData(period).then(setSalesData);
  }, [period]);

  const cards = stats ? [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-accent', bg: 'bg-accent/10' },
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name === 'revenue' ? `$${Number(p.value).toFixed(2)}` : p.value} {p.name}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(null).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
            ))
          : cards.map(card => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
                    <card.icon className={cn('w-4 h-4', card.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            ))
        }
      </div>

      {/* Sales chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Sales Overview</h2>
          </div>
          <div className="flex gap-1">
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize',
                  period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-muted'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217,91%,60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,40%,18%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215,16%,57%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,16%,57%)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(217,91%,60%)"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders count chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Order Volume</h2>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesData.slice(-12)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,40%,18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="hsl(189,94%,43%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array(3).fill(null).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : stats?.recentOrders?.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left pb-2 whitespace-nowrap">Order</th>
                    <th className="text-left pb-2 whitespace-nowrap">Status</th>
                    <th className="text-right pb-2 whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(stats?.recentOrders || []).map((order: Order) => (
                    <tr key={order.id} className="border-t border-border/50">
                      <td className="py-2 text-foreground whitespace-nowrap">{order.order_number}</td>
                      <td className="py-2 whitespace-nowrap">
                        <span className={cn('text-xs font-medium capitalize', STATUS_COLORS[order.status])}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 text-right text-foreground font-medium whitespace-nowrap">${order.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Products', path: '/admin/products', icon: Package },
          { label: 'View Orders', path: '/admin/orders', icon: ShoppingBag },
          { label: 'Customers', path: '/admin/customers', icon: Users },
          { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
        ].map(item => (
          <Link key={item.path} to={item.path} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
            <item.icon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
