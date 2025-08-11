"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import toast from "react-hot-toast"

const PackageCard = ({ pkg, wishlist = [], addToWishlist, removeFromWishlist, setQuickViewProduct, handleAddToCart }) => {
  // If not passed as prop, fallback to context
  const cart = useCart?.() || {}
  const addToWishlistFn = addToWishlist || cart.addToWishlist
  const removeFromWishlistFn = removeFromWishlist || cart.removeFromWishlist
  const addToCartFn = handleAddToCart || cart.addToCart
  const [loading, setLoading] = useState(false)
  const isWishlisted = wishlist?.some?.(i => i.id === pkg._id)
  const formatNumber = (number) => new Intl.NumberFormat('en-IN').format(number)

  return (
    <div className="flex flex-col w-58 md:w-[250px] rounded-3xl mb-2 group cursor-pointer">
      {/* Image Section */}
      <div className="relative w-full md:h-80 rounded-3xl overflow-hidden flex items-center justify-center group/image">
        {/* GET 10% OFF Tag */}
        <div className="absolute top-6 left-4 z-10">
          {(() => {
            const coupon = pkg.coupon || pkg.coupons?.coupon;
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
              <div className="rounded-full px-4 py-1 text-xs md:text-sm font-bold shadow text-black tracking-tight" style={{ letterSpacing: 0 }}>
                {offerText}
              </div>
            );
          })()}
        </div>
        {/* Heart/Wishlist & Cart Buttons - Top Right */}
        {/* <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 items-end">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full transition-colors duration-300 h-12 w-12 shadow-none ${isWishlisted ? "bg-pink-600 hover:bg-pink-700" : "bg-white hover:bg-[#b3a7a3]"}`}
            onClick={() => {
              if (isWishlisted) {
                removeFromWishlistFn(pkg._id)
                toast.success("Removed from wishlist!")
              } else {
                const price = pkg.price || 0;
                const coupon = pkg.coupon || pkg.coupons?.coupon;
                let discountedPrice = price;
                let couponApplied = false;
                let couponCode = "";
                if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                  discountedPrice = price - (price * coupon.percent) / 100;
                  couponApplied = true;
                  couponCode = coupon.couponCode;
                } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                  discountedPrice = price - coupon.amount;
                  couponApplied = true;
                  couponCode = coupon.couponCode;
                }
                addToWishlistFn({
                  id: pkg._id,
                  name: pkg.title,
                  image: pkg?.gallery?.mainImage || "/RandomTourPackageImages/u1.jpg",
                  price: Math.round(discountedPrice),
                  originalPrice: price,
                  qty: 1,
                  couponApplied,
                  couponCode: couponApplied ? couponCode : undefined
                })
                toast.success("Added to wishlist!")
              }
            }}
          >
            <Heart size={28} className={isWishlisted ? "text-white" : "text-pink-600"} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-[#b3a7a3]/80 hover:bg-[#b3a7a3] transition-colors duration-300 h-12 w-12 shadow-none"
            onClick={() => {
              const price = pkg.price || 0;
              const coupon = pkg.coupon || pkg.coupons?.coupon;
              let discountedPrice = price;
              let couponApplied = false;
              let couponCode = "";
              if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                discountedPrice = price - (price * coupon.percent) / 100;
                couponApplied = true;
                couponCode = coupon.couponCode;
              } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                discountedPrice = price - coupon.amount;
                couponApplied = true;
                couponCode = coupon.couponCode;
              } else if (pkg.originalPrice > price) {
                discountedPrice = price;
                couponApplied = true;
                couponCode = "DEFAULT";
              }
              addToCartFn({
                id: pkg._id,
                name: pkg.title,
                image: pkg?.gallery?.mainImage || "/placeholder.jpeg",
                price: Math.round(discountedPrice),
                size: pkg?.quantity?.variants[0].size,
                weight: pkg?.quantity?.variants[0].weight,
                color: pkg?.quantity?.variants[0].color,
                originalPrice: price,
                qty: 1,
                couponApplied,
                couponCode: couponApplied ? couponCode : undefined,
                productCode: pkg.code || pkg.productCode || '',
                discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
                discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
                cgst: (pkg.taxes && pkg.taxes.cgst) || pkg.cgst || (pkg.tax && pkg.tax.cgst) || 0,
                sgst: (pkg.taxes && pkg.taxes.sgst) || pkg.sgst || (pkg.tax && pkg.tax.sgst) || 0,
                totalQuantity: pkg?.quantity?.variants[0]?.qty || 0,
              }, 1)
              toast.success("Added to cart!")
            }}
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
        </div> */}
        <Image
          src={pkg?.gallery?.mainImage?.url || "/placeholder.jpeg"}
          alt={pkg?.title || "Product Image"}
          width={400}
          height={500}
          quality={60}
          className="object-cover w-full h-full rounded-3xl transition-transform duration-300 group-hover/image:scale-105"
        />
        {/* Quick View Button - Slide Up from Bottom on Hover (image only) */}
        {setQuickViewProduct && (
          <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center translate-y-10 opacity-0 group-hover/image:translate-y-0 group-hover/image:opacity-100 transition-all duration-300 py-4 ">
            <Button
              className="bg-black text-white hover:bg-gray-800 transition-colors duration-300 uppercase text-sm font-bold px-8 py-3 rounded-full shadow-lg border border-2 border-white"
              onClick={() => setQuickViewProduct(pkg)}
            >
              QUICK VIEW
            </Button>
          </div>
        )}
      </div>
      {/* Name and Price Section */}
      <div className="flex flex-col items-start justify-between px-2 pt-4 pb-2 mt-0">
        <Link
          href={`/product/${pkg.slug}`}
          className="font-bold hover:underline text-sm md:text-xl text-gray-900 leading-tight truncate cursor-pointer"
        >
          {pkg?.title}
        </Link>
        {(() => {
          const price = pkg.price || 0;
          const originalPrice = pkg.originalPrice || price;
          const coupon = pkg.coupon || pkg.coupons?.coupon;
          let discountedPrice = price;
          let hasDiscount = false;

          if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
            discountedPrice = price - (price * coupon.percent) / 100;
            hasDiscount = true;
          } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
            discountedPrice = price - coupon.amount;
            hasDiscount = true;
          } else if (originalPrice > price) {
            discountedPrice = price;
            hasDiscount = true;
          }
          if (hasDiscount && discountedPrice < originalPrice) {
            return (
              <span>
                <span className="font-semibold text-md md:text-xl text-black px-2">₹{formatNumber(Math.round(discountedPrice))}</span>
                <del className="text-black font-semibold text-sm md:text-xl mr-2">₹{formatNumber(originalPrice)}</del>
              </span>
            );
          } else {
            return (
              <span className="font-semibold text-md md:text-xl text-black">₹{formatNumber(price)}</span>
            );
          }
        })()}
      </div>
    </div>
  )
}

export default PackageCard
