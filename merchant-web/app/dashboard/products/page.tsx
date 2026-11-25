'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { Product, Category } from '@/lib/types';
import { ProductModal } from '@/components/ProductModal';

export default function ProductsPage() {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    if (!store) return;
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('store_id', store.id).eq('is_active', true).order('sort_order'),
    ]);
    setProducts((prodRes.data ?? []) as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [store]);

  const handleSave = async (data: Partial<Product>) => {
    if (!store) return;
    if (editing) {
      await supabase.from('products').update(data).eq('id', editing.id);
    } else {
      await supabase.from('products').insert({ ...data, store_id: store.id });
    }
    fetchProducts();
    setModalOpen(false);
    setEditing(null);
  };

  const toggleAvailable = async (product: Product) => {
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const catName = (id: string | null) => categories.find(c => c.id === id)?.name ?? '—';
  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Products</h1>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-16">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center text-gray-400">No products yet. Add your first one!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-center">Discount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0 text-lg">🖼️</div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-400">{product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{catName(product.category_id)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold">${Number(product.price).toFixed(2)}</div>
                      {product.compare_at_price && (
                        <div className="text-xs text-gray-400 line-through">${Number(product.compare_at_price).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.discount_percent ? (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{product.discount_percent}% OFF</span>
                      ) : product.has_free_gift ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">🎁 Gift</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleAvailable(product)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          product.is_available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {product.is_available ? '● Active' : '○ Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(product); setModalOpen(true); }}
                          className="text-brand-600 hover:underline font-semibold text-xs"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-600 font-semibold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && store && (
        <ProductModal
          product={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          storeId={store.id}
        />
      )}
    </div>
  );
}
