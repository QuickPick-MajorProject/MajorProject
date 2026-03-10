import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const USER_ID = 'demo-user'; // Use a real userId in production

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  // Load cart from backend and persist to localStorage
  const loadCart = useCallback(async () => {
    try {
      const res = await axios.get(`/api/cart/${USER_ID}`);
      setCart(res.data.cart || []);
      localStorage.setItem('cart', JSON.stringify(res.data.cart || []));
    } catch {
      setCart([]);
      localStorage.setItem('cart', '[]');
    }
  }, []);

  // Add to cart (after chat or other flows)
  const addToCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Clear cart (optional)
  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.setItem('cart', '[]');
  }, []);

  // Get total item count
  const getCartCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart]);

  // On mount, always load cart from backend
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Also update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      userId: USER_ID,
      loadCart,
      addToCart,
      clearCart,
      getCartCount,
      setCart
    }}>
      {children}
    </CartContext.Provider>
  );
};