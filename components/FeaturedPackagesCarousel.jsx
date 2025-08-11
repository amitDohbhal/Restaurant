"use client";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const dummyPackages = [
    {
        _id: "1",
        link: "#",
        basicDetails: { thumbnail: { url: "/RandomTourPackageImages/u1.jpg" } },
        packageName: "Sample Package 1",
    },
    {
        _id: "2",
        link: "#",
        basicDetails: { thumbnail: { url: "/RandomTourPackageImages/u2.jpg" } },
        packageName: "Sample Package 2",
    },
    {
        _id: "3",
        link: "#",
        basicDetails: { thumbnail: { url: "/RandomTourPackageImages/u3.jpg" } },
        packageName: "Sample Package 3",
    },
];

export default function FeaturedPackagesCarousel({ featuredPackages: initialFeaturedPackages }) {
    const [featuredPackages, setFeaturedPackages] = useState(initialFeaturedPackages || []);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // console.log('FeaturedPackagesCarousel initialFeaturedPackages:', initialFeaturedPackages);
        if (!initialFeaturedPackages || initialFeaturedPackages.length === 0) {
            const fetchFeaturedPackages = async () => {
                try {
                    const res = await fetch("/api/featured-packages");
                    const data = await res.json();
                    let pkgs = Array.isArray(data)
                        ? data
                        : Array.isArray(data)
                        ? data
                        : [];
                    // console.log('FeaturedPackagesCarousel fetched pkgs:', pkgs);
                    setFeaturedPackages(pkgs.length ? pkgs : dummyPackages);
                } catch (error) {
                    // setFeaturedPackages(dummyPackages);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFeaturedPackages();
        } else {
            setIsLoading(false);
        }
    }, [initialFeaturedPackages]);

    if (isLoading) {
        // Render skeleton or loading state
        return (
            <section className="p-4 bg-white">
                <div className="flex gap-4">
                    {dummyPackages.map((item) => (
                        <div key={item._id} className="rounded-xl w-64 h-64 bg-gray-200 animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="p-4 bg-white">
            <Carousel className="max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto my-6 md:my-10 w-full md:w-full">
                <CarouselContent className="-ml-1 w-full">
                    {(Array.isArray(featuredPackages) ? featuredPackages : []).map((item) => (
                        <CarouselItem key={item._id} className="pl-1 md:basis-1/2 lg:basis-1/3 xl:basis-1/3">
                            <div className="p-1">
                                <Card>
                                    <CardContent className="p-0 rounded-xl flex flex-col h-[420px] justify-between  bg-white rounded-xl shadow  flex flex-col  relative overflow-hidden group">
                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                            <Image
                                                src={item?.image?.url || item?.basicDetails?.thumbnail?.url || "/RandomTourPackageImages/u1.jpg"}
                                                alt={item?.title || item?.packageName || "Tour package image"}
                                                width={1280}
                                                height={720}
                                                quality={50}
                                                className="rounded-t-xl w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                                            />
                                            {/* Overlay for lighter, full black shade on hover */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100  transition-all duration-500 z-10"></div>
                                            {/* Text slides up on hover */}
                                            <div className="absolute bottom-0 left-0 text-center w-full z-20 translate-y-full group-hover:translate-y-[-25%] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                                                <h1 className="text-white text-xl xl:text-2xl mt-2 font-bold">{item?.title || item?.packageName}</h1>
                                                <Link href={item?.link || `/package/${item._id}`}>
                                                    <button className="hover:bg-white hover:text-black text-white font-bold px-4 py-2 rounded-full mt-4 transition duration-300 ease-in-out">
                                                        View More
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </section>
    );
}
