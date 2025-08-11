"use client";
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import toast from "react-hot-toast"
import { MapPin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
const CartDetails = () => {
  // 2. Get price after discount
  const getAfterDiscount = (item) => {
    const base = item.originalPrice ?? item.price;
    if (item.discountPercent) return base * (1 - item.discountPercent / 100);
    if (item.discountAmount) return base - item.discountAmount;
    return base;
  };
  const { cart: rawCart, updateCartQty, removeFromCart } = useCart();
  const cart = Array.isArray(rawCart) ? rawCart : [];
  // console.log(cart)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // console.log(cart);

  const router = useRouter();

  // Handler for checkout navigation
  const { data: session } = useSession();

  const handleCheckout = () => {
    if (!termsChecked) return;
    // First, ensure we have the latest cart data
    const currentCart = Array.isArray(rawCart) ? rawCart : [];

    // Collect all relevant cart data for checkout
    const checkoutData = {
      cart: currentCart.map((item) => ({
        ...item,
        // include all important fields
        discountPercent: item.discountPercent || null,
        discountAmount: item.discountAmount || null,
        cgst: item.cgst || 0,
        sgst: item.sgst || 0,
        originalPrice: item.originalPrice ?? item.price,
        afterDiscount: getAfterDiscount(item),
      })),
      subTotal: currentCart.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.qty, 0),
      totalDiscount: currentCart.reduce((sum, item) => {
        const discount = item.discountPercent ?
          (item.originalPrice ?? item.price) * (item.discountPercent / 100) :
          (item.discountAmount || 0);
        return sum + (discount * item.qty);
      }, 0),
      shipping: FinalShipping || 0,
      pincode: pincodeResult?.pincode || null,
      city: pincodeResult?.city || null,
      state: pincodeResult?.state || null,
      district: pincodeResult?.district || null,
      taxTotal: currentCart.reduce((sum, item) => {
        const price = getAfterDiscount(item);
        const tax = ((item.cgst || 0) + (item.sgst || 0)) / 100 * price * item.qty;
        return sum + tax;
      }, 0),
      finalShipping: FinalShipping || 0,
      email: session?.user?.email || null,
      promo: appliedPromoDetails
        ? {
          code: appliedPromoDetails.couponCode,
          percent: appliedPromoDetails.percent || null,
          amount: appliedPromoDetails.amount || null,
          discount: promoDiscount,
        }
        : null,
      cartTotal: currentCart.reduce((sum, item) => {
        const price = getAfterDiscount(item);
        const tax = ((item.cgst || 0) + (item.sgst || 0)) / 100 * price;
        return sum + (price + tax) * item.qty;
      }, 0) + (FinalShipping || 0) - (promoDiscount || 0),
    };

    // Save to localStorage before navigation
    localStorage.setItem("checkoutCart", JSON.stringify(checkoutData));

    // Redirect to checkout
    router.push("/checkout");
  };

  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const [termsChecked, setTermsChecked] = React.useState(false);
  // Calculate total cart weight in grams
  // Calculate total cart weight in grams (weight is number from DB)
  const totalWeight = cart.reduce((sum, item) => sum + ((typeof item.weight === "number" ? item.weight : 0) * item.qty), 0);


  const [pincode, setPincode] = React.useState("");
  const [pincodeResult, setPincodeResult] = React.useState(null);
  const [pincodeError, setPincodeError] = React.useState("");
  const [isCheckingPincode, setIsCheckingPincode] = React.useState(false);
  const [appliedPromo, setAppliedPromo] = React.useState(null); // to track applied promo
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAfterDiscount = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + getAfterDiscount(item) * item.qty, 0)
    : 0;

  const [isPincodeModalOpen, setIsPincodeModalOpen] = React.useState(false);
  const [isPincodeConfirmModalOpen, setIsPincodeConfirmModalOpen] =
    React.useState(false);
  const [stateInput, setStateInput] = React.useState("");
  const [districtInput, setDistrictInput] = React.useState("");
  // const [cityInput, setCityInput] = React.useState("");
  const [pincodeInput, setPincodeInput] = React.useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [FinalShipping, setFinalShipping] = useState(0);
  const [shippingTierLabel, setShippingTierLabel] = useState("");
  const [shippingPerUnit, setShippingPerUnit] = useState(null);
  const [statesList, setStatesList] = useState([]);

  // Restore delivery location from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('deliveryLocation');
    if (saved) {
      const loc = JSON.parse(saved);
      setPincodeInput(loc.pincode);
      setPincodeResult(loc);
    }
  }, []);

  useEffect(() => {
    const fetchShippingCharge = async () => {
      if (totalWeight === 0) {
        setFinalShipping(0);
        setShippingTierLabel("");
        setShippingPerUnit(null);
        return;
      }
      setLoadingShipping(true);
      try {
        const res = await fetch('/api/checkShipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: totalWeight }),
        });
        const data = await res.json();
        if (data.available && data.shippingCharge != null) {
          setFinalShipping(Number(data.shippingCharge));
          setShippingTierLabel(data.tierLabel || "");
          setShippingPerUnit(data.perUnitCharge || null);
        } else {
          setFinalShipping(0);
          setShippingTierLabel("");
          setShippingPerUnit(null);
        }
      } catch (e) {
        setFinalShipping(0);
        setShippingTierLabel("");
        setShippingPerUnit(null);
      }
      setLoadingShipping(false);
    };
    fetchShippingCharge();
  }, [cart, totalWeight]);

  useEffect(() => {
    // Fetch states/districts from API on mount
    const fetchStates = async () => {
      try {
        const res = await fetch('/api/zipcode');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setStatesList(data.data);
        }
      } catch (e) {
        setStatesList([]);
      }
    };

    fetchStates();
  }, []);

  const handleApplyPincode = () => {
    setIsPincodeConfirmModalOpen(false);
    // The pincodeResult is already set, so shipping charges will be updated
  };
  // Coupon apply handler
  const handleApplyPromo = async () => {
    // Defensive: ensure cart is defined and is an array
    if (!Array.isArray(cart)) {
      setPromoError("Cart is not loaded. Please refresh the page.");
      return;
    }
    setPromoError("");

    // If any cart item has a discount or coupon, block promo code
    const hasDiscountedItem = cart.some(
      (item) =>
        item.discountPercent || item.discountAmount || item.couponApplied
    );
    if (hasDiscountedItem) {
      setPromoError(
        "A product-level discount or coupon is already applied. Promo code cannot be used."
      );
      return;
    }

    if (!promoCode) {
      setPromoError("Please enter a promo code.");
      return;
    }

    if (appliedPromo) {
      setPromoError(`Promo code "${appliedPromo}" is already applied.`);
      return;
    }
    const totalAfterDiscount = Array.isArray(cart)
      ? cart.reduce((sum, item) => sum + getAfterDiscount(item) * item.qty, 0)
      : 0;

    // Calculate cart total (before promo)
    const cartTotalBeforePromo = totalAfterDiscount + taxTotal + finalShipping;

    try {
      const res = await fetch("/api/validatePromo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode, cartTotal: cartTotalBeforePromo }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }
      // Check if discount is not greater than cart total (should be handled by API, but double check)
      if (data.discount >= cartTotalBeforePromo) {
        setPromoError("Discount cannot exceed or equal cart total.");
        return;
      }
      setAppliedPromo(promoCode);
      setAppliedPromoDetails(data.coupon); // store full coupon details
      localStorage.setItem("appliedPromoCode", promoCode); // store for checkout
      localStorage.setItem("appliedPromoDetails", JSON.stringify(data.coupon));
      setPromoCode(""); // clear input
    } catch (err) {
      setPromoError("Failed to validate promo code. Please try again.");
    }
  };

  const getDiscount = (item) => {
    if (item.discountPercent) return `${item.discountPercent}%`;
    if (item.discountAmount) return `${item.discountAmount} Rs`;
    return "-";
  };
  // Promo discount logic
  const [appliedPromoDetails, setAppliedPromoDetails] = React.useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("appliedPromoDetails");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const getAmount = (item) => {
    const afterDiscount = getAfterDiscount(item);
    const cgstPercent = Number(item.cgst) || 0;
    const sgstPercent = Number(item.sgst) || 0;

    const cgstAmount = (afterDiscount * cgstPercent) / 100;
    const sgstAmount = (afterDiscount * sgstPercent) / 100;

    const totalPerItem = afterDiscount + cgstAmount + sgstAmount;
    return totalPerItem * item.qty;
  };

  // 5. For entire cart
  const subTotal = Array.isArray(cart)
    ? cart.reduce(
      (sum, item) => sum + (item.originalPrice ?? item.price) * item.qty,
      0
    )
    : 0;
  const totalDiscount = Array.isArray(cart)
    ? cart.reduce(
      (sum, item) =>
        sum +
        (item.discountPercent
          ? (item.originalPrice ?? item.price) * (item.discountPercent / 100)
          : item.discountAmount || 0) *
        item.qty,
      0
    )
    : 0;

  const finalShipping = pincodeResult?.price || FinalShipping || 0;

  // Remove promo if a discounted/coupon item is present
  const hasDiscountedItem = cart.some(
    (item) => item.discountPercent || item.discountAmount || item.couponApplied
  );
  React.useEffect(() => {
    if (hasDiscountedItem && (appliedPromo || appliedPromoDetails)) {
      setAppliedPromo(null);
      setAppliedPromoDetails(null);
      localStorage.removeItem("appliedPromoCode");
      localStorage.removeItem("appliedPromoDetails");
    }
  }, [cart]);

  let promoDiscount = 0;
  if (appliedPromoDetails && !hasDiscountedItem) {
    if (appliedPromoDetails.percent) {
      promoDiscount = Math.round(
        (totalAfterDiscount + taxTotal + finalShipping) *
        (appliedPromoDetails.percent / 100)
      );
    } else if (appliedPromoDetails.amount) {
      promoDiscount = appliedPromoDetails.amount;
    }
    // Ensure discount doesn't exceed total
    const maxDiscount = totalAfterDiscount + taxTotal + finalShipping;
    if (promoDiscount > maxDiscount) promoDiscount = maxDiscount;
  }
  const taxTotal = cart.reduce(
    (sum, item) =>
      sum +
      ((getAfterDiscount(item) *
        ((Number(item.cgst) || 0) + (Number(item.sgst) || 0))) /
        100) *
      item.qty,
    0
  );
  const finalAmount = totalAfterDiscount + taxTotal + FinalShipping - (promoDiscount || 0);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  // UI
  return (
    <div className="w-full md:px-5 mx-auto p-2 md:p-4 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Add To Cart</h2>
        {/* <Link href="/shop" className="text-green-700 font-semibold text-sm">Continuew Shopping &gt;&gt;</Link> */}
      </div>
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Link href="/" className="text-green-700 font-semibold text-sm">Continue Shopping &gt;&gt;</Link>
          Your cart is empty.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Product Table */}
          <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full border-collapse rounded overflow-hidden shadow text-xs md:text-base">
                <thead>
                  <tr className="bg-blue-200 text-black text-sm">
                    <th className="border p-2">Image</th>
                    <th className="border p-2">Name / Code</th>
                    <th className="border p-2">Base Price</th>
                    <th className="border p-2">Discount</th>
                    <th className="border p-2">After Discount</th>
                    <th className="border p-2">Weight (Kg)</th>
                    <th className="border p-2">CGST %</th>
                    <th className="border p-2">SGST %</th>
                    <th className="border p-2">Qty</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-orange-100" : "bg-gray-100"}>
                      <td className="border p-2 text-center">
                        <img src={item.image?.url || item.image} alt={item.name} className="w-20 h-20 rounded object-cover mx-auto" />
                      </td>
                      <td className="border p-2 text-center">
                        <div className="font-bold text-base leading-tight">{item.name}</div>
                        <div className="italic text-base text-black">{item.productCode || "N/A"}</div>
                      </td>
                      <td className="border p-2 text-center">₹{item.originalPrice ?? item.price}</td>
                      <td className="border p-2 text-center">{getDiscount(item)}</td>
                      <td className="border p-2 text-center">₹{getAfterDiscount(item)}</td>
                      <td className="border p-2 text-center">
                        {item.weight !== undefined && item.weight !== null 
                          ? Number(item.weight).toLocaleString() 
                          : '0.000'} kg
                      </td>
                      <td className="border p-2 text-center">₹{(item.price * item.cgst / 100).toFixed(2)}</td>
                      <td className="border p-2 text-center">₹{(item.price * item.sgst / 100).toFixed(2)}</td>
                      <td className="border p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateCartQty(item.id, Math.max(1, item.qty - 1))} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center">-</button>
                          <span className="w-7 text-center font-semibold">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, item.qty + 1)} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center">+</button>
                        </div>
                      </td>
                      <td className="border p-2 text-center font-bold">₹{getAmount(item)}</td>
                      <td className="border p-2 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 text-xl flex items-center justify-center" title="Remove">
                          &#10006;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden flex">
              <div className="w-full border-collapse rounded overflow-hidden shadow text-xs md:text-base">
                  <div className="md:hidden flex flex-col gap-4">
                    {cart.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-2 gap-2 p-2 rounded shadow ${idx % 2 === 0 ? "bg-orange-100" : "bg-gray-100"
                          }`}
                      >
                        {/* Left Column: Image + Quantity */}
                        <div className="flex flex-col items-center justify-center gap-2">
                          <img
                            src={item.image?.url || item.image}
                            alt={item.name}
                            className="w-32 h-32 object-contain rounded"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQty(item.id, Math.max(1, item.qty - 1))}
                              className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-semibold">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, item.qty + 1)}
                              className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Right Column: Product Info */}
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-semibold">Name:</span> {item.name}
                          </div>
                          <div>
                            <span className="font-semibold">Code:</span> {item.productCode || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Base Price:</span> ₹{item.originalPrice ?? item.price}
                          </div>
                          <div>
                            <span className="font-semibold">Discount:</span> {getDiscount(item)}
                          </div>
                          <div>
                            <span className="font-semibold">After Discount:</span> ₹{getAfterDiscount(item)}
                          </div>
                          <div>
                            <span className="font-semibold">Weight:</span> {item.weight ?? 0}g
                          </div>
                          <div>
                            <span className="font-semibold">CGST:</span> ₹{(item.price * item.cgst / 100).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-semibold">SGST:</span> ₹{(item.price * item.sgst / 100).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-semibold">Total:</span> ₹{getAmount(item)}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mt-2 bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>


          </div>


          {/* Right: Order Summary Card */}
          <div className="w-full md:w-1/2 flex flex-col gap-2 mt-8 md:mt-0">
            <div className="border border-gray-300 rounded-lg shadow p-6 bg-white">
              {/* Subtotal */}
              <div className="flex justify-between items-center mb-0">
                <span className="font-semibold text-base">
                  Subtotal{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (INR)
                  </span>
                </span>
                <span className="font-semibold text-base">
                  {subTotal.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-red-600 mb-2 -mt-1">
                Subtotal does not include applicable taxes
              </div>

              {/* Discount Amount */}
              <div className="flex justify-between items-center mt-2 mb-1">
                <span className="font-bold text-base">Discount Amount</span>
                <span className="font-bold text-base">
                  ₹{Math.max(0, totalDiscount).toFixed(2)}
                </span>
              </div>
              {appliedPromoDetails && (
                <div className="flex justify-between items-center mb-1 text-green-700">
                  <span className="font-bold text-base">
                    Promo Code ({appliedPromoDetails.couponCode})
                  </span>
                  <span className="font-bold text-base">
                    -₹{promoDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <hr className="my-2" />

              {/* Promo Code Section */}
              <div className="text-center font-semibold text-lg mb-2">
                Have a promo code?
              </div>
              {appliedPromo && (
                <div className="text-green-700 text-xs mt-1">
                  Promo code "{appliedPromo}" applied successfully!
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Apply Promo Code"
                  className="w-full border border-blue-400 bg-blue-100 px-3 py-2 rounded text-gray-700"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError("");
                  }}
                  disabled={!!appliedPromo}
                />

                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                  onClick={handleApplyPromo}
                  disabled={!promoCode || !!appliedPromo}
                >
                  Apply
                </button>
              </div>


              {/* Note about coupons */}
              <div className="text-xs text-red-600 mb-2">
                Note : If discount promo code already applied extra additional
                coupon not applicable
              </div>
              {/* Nice! You saved... */}
              {totalDiscount > 0 && (
                <div className="bg-gray-100 rounded px-2 py-1 text-center text-sm font-semibold text-black mb-2">
                  🎉 Nice! You saved{" "}
                  <span className="font-bold">₹{totalDiscount.toFixed(2)}</span>{" "}
                  on your order.
                </div>
              )}
              {promoError && (
                <div className="text-xs text-red-600 mt-1">{promoError}</div>
              )}
              {/* Shipping Charges */}
              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold">
                  Shipping Charges{shippingTierLabel ? ` (${shippingTierLabel})` : ''}
                </span>
                <span className="font-semibold">
                  ₹{FinalShipping.toFixed(2)}
                </span>
              </div>
              {/* Pincode check UI */}
              <div className="">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-medium flex items-center gap-1">
                    <MapPin size={18} className="inline-block" />
                    Delivery Options
                  </span>
                </div>
                {!pincodeResult ? (
                  <div className="border rounded px-4 py-3 flex items-center gap-2 bg-white max-w-xs">
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none text-gray-700"
                      placeholder="Enter pincode"
                      value={pincodeInput}
                      onChange={e => setPincodeInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                    <button
                      className="text-blue-900 font-semibold ml-2"
                      disabled={loadingShipping || pincodeInput.length !== 6}
                      onClick={async () => {
                        setPincodeError('');
                        setLoadingShipping(true);
                        setPincodeResult(null);
                        try {
                          const res = await fetch('/api/zipcode/checkZip', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pincode: pincodeInput }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setPincodeResult(data);
                            setPincodeError("");
                            // Persist delivery location to localStorage
                            localStorage.setItem('deliveryLocation', JSON.stringify({
                              pincode: data.pincode,
                              city: data.city,
                              state: data.state,
                              district: data.district
                            }));
                            setIsPincodeModalOpen(false);
                            setIsPincodeConfirmModalOpen(true);
                          } else {
                            setPincodeError(data.message || 'Delivery not available');
                          }
                        } catch {
                          setPincodeError('Server error. Please try again.');
                        } finally {
                          setLoadingShipping(false);
                        }
                      }}
                    >
                      {loadingShipping ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                ) : (
                  <div className="border rounded px-4 py-3 bg-white w-fit">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="inline-block" />
                      <span className="font-semibold">Delivery options for {pincodeResult.pincode}</span>
                      <button
                        className="ml-auto px-2 py-1 border rounded border-black text-sm"
                        onClick={() => {
                          setPincodeInput('');
                          setPincodeResult(null);
                        }}
                      >
                        Change
                      </button>
                    </div>
                    <div className="mb-1 text-sm">
                      Shipping to: <span className="font-semibold">{pincodeResult.city || pincodeResult.district}, {pincodeResult.state}, India</span>
                    </div>
                  </div>
                )}
                {pincodeError && (
                  <div className="text-red-600 text-xs mt-1">
                    {pincodeError}
                  </div>
                )}
              </div>

              {/* PIN Code Confirmation Modal */}
              <Dialog
                open={isPincodeConfirmModalOpen}
                onOpenChange={setIsPincodeConfirmModalOpen}
              >
                <DialogContent className="bg-white rounded-lg max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                      Yes, we've confirmed!
                    </DialogTitle>
                  </DialogHeader>

                  <div className="mt-4 space-y-4">
                    <p className="text-center">
                      Your area PIN code is available for shipping.
                      <br />
                      You can proceed with your order, and we'll
                      <br />
                      ensure a smooth and timely delivery.
                    </p>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-right font-semibold">State</div>
                      <div className="col-span-2 border-b border-gray-300">
                        {pincodeResult?.state}
                      </div>

                      <div className="text-right font-semibold">Distt.</div>
                      <div className="col-span-2 border-b border-gray-300">
                        {pincodeResult?.district}
                      </div>

                      <div className="text-right font-semibold">PIN Code</div>
                      <div className="col-span-2 border-b border-gray-300">
                        {pincodeResult?.pincode}
                      </div>
                    </div>

                    <button
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md transition-colors"
                      onClick={handleApplyPincode}
                    >
                      Apply Now
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Total CGST/SGST */}
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Total CGST ({cart[0]?.cgst || 0}%)</span>
                <span className="text-gray-900 font-medium">₹{cart.reduce((total, item) => total + (item.price * item.cgst / 100 * item.qty), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Total SGST ({cart[0]?.sgst || 0}%)</span>
                <span className="text-gray-900 font-medium">₹{cart.reduce((total, item) => total + (item.price * item.sgst / 100 * item.qty), 0).toFixed(2)}</span>
              </div>
              <hr className="my-2" />

              {/* Final Amount */}
              <div className="flex justify-between items-center font-bold text-lg mb-2">
                <span>Final Amount</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>

              {/* Terms and Pay Button */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="accent-black"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                />
                <label htmlFor="terms" className="text-xs">
                  I have read and agree to the website terms and conditions
                </label>
              </div>
              <button
                className="w-full py-3 bg-orange-500 text-white font-bold text-base hover:bg-orange-600 mb-2"
                disabled={!termsChecked || !pincodeResult}
                onClick={() => {
                  if (!pincodeResult) {
                    toast.error('Please check your pincode before proceeding.');
                    return;
                  }
                  handleCheckout();
                }}
              >
                Continue
              </button>

              {/* Secure Payment and Card Icons */}
              <div className="flex flex-col items-center gap-1 my-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Secure Payment
                  </span>
                  <img
                    src="/visa-img.png"
                    alt="Visa"
                    className="w-8 h-6 object-contain"
                  />
                  <img
                    src="/master-card.png"
                    alt="Mastercard"
                    className="w-8 h-6 object-contain"
                  />
                  {/* <img src="/amex.png" alt="Amex" className="w-8 h-6 object-contain" /> */}
                  <img
                    src="/rupay.png"
                    alt="Rupay"
                    className="w-8 h-6 object-contain"
                  />
                  <img
                    src="/upi.png"
                    alt="UPI"
                    className="w-8 h-6 object-contain"
                  />
                </div>
                <div className="text-xs text-gray-700">
                  We also accept Indian Debit Cards, UPI and Netbanking.
                </div>
              </div>

              {/* Continue Shopping Button */}
              <button
                className="w-full py-3 bg-green-700 text-white font-bold text-base hover:bg-green-800 my-2"
                onClick={() => (window.location.href = "/")}
              >
                Continue Shopping
              </button>

              {/* Info Footer */}
              <div className="text-xs text-gray-700 mt-4 text-center">
                Your personal data will be used to process your order, support
                your experience throughout this website, and for other purposes
                described in our privacy policy.
              </div>
            </div>
            <div className="flex flex-col items-center mt-3">
              <div className="flex items-center gap-1 text-gray-800 text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-4m0 0V8m0 4h4m-4 0H8"
                  />
                </svg>
                <span className="font-semibold">Quality You Can Trust</span>
              </div>
              <div className="text-xs text-gray-600 mt-1 max-w-xs text-center">
                Your Rishikesh Handmade Guides are available 24/7/365 to answer
                your question and help you better understand your purchase.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDetails;
