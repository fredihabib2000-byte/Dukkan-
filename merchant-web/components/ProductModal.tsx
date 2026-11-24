'use client';
import { useState, FormEvent } from 'react';
import { Product, Category } from '@/lib/types';

type Props = {
  product: Product | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
};

export function ProductModal({ product, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    compare_at_price: product?.compare_at_price?.toString() ?? '',
    unit: product?.unit ?? 'pcs',
    category_id: product?.category_id ?? '',
    discount_percent: product?.discount_percent?.toString() ?? '',
    has_free_gift: product?.has_free_gift ?? false,
    free_gift_label: product?.free_gift_label ?? '',
    is_available: product?.is_available ?? true,
    is_featured: product?.is_featured ?? false,
    stock_quantity: product?.stock_quantity?.toString() ?? '0',
  });

  const set = (key: string, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      unit: form.unit,
      category_id: form.category_id || null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      has_free_gift: form.has_free_gift,
      free_gift_label: form.free_gift_label || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      stock_quantity: parseInt(form.stock_quantity),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-extrabold text-lg text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Product Name *">
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className={input} placeholder="e.g. Organic Bananas" />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className={`${input} h-20 resize-none`} placeholder="Short description…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($) *">
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                className={input} placeholder="0.00" />
            </Field>
            <Field label="Original Price ($)">
              <input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => set('compare_at_price', e.target.value)}
                className={input} placeholder="0.00 (crossed out)" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit">
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={input}>
                {['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'bottle'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={input}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount %">
              <input type="number" min="0" max="99" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)}
                className={input} placeholder="e.g. 20" />
            </Field>
            <Field label="Stock Quantity">
              <input type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)}
                className={input} />
            </Field>
          </div>

          {/* Free gift */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <input type="checkbox" id="gift" checked={form.has_free_gift} onChange={e => set('has_free_gift', e.target.checked)} className="w-4 h-4 accent-brand-600" />
            <label htmlFor="gift" className="text-sm font-semibold text-gray-700">Include free gift</label>
          </div>
          {form.has_free_gift && (
            <Field label="Free Gift Label">
              <input value={form.free_gift_label} onChange={e => set('free_gift_label', e.target.value)}
                className={input} placeholder="e.g. Free tote bag with purchase" />
            </Field>
          )}

          {/* Toggles */}
          <div className="flex gap-4">
            <Toggle id="available" checked={form.is_available} onChange={v => set('is_available', v)} label="Available to customers" />
            <Toggle id="featured" checked={form.is_featured} onChange={v => set('is_featured', v)} label="Featured product" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-brand-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-brand-700">
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-brand-600" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
