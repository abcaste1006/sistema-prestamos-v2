import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  equipmentId: string;
  name: string;
  category: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (equipmentId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        // Evitar duplicados
        if (items.some((i) => i.equipmentId === item.equipmentId)) {
          return;
        }
        set({ items: [...items, item] });
      },

      removeItem: (equipmentId) => {
        set({
          items: get().items.filter((i) => i.equipmentId !== equipmentId),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.length;
      },
    }),
    {
      name: "cart-storage", // nombre en localStorage
    },
  ),
);
