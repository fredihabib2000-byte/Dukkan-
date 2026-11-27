'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import Image from 'next/image';

type WishlistRow = {
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number;
  wishlist_count: number;
};

export default function WishlistPage() {
  const { store, loading: storeLoading } = useStore();
  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_store_wishlist_counts', {
        p_store_id: store.id,
      });
      if (!error && data) setRows(data as WishlistRow[]);
      setLoading(false);
    })();
  }, [store]);

  if (storeLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + Number(r.wishlist_count), 0);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Customer Wishlists</h1>
        <p className="text-sm text-gray-500 mt-1">
          Products your customers saved — sorted by most saved first.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Saves</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Products Saved</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">
            {rows.filter(r => Number(r.wishlist_count) > 0).length}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">♡</div>
          <p className="font-semibold text-gray-700">No wishlists yet</p>
          <p className="text-sm text-gray-400 mt-1">When customers save your products, they'll appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Saves</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.product_id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {row.product_image ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={row.product_image}
                            alt={row.product_name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-300 text-lg">🏷️</span>
                        </div>
                      )}
                      <span className="font-semibold text-gray-900 truncate max-w-xs">{row.product_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600 font-medium">
                    ${Number(row.product_price).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs ${
                      Number(row.wishlist_count) > 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      ♡ {row.wishlist_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
