"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Share2, Ruler, Mail, Star, MapPin, InfoIcon, X, Loader2 } from "lucide-react"
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import VisuallyHidden from '@/components/VisuallyHidden';
import Autoplay from "embla-carousel-autoplay";
export default function ProductDetailView({ product }) {
  // console.log(product);
  // --- Ask An Expert Modal State ---
  const [showExpertModal, setShowExpertModal] = useState(false);
  // Artisan Modal State
  const [showArtisanModal, setShowArtisanModal] = useState(false);
  const [expertForm, setExpertForm] = useState({
    name: '',
    email: '',
    phone: '',
    need: 'Appointment',
    question: '',
    contactMethod: 'Phone',
  });
  const handleExpertInputChange = (e) => {
    const { name, value, type } = e.target;
    setExpertForm((prev) => ({
      ...prev,
      [name]: type === 'radio' ? value : value,
    }));
  };
  const handleExpertSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...expertForm,
        type: 'product',
        productId: product._id,
        queryName: product.title || ''
      };
      const res = await fetch('/api/askExpertsEnquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit your question.');
        return;
      }
      setShowExpertModal(false);
      setExpertForm({
        name: '',
        email: '',
        phone: '',
        need: 'Appointment',
        question: '',
        contactMethod: 'Phone',
      });
      toast.success('Your question has been submitted!');
    } catch (err) {
      toast.error('Failed to submit your question.');
    }
  };


  const router = useRouter();
  const [showShareBox, setShowShareBox] = React.useState(false);
  const [productUrl, setProductUrl] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined" && product && product.slug) {
      setProductUrl(window.location.origin + "/product/" + product.slug);
    } else if (product && product.slug) {
      setProductUrl("/product/" + product.slug);
    }
  }, [product]);

  // Close share box when clicking outside
  React.useEffect(() => {
    if (!showShareBox) return;
    function handleClick(e) {
      const pop = document.getElementById("share-popover");
      if (pop && !pop.contains(e.target)) {
        setShowShareBox(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showShareBox]);

  // console.log(product)
  const [selectedImage, setSelectedImage] = React.useState(product?.gallery?.mainImage?.url || []);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [showSizeChart, setShowSizeChart] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState(null);
  const [selectedWeight, setSelectedWeight] = React.useState(null);
  const [selectedColor, setSelectedColor] = React.useState(null);
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const desc = product.description?.overview || "No Description";
  const words = desc.split(' ');
  const [shippingTierLabel, setShippingTierLabel] = useState("");
  const [FinalShipping, setFinalShipping] = useState(0);
  const [pincodeResult, setPincodeResult] = React.useState(null);
  const [pincodeError, setPincodeError] = React.useState("");
  const [stateInput, setStateInput] = React.useState("");
  const [districtInput, setDistrictInput] = React.useState("");
  const [statesList, setStatesList] = useState([]);
  const [pincodeInput, setPincodeInput] = React.useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingPerUnit, setShippingPerUnit] = useState(null);

  // Restore delivery location from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('deliveryLocation');
    if (saved) {
      const loc = JSON.parse(saved);
      setPincodeInput(loc.pincode);
      setPincodeResult(loc);
    }
  }, []);

  // Extract variants
  const variants = Array.isArray(product?.quantity?.variants) ? product.quantity.variants : [];
  // console.log(product?.quantity?.variants);

  // Get all unique sizes and colors from variants
  const availableSizes = [...new Set(variants.map(v => v.size))];
  const allColors = [...new Set(variants.map(v => v.color))];

  // Find the selected variant
  const selectedVariant = variants.find(v => {
    return (
      (selectedSize ? v.size === selectedSize : true) &&
      (selectedWeight ? v.weight === selectedWeight : true) &&
      (selectedColor ? v.color === selectedColor : true)
    );
  });
  // console.log(selectedVariant?.price);

  // Set default selection on mount or when variants change
  React.useEffect(() => {
    if (variants.length && !selectedSize && !selectedColor) {
      setSelectedSize(variants[0].size);
      setSelectedWeight(variants[0].weight);
      setSelectedColor(variants[0].color);
      // Set initial variant images
      setVariantImages(getVariantImages(variants[0]));
    }
  }, [variants]);

  // Cap quantity to available stock
  React.useEffect(() => {
    if (selectedVariant && quantity > selectedVariant.qty) {
      setQuantity(selectedVariant.qty);
    }
  }, [selectedVariant, quantity]);

  // Initialize discount related variables
  const coupon = product.coupon || product.coupons?.coupon;
  let hasDiscount = false;
  let discountedPrice = selectedVariant ? selectedVariant.price : "No Price";
  let couponText = '';

  // Calculate discount if applicable
  if (selectedVariant) {
    if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
      discountedPrice = selectedVariant.price - (selectedVariant.price * coupon.percent) / 100;
      hasDiscount = true;
      couponText = `${coupon.couponCode || ''} (${coupon.percent}% OFF)`;
    } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
      discountedPrice = selectedVariant.price - coupon.amount;
      hasDiscount = true;
      couponText = `${coupon.couponCode || ''} (₹${coupon.amount} OFF)`;
    } else {
      discountedPrice = selectedVariant.price;
    }
  }
  // Update prices when variant, quantity, or discount changes
  useEffect(() => {
    if (selectedVariant) {
      const currentPrice = hasDiscount ? Math.round(discountedPrice) : selectedVariant.price;
      setBasePrice(currentPrice);
      setTotalPrice(currentPrice * quantity);
    }
  }, [selectedVariant, quantity, hasDiscount, discountedPrice]);

  const formatNumeric = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };
  const price = selectedVariant ? formatNumeric(selectedVariant.price) : 0;
  const total = hasDiscount ? (discountedPrice * quantity).toFixed(2) : (selectedVariant ? (selectedVariant.price * quantity).toFixed(2) : 0);

  const { cart, addToCart, setCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  // Get images from the selected variant or first available variant
  const getVariantImages = (variant) => {
    if (!variant) return ['/placeholder.jpeg'];

    const images = [];

    // Add profile image if exists
    if (variant.profileImage?.url) {
      images.push(variant.profileImage.url);
    }

    // Add all valid sub-images 
    if (Array.isArray(variant.subImages)) {
      variant.subImages.forEach(img => {
        if (img?.url && typeof img.url === 'string' && img.url.trim() !== '') {
          images.push(img.url);
        }
      });
    }
    return images.length > 0 ? images : ['/placeholder.jpeg'];
  };

  // Get images for the selected variant or first variant if none selected
  const [variantImages, setVariantImages] = useState(
    variants.length > 0 ? getVariantImages(variants[0]) : ['/placeholder.jpeg']
  );

  // Debug main image array and index
  // Embla carousel API and active image index for main image gallery
  const [carouselApi, setCarouselApi] = React.useState(null);
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  // Update variant images when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      const images = getVariantImages(selectedVariant);
      setVariantImages(images);

      // Reset carousel to first image when variant changes
      if (carouselApi) {
        carouselApi.scrollTo(0);
      }
    }
  }, [selectedVariant, carouselApi]);

  const allImages = variantImages;
  React.useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      const idx = carouselApi.selectedScrollSnap();
      setActiveImageIdx(idx);
    };
    carouselApi.on('select', onSelect);
    setActiveImageIdx(carouselApi.selectedScrollSnap());
    return () => carouselApi.off('select', onSelect);
  }, [carouselApi]);

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


  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* LEFT: Product Images */}
      <div className="w-full md:w-2/3 flex flex-col items-center">

        {/* Main Image Carousel (QuickView style, embla-controlled) */}
        <div className="w-full flex justify-center mb-4">
          <div className="relative w-full max-w-[800px] h-[420px] md:h-[600px] flex items-center justify-center rounded-xl overflow-hidden">
            <Carousel
              className="w-full h-full pr-4"
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 4000 })]}
              setApi={setCarouselApi}
            >
              <CarouselContent className="h-[420px] md:h-[600px]">
                {allImages.map((img, idx) => (
                  <CarouselItem key={idx} className="flex items-center justify-center h-full">
                    <div className="relative w-full h-[420px] md:h-[600px] flex items-center justify-center"
                    >
                      <Image
                        src={img}
                        alt={`Product image ${idx}`}
                        layout="fill"
                        objectFit="contain"
                        className="w-full h-full object-contain"
                        draggable={false}
                        style={{
                          objectFit: 'contain',
                          width: '100%',
                          height: '100%',
                          transition: 'transform 0.3s',

                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10 " />
              <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
            </Carousel>
          </div>
        </div>
        {/* Sub-Images Carousel (5 per row) */}
        {allImages.length > 1 && (
          <div className="w-full max-w-[300px] md:max-w-[400px] mx-auto px-2">
            <Carousel opts={{ align: 'start', loop: allImages.length > 5 }} className="w-full">
              <CarouselContent>
                {allImages.map((img, idx) => (
                  <CarouselItem key={idx} className="flex justify-center basis-1/5 max-w-[20%] min-w-0">
                    <button
                      className={`rounded-lg border-2 ${activeImageIdx === idx ? 'border-black' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-black`}
                      onClick={() => carouselApi && carouselApi.scrollTo(idx)}
                      style={{ minWidth: 64, minHeight: 64 }}
                    >
                      <Image
                        src={img}
                        alt={`${product.title} thumb ${idx + 1}`}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover w-16 h-16"
                      />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 5 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          </div>
        )}

      </div>
      {/* CENTER: Product Details/Description/Selectors */}
      <div className="w-full lg:w-1/3 max-w-xl mx-auto flex flex-col">
        <div className="flex items-center gap-4 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
        </div>
        {/* Product Code */}
        {product.code && (
          <span className="text-sm text-black my-2 w-fit font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">Code: {product.code}</span>
        )}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold flex items-center">
            {(() => {
              if (Array.isArray(product?.reviews) && product.reviews.length > 0) {
                const avg = product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / product.reviews.length;
                return avg.toFixed(1);
              }
              return "0";
            })()} Rating</span>
          <span className="text-gray-700 text-sm">({product.reviews?.length || 0} customer reviews)</span>
        </div>
        {(() => {

          if (desc === "No Description") {
            return <p className="text-gray-700 mb-4 max-w-lg">No Description</p>;
          }
          if (showFullDesc || words.length <= 20) {
            return (
              <div className="text-gray-700 my-6 text-md max-w-lg">
                <div dangerouslySetInnerHTML={{ __html: desc }} />
                {words.length > 20 && (
                  <>
                    {' '}<button className="text-blue-600 underline ml-2" onClick={() => setShowFullDesc(false)}>Close</button>
                  </>
                )}
              </div>
            );
          }
          return (
            <div className="text-gray-700 my-4 text-sm md:text-md max-w-lg">
              <div dangerouslySetInnerHTML={{ __html: words.slice(0, 20).join(' ') + '...' }} />
              <button className="text-blue-600 underline" onClick={() => setShowFullDesc(true)}>Read more</button>
            </div>
          );
        })()}
        {/* Selectors */}
        {/* Price and Coupon Section */}
        <div className="mb-2 flex items-center gap-2">
          {selectedVariant && selectedVariant.price !== undefined && selectedVariant.price !== null ? (
            hasDiscount ? (
              <div className="flex items-center gap-2 mb-1">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    {selectedVariant.qty <= 0 ? (
                      <span className="text-red-600 text-lg font-medium">Out of Stock</span>
                    ) : (
                      <span className="font-bold text-xl text-black">
                        ₹ {formatNumeric(Math.round(discountedPrice * quantity))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm">
                    <del className="text-gray-600 font-semibold">
                      ₹{formatNumeric(selectedVariant.price * quantity)}
                    </del>
                    <span className="border border-green-500 text-green-700 px-2 py-0.5 rounded text-xs font-semibold bg-green-50 ml-2">
                      Coupon Applied: {couponText}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {selectedVariant.qty <= 0 ? (
                  <span className="text-red-600 text-lg font-medium">Out of Stock</span>
                ) : (
                  <span className="font-bold text-xl text-black">
                    ₹ {formatNumeric(selectedVariant.price * quantity)}
                  </span>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center">
              <span className="text-red-600 font-semibold text-sm">Price Not Available</span>
            </div>
          )}
        </div>

        {/* Stock Status */}
        {/* Quantity */}
        {(() => {
          const currentVariantInStock = selectedVariant?.qty > 0;

          if (currentVariantInStock) {
            return (
              <div className="flex items-center gap-2 my-4">
                <span className="font-bold text-md">Quantity:</span>
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center font-bold text-lg hover:bg-gray-100"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center font-bold text-lg hover:bg-gray-100"
                  onClick={() => setQuantity(q => Math.min(selectedVariant.qty, q + 1))}
                  aria-label="Increase quantity"
                  disabled={!selectedVariant || quantity >= selectedVariant.qty}
                >
                  +
                </button>
              </div>
            );
          } else {
            return (
              <div className="text-sm my-2 text-red-600 font-medium">
                This variant is currently out of stock
              </div>
            );
          }
        })()}
        <div className="flex flex-col gap-4 mb-6">
          {/* Quantity */}
          {product?.quantity?.varients?.[0].qty > 0 && (

            <div className="flex items-center gap-2">
              <span className="font-bold text-md">Quantity:</span>
              <div className="flex items-center gap-1">
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center font-bold text-lg hover:bg-gray-100"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center font-bold text-lg hover:bg-gray-100"
                  onClick={() => setQuantity(q => selectedVariant ? Math.min(selectedVariant.qty, q + 1) : q + 1)}
                  aria-label="Increase quantity"
                  disabled={!selectedVariant || quantity >= (selectedVariant?.qty || 0)}
                >
                  +
                </button>
                {selectedVariant && (
                  <span className="ml-4 font-semibold">
                    Total: ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Size */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-md">Size:</span>
            {availableSizes.map((size, idx) => {
              const variant = variants.find(v => v.size === size);
              const weight = variant?.weight || "N/A"; // fallback if weight is not available

              return (
                <button
                  key={size || idx}
                  className={`relative min-w-24 px-3 py-2 border rounded-xl bg-white text-sm font-medium transition-all duration-150
          ${selectedSize === size ? 'border-black ring-1 ring-black' : 'border-gray-300'}
          hover:bg-gray-100
        `}
                  onClick={() => {
                    setSelectedSize(size);
                    setQuantity(1);
                    // Get all colors for this size
                    const colorsForSize = variants.filter(v => v.size === size).map(v => v.color);
                    const newColor = colorsForSize.includes(selectedColor) ? selectedColor : colorsForSize[0];
                    setSelectedColor(newColor);
                    // Get weight for size+color
                    const weightForSize = variants.find(v => v.size === size && v.color === newColor)?.weight;
                    setSelectedWeight(weightForSize);
                  }}
                  aria-pressed={selectedSize === size}
                  tabIndex={0}
                >
                  <div className="flex justify-between items-center w-full gap-2">
                    <span>{size}</span>
                    <div className="h-4 w-px bg-gray-300" />
                    <span className="text-gray-600 text-md">
                      {weight?.toLocaleString()} kg
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Size Chart Link/Button */}
          <div className="flex gap-4 items-center">
            {product?.size?.sizeChartUrl?.url && (
              <>
                <span
                  className="ml-3 text-black cursor-pointer hover:underline text-base flex items-center gap-2"
                  onClick={() => setShowSizeChart(true)}
                >
                  <Ruler />
                  Size Chart
                </span>
                {/* Modal for Size Chart */}
                {showSizeChart && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSizeChart(false)}>
                    <div className="bg-white rounded-lg p-4 shadow-xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
                      <button
                        className="absolute top-2 right-4 text-2xl font-bold text-gray-500 hover:text-black focus:outline-none"
                        onClick={() => setShowSizeChart(false)}
                        aria-label="Close size chart"
                      >
                        &times;
                      </button>
                      <img src={product?.size?.sizeChartUrl?.url} alt="Size Chart" className="w-full h-auto rounded-lg" />
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Ask An Expert Button */}
            <button
              className="text-black hover:underline w-fit text-base flex items-center gap-2"
              onClick={() => setShowExpertModal(true)}
            >
              <Mail />
              Ask An Expert
            </button>
            {/* Ask An Expert Modal */}
            {showExpertModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in h-[90vh] md:h-fit overflow-y-auto">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-4xl font-bold"
                    onClick={() => setShowExpertModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-bold mb-2 text-center">Ask An Expert</h2>
                  <form onSubmit={handleExpertSubmit} className="flex flex-col gap-4">
                    <div className="text-center text-gray-500 text-sm mb-2">We will follow up with you via email within 24–36 hours</div>
                    <hr className="" />
                    <div className="text-center text-base mb-2">Please answer the following questionnaire</div>
                    <input
                      type="text"
                      name="name"
                      value={expertForm.name}
                      onChange={handleExpertInputChange}
                      placeholder="Your Name"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={expertForm.email}
                      onChange={handleExpertInputChange}
                      placeholder="Email Address"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      type="text"
                      name="phone"
                      value={expertForm.phone}
                      onChange={handleExpertInputChange}
                      placeholder="Phone Number"
                      className="border rounded px-3 py-2"
                      required
                    />
                    <div className="flex flex-row gap-6 items-center mt-2">
                      <span className="text-sm">Do You Need</span>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name="need"
                          value="Appointment"
                          checked={expertForm.need === 'Appointment'}
                          onChange={handleExpertInputChange}
                          required
                        /> Appointment
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name="need"
                          value="Business"
                          checked={expertForm.need === 'Business'}
                          onChange={handleExpertInputChange}
                          required
                        /> Business
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name="need"
                          value="Personal"
                          checked={expertForm.need === 'Personal'}
                          onChange={handleExpertInputChange}
                        /> Personal
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">What Can I Help You With Today?</label>
                      <textarea
                        name="question"
                        value={expertForm.question}
                        onChange={handleExpertInputChange}
                        placeholder="Describe your question or issue"
                        className="border rounded px-3 py-2 w-full h-24 "
                        rows={4}
                        required
                      />
                    </div>
                    <div className="mt-2">
                      <span className="block text-sm mb-1">How Would You Like Me To Contact You?</span>
                      <div className="flex flex-row gap-6">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="Phone"
                            checked={expertForm.contactMethod === 'Phone'}
                            onChange={handleExpertInputChange}
                          /> Phone
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="Email"
                            checked={expertForm.contactMethod === 'Email'}
                            onChange={handleExpertInputChange}
                          /> Email
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="Both"
                            checked={expertForm.contactMethod === 'Both'}
                            onChange={handleExpertInputChange}
                          /> Both
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-black text-white rounded px-6 py-2 font-bold hover:bg-gray-900 transition mt-2"
                    >
                      SEND QUESTION
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-md">Color:</span>
            {allColors.map((color, idx) => {
              // Only enable colors that are available for the selected size
              const enabled = selectedSize ? variants.some(v => v.color === color && v.size === selectedSize) : false;
              return (
                <button
                  key={color || idx}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-150
          ${selectedColor === color ? 'border-black ring-1 ring-black' : ''}
          ${!enabled ? 'border-gray-300 opacity-40 cursor-not-allowed' : 'hover:ring-2 hover:ring-black'}
        `}
                  style={{ background: color, position: 'relative' }}
                  title={color}
                  onClick={() => {
                    if (!enabled) return;
                    setSelectedColor(color);
                    setQuantity(1);
                  }}
                  aria-disabled={!enabled}
                  tabIndex={enabled ? 0 : -1}
                >
                  {(!enabled) && (
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
                      <line x1="5" y1="35" x2="35" y2="5" stroke="#e57373" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {/* Pincode check UI */}
          <div className="">
            <div className="flex items-center gap-2 my-2">
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
                      // You may want to auto-detect state/district from another API if needed.
                      // Here, we assume checkZip API can find from just pincode.
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
                  {loadingShipping ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin mr-2" />
                      Checking...
                    </span>
                  ) : (
                    'Check'
                  )}

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
              <div className="text-red-600 text-xs mt-1">{pincodeError}</div>
            )}
          </div>
          {/* Tags, etc. */}
          {product.categoryTag && (
            <div className="mb-4">
              <div className="text-sm mb-1">
                <span className="block font-semibold text-lg mb-2">Category:</span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  {Array.isArray(product.categoryTag?.tags) && product.categoryTag.tags.length > 0 ? (
                    product.categoryTag.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No categories</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="py-2">
          {product.pdf > 0 && (

            <button
              className="bg-black text-white py-3 px-8 font-semibold hover:bg-gray-800 w-full"
              onClick={() => setShowPdfModal(true)}
            >
              Get Package PDF
            </button>
          )}

          <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
            <DialogContent className="max-w-lg">
              <DialogTitle>Package PDFs</DialogTitle>
              {Array.isArray(product.pdfs) && product.pdfs.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {product.pdfs.map((pdf, idx) => (
                    <div key={pdf._id || pdf.key || idx} className="flex items-center justify-between py-2 gap-2">
                      <span className="font-medium text-gray-800">{pdf.name}</span>
                      <div className="flex gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-semibold"
                          onClick={() => setPdfPreviewUrl(pdf.url)}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}

                  <Dialog open={!!pdfPreviewUrl} onOpenChange={() => setPdfPreviewUrl(null)}>
                    <DialogContent className="md:max-w-2xl">
                      <DialogTitle>PDF Preview</DialogTitle>
                      {pdfPreviewUrl && (
                        <iframe
                          className="h-[500px]"
                          src={pdfPreviewUrl}
                          width="100%"
                          height="600px"
                          style={{ border: '1px solid #ccc', borderRadius: 8 }}
                          title="Package PDF Preview"
                        />
                      )}
                      <DialogFooter>
                        <DialogClose asChild>
                          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Close</button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-gray-500 py-4">No PDFs available for this package.</div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">Close</button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          <div className="flex gap-4 mb-6 items-center py-2">
            {(() => {
              const hasAnyVariantInStock = product?.quantity?.variants?.some(v => v.qty > 0) ||
                product?.quantity?.varients?.some(v => v.qty > 0);
              const currentVariantInStock = selectedVariant?.qty > 0;

              if (hasAnyVariantInStock) {
                return (
                  <button
                    className={`bg-black text-white py-3 px-8 font-semibold hover:bg-gray-800 w-full ${!currentVariantInStock ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    onClick={() => {
                      if (!selectedVariant) {
                        toast.error("Please select a variant");
                        return;
                      }
                      if (!currentVariantInStock) {
                        toast.error("Selected variant is out of stock");
                        return;
                      }
                      addToCart({
                        id: product._id,
                        name: product.title,
                        image: typeof selectedImage === "string" ? selectedImage : selectedImage?.url || product.gallery?.mainImage?.url || '/placeholder.jpeg',
                        price: basePrice, // Use the base price (price per unit)
                        originalPrice: selectedVariant.price,
                        couponApplied: hasDiscount,
                        couponCode: coupon ? coupon.couponCode : '',
                        size: selectedSize,
                        weight: selectedWeight, // Convert grams to kg for cart
                        color: selectedColor,
                        qty: quantity, // This will be used to calculate the total in the cart
                        productCode: product.code || product.productCode || '',
                        discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
                        discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
                        cgst: (product.taxes && product.taxes.cgst) || product.cgst || (product.tax && product.tax.cgst) || 0,
                        sgst: (product.taxes && product.taxes.sgst) || product.sgst || (product.tax && product.tax.sgst) || 0,
                        igst: (product.taxes && product.taxes.igst) || product.igst || (product.tax && product.tax.igst) || 0,
                        totalQuantity: selectedVariant.qty || 0,
                      });
                      toast.success("Added to cart!");
                    }}
                  >
                    {currentVariantInStock ? 'ADD TO CART' : 'SELECT AVAILABLE VARIANT'}
                  </button>
                );
              } else {
                return (
                  <div className="w-full py-3 px-4 bg-gray-300 text-gray-600 font-medium text-center rounded-lg cursor-not-allowed">
                    OUT OF STOCK
                  </div>
                );
              }
            })()}

            <button
              className={`p-2 rounded-full border hover:bg-gray-50 ${wishlist && wishlist.some(i => i.id === product._id) ? "bg-pink-600 border-pink-600" : ""}`}
              onClick={() => {
                if (!selectedVariant) return;
                if (wishlist && wishlist.some(i => i.id === product._id)) {
                  removeFromWishlist(product._id);
                  toast.success("Removed from wishlist!");
                } else {
                  addToWishlist({
                    id: product._id,
                    name: product.title,
                    image: typeof selectedImage === "string" ? selectedImage : selectedImage?.url || product.gallery?.mainImage?.url || '/placeholder.png',
                    price: hasDiscount ? Math.round(discountedPrice) : selectedVariant.price,
                    originalPrice: selectedVariant.price,
                    couponApplied: hasDiscount,
                    couponCode: coupon ? coupon.couponCode : '',
                    size: selectedSize,
                    weight: selectedWeight, // Convert grams to kg for cart
                    color: selectedColor,
                    qty: 1,
                    productCode: product.code || product.productCode || '',
                    discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
                    discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
                    cgst: (product.taxes && product.taxes.cgst) || product.cgst || (product.tax && product.tax.cgst) || 0,
                    sgst: (product.taxes && product.taxes.sgst) || product.sgst || (product.tax && product.tax.sgst) || 0,
                    igst: (product.taxes && product.taxes.igst) || product.igst || (product.tax && product.tax.igst) || 0,
                    totalQuantity: selectedVariant.qty || 0,
                  });
                  toast.success("Added to wishlist!");
                }
              }}
            >
              <Heart className={wishlist && wishlist.some(i => i.id === product._id) ? "text-white" : "text-pink-600"} />
            </button>

            <div className="relative">
              <button
                className="p-2 rounded-full border hover:bg-gray-50"
                onClick={() => setShowShareBox((prev) => !prev)}
                aria-label="Share Product"
                type="button"
              >
                <Share2 />
              </button>
              {showShareBox && (
                <div id="share-popover" className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base">Share Product</span>
                    <button className="text-gray-400 hover:text-black text-xl" onClick={() => setShowShareBox(false)} aria-label="Close share box">&times;</button>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-700">Share via...</span>
                    <div className="flex gap-4 mt-2">
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#3b5998] hover:bg-[#334f88] rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                        title="Share on Facebook"
                      >
                        <svg width="26" height="26" fill="white" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24h11.495v-9.294H9.691V11.01h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.31h3.587l-.467 3.696h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0" /></svg>
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(productUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#1da851] rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                        title="Share on WhatsApp"
                      >
                        <svg width="26" height="26" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.207-.242-.58-.487-.501-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.366.709.306 1.262.489 1.694.626.712.227 1.36.195 1.87.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.646-.235-.374a9.86 9.86 0 0 1-1.51-5.204c.001-5.455 4.436-9.89 9.892-9.89 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.896 6.991c-.003 5.456-4.437 9.891-9.892 9.891m8.413-18.304A11.815 11.815 0 0 0 12.05.001C5.495.001.06 5.436.058 11.992c0 2.115.553 4.178 1.602 5.993L.057 24l6.184-1.646a11.94 11.94 0 0 0 5.809 1.479h.005c6.555 0 11.892-5.437 11.893-11.994a11.86 11.86 0 0 0-3.487-8.413" /></svg>
                      </a>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 mt-2">Or copy link</span>
                  <div className="flex gap-2 mt-1">
                    <input
                      id="share-url"
                      type="text"
                      className="border rounded px-2 py-1 flex-1 text-sm bg-[#f5f6fa]"
                      value={productUrl}
                      readOnly
                    />
                    <button
                      className="bg-[#6c47ff] text-white px-4 py-1.5 rounded font-semibold text-sm hover:bg-[#4f2eb8]"
                      onClick={() => {
                        navigator.clipboard.writeText(productUrl);
                        toast.success('Copied to clipboard!');
                      }}
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            className={`border border-black py-3 font-semibold w-full ${selectedVariant?.qty > 0
              ? 'hover:bg-gray-100'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            onClick={async () => {
              if (!selectedVariant) return;
              // Block if pincode is not entered
              if (!pincodeInput) {
                toast.error('Please enter your pincode before proceeding.');
                return;
              }
              try {
                // Prepare the buy-now product
                const price = selectedVariant.price;
                const couponObj = coupon || (product.coupons && product.coupons.coupon);
                let discountedPrice = price;
                let couponApplied = false;
                let couponCode = "";
                if (couponObj && typeof couponObj.percent === 'number' && couponObj.percent > 0) {
                  discountedPrice = price - (price * couponObj.percent) / 100;
                  couponApplied = true;
                  couponCode = couponObj.couponCode;
                } else if (couponObj && typeof couponObj.amount === 'number' && couponObj.amount > 0) {
                  discountedPrice = price - couponObj.amount;
                  couponApplied = true;
                  couponCode = couponObj.couponCode;
                }
                const totalWeight = (selectedVariant?.weight || 0) * quantity; // Convert grams to kg for shipping calculation
                // console.log(totalWeight);
                // Fetch shipping charge from API before proceeding
                let shippingCharge = 0;
                let shippingTierLabel = '';
                let shippingPerUnit = null;
                try {
                  const res = await fetch('/api/checkShipping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weight: totalWeight })
                  });
                  const data = await res.json();
                  // console.log(data);
                  if (data.available && data.shippingCharge != null) {
                    // CartDetails logic: use per-unit for extra weight
                    shippingCharge = Number(data.shippingCharge);
                    shippingTierLabel = data.tierLabel || '';
                    shippingPerUnit = data.perUnitCharge || null;
                    // If per-unit charge is present and totalWeight > 1kg, add extra per-unit
                    if (shippingPerUnit && totalWeight > 1) {
                      // Example: base charge for 1kg, add per-unit for each extra kg (ceil)
                      const extraUnits = Math.ceil(totalWeight) - 1;
                      shippingCharge += extraUnits * Number(shippingPerUnit);
                    }
                    setFinalShipping(shippingCharge);
                    setShippingTierLabel(shippingTierLabel);
                    setShippingPerUnit(shippingPerUnit);
                  } else {
                    setFinalShipping(0);
                    setShippingTierLabel("");
                    setShippingPerUnit(null);
                    toast.error('Shipping not available to this pincode or failed to fetch shipping charge.');
                    return;
                  }
                } catch (err) {
                  setFinalShipping(0);
                  setShippingTierLabel("");
                  setShippingPerUnit(null);
                  toast.error('Failed to fetch shipping charge.');
                  return;
                }

                const buyNowProduct = {
                  id: product._id,
                  name: product.title,
                  image: selectedImage || product.gallery?.mainImage?.url || '/placeholder.jpeg',
                  price: Math.round(discountedPrice),
                  size: selectedSize,
                  weight: selectedWeight, // Convert grams to kg for cart
                  color: selectedColor,
                  originalPrice: price,
                  qty: quantity,
                  totalWeight,
                  couponApplied,
                  finalShipping: FinalShipping,
                  pincode: pincodeResult?.pincode || null,
                  city: pincodeResult?.city || null,
                  state: pincodeResult?.state || null,
                  district: pincodeResult?.district || null,
                  couponCode: couponApplied ? couponCode : undefined,
                  productCode: product.code || product.productCode || '',
                  discountPercent: couponObj && typeof couponObj.percent === 'number' ? couponObj.percent : undefined,
                  discountAmount: couponObj && typeof couponObj.amount === 'number' ? couponObj.amount : undefined,
                  cgst: Number((product.taxes && product.taxes.cgst) || product.cgst || (product.tax && product.tax.cgst) || 0),
                  sgst: Number((product.taxes && product.taxes.sgst) || product.sgst || (product.tax && product.tax.sgst) || 0),
                  // quantity: product.quantity || {},
                };

                // Store the product in localStorage
                localStorage.setItem('buyNowProduct', JSON.stringify(buyNowProduct));

                // Redirect to checkout with buy-now mode
                router.push(`/checkout?mode=buy-now`);
              } catch (error) {
                // console.error('Error preparing buy-now product:', error);
                toast.error('Failed to prepare product. Please try again.');
              }
            }}
            disabled={!selectedVariant || selectedVariant.qty <= 0}
          >
            {selectedVariant?.qty > 0 ? 'BUY IT NOW' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>
    </div >
  );
}