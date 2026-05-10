import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

interface AppState {
  cart: CartItem[];
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  user: any | null;
  deliveryLocation: 'insideDhaka' | 'outsideDhaka';
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setUser: (user: any) => void;
  setDeliveryLocation: (location: 'insideDhaka' | 'outsideDhaka') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,
      isMobileMenuOpen: false,
      user: null,
      deliveryLocation: 'insideDhaka',
      addToCart: (item) => {
        const cart = get().cart;
        const existingItem = cart.find((i) => i.id === item.id);
        if (existingItem) {
          set({
            cart: cart.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
            ),
          });
        } else {
          set({ cart: [...cart, { ...item, quantity: item.quantity || 1 }] });
        }
      },
      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
      updateQuantity: (id, amount) =>
        set((state) => ({
          cart: state.cart
            .map((i) => (i.id === id ? { ...i, quantity: i.quantity + amount } : i))
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ cart: [] }),
      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setIsMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
      setUser: (user) => set({ user }),
      setDeliveryLocation: (location) => set({ deliveryLocation: location }),
    }),
    {
      name: 'anybeauty-store',
      partialize: (state) => ({ cart: state.cart, deliveryLocation: state.deliveryLocation }),
    }
  )
);
