import { create } from 'zustand';
import { Product } from '@/lib/types';

type CartItem = {
  product: Product;
  quantity: number;
};

type CartStore = {
  storeId: string | null;
  items: CartItem[];
  addItem: (product: Product, storeId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  storeId: null,
  items: [],

  addItem: (product, storeId) => {
    const { items, storeId: currentStoreId } = get();
    // If adding from a different store, clear cart first
    if (currentStoreId && currentStoreId !== storeId) {
      set({ items: [], storeId });
    }
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        storeId,
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ storeId, items: [...items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
      storeId: state.items.length === 1 ? null : state.storeId,
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
    })),

  clearCart: () => set({ items: [], storeId: null }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
