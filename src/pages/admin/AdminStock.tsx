import React, { useEffect, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminGetProducts, updateProduct } from '@/lib/api';
import type { Product } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const LOW_STOCK = 10;

  useEffect(() => {
    adminGetProducts(1, 100).then(({ products: p }) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const handleSave = async (product: Product) => {
    const newStock = parseInt(edits[product.id] ?? String(product.stock));
    if (isNaN(newStock) || newStock < 0) { toast.error('Invalid stock value'); return; }
    setSaving(product.id);
    try {
      await updateProduct(product.id, { stock: newStock });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      const newEdits = { ...edits };
      delete newEdits[product.id];
      setEdits(newEdits);
      toast.success(`Stock updated for ${product.name}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Stock Management</h1>

      {/* Alerts */}
      {!loading && (outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-2">
          {outOfStockProducts.length > 0 && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {outOfStockProducts.length} product{outOfStockProducts.length !== 1 ? 's' : ''} out of stock
              </p>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-400 font-medium">
                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low (≤{LOW_STOCK} units)
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="border-b border-border">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 whitespace-nowrap">Product</th>
              <th className="text-left p-3 whitespace-nowrap">Category</th>
              <th className="text-right p-3 whitespace-nowrap">Current Stock</th>
              <th className="text-right p-3 whitespace-nowrap">Status</th>
              <th className="text-right p-3 whitespace-nowrap">Update Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(null).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {Array(5).fill(null).map((_, j) => (
                  <td key={j} className="p-3"><div className="h-4 bg-muted rounded animate-pulse" style={{ width: j === 0 ? 160 : 80 }} /></td>
                ))}
              </tr>
            )) : products.map(product => {
              const currentStock = edits[product.id] !== undefined ? parseInt(edits[product.id]) : product.stock;
              const isDirty = edits[product.id] !== undefined;
              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{(product as any).category?.name || '—'}</span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <span className={cn('text-sm font-bold',
                      product.stock === 0 ? 'text-destructive' :
                      product.stock <= LOW_STOCK ? 'text-yellow-400' :
                      'text-green-400'
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      product.stock === 0 ? 'bg-destructive/10 text-destructive' :
                      product.stock <= LOW_STOCK ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-green-400/10 text-green-400'
                    )}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} units remaining`}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={edits[product.id] ?? product.stock}
                        onChange={e => setEdits(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-20 h-8 text-sm bg-muted border-border text-right"
                      />
                      {isDirty && (
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleSave(product)}
                          disabled={saving === product.id}
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
