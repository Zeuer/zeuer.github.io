import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax: 0, total: 0 });
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user === false) {
      const local = localStorage.getItem("zeuer_cart");
      if (local) setCart(JSON.parse(local));
      return;
    }
    try {
      const { data } = await axios.get(`${API}/api/cart`, { withCredentials: true });
      setCart(data);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, size, quantity = 1) => {
    if (!user || user === false) return null;
    try {
      const { data } = await axios.post(`${API}/api/cart/add`, { product_id: productId, size, quantity }, { withCredentials: true });
      setCart(data);
      setCartOpen(true);
      return data;
    } catch (e) {
      throw e;
    }
  };

  const updateCartItem = async (productId, size, quantity) => {
    try {
      const { data } = await axios.put(`${API}/api/cart/${productId}/${size}`, { quantity }, { withCredentials: true });
      setCart(data);
      return data;
    } catch (e) {
      throw e;
    }
  };

  const removeFromCart = async (productId, size) => {
    try {
      const { data } = await axios.delete(`${API}/api/cart/${productId}/${size}`, { withCredentials: true });
      setCart(data);
      return data;
    } catch (e) {
      throw e;
    }
  };

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, updateCartItem, removeFromCart, fetchCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
