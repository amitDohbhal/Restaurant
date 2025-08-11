"use client";
import React from "react";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";


function RemoveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="11" fill="#fff" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
  );
}

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  // console.log(addToCart)
  const loading = false; // context is always available

  return (
    <div className="bg-[#fcf7f1]">
      {/* Banner */}
      <div className="w-full h-60 bg-gradient-to-r from-[#9e7a5b] to-[#fff0] relative flex items-stretch justify-start">
        <div className="z-10 flex flex-col justify-center items-center w-full min-w-[320px]">
          <div className="text-black font-bold text-5xl mt-10 mb-2 tracking-wide">Wishlist</div>
          <div className="flex items-center gap-2 text-black text-base">
            <span>Home</span>
            <span className="text-lg">›</span>
            <span className="font-semibold">Wishlist</span>
          </div>
        </div>
        {/* <img
          src="/wishlist-banner.jpg"
          className="absolute right-0 top-0 h-full object-cover w-[340px] z-0"
          alt="Wishlist Banner"
        /> */}
      </div>

      {/* Wishlist List (Card style) */}
      <div className="max-w-[1100px] min-h-[600px] mx-auto p-8 md:p-8">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-8">No items in wishlist.</div>
        ) : (
          <>
            {/* Header Row */}
            <div className="overflow-x-auto rounded-lg border border-[#f5e6d9] shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
                <thead className="bg-gray-50 font-semibold text-left">
                  <tr>
                    <th className="px-6 py-3 w-1/3">Product</th>
                    <th className="px-4 py-3 w-1/5 text-right">Price</th>
                    <th className="px-4 py-3 w-1/6 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Action</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {wishlist.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {/* Product (Image + Name) */}
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-[#f5e6d9] overflow-hidden flex items-center justify-center">
                          <img
                            src={item.image?.url || "/placeholder.png"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{item.name}</span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 text-right">
                        {item.oldPrice && (
                          <span className="text-gray-400 line-through mr-2 text-sm">
                            ₹{item.oldPrice}
                          </span>
                        )}
                        <span className="text-gray-900 font-semibold text-base">
                          ₹{item.price}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-[#1a9b40] font-semibold">In Stock</span>
                      </td>

                      {/* Add to Cart Button */}
                      <td className="px-4 py-4 text-center">
                        <button
                          className="bg-black text-white rounded-lg text-sm font-semibold px-4 py-2 hover:bg-gray-800 transition"
                          onClick={() => {
                            addToCart(item);
                            toast.success("Added to cart!");
                          }}
                        >
                          Add To Cart
                        </button>
                      </td>

                      {/* Remove Button */}
                      <td className="px-4 py-4 text-center">
                        <button
                          className="ml-2"
                          aria-label="Remove"
                          onClick={() => {
                            removeFromWishlist(item.id);
                            toast.success("Removed from wishlist!");
                          } }
                        >
                          <RemoveIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
