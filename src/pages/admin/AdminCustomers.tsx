import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getAdminCustomers } from '@/lib/api';
import type { Profile } from '@/types/types';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    getAdminCustomers(page, LIMIT).then(({ profiles, total: t }) => {
      setCustomers(profiles);
      setTotal(t);
      setLoading(false);
    });
  }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Customers ({total})</h1>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="border-b border-border">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 whitespace-nowrap">Customer</th>
              <th className="text-left p-3 whitespace-nowrap">Email</th>
              <th className="text-left p-3 whitespace-nowrap">Phone</th>
              <th className="text-left p-3 whitespace-nowrap">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(null).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {Array(4).fill(null).map((_, j) => (
                  <td key={j} className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-32" /></td>
                ))}
              </tr>
            )) : customers.map(customer => (
              <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {customer.avatar_url
                        ? <img src={customer.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <User className="w-4 h-4 text-primary" />
                      }
                    </div>
                    <span className="text-sm font-medium text-foreground">{customer.full_name || '—'}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap"><span className="text-sm text-muted-foreground">{customer.email}</span></td>
                <td className="p-3 whitespace-nowrap"><span className="text-sm text-muted-foreground">{customer.phone || '—'}</span></td>
                <td className="p-3 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && customers.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No customers yet.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
            disabled={page === 1} onClick={() => setPage(p => p - 1)}
          >Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
            disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
          >Next</button>
        </div>
      )}
    </div>
  );
}
