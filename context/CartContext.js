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
  return 1; // fallback if nothing present
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

  // Rest of your component code...
  // Make sure there are no extra opening braces in the rest of the file

  // Cart functions
  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      const maxQty = getAvailableQty(item);
      if (idx > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[idx].qty + qty, maxQty);
        if (updated[idx].qty + qty > maxQty) {
          toast.error(`Only ${maxQty} left in stock!`);
        }
        updated[idx] = {
          ...updated[idx],
          ...item,
          qty: newQty,
        };
        return updated;
      }
      if (qty > maxQty) {
        toast.error(`Only ${maxQty} left in stock!`);
      }
      return [...prev, { ...item, qty: Math.min(qty, maxQty) }];
    });
  };
  const removeFromCart = (id) => {
    setIsClearing(true);

    setCart(prev => {
      const updatedCart = prev.filter(i => i.id !== id);

      // Sync with database if user is authenticated
      if (session?.user) {
        const userId = session.user._id || session.user.id || session.user.email;
        // Only clear cart in local state and localStorage, do NOT call API
        setCart([]);
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
        setTimeout(() => setIsClearing(false), 500);
          }
      return updatedCart;
    });
  };
  const updateCartQty = (id, qty) => setCart(prev => prev.map(i => {
    if (i.id === id) {
      const maxQty = getAvailableQty(i);
      if (qty > maxQty) {``
        toast.error(`Only ${maxQty} left in stock!`);
        return { ...i, qty: maxQty };
      }
      return { ...i, qty: Math.max(1, qty) };
    }
    return i;
  }));
  const clearCart = async () => {
  setIsClearing(true);

  // Clear cart from database if user is authenticated
  // if (session?.user) {
  //   try {
  //     console.log('[CartContext][clearCart] session.user:', session.user);
  //     const userId = session.user._id || session.user.id || session.user.email;
  //     console.log('[CartContext][clearCart] Using userId for cart sync:', userId);
  //     const response = await fetch('/api/sync-cart', {
  //       method: 'DELETE',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ userId })
  //     });
  //     const data = await response.json();
  //     if (data.success) {
  //       setCart([]);
  //       try {
  //         localStorage.removeItem("cart");
  //         Object.keys(localStorage).forEach(key => {
  //           if (key.startsWith('cart_')) {
  //             localStorage.removeItem(key);
  //           }
  //         });
  //       } catch (error) {
  //         console.error('Error clearing cart data from localStorage:', error);
  //       } finally {
  //         setTimeout(() => setIsClearing(false), 1000);
  //       }
  //     } else {
  //       console.error('Failed to clear cart from database:', data.error);
  //     }
  //   } catch (error) {
  //     console.error('Error clearing cart from database:', error);
  //   } finally {
  //     setTimeout(() => setIsClearing(false), 1000);
  //   }
  // }
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
