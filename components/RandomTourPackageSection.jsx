"use client";
import { useEffect, useState } from "react";
import { CalendarClock, MapPin, Heart, Bookmark, ArrowRight, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "./ui/skeleton";
import Autoplay from "embla-carousel-autoplay";
import QuickViewProductCard from "./QuickViewProductCard";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast"



function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

const RandomTourPackageSection = () => {
  // ...existing state and hooks
  const handleAddToCart = (item) => {
    const price = item?.quantity?.variants[0].price;
    const coupon = item.coupon || item.coupons?.coupon;
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

    addToCart({
      id: item._id,
      name: item.title,
      image: item?.gallery?.mainImage || "/placeholder.jpeg",
      price: Math.round(discountedPrice),
      size: item?.quantity?.variants[0]?.size,
      weight: item?.quantity?.variants[0]?.weight ? item.quantity.variants[0].weight / 1000 : 0, // Convert grams to kg
      color:item?.quantity?.variants[0].color,
      originalPrice: price,
      qty: 1,
      couponApplied,
      couponCode: couponApplied ? couponCode : undefined,
      productCode: item.code || item.productCode || '',
      discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
      discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
      cgst: (item.taxes && item.taxes.cgst) || item.cgst || (item.tax && item.tax.cgst) || 0,
      sgst: (item.taxes && item.taxes.sgst) || item.sgst || (item.tax && item.tax.sgst) || 0,
      totalQuantity: item?.quantity?.variants[0]?.qty || 0,
    });
    toast.success("Added to cart!");
  };

  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isartisanLoading, setIsArtisanLoading] = useState(true);

  const [artisan, setArtisan] = useState([])
  const [quickViewProduct, setQuickViewProduct] = useState(null);


  // Prevent background scroll when Quick View is open
  useEffect(() => {
    if (quickViewProduct) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [quickViewProduct]);




  // Fetch Artisan 
  const fetchArtisan = async () => {
    try {
      const res = await fetch("/api/createArtisan");
      const data = await res.json();
      // console.log(data);
      // Ensure artisan is always an array
      if (Array.isArray(data)) {
        setArtisan(data);
      } else if (Array.isArray(data.artisans)) {
        setArtisan(data.artisans);
      } else {
        setArtisan([]);
      }
    } catch (error) {
      setArtisan([]);
    } finally {
      setIsArtisanLoading(false);
    }
  };
  // Fetch Prouducts
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/product");
      const data = await res.json();
      // console.log("Product API response:", data);

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      // console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchArtisan();
    fetchProducts();
  }, []);



  const formatNumeric = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };


  return (
    <section className="bg-[#fcf7f1] md:mt-19 w-full overflow-hidden max-w-screen overflow-x-hidden">
      <div className=" w-full h-full overflow-hidden max-w-screen">
        {/* Product Section */}
        <div className="w-full py-10 px-2 bg-[#FCF7F1]">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-center md:mt-10 uppercase">
          Equip Your Next Adventure.
          </h1>
          <p className=" text-gray-600 py-4 text-center font-barlow md:w-[50%] w-full mx-auto">
            Discover the hottest deals with our Trending Products! Curated
            daily, these top-rated picks offer the best value and quality —
            handpicked for professionals who demand the best, today. Don’t miss
            out — elevate your experience now!
          </p>
          <Carousel
            className={`w-full md:w-[95%] mx-auto my-4 ${products.length > 0 ? "block" : "hidden"}`}
          >
            <CarouselContent className="w-full gap-2">
              {products.length > 0 &&
                products.map((item, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start"
                  >
                    <div className="flex flex-col md:w-[290px] ">
                      {/* Image Section */}
                      <div className="relative w-full md:h-96 rounded-3xl overflow-hidden flex items-center justify-center group/image">
                        {/* {item.productTagLine?.tagLine && item.productTagLine.tagLine.length > 0 && (
                          <div className="absolute top-4 left-1 z-10 w-10 h-fit px-4 py-1 text-md font-bold shadow text-black tracking-tight" style={{ letterSpacing: 0 }}>
                            {item.productTagLine.tagLine.split('').map((char, idx) => (
                              <span key={idx} style={{ display: 'block', lineHeight: '1.2' }}>{char}</span>
                            ))}
                          </div>
                        )} */}
                        {/* GET 10% OFF Tag */}
                        {(() => {
                          const coupon = item.coupon || item.coupons?.coupon;
                          if (!coupon?.couponCode) return null;

                          const { percent, amount, couponCode } = coupon;

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

                        {/* Heart/Wishlist & Cart Buttons - Top Right */}
                        <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full transition-colors duration-300 h-12 w-12 shadow-none ${wishlist.some(i => i.id === item._id) ? "bg-pink-600 hover:bg-pink-700" : "bg-white hover:bg-[#b3a7a3]"}`}
                            onClick={() => {
                              if (wishlist.some(i => i.id === item._id)) {
                                removeFromWishlist(item._id);
                                toast.success("Removed from wishlist!");
                              } else {
                                const price = item?.quantity?.variants[0].price;
                                const coupon = item.coupon || item.coupons?.coupon;
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
                                addToWishlist({
                                  id: item._id,
                                  name: item.title,
                                  image: item?.gallery?.mainImage || "/placeholder.jpeg",
                                  price: Math.round(discountedPrice),
                                  size: item?.quantity?.variants[0].size,
                                  weight: item?.quantity?.variants[0].weight,
                                  color:item?.quantity?.variants[0].color,
                                  originalPrice: price,
                                  qty: 1,
                                  couponApplied,
                                  couponCode: couponApplied ? couponCode : undefined,
                                  productCode: item.code || item.productCode || '',
                                  discountPercent: coupon && typeof coupon.percent === 'number' ? coupon.percent : undefined,
                                  discountAmount: coupon && typeof coupon.amount === 'number' ? coupon.amount : undefined,
                                  cgst: (item.taxes && item.taxes.cgst) || item.cgst || (item.tax && item.tax.cgst) || 0,
                                  sgst: (item.taxes && item.taxes.sgst) || item.sgst || (item.tax && item.tax.sgst) || 0,
                                  totalQuantity: item?.quantity?.variants[0]?.qty || 0,
                                });
                                toast.success("Added to wishlist!");
                              }
                            }}
                          >
                            <Heart size={28} className={wishlist.some(i => i.id === item._id) ? "text-white" : "text-pink-600"} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-[#b3a7a3]/80 hover:bg-[#b3a7a3] transition-colors duration-300 h-12 w-12 shadow-none"
                            onClick={() => handleAddToCart(item)}
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
                        <Image
                          src={item?.gallery?.mainImage?.url || "/placeholder.jpeg"}
                          alt={item?.title || "Tour package image"}
                          width={400}
                          height={500}
                          quality={60}
                          className="object-cover w-full h-full rounded-3xl transition-transform duration-300 group-hover/image:scale-105"
                        />
                        {/* Quick View Button - Slide Up from Bottom on Hover (image only) */}
                        <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center translate-y-10 opacity-0 group-hover/image:translate-y-0 group-hover/image:opacity-100 transition-all duration-300 py-4 ">
                          <Button
                            className="bg-black text-white hover:bg-gray-800 transition-colors duration-300 uppercase text-sm font-bold px-8 py-3 rounded-full shadow-lg border border-2 border-white"
                            onClick={() => setQuickViewProduct(item.product ? item.product : item) // Ensure we always pass the actual product object, not a wrapper
                            }
                          >
                            QUICK VIEW
                          </Button>

                        </div>
                      </div>
                      {/* Name and Price Section */}
                      <div className="flex items-center justify-between px-1 pt-4 pb-2 mt-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-bold hover:underline text-lg md:text-xl text-gray-900 leading-tight max-w-[200px] truncate cursor-pointer"
                        >
                          {item?.title}
                        </Link>

                        {(() => {
                          const price = item?.quantity?.variants[0].price;
                          const coupon = item.coupon || item.coupons?.coupon;
                          let discountedPrice = price;
                          let hasDiscount = false;

                          if (coupon && typeof coupon.percent === 'number' && coupon.percent > 0) {
                            discountedPrice = price - (price * coupon.percent) / 100;
                            hasDiscount = true;
                          } else if (coupon && typeof coupon.amount === 'number' && coupon.amount > 0) {
                            discountedPrice = price - coupon.amount;
                            hasDiscount = true;
                          }

                          if (hasDiscount && discountedPrice < price) {
                            return (
                              <span>
                                <del className="text-black font-bold text-md md:text-xl">₹{formatNumeric(price)}</del>
                                <span className="font-bold text-md md:text-xl text-black px-2">₹{formatNumeric(Math.round(discountedPrice))}</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="font-bold text-lg md:text-xl text-black">₹{formatNumeric(price)}</span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
          </Carousel>
        </div>


        {/* Artisan Carousel Section */}
        <div className="w-full py-10 md:py-20">
          {/* Desktop: Grid/List */}
          <div className="w-full max-w-[90%] mx-auto mb-16">
            <div className="flex flex-col md:flex-row items-start gap-5">
              {/* Left: Heading and description */}
              <div className="flex-1 flex flex-col justify-center md:pr-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-start mb-5 uppercase">Our Industry Experts</h2>
                {/* <h2 className="text-xl font-bold mb-2">Celebrating the Art of Craftsmanship. Honoring the Hands That Shape Beauty</h2> */}
                <div className="text-md text-gray-700 text-justify mb-6">
                At the heart of every great expedition is dependable gear—and that’s where we come in. As a leading provider of adventure and expedition equipment, we specialize in supplying high-performance, safety-tested gear for professionals, outdoor enthusiasts, rescue teams, and expedition leaders. Our commitment goes beyond products; we offer end-to-end gear solutions designed for extreme conditions, rugged terrains, and mission-critical operations. Backed by trusted global brands and decades of field experience, our management philosophy focuses on quality, innovation, and reliability. Whether you're preparing for a Himalayan ascent, a wilderness survival course, or a high-altitude rescue mission, we ensure you’re equipped to go further—safely, efficiently, and confidently.
                </div>
              
              </div>
              {/* Right: Top 2 artisan cards in new style */}
              <div className="hidden md:flex flex-row gap-4 justify-end">
                {(artisan && artisan.slice(0, 2).map((item, idx) => {
                  const card = {
                    id: item._id || idx,
                    slug: item.slug,
                    name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                    image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                    title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                    subtitle: item.shgName || "",
                    experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                    location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                    socials: [
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        ), url: item.socialPlugin?.facebook || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        ), url: item.socialPlugin?.instagram || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        ), url: item.socialPlugin?.youtube || "#"
                      },
                      {
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                            <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                          </svg>
                        ), url: item.socialPlugin?.google || "#"
                      },
                      {
                        icon: (
                          <Globe />
                        ), url: item.socialPlugin?.website || "#"
                      },
                    ],
                  };
                  return (
                    <div key={card.id} className="relative rounded-2xl shadow-md group transition-all h-full w-[340px] flex flex-col bg-[#fbeff2] overflow-hidden">
                  
                  
                      {/* Card Image */}
                      <div className="relative w-full h-96">
                        <img
                          src={card.image}
                          alt={card.name}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      {/* Card Content Overlay */}
                      <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                        <div>
                          <Link
                            href={`/artisan/${card.slug}`}
                            className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                            title={card.name}
                          >
                            {card.name}
                          </Link>
                          <div className="text-md text-white drop-shadow-md">{card.title}</div>
                        </div>
                        {/* Arrow Button with Socials on Hover */}
                        <div className="relative group/arrow">
                          <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {/* Social Icons: show on arrow hover */}
                          <div className="absolute bottom-12 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                            {card.socials.slice(0, 6).map((s, i) => (
                              <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                          bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                          transform translate-y-5 group-hover/arrow:translate-y-0
                        `}
                                style={{
                                  transitionProperty: 'transform, opacity, background-color, box-shadow',
                                  transitionDuration: '0.6s',
                                  transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                  transitionDelay: `${i * 60}ms`
                                }}
                              >
                                {s.icon}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
            {/* Carousel for remaining artisans in new style in Laptop View*/}
            {artisan && artisan.length > 2 && (
              <div className="hidden md:flex mt-10">
                <Carousel className="w-full">
                  <CarouselContent className="flex gap-4">
                    {artisan.slice(2).map((item, idx) => {
                      const card = {
                        id: item._id || idx,
                        slug:item.slug,
                        name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                        image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                        title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                        subtitle: item.shgName || "",
                        experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                        location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                        socials: [
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            ), url: item.socialPlugin?.facebook || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            ), url: item.socialPlugin?.instagram || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                            ), url: item.socialPlugin?.youtube || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                                <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                              </svg>
                            ), url: item.socialPlugin?.google || "#"
                          },
                          {
                            icon: (
                              <Globe />
                            ), url: item.socialPlugin?.website || "#"
                          },
                        ],
                      };
                      return (
                        <CarouselItem key={card.id} className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start">
                          <div className="relative rounded-2xl overflow-hidden shadow-md group transition-all h-full flex flex-col bg-[#fbeff2]">
                          
                        
                            {/* Card Image */}
                            <div className="relative w-full h-96">
                              <img
                                src={card.image}
                                alt={card.name}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            {/* Card Content Overlay */}
                            <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                              <div>
                                <Link
                                  href={`/artisan/${card.slug}`}
                                  className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                                  title={card.name}
                                >
                                  {card.name}
                                </Link>
                                <div className="text-md text-white drop-shadow-md">{card.title}</div>
                              </div>
                              {/* Arrow Button with Socials on Hover */}
                              <div className="relative group/arrow">
                                <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {/* Social Icons: show on arrow hover */}
                                <div className="absolute bottom-14 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                                  {card.socials.slice(0, 6).map((s, i) => (
                                    <a
                                      key={i}
                                      href={s.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`
                                bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                                transform translate-y-5 group-hover/arrow:translate-y-0
                              `}
                                      style={{
                                        transitionProperty: 'transform, opacity, background-color, box-shadow',
                                        transitionDuration: '0.6s',
                                        transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                        transitionDelay: `${i * 60}ms`
                                      }}
                                    >
                                      {s.icon}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <div className="flex items-center gap-3 mt-4 justify-center">
                    <CarouselPrevious className="bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                    <CarouselNext className="bg-[#f7eedd] !rounded-full !w-12 !h-12 !flex !items-center !justify-center transition" />
                  </div>
                </Carousel>
              </div>
            )}
            {/* Carousel for remaining artisans in new style */}
            {artisan && artisan.length > 1 && (
              <div className="md:hidden lg:hidden mt-10">
                <Carousel className="w-full">
                  <CarouselContent className="flex gap-4">
                    {artisan.map((item, idx) => {
                      const card = {
                        id: item._id || idx,
                        slug: item.slug,
                        name: `${item.title ? item.title + " " : ""}${item.firstName || ''} ${item.lastName || ''}`.trim() || "Unknown Artisan",
                        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "N/A",
                        image: item.profileImage?.url || item.image || "/bg-custom-1.jpg",
                        title: item.specializations && item.specializations.length > 0 ? item.specializations.join(", ") : "Artisan",
                        subtitle: item.shgName || "",
                        experience: item.yearsOfExperience ? `${item.yearsOfExperience} years experience` : "",
                        location: item.address ? `${item.address.city}, ${item.address.state}` : "",
                        socials: [
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            ), url: item.socialPlugin?.facebook || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram-icon lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            ), url: item.socialPlugin?.instagram || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                            ), url: item.socialPlugin?.youtube || "#"
                          },
                          {
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                                <path d="M21.35 11.1h-9.18v2.83h5.43c-.24 1.38-1.42 4.04-5.43 4.04-3.27 0-5.94-2.71-5.94-6.05s2.67-6.05 5.94-6.05c1.86 0 3.11.8 3.82 1.49l2.6-2.57C17.36 3.43 15.01 2.5 12 2.5 6.95 2.5 2.9 6.53 2.9 11.5S6.95 20.5 12 20.5c6.89 0 9.1-4.82 9.1-7.22 0-.48-.05-.8-.15-1.18z" />
                              </svg>
                            ), url: item.socialPlugin?.google || "#"
                          },
                          {
                            icon: (
                              <Globe />
                            ), url: item.socialPlugin?.website || "#"
                          },
                        ],
                      };
                      return (
                        <CarouselItem key={card.id} className="pl-5 md:basis-1/2 lg:basis-1/4 min-w-0 snap-start">
                          <div className="relative rounded-2xl overflow-hidden shadow-md group transition-all h-full flex flex-col bg-[#fbeff2]">
                       
                            {/* Card Image */}
                            <div className="relative w-full h-96">
                              <img
                                src={card.image}
                                alt={card.name}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            {/* Card Content Overlay */}
                            <div className="absolute left-0 bottom-0 w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                              <div>
                                <Link
                                  href={`/artisan/${card.slug}`}
                                  className="font-bold text-2xl text-white mb-3 leading-tight drop-shadow-md hover:underline hover:decoration-2 hover:underline-offset-4 transition cursor-pointer"
                                  title={card.name}
                                >
                                  {card.name}
                                </Link>
                                <div className="text-md text-white drop-shadow-md">{card.title}</div>
                              </div>
                              {/* Arrow Button with Socials on Hover */}
                              <div className="relative group/arrow">
                                <button className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow transition group-hover/arrow:bg-[#e84393] group-hover/arrow:text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {/* Social Icons: show on arrow hover */}
                                <div className="absolute bottom-14 right-0 flex flex-col gap-4 opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 z-30 items-center">
                                  {card.socials.slice(0, 6).map((s, i) => (
                                    <a
                                      key={i}
                                      href={s.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`
                                bg-white rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100 transition
                                transform translate-y-5 group-hover/arrow:translate-y-0
                              `}
                                      style={{
                                        transitionProperty: 'transform, opacity, background-color, box-shadow',
                                        transitionDuration: '0.6s',
                                        transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                                        transitionDelay: `${i * 60}ms`
                                      }}
                                    >
                                      {s.icon}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <div className="flex items-center gap-3 mt-4 justify-center">
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 p-5" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 p-5" />
                  </div>
                </Carousel>
              </div>
            )}
          </div>
        </div>


        {/* Quick View Modal */}
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQuickViewProduct(null)}>
            <div className="bg-white rounded-2xl shadow-xl mx-auto md:max-w-4xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-2xl font-bold text-gray-500 z-50 rounded-full w-8 h-8 border border-black bg-black text-white flex items-center justify-center hover:bg-gray-100 hover:text-black focus:outline-none"
                onClick={() => setQuickViewProduct(null)}
                aria-label="Close quick view"
              >
                &times;
              </button>
              <QuickViewProductCard product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
export default RandomTourPackageSection