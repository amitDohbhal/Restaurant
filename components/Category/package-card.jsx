"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import toast from "react-hot-toast"
import PriceSelectionPopup from "./PriceSelectionPopup"

const PackageCard = ({ 
  pkg, 
  wishlist = [], 
  addToWishlist, 
  removeFromWishlist, 
  setQuickViewProduct, 
  handleAddToCart 
}) => {
  const [showPricePopup, setShowPricePopup] = useState(false);
  // If not passed as prop, fallback to context
  const cart = useCart?.() || {}
  const addToCartFn = handleAddToCart || cart.addToCart
  const addToWishlistFn = addToWishlist || cart.addToWishlist
  const removeFromWishlistFn = removeFromWishlist || cart.removeFromWishlist

  const [loading, setLoading] = useState(false)
  const isWishlisted = wishlist?.some?.(i => i.id === pkg._id)
  const formatNumber = (number) => new Intl.NumberFormat('en-IN').format(number)

  // Calculate price with discount if any
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

  const handleAddToCartWithOptions = (productData) => {
    console.log('Adding to cart:', productData);
    
    // If it's a single item (backward compatibility)
    if (!Array.isArray(productData)) {
      productData = [productData];
    }
    
    // Process each selected option
    productData.forEach(item => {
      const quantity = item.quantity || 1;
      // Create a cart item with all the original product data
      const cartItem = {
        // Spread all original item properties first
        ...item,
        // Then override with cart-specific properties
        id: `${item._id}_${item.selectedOption}`, // Unique ID with option
        name: `${item.title} (${item.optionLabel || item.selectedOption})`,
        qty: quantity,
        // Ensure these are numbers
        price: parseFloat(item.price),
        originalPrice: parseFloat(item.originalPrice || item.price),
        cgstPercent: parseFloat(item.cgstPercent) || 0,
        sgstPercent: parseFloat(item.sgstPercent) || 0,
        // Ensure image is properly formatted
        image: item.image?.url ? item.image : { url: "/placeholder.jpeg" },
        // Add any missing properties with defaults
        productCode: item.productCode || item.code || '',
        description: item.description || item.productDescription || ''
      };
      
      console.log('Adding cart item:', cartItem);
      
      if (addToCartFn) {
        // Pass the cart item and quantity to addToCartFn
        addToCartFn(cartItem, quantity);
      }
    });
    
    toast.success(`${productData.length} item${productData.length > 1 ? 's' : ''} added to cart!`);
  };

  return (
    <>
      <div className="flex flex-col w-58 md:w-[300px] rounded-md mb-2 group cursor-pointer bg-white">
      {/* Image Section */}
      <div className="relative w-full h-48 md:h-60 rounded-t-3xl overflow-hidden">
        <Image
          src={typeof pkg.image === 'string' ? pkg.image : (pkg.image?.url || "/placeholder.jpeg")}
          alt={pkg?.title || pkg?.name || "Food Image"}
          width={400}
          height={400}
          quality={75}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
      </div>
      {/* Product Info Section */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Product Title */}
        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2 line-clamp-2 h-10">
          {pkg?.title}
        </h3>
        {/* Action Buttons */}
        <div className="mt-auto pt-3 flex flex-row gap-2">
        {/* Price Section */}
        <div className="mb-3 w-32">
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">₹{formatNumber(Math.round(discountedPrice))}</span>
                <span className="text-sm text-gray-500 line-through">₹{formatNumber(Math.round(originalPrice))}</span>
                {coupon?.percent && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {coupon.percent}% OFF
                  </span>
                )}
              </div>
            );
          } else {
            return (
              <span className="font-bold text-lg text-gray-900">₹{formatNumber(Math.round(price))}</span>
            );
          }
        })()}
        </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => setShowPricePopup(true)}
          >
            <ShoppingCart size={16} />
            Add to Cart
          </Button>
          
        </div>
          <Button 
            variant="outline" 
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-2 text-sm font-medium rounded-lg transition-colors"
            onClick={() => setShowPricePopup(true)}
          >
            Choose Option
          </Button>
      </div>
      
      {/* Price Selection Popup */}
      {showPricePopup && (
        <PriceSelectionPopup
          product={{
            ...pkg,
            title: pkg.title || pkg.name,
            description: pkg.description || pkg.productDescription,
            originalPrice: pkg.originalPrice || pkg.price,
            fullPrice: pkg.fullPrice || pkg.price,
            halfPrice: pkg.halfPrice,
            quarterPrice: pkg.quarterPrice,
            perPiecePrice: pkg.perPiecePrice
          }}
          onClose={() => setShowPricePopup(false)}
          onAddToCart={handleAddToCartWithOptions}
        />
      )}
    </div>
    </>
  )
}

export default PackageCard
