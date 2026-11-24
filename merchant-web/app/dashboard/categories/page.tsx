'use client';
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { Category } from '@/lib/types';

export default function CategoriesPage() {
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const fetchCategories = async () => {
    if (!store) return;
    const { data } = await supabase.from('categories').select('*').eq('store_id', store.id).order('sort_order');
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, [store]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!store || !newName.trim()) return;
    setAdding(true);
    await supabase.from('categories').insert({
      store_id: store.id,
      name: newName.trim(),
      sort_order: categories.length,
    });
    setNewName('');
    fetchCategories();
    setAdding(false);
  };

  const handleRename = async (id: string) => {
    if (!editing || editing.id !== id) return;
    await supabase.from('categories').update({ name: editing.name }).eq('id', id);
    setEditing(null);
    fetchCategories();
  };

  const handleToggle = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in it will be uncategorised.')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Categories</h1>

      {/* Add category */}
      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          value={newName} onChange={e => setNewName(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          placeholder="New category name…"
        />
        <button type="submit" disabled={adding || !newName.trim()}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {adding ? '…' : '+ Add'}
        </button>
      </form>

      {loading ? (
        <div className="text-gray-400 text-center py-16">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No categories yet</div>
          ) : categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-gray-400 font-mono text-sm w-6">{cat.sort_order + 1}</span>
              {editing?.id === cat.id ? (
                <input
                  autoFocus value={editing.name}
                  onChange={e => setEditing({ id: cat.id, name: e.target.value })}
                  onBlur={() => handleRename(cat.id)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(cat.id)}
                  className="flex-1 border-b-2 border-brand-500 outline-none text-sm font-semibold py-1 bg-transparent"
                />
              ) : (
                <span className="flex-1 font-semibold text-gray-900">{cat.name}</span>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(cat)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                    cat.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => setEditing({ id: cat.id, name: cat.name })}
                  className="text-brand-600 hover:underline text-xs font-semibold"
                >
                  Rename
                </button>
                <button onClick={() => handleDelete(cat.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
