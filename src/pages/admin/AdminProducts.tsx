import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminGetProducts, createProduct, updateProduct, deleteProduct, getCategories } from '@/lib/api';
import type { Product, Category } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  name: '', slug: '', description: '', price: '', original_price: '',
  brand: '', stock: '', category_id: '', image_url: '', images: [] as string[],
  is_new: false, is_featured: false, is_deal: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ products: p, total: t }] = await Promise.all([adminGetProducts(page, LIMIT)]);
    setProducts(p);
    setTotal(t);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { getCategories().then(setCategories); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      price: String(p.price), original_price: String(p.original_price || ''),
      brand: p.brand || '', stock: String(p.stock),
      category_id: p.category_id || '', image_url: p.image_url || '', images: p.images?.length ? p.images : [],
      is_new: p.is_new, is_featured: p.is_featured, is_deal: p.is_deal,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) { toast.error('Name, price, and stock are required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: form.description,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        brand: form.brand,
        stock: parseInt(form.stock),
        category_id: form.category_id || null,
        image_url: form.image_url,
        images: form.images.map(url => url.trim()).filter(Boolean),
        is_new: form.is_new,
        is_featured: form.is_featured,
        is_deal: form.is_deal,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = search ? products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  ) : products;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">Products ({total})</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 bg-card border-border"
          />
        </div>
        {search && (
          <Button variant="ghost" size="icon" onClick={() => setSearch('')}><X className="w-4 h-4" /></Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="border-b border-border">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 whitespace-nowrap">Product</th>
              <th className="text-left p-3 whitespace-nowrap">Category</th>
              <th className="text-right p-3 whitespace-nowrap">Price</th>
              <th className="text-right p-3 whitespace-nowrap">Stock</th>
              <th className="text-center p-3 whitespace-nowrap">Flags</th>
              <th className="text-right p-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(null).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-3"><div className="h-10 bg-muted rounded animate-pulse w-48" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-20" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-16 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-10 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-16 mx-auto" /></td>
                  <td className="p-3"><div className="h-8 bg-muted rounded animate-pulse w-16 ml-auto" /></td>
                </tr>
              ))
            ) : filtered.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap"><span className="text-xs text-muted-foreground">{(p as any).category?.name || '—'}</span></td>
                <td className="p-3 text-right whitespace-nowrap">
                  <span className="text-sm font-medium text-foreground">${p.price.toFixed(2)}</span>
                  {p.original_price && p.original_price > p.price && (
                    <span className="text-xs text-muted-foreground line-through ml-1">${p.original_price.toFixed(2)}</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <span className={cn('text-sm font-medium', p.stock === 0 ? 'text-destructive' : p.stock < 10 ? 'text-yellow-400' : 'text-green-400')}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {p.is_new && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">New</span>}
                    {p.is_deal && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Deal</span>}
                    {p.is_featured && <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded">★</span>}
                  </div>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id, p.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No products found.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="border border-border" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" className="border border-border" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground mb-1 block">Product Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border" placeholder="Product name" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Price *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-muted border-border" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Original Price</Label>
                <Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="bg-muted border-border" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Brand</Label>
                <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="bg-muted border-border" placeholder="Apple" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Stock *</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="bg-muted border-border" placeholder="0" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Image URL</Label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="bg-muted border-border" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground mb-1 block">Additional Photos (other angles)</Label>
                <div className="space-y-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={url}
                        onChange={e => setForm(f => ({ ...f, images: f.images.map((u, idx) => idx === i ? e.target.value : u) }))}
                        className="bg-muted border-border"
                        placeholder="https://..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 border border-border"
                    onClick={() => setForm(f => ({ ...f, images: [...f.images, ''] }))}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another photo
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground mb-1 block">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-muted border-border resize-none" rows={3} />
              </div>
              <div className="md:col-span-2 flex items-center gap-6">
                {(['is_new', 'is_featured', 'is_deal'] as const).map(flag => (
                  <label key={flag} className="flex items-center gap-2 cursor-pointer min-h-8">
                    <input type="checkbox" checked={form[flag]} onChange={e => setForm(f => ({ ...f, [flag]: e.target.checked }))} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-muted-foreground capitalize">{flag.replace('is_', '')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 border border-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
