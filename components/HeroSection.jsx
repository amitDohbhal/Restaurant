"use client";
import { useState, useEffect, useRef } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import toast from "react-hot-toast";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
// import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/SearchContext";
import { CalendarClock, MapPin, Search, Sparkle, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

const HeroSection = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [desktopApi, setDesktopApi] = useState();
  const [desktopSelectedIndex, setDesktopSelectedIndex] = useState(0);
  const [mobileApi, setMobileApi] = useState(null);
  const [mobileSelectedIndex, setMobileSelectedIndex] = useState(0);
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));



  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch("/api/addBanner");
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Desktop carousel effect
  useEffect(() => {
    if (!desktopApi) return;
    const onSelect = () => {
      const idx = desktopApi.selectedScrollSnap();
      setDesktopSelectedIndex(idx);
    };
    desktopApi.on("select", onSelect);
    onSelect();
    return () => {
      desktopApi.off("select", onSelect);
    };
  }, [desktopApi]);

  // Mobile carousel effect
  useEffect(() => {
    if (!mobileApi) return;
    const onSelect = () => {
      const idx = mobileApi.selectedScrollSnap();
      setMobileSelectedIndex(idx);
    };
    mobileApi.on("select", onSelect);
    onSelect();
    return () => {
      mobileApi.off("select", onSelect);
    };
  }, [mobileApi]);


  const { isSearchOpen, setIsSearchOpen } = useSearch();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  if (isLoading) {
    return (
      <section className="relative xl:h-screen w-full overflow-hidden z-[160]">
        <Carousel className="h-full w-full" plugins={[plugin.current]} onMouseLeave={plugin.current.reset}>
          <CarouselContent className="h-full">
            {[...Array(4)].map((_, index) => (
              <CarouselItem key={index} className="h-[100vh] md:h-full">
                <div className="relative h-full w-full">
                  <Skeleton className="h-[100vh] w-full" />
                  <div className="absolute translate-y-1/2 top-1/3 translate-x-1/2 right-1/2 z-20 w-full">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </div>
                  <div className="absolute translate-y-1/2 bottom-1/2 translate-x-1/2 right-1/2 z-20 w-full">
                    <Skeleton className="h-12 w-3/4 mx-auto" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
    );
  }

  return (
    <section className="bg-[#fcf7f1] relative xl:h-screen h-full w-full p-2 overflow-hidden z-0 group">
      <div className="hidden xl:block w-full h-screen ">
        <div className="hidden xl:block w-full h-full">
          <Carousel
            className="h-full w-full"
            plugins={[plugin.current]}
            onMouseLeave={plugin.current.reset}
            setApi={setDesktopApi}
          >
            <CarouselContent className="h-full">
              {banners.map((item, index) => (
                <CarouselItem key={index} className="h-[100vh] md:h-full">
                  <Link href={item?.buttonLink || "#"} className="block h-full w-full">
                  <div className="relative h-[100vh] w-full flex items-center justify-center">
                      <Image
                        src={item?.frontImg?.url || "/placeholder.jpeg"}
                        alt={item?.title || "Banner Image"}
                        fill
                        quality={100}
                        priority
                        className="object-cover"
                      />
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Arrows */}
            <CarouselPrevious className="left-4 md:left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CarouselNext className="right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Carousel>

          {/* Custom Pagination Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setDesktopSelectedIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === desktopSelectedIndex ? "bg-white w-6" : "bg-white/50"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>
      </div>

      <div className="block xl:hidden w-full h-full py-2 relative max-h-[100vh]">
        {/* Mobile Carousel: Only show first image, center content over image, add to cart above image */}
        <Carousel className="w-full max-w-md mx-auto" plugins={[plugin.current]} onMouseLeave={plugin.current.reset} setApi={setMobileApi} >
          <CarouselContent>
            {banners.map((banner, index) => (
              <CarouselItem key={index} className="flex flex-col items-center justify-center relative">
                <Link href={banner?.buttonLink || "#"} className="block h-full w-full">
                <div className="relative w-full flex flex-col items-center">
                  {/* Front Image only for mobile */}
                  <img
                    src={banner.frontImg?.url || "/placeholder.jpeg"}
                    alt={banner.title ? `${banner.title} Front` : "Banner Image"}
                    className="object-cover w-full h-[50vh] rounded-lg shadow-lg z-0"
                  />
                </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (mobileApi && typeof mobileApi.scrollTo === 'function') {
                    mobileApi.scrollTo(index);
                    setMobileSelectedIndex(index);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === mobileSelectedIndex ? "bg-black w-6" : "bg-black/30"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </div>

    </section>
  );
};

export default HeroSection;