import { create } from 'zustand';
import { Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';

type WishlistItem = { product: Product; storeId: string };

type WishlistStore = {
  items: WishlistItem[];
  loaded: boolean;
  toggle: (product: Product, storeId: string) => Promise<void>;
  isSaved: (productId: string) => boolean;
  loadFromSupabase: () => Promise<void>;
  clear: () => void;
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loaded: false,

  loadFromSupabase: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loaded: true }); return; }

    const { data } = await supabase
      .from('wishlist_items')
      .select('product_id, store_id, products(*)')
      .eq('user_id', user.id);

    if (data) {
      const items: WishlistItem[] = data
        .filter((r: any) => r.products)
        .map((r: any) => ({ product: r.products as Product, storeId: r.store_id }));
      set({ items, loaded: true });
    } else {
      set({ loaded: true });
    }
  },

  toggle: async (product, storeId) => {
    const { items } = get();
    const exists = items.find(i => i.product.id === product.id);

    // Optimistic update
    if (exists) {
      set({ items: items.filter(i => i.product.id !== product.id) });
    } else {
      set({ items: [...items, { product, storeId }] });
    }

    // Sync to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (exists) {
      await supabase.from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
    } else {
      await supabase.from('wishlist_items')
        .upsert({ user_id: user.id, product_id: product.id, store_id: storeId });
    }
  },

  isSaved: (productId) => get().items.some(i => i.product.id === productId),

  clear: () => set({ items: [], loaded: false }),
}));
