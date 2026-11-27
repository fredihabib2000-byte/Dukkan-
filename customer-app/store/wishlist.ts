import { create } from 'zustand';
import { Product } from '@/lib/types';

type WishlistItem = { product: Product; storeId: string };

type WishlistStore = {
  items: WishlistItem[];
  toggle: (product: Product, storeId: string) => void;
  isSaved: (productId: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],

  toggle: (product, storeId) => {
    const { items } = get();
    const exists = items.find(i => i.product.id === product.id);
    if (exists) {
      set({ items: items.filter(i => i.product.id !== product.id) });
    } else {
      set({ items: [...items, { product, storeId }] });
    }
  },

  isSaved: (productId) => get().items.some(i => i.product.id === productId),

  clear: () => set({ items: [] }),
}));
