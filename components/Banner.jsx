"use client";
import { useEffect, useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

import Link from "next/link";

const Banner = () => {
    const [promotinalBanner, setPromotinalBanner] = useState([])
    const [featuredOffer, setFeaturedOffer] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    // console.log(promotinalBanner)
    const fetchPromotinalBanner = async () => {
        try {
            const res = await fetch("/api/addPromotinalBanner");
            const data = await res.json();
            // console.log("Promotinal Banner API response:", data);
            if (data && data.length > 0) {
                setPromotinalBanner(data);
            } else {
                setPromotinalBanner([]);
            }
        } catch (error) {
            // console.error("Error fetching products:", error);
            setPromotinalBanner([]);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchFeaturedOffer = async () => {
        try {
            const res = await fetch("/api/addFeaturedOffer");
            const data = await res.json();
            // console.log("Featured Offer API response:", data);
            if (data && data.length > 0) {
                setFeaturedOffer(data);
            } else {
                setFeaturedOffer([]);
            }
        } catch (error) {
            // console.error("Error fetching products:", error);
            setFeaturedOffer([]);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchPromotinalBanner();
        fetchFeaturedOffer();
    }, [])
    return (
        <div className="bg-[#fcf7f1] w-full overflow-hidden max-w-screen overflow-x-hidden">
            {/* Promotional Banner Section */}
            {promotinalBanner.length > 0 && (
                <div className="w-full py-10 px-2 md:py-20 bg-[#FCF7F1]">
                    <h2 className="text-2xl md:text-4xl font-bold text-center mb-5 uppercase">
                        <span className="italic">Click</span>,
                        <span >Collect</span>,
                        <span>Checkout</span>
                    </h2>
                    <p className="font-barlow text-gray-600 mb-5 md:w-[50%] w-full mx-auto text-center">From everyday essentials to the latest trends, we bring everything to your fingertips. Enjoy easy browsing, secure checkout, and doorstep delivery with exciting deals and free shipping.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 px-2">
                        {promotinalBanner.map((item, idx) => (
                            <div key={idx} className="flex flex-col h-[220px] md:h-[450px] p-0 overflow-hidden relative group">
                                <Link href={item?.buttonLink || '#'} target="_blank" rel="noopener noreferrer" ><img src={item.image?.url} alt={item.title} className="absolute inset-0 w-full h-full md:object-cover object-contain object-center transition-transform duration-300 group-hover:scale-105" /></Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Offer For You Section */}
            {featuredOffer.length > 0 && (
                <div className="w-full md:py-20 py-10 px-2 md:px-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-5 uppercase">Featured Offer For You</h2>
                    <Carousel className="w-full">
                        <CarouselContent>
                            {featuredOffer.map((item, idx) => (
                                <CarouselItem key={idx} className="md:basis-1/3 lg:basis-1/4">
                                    <div className="flex flex-col h-[350px] p-0 overflow-hidden relative group">
                                        <Link href={item?.buttonLink || '#'} target="_blank" rel="noopener noreferrer"><img src={item.image?.url} alt={item.title} className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105" /></Link>

                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselNext className="!right-2 !top-1/2 !-translate-y-1/2 z-10 " />
                        <CarouselPrevious className="!left-1 !top-1/2 !-translate-y-1/2 z-10" />
                    </Carousel>
                </div>
            )}
        </div>
    )
}

export default Banner