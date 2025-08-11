"use client";
import React from "react";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel";
import { Button } from "./ui/button";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
function RelatedProductsCarousel({ products }) {
  // console.log(products)
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  const handleAddToCart = (p) => {
    const price = p?.quantity?.variants?.[0]?.price || 0;
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
      id: p._id,
      name: p.title,
      image: p?.gallery?.mainImage || "/placeholder.jpeg",
      price: Math.round(discountedPrice),
      originalPrice: price,
      qty: 1,
      couponApplied,
      couponCode: couponApplied ? couponCode : undefined,
      productCode: p.code || p.productCode || '',
      discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
      discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
      cgst: (p.taxes && p.taxes.cgst) || p.cgst || (p.tax && p.tax.cgst) || 0,
      sgst: (p.taxes && p.taxes.sgst) || p.sgst || (p.tax && p.tax.sgst) || 0,
      quantity: p.quantity || {},
    });
    toast.success("Added to cart!");
  };
  // If no products, don't render the component
  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-10 md:px-5">
      {/* <h2 className="text-xl font-bold mb-8 text-center">Related Products</h2> */}
      <div className="relative">
        <Carousel className="w-full pl-2" plugins={[Autoplay({ delay: 4000 })]}>
          <CarouselContent>
            {safeProducts.map((p, idx) => (
              <CarouselItem key={p._id || idx} className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start">
                <div
                  className="rounded-2xl flex flex-col justify-between w-72 mx-auto min-w-[270px] p-0 relative overflow-hidden"
                >
                  {(() => {
                    const coupon = p.coupon || p.coupons?.coupon;
                    if (!coupon?.couponCode) return null;

                    const { percent, amount } = coupon;

                    let offerText;
                    if (typeof percent === 'number' && percent > 0) {
                      offerText = <>GET {percent}% OFF</>;
                    } else if (typeof amount === 'number' && amount > 0) {
                      offerText = <>GET ₹{amount} OFF</>;
                    } else {
                      offerText = <>Special Offer</>;
                    }

                    return (
                      <div className="absolute top-6 left-4 z-10 bg-white rounded-full px-4 py-1 text-sm font-bold shadow text-black tracking-tight" style={{ letterSpacing: 0 }}>
                        {offerText}
                      </div>
                    );
                  })()}
                  {/* Icons top right, stacked */}
                  <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full transition-colors duration-300 h-12 w-12 shadow-none ${wishlist.some(i => i.id === p._id) ? "bg-pink-600 hover:bg-pink-700" : "bg-white hover:bg-[#b3a7a3]"}`}
                      onClick={() => {
                        if (wishlist.some(i => i.id === p._id)) {
                          removeFromWishlist(p._id);
                          toast.success("Removed from wishlist!");
                        } else {
                          const price = p?.quantity?.variants?.[0]?.price || 0;
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
                          addToWishlist({
                            id: p._id,
                            name: p.title,
                            image: p?.gallery?.mainImage || "/placeholder.jpeg",
                            price: Math.round(discountedPrice),
                            originalPrice: price,
                            qty: 1,
                            couponApplied,
                            couponCode: couponApplied ? couponCode : undefined
                          });
                          toast.success("Added to wishlist!");
                        }
                      }}
                    >
                      <Heart size={28} className={wishlist.some(i => i.id === p._id) ? "text-white" : "text-pink-600"} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#b3a7a3]/80 hover:bg-[#b3a7a3] transition-colors duration-300 h-12 w-12 shadow-none"
                      onClick={() => handleAddToCart(p)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                    </Button>
                  </div>
                  {/* Image */}
                  <div className="w-full aspect-[3/4] relative flex items-center justify-center">
                    <Image
                      src={p.gallery?.mainImage?.url || '/placeholder-image.jpg'}
                      alt={p.title || 'Product Image'}
                      fill
                      className="object-cover rounded-2xl hover:scale-105 transition-all duration-300"
                      sizes="(max-width: 768px) 100vw, 300px"
                      priority={idx === 0}
                    />
                  </div>
                  {/* Bottom section: name and price */}
                  <div className="flex flex-col items-start justify-between w-full px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${p._id}`}
                        className="font-bold hover:underline text-xl text-gray-900 leading-tight max-w-[200px] truncate cursor-pointer"
                      >
                        {p?.title}
                      </Link>
                    </div>
                    {(() => {
                      const price = p?.quantity?.variants?.[0]?.price || 0;
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
                      if (couponApplied) {
                        return (
                          <div className="whitespace-nowrap flex gap-2">
                            <span className="text-gray-600 line-through text-lg">₹{price?.toLocaleString('en-IN')}</span>
                            <span className="text-xl font-bold text-black">₹{Math.round(discountedPrice)?.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xl font-bold text-black whitespace-nowrap">
                            ₹{price?.toLocaleString('en-IN')}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute top-44 left-0 z-10 p-5 " />
          <CarouselNext className="absolute top-44 right-0 z-10 p-5" />
        </Carousel>
      </div>
    </div>
  );
}

export default RelatedProductsCarousel;
