"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
const CartContext = createContext();

function getInitial(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function getAvailableQty(item) {
  if (item?.totalQuantity !== undefined) return item.totalQuantity;
  return 9999; // Return a large number as default to avoid stock limit issues
}


export function CartProvider({ children, session }) {
  const [cart, setCart] = useState(() => getInitial("cart", []));
  const [wishlist, setWishlist] = useState(() => getInitial("wishlist", []));
  const [isClearing, setIsClearing] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  // Cart functions
  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      // Create a unique ID that includes the selected option if it exists
      const itemId = item.selectedOption ? `${item._id || item.id}_${item.selectedOption}` : (item._id || item.id);
      
      // Find if item with same ID and selected option exists
      const existingItemIndex = prev.findIndex(i => i.id === itemId);
      
      const maxQty = getAvailableQty(item);
      const quantityToAdd = Math.max(1, parseInt(qty, 10));
      
      if (existingItemIndex > -1) {
        // If item with same option exists, update its quantity and preserve all data
        const updated = [...prev];
        const existingItem = updated[existingItemIndex];
        const newQty = Math.min((parseInt(existingItem.qty, 10) || 0) + quantityToAdd, maxQty);
        
        // Preserve all existing data and update quantity
        updated[existingItemIndex] = {
          ...existingItem,  // Keep all existing data
          ...item,         // Update with any new data
          qty: newQty,     // Update quantity
          id: itemId       // Ensure ID is correct
        };
        
        return updated;
      } else {
        // If item doesn't exist, add it with all data and specified quantity
        const finalQty = Math.min(quantityToAdd, maxQty);
        return [
          ...prev, 
          { 
            ...item,      // Include all item data
            id: itemId,   // Set the correct ID
            qty: finalQty // Set the quantity
          }
        ];
      }
    });
  };
  const removeFromCart = (id) => {
    setIsClearing(true);

    setCart(prev => {
      // Handle both ID formats (with or without the _option suffix)
      const updatedCart = prev.filter(i => i.id !== id && 
        !(i._id === id.split('_')[0] && i.selectedOption === id.split('_')[1]));
      
      // Clear cart in localStorage if it's empty after removal
      if (updatedCart.length === 0) {
        try {
          localStorage.removeItem("cart");
          localStorage.removeItem("checkoutCart");
          localStorage.removeItem("checkoutData");
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cart_')) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.error('Error clearing cart/checkout data from localStorage:', error);
        }
      }
      
      setTimeout(() => setIsClearing(false), 500);
      return updatedCart;
    });
  };
  const updateCartQty = (id, qty) => setCart(prev => prev.map(i => {
    if (i.id === id) {
      const maxQty = getAvailableQty(i);
      if (qty > maxQty) {
        return { ...i, qty: maxQty };
      }
      return { ...i, qty: Math.max(1, qty) };
    }
    return i;
  }));
  const clearCart = async () => {
  setIsClearing(true);
};

  // Wishlist functions
  const addToWishlist = item => {
    setWishlist(prev => prev.some(i => i.id === item.id) ? prev : [...prev, item]);
  };
  const removeFromWishlist = id => setWishlist(prev => prev.filter(i => i.id !== id));
  const clearWishlist = () => setWishlist([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        setCart,
        setWishlist,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
