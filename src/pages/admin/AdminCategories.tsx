import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import type { Category } from '@/types/types';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', image_url: '', item_count: '' });
  const [saving, setSaving] = useState(false);

  const fetchCats = () => {
    setLoading(true);
    getCategories().then(c => { setCategories(c); setLoading(false); });
  };

  useEffect(() => { fetchCats(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', icon: '', image_url: '', item_count: '' });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon || '', image_url: cat.image_url || '', item_count: String(cat.item_count) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        icon: form.icon || null,
        image_url: form.image_url || null,
        item_count: parseInt(form.item_count) || 0,
      };
      if (editing) { await updateCategory(editing.id, payload); toast.success('Category updated'); }
      else { await createCategory(payload); toast.success('Category created'); }
      setDialogOpen(false);
      fetchCats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try { await deleteCategory(id); toast.success('Deleted'); fetchCats(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="border-b border-border">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-3 whitespace-nowrap">Category</th>
              <th className="text-left p-3 whitespace-nowrap">Slug</th>
              <th className="text-right p-3 whitespace-nowrap">Items</th>
              <th className="text-right p-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(6).fill(null).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-3"><div className="h-10 bg-muted rounded animate-pulse w-40" /></td>
                <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-24" /></td>
                <td className="p-3"><div className="h-4 bg-muted rounded animate-pulse w-10 ml-auto" /></td>
                <td className="p-3"><div className="h-8 bg-muted rounded animate-pulse w-16 ml-auto" /></td>
              </tr>
            )) : categories.map(cat => (
              <tr key={cat.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {cat.image_url
                      ? <img src={cat.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{cat.name[0]}</div>
                    }
                    <div>
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.icon}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap"><span className="text-xs text-muted-foreground font-mono">{cat.slug}</span></td>
                <td className="p-3 text-right whitespace-nowrap"><span className="text-sm text-foreground">{cat.item_count}</span></td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id, cat.name)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Name *', key: 'name', placeholder: 'Laptops' },
              { label: 'Slug', key: 'slug', placeholder: 'laptops' },
              { label: 'Icon (lucide name)', key: 'icon', placeholder: 'Laptop' },
              { label: 'Image URL', key: 'image_url', placeholder: 'https://...' },
              { label: 'Item Count', key: 'item_count', placeholder: '0' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-sm text-muted-foreground mb-1 block">{f.label}</Label>
                <Input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="bg-muted border-border"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 border border-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
