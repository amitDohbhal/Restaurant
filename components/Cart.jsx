import React, { useState, useEffect } from "react";
import { ShoppingCart, Heart, X, Minus, Plus, Ship } from "lucide-react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useSession } from "next-auth/react";

export default function Cart({ open, onClose, initialTab = "cart" }) {
  const [tab, setTab] = useState(initialTab);
  const [show, setShow] = useState(true); // Always mount on first render
  const firstRender = React.useRef(true);
  const { cart: rawCart, wishlist, setCart, setWishlist, updateCartQty, removeFromCart, removeFromWishlist, isClearing,clearCart } = useCart();
  const cart = Array.isArray(rawCart) ? rawCart : [];
  useEffect(() => {
    if (open) {
      setShow(true);
      setTab(initialTab);
      document.body.classList.add('overflow-hidden');
    } else {
      // Wait for animation before unmounting
      const timer = setTimeout(() => setShow(false), 500);
      document.body.classList.remove('overflow-hidden');
      return () => clearTimeout(timer);
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [open, initialTab]);

  // Prevent instant open animation on first mount
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (!open) setShow(false);
    }
  }, []);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (!show || typeof window === "undefined") return null;

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[999] flex">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[999] transition-opacity duration-500 ease-in-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Cart Sidebar */}
        <div
          className={`fixed top-0 right-0 h-full w-[400px] bg-[#fcf7f1] shadow-lg z-[999] flex flex-col border-l border-neutral-200 
          transition-all duration-500 ease-in-out transform-gpu
          ${open ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}`}
          style={{ maxWidth: "100vw" }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-neutral-200">
            <div className="flex gap-7 text-lg font-semibold">
              <button
                className={`flex items-center gap-2 pb-2 border-b-2 ${tab === "cart" ? "border-black" : "border-transparent"}`}
                onClick={() => setTab("cart")}
              >
                Shopping Cart <span className="ml-1 text-xs bg-black text-white rounded-full px-2">{cart.length}</span>
              </button>
              <button
                className={`flex items-center gap-2 pb-2 border-b-2 ${tab === "wishlist" ? "border-black" : "border-transparent"}`}
                onClick={() => setTab("wishlist")}
              >
                Previous Orders
              </button>
            </div>
            <button onClick={onClose} aria-label="Close"><X size={24} /></button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
            {(tab === "cart" ? cart : wishlist).map((item, index) => (
              <div key={`${item.id}_${item.size || 'N/A'}_${item.color || 'N/A'}_${index}`} className="flex items-center gap-4 py-4 border-b border-neutral-200 last:border-b-0">
                <img src={typeof item.image === "string" ? item.image : item.image?.url} alt={item.name} className="w-20 h-20 rounded-lg object-cover border" />
                <div className="flex-1">
                  <div className="font-semibold text-base leading-tight mb-1">{item.name}</div>
                  {tab === "cart" && (
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateCartQty(item.id, Math.max(1, item.qty - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center"><Minus size={18} /></button>
                      <span className="mx-2 font-medium">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, item.qty + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus size={18} /></button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold">₹{(item.price * (item.qty || 1)).toFixed(2)}</span>
                  {tab === "cart" ? (
                    <button onClick={async () => await removeFromCart(item.id)} className="text-neutral-400 hover:text-red-500">
                      <X size={18} />
                    </button>
                  ) : (
                    <button onClick={async () => await removeFromWishlist(item.id)} className="text-neutral-400 hover:text-red-500">
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {tab === "cart" && (
            <div className="px-6 pt-2 pb-6 border-t border-neutral-200">
              <div className="flex justify-between text-lg font-semibold mb-2">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="text-md font-semibold mb-1 text-center">
                  "Almost Yours—Just One Step Left!"
                  </div>
                </div> 
              </div>
              <Link href="/cartDetails" className="block w-full">
                <button
                  className="w-full py-2 bg-black text-white rounded-lg font-semibold"
                  onClick={onClose}
                  type="button"
                >View Cart</button>
              </Link>
            </div>
          )}

          {/* Wishlist Footer: Check Wishlist button */}
          {tab === "previous_orders" && (
            <div className="px-6 pt-2 pb-6 border-t border-neutral-200">
              <Link href="/previous_orders" className="block w-full">
                <button
                  className="w-full bg-black text-white rounded-lg font-semibold mt-2 hover:bg-neutral-800 transition"
                  onClick={onClose}
                  type="button"
                >Check Previous Orders</button>
              </Link>
              <Link href="/cartDetails" className="block w-full">
                <button
                  className="w-full py-2 bg-black text-white rounded-lg font-semibold"
                  onClick={onClose}
                  type="button"
                >View Cart</button>
              </Link>
            </div>
            
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
