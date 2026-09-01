import React, { useEffect, useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAdminOrders, updateOrderStatus } from '@/lib/api';
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
const STATUSES = ['pending','processing','shipped','delivered','cancelled'] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchOrders = useCallback(() => {
    setLoading(true);
    getAdminOrders(page, LIMIT).then(({ orders: o, total: t }) => {
      setOrders(o); setTotal(t); setLoading(false);
    });
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Orders ({total})</h1>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="border-b border-border">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 whitespace-nowrap">Order</th>
              <th className="text-left p-3 whitespace-nowrap">Date</th>
              <th className="text-left p-3 whitespace-nowrap">Customer</th>
              <th className="text-right p-3 whitespace-nowrap">Total</th>
              <th className="text-center p-3 whitespace-nowrap">Status</th>
              <th className="text-right p-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(null).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {Array(6).fill(null).map((_, j) => (
                  <td key={j} className="p-3"><div className="h-4 bg-muted rounded animate-pulse" style={{ width: j === 0 ? 80 : j === 4 ? 100 : 60 }} /></td>
                ))}
              </tr>
            )) : orders.map(order => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 whitespace-nowrap">
                  <p className="text-sm font-medium text-foreground">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.order_items?.length || 0} items</p>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <p className="text-sm text-foreground">{order.shipping_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping_email}</p>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <span className="text-sm font-bold text-foreground">${order.total.toFixed(2)}</span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <Select
                    value={order.status}
                    onValueChange={(v) => handleStatusChange(order.id, v as Order['status'])}
                    disabled={updatingId === order.id}
                  >
                    <SelectTrigger className={cn('h-7 text-xs w-32 border-border', STATUS_COLORS[order.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {STATUSES.map(s => (
                        <SelectItem key={s} value={s} className={cn('text-xs capitalize', STATUS_COLORS[s])}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(order)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No orders yet.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="border border-border" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" className="border border-border" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="bg-card border-border max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {viewing?.order_number}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className={cn('font-semibold capitalize', STATUS_COLORS[viewing.status])}>{viewing.status}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <p className="font-semibold capitalize">{viewing.payment_method?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Ship To</p>
                <p className="font-medium">{viewing.shipping_name}</p>
                <p className="text-muted-foreground">{viewing.shipping_address}, {viewing.shipping_city}, {viewing.shipping_state}</p>
                <p className="text-muted-foreground">{viewing.shipping_email}</p>
              </div>
              {viewing.order_items && viewing.order_items.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {viewing.order_items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">×{item.quantity} @ ${item.price.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-bold shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm space-y-1 border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${viewing.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>${viewing.shipping.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${viewing.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-foreground text-base"><span>Total</span><span>${viewing.total.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
