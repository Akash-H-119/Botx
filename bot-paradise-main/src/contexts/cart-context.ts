import { createContext } from "react";

export interface CartItem {
  id: string;
  name: string;
  price_usd: number;
  cover_image_url?: string | null;
  slug: string;
}

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

export const CART_STORAGE_KEY = "tbm_cart";

export const CartContext = createContext<CartContextValue | undefined>(undefined);
