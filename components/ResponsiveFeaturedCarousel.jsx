"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast"

const dummyProducts = [
  {
    id: 1,
    name: "Loremour De Saliduar Cosmopolis",
    image: "/RandomTourPackageImages/u1.jpg",
    oldPrice: 140.0,
    price: 126.0,
    checked: true,
  },
  {
    id: 2,
    name: "Dinterdum Condiment Milancelos",
    image: "/RandomTourPackageImages/u2.jpg",
    oldPrice: 139.0,
    price: 89.0,
    checked: true,
    priceRange: true,
    minPrice: 89.0,
    maxPrice: 139.0,
  },
  {
    id: 3,
    name: "Magnis Durtarien Aldo Lacinado Pharetas",
    image: "/RandomTourPackageImages/u3.jpg",
    oldPrice: 90.0,
    price: 80.0,
    checked: true,
  },
  {
    id: 4,
    name: "Dempus Dortis Delios Nullam Sapiendo",
    image: "/RandomTourPackageImages/u1.jpg",
    price: 89.0,
    checked: true,
  },
];


const ResponsiveFeaturedCarousel = ({ products }) => {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  // Use products if available and non-empty, otherwise fallback to 3 dummy products
  // console.log(products)
  const displayProducts = Array.isArray(products) && products.length > 0
    ? products
    : dummyProducts;

  // Always keep selected state in sync with displayProducts length
  const [selected, setSelected] = React.useState(() => displayProducts.map((p) => p.checked ?? true));

  React.useEffect(() => {
    setSelected(displayProducts.map((p) => p.checked ?? true));
  }, [displayProducts]);

  const handleCheck = (idx) => {
    setSelected((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  // Calculate totals
  const total = displayProducts.reduce(
    (sum, p, i) => (selected[i] ? sum + (p.quantity?.variants[0].price || p.minPrice || 0) : sum),
    0
  );
  const chunkArray = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );


  // Modal state for options
  const [optionModal, setOptionModal] = React.useState({ open: false, productIdx: null });
  const [selectedColor, setSelectedColor] = React.useState(null);
  const [selectedSize, setSelectedSize] = React.useState(null);

  // Helper to get options for modal
  const getOptions = (product) => {
    // Try product.colors (array of {name, hex}), or variants
    let colors = product.colors || [];
    let sizes = product.sizes || [];
    if (!colors.length && product.quantity?.variants) {
      colors = Array.from(new Set(product.quantity.variants.map(v => v.color))).filter(Boolean).map(color => ({ name: color, hex: color }));
    }
    if (!sizes.length && product.quantity?.variants) {
      sizes = Array.from(new Set(product.quantity.variants.map(v => v.size))).filter(Boolean);
    }
    return { colors, sizes };
  };

  // Reset modal state on open
  React.useEffect(() => {
    if (optionModal.open && optionModal.productIdx != null) {
      setSelectedColor(null);
      setSelectedSize(null);
    }
  }, [optionModal]);

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 rounded-2xl items-center justify-center py-8 px-2 md:px-4 md:mt-4">
      {/* Choose Options Modal */}
      {optionModal.open && optionModal.productIdx != null && (
        (() => {
          const product = displayProducts[optionModal.productIdx];
          if (!product) return null;
          const { colors, sizes } = getOptions(product);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-xl w-[340px] p-6 relative animate-fade-in">
                <button
                  className="absolute right-4 top-4 text-xl text-gray-400 hover:text-black"
                  onClick={() => setOptionModal({ open: false, productIdx: null })}
                  aria-label="Close"
                >&#10005;</button>
                <div className="font-bold text-lg mb-4">CHOOSE OPTIONS</div>
                {/* Color selection */}
                {colors.length > 0 && (
                  <div className="mb-4">
                    <div className="font-semibold text-sm mb-1">Color: {selectedColor || <span className="text-black">Select</span>}</div>
                    <div className="flex gap-3">
                      {colors.map((color, idx) => (
                        <button
                          key={color.hex || color.name || idx}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === (color.name || color.hex) ? 'border-black' : 'border-gray-300'}`}
                          style={{ background: color.hex || color.name }}
                          title={color.name}
                          onClick={() => setSelectedColor(color.name || color.hex)}
                        >
                          {selectedColor === (color.name || color.hex) && <span className="w-4 h-4 bg-white rounded-full border border-black"></span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Size selection */}
                {sizes.length > 0 && (
                  <div className="mb-4">
                    <div className="font-semibold text-sm mb-1">Size: {selectedSize || <span className="text-black">Select</span>}</div>
                    <div className="flex gap-3">
                      {sizes.map((size, idx) => (
                        <button
                          key={size || idx}
                          className={`min-w-12 h-12 border-2 flex items-center justify-center text-sm font-semibold transition-all ${selectedSize === size ? 'border-black bg-gray-100' : 'border-gray-300'}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  className={`mt-4 w-full py-2 rounded-lg font-bold text-base transition ${selectedColor && selectedSize ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  disabled={!selectedColor || !selectedSize}
                  onClick={() => {
                    // Add to cart with selected options
                    const prod = displayProducts[optionModal.productIdx];
                    let price = prod.price || prod.minPrice || 0;
                    // Find variant price if available
                    if (prod.quantity?.variants) {
                      const variant = prod.quantity.variants.find(v => v.size === selectedSize && (v.color === selectedColor || !selectedColor));
                      if (variant) price = variant.price;
                    }
                    addToCart({
                      id: prod._id || prod.id,
                      name: prod.title || prod.name,
                      image: (prod.gallery?.mainImage) || (prod.image?.url) || prod.image || "/placeholder.jpeg",
                      price,
                      color: selectedColor,
                      size: selectedSize,
                    }, 1);
                    toast.success('Added to cart!');
                    setOptionModal({ open: false, productIdx: null });
                  }}
                >Add to Cart</button>
              </div>
            </div>
          );
        })()
      )}

      {/* Carousel Section (Left) */}
      <div className="flex-1 w-full md:max-w-[70%] mx-auto flex flex-row items-start">
         {/* Desktop Carousel: 4 products per row */}
         <div className="hidden md:flex relative w-full">
          <Carousel className="w-full">
            <CarouselContent className="w-full gap-2">
              {chunkArray(displayProducts, 4).map((row, rowIdx) => (
                <CarouselItem key={rowIdx} className="flex gap-2 justify-start">
                  {row.map((product, idx) => {
                    const globalIdx = rowIdx * 4 + idx;
                    return (
                      <div key={product.id || product._id || globalIdx} className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col w-56 min-w-[220px] justify-between">
                        <div>
                          <div className="w-full h-56 relative mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                            <Image
                              src={product.gallery?.mainImage?.url || (product.image && product.image.url) || product.image || "/placeholder.jpeg"}
                              alt={product.title || product.packageName || "Product image"}
                              width={180}
                              height={180}
                              className="object-contain w-full h-full hover:scale-105 transition-all duration-300"
                            />
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={selected[globalIdx]}
                                onChange={() => handleCheck(globalIdx)}
                                className="accent-black scale-125 cursor-pointer"
                                style={{ marginTop: 2 }}
                              />
                              <Link
                                href={`/product/${product.slug}`}
                                className="font-semibold text-[16px] text-black leading-tight hover:underline"
                                style={{ lineHeight: '1.2' }}
                              >
                                {product.title || product.name || product.packageName}
                              </Link>
                            </div>
                            {/* Price block */}
                            <div className="flex items-center gap-2 mt-1">
                              {product.oldPrice && (
                                <span className="text-gray-400 text-[17px] font-semibold line-through">
                                  ₹{product.oldPrice.toFixed(2)}
                                </span>
                              )}
                              {(() => {
                                const price = product.quantity?.variants?.[0]?.price || product.price || product.minPrice || 0;
                                const coupon = product.coupon || product.coupons?.coupon;
                                let discountedPrice = price;
                                let couponApplied = false;
                                if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                                  discountedPrice = price - (price * coupon.percent) / 100;
                                  couponApplied = true;
                                } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                                  discountedPrice = price - coupon.amount;
                                  couponApplied = true;
                                }
                                if (couponApplied || product.oldPrice) {
                                  return (
                                    <span className="text-[19px] font-bold text-black ml-1">₹{Math.round(discountedPrice)?.toLocaleString('en-IN')}</span>
                                  );
                                } else {
                                  return <span className="text-[19px] font-bold text-black">₹{price?.toLocaleString('en-IN')}</span>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        <button
                          className="border border-black rounded-md py-2 px-3 text-sm font-semibold mt-2 hover:bg-black hover:text-white transition"
                          onClick={() => setOptionModal({ open: true, productIdx: globalIdx })}
                        >
                          Choose Options
                        </button>
                      </div>
                    );
                  })}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-8 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute -right-8 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>       
        
        {/* Mobile Carousel: 2 products per row */}
        <div className="flex md:hidden relative w-full">
          <Carousel className="w-full">
            <CarouselContent className="w-full gap-2">
              {chunkArray(displayProducts, 2).map((row, rowIdx) => (
                <CarouselItem key={rowIdx} className="flex gap-2 justify-center">
                  {row.map((product, idx) => {
                    const globalIdx = rowIdx * 2 + idx;
                    return (
                      <div key={product.id || product._id || globalIdx} className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col w-full min-w-[150px] justify-between">
                        <div>
                          <div className="w-full h-52 relative mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 hover:scale-105 transition-all duration-300">
                            <Image
                              src={product.gallery?.mainImage?.url || (product.image && product.image.url) || product.image || "/placeholder.jpeg"}
                              alt={product.title || product.packageName || "Product image"}
                              width={120}
                              height={120}
                              className="object-contain w-full h-full hover:scale-105 transition-all duration-300"
                            />
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={selected[globalIdx]}
                                onChange={() => handleCheck(globalIdx)}
                                className="accent-black scale-125 cursor-pointer"
                                style={{ marginTop: 2 }}
                              />
                              <Link
                                href={`/product/${product.slug}`}
                                className="font-semibold text-[15px] text-black leading-tight hover:underline"
                                style={{ lineHeight: '1.2' }}
                              >
                                {product.title || product.name || product.packageName}
                              </Link>
                            </div>
                            {/* Price block */}
                            <div className="flex items-center gap-2 mt-1">
                              {product.oldPrice && (
                                <span className="text-gray-400 text-[15px] font-semibold line-through">
                                  ₹{product.oldPrice.toFixed(2)}
                                </span>
                              )}
                              {(() => {
                                const price = product.quantity?.variants?.[0]?.price || product.price || product.minPrice || 0;
                                const coupon = product.coupon || product.coupons?.coupon;
                                let discountedPrice = price;
                                let couponApplied = false;
                                if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                                  discountedPrice = price - (price * coupon.percent) / 100;
                                  couponApplied = true;
                                } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                                  discountedPrice = price - coupon.amount;
                                  couponApplied = true;
                                }
                                if (couponApplied || product.oldPrice) {
                                  return (
                                    <span className="text-[17px] font-bold text-black ml-1">₹{Math.round(discountedPrice)?.toLocaleString('en-IN')}</span>
                                  );
                                } else {
                                  return <span className="text-[17px] font-bold text-black">₹{price?.toLocaleString('en-IN')}</span>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        <button
                          className="border border-black rounded-md py-2 px-3 text-sm font-semibold mt-2 hover:bg-black hover:text-white transition"
                          onClick={() => setOptionModal({ open: true, productIdx: globalIdx })}
                        >
                          Choose Options
                        </button>
                      </div>
                    );
                  })}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

       
    
      </div>
      {/* Summary Section (Right) */}
      <div className="flex-shrink-0 w-[320px] md:ml-8">
        <div className="rounded-2xl border border-gray-200 p-6 bg-white flex flex-col items-center">
          <span className="text-m md:text-xl font-semibold text-gray-900 mb-2">Price Total:</span>
          {(() => {
            let originalTotal = 0;
            let discountedTotal = 0;
            let anyDiscount = false;
            displayProducts.forEach((product, idx) => {
              if (!selected[idx]) return;
              const price = product.quantity?.variants?.[0]?.price || product.price || product.minPrice || 0;
              const coupon = product.coupon || product.coupons?.coupon;
              let discountedPrice = price;
              if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                discountedPrice = price - (price * coupon.percent) / 100;
                anyDiscount = true;
              } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                discountedPrice = price - coupon.amount;
                anyDiscount = true;
              }
              originalTotal += price;
              discountedTotal += discountedPrice;
            });
            if (anyDiscount) {
              return (
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-gray-400 line-through text-base">₹{originalTotal.toFixed(2)}</span>
                  <span className="text-xl font-bold text-black">₹{discountedTotal.toFixed(2)}</span>
                </div>
              );
            } else {
              return (
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-xl font-bold text-black">₹{originalTotal.toFixed(2)}</span>
                </div>
              );
            }
          })()}
          <button
            className="bg-black text-white w-full py-3 rounded-lg font-bold text-base mb-3 mt-2 hover:bg-gray-900 transition"
            onClick={() => {
              // Add all selected products to cart
              let added = 0;
              displayProducts.forEach((p, i) => {
                if (selected[i]) {
                  // Use similar logic as ProductDetailView
                  const price = p.quantity?.variants?.[0]?.price || p.price || p.minPrice || 0;
                  const coupon = p.coupon || p.coupons?.coupon;
                  let discountedPrice = price;
                  let couponApplied = false;
                  let couponCode = '';
                  if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                    discountedPrice = price - (price * coupon.percent) / 100;
                    couponApplied = true;
                    couponCode = coupon.couponCode;
                  } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                    discountedPrice = price - coupon.amount;
                    couponApplied = true;
                    couponCode = coupon.couponCode;
                  }
                  addToCart({
                    id: p._id || p.id,
                    name: p.title || p.name,
                    image: (p.gallery?.mainImage) || (p.image?.url) || p.image || "/placeholder.jpeg",
                    price: Math.round(discountedPrice),
                    originalPrice: price,
                    couponApplied,
                    couponCode: couponApplied ? couponCode : undefined
                  }, 1);
                  added++;
                }
              });
              if (added > 0) {
                toast.success(`${added} product${added > 1 ? 's' : ''} added to cart!`);
              } else {
                toast.error("Please select at least one product.");
              }
            }}
          >ADD ALL TO CART</button>
          <div className="text-sm font-semibold text-center text-gray-700 w-52">Get a 10% discount buying these products together</div>
        </div>
      </div>
    </div>
  );
};
export default ResponsiveFeaturedCarousel;
