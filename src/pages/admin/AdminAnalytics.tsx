import React, { useEffect, useState } from 'react';
import { getSalesData, getAdminAnalytics } from '@/lib/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly';

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

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSalesData(period), getAdminAnalytics()]).then(([d, s]) => {
      setSalesData(d);
      setStats(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getSalesData(period).then(setSalesData);
  }, [period]);

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-muted'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Period Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Period Orders', value: totalOrders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Avg. Order Value', value: totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : '$0', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Total Customers', value: stats?.totalCustomers ?? '—', icon: TrendingDown, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-4 h-4', card.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Revenue Trend</h2>
        <div className="w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217,91%,60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,40%,18%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215,16%,57%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,16%,57%)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(217,91%,60%)" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders + combined */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Order Volume</h2>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,40%,18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="hsl(189,94%,43%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Revenue vs Orders</h2>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,40%,18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(215,16%,57%)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(142,69%,58%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
