"use client";

import React, { useEffect, useState } from 'react';
import { useSidebar } from "@/components/ui/sidebar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarClock } from "lucide-react";

const ResponsiveCarousel = ({ packages, formatNumericStr }) => {

    // Convert the formatNumeric string back to a function
    const formatNumeric = new Function('return ' + formatNumericStr)();

    // Get sidebar state from the sidebar context
    const sidebarContext = useSidebar();
    const sidebarOpen = sidebarContext?.open ?? false;

    // Number of packages to display based on sidebar state
    const packagesToShow = sidebarOpen ? 3 : 4;

    // Container width based on sidebar state
    const containerWidth = sidebarOpen ? 'xl:max-w-5xl' : 'xl:max-w-7xl';

    // Item width classes based on sidebar state
    const itemWidthClasses = sidebarOpen
        ? "md:basis-1/3 lg:basis-1/3 xl:basis-1/3"
        : "md:basis-1/2 lg:basis-1/3 xl:basis-1/4";

    return (
        <div className="flex flex-col items-center">
            <Carousel className={`max-w-xl lg:max-w-3xl ${containerWidth} mx-auto my-6 md:my-10 w-full md:w-full`}>
                <CarouselContent className="-ml-1 w-full">
                    {packages.map((item, index) => (
                        <CarouselItem
                            key={index}
                            className={`pl-1 ${itemWidthClasses}`}
                        >
                            <div className="p-1">
                                <Card>
                                    <CardContent className="justify-between bg-white rounded-xl shadow p-4 flex flex-col h-full relative overflow-hidden group">
                                        <div className="relative w-full h-52 md:h-48 mb-3 rounded-lg overflow-hidden">
                                            <Image
                                                src={item?.basicDetails?.thumbnail?.url || "/RandomTourPackageImages/u1.jpg"}
                                                alt={item?.packageName || "Tour package image"}
                                                width={1280}
                                                height={720}
                                                quality={50}
                                                className="rounded-t-xl w-full h-full object-fill"
                                            />
                                        </div>
                                        <div className="p-2 flex flex-col gap-2">
                                            <div className="flex xl:flex-row  gap-2 xl:items-center justify-between font-barlow">
                                                <p className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
                                                    <MapPin size={20} /> {item?.basicDetails?.location}
                                                </p>
                                                <p className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
                                                    <CalendarClock size={20} /> {item?.basicDetails?.duration} Days {item?.basicDetails?.duration - 1} Nights
                                                </p>
                                            </div>
                                            <p className="font-bold md:text-lg text-xl line-clamp-2">{item?.packageName}</p>
                                        </div>
                                        <div className="h-px bg-gray-200 my-1" />
                                        <div className="flex flex-col gap-2 flex-1 ">
                                            <div className="text-gray-700 mx-2 text-sm mb-2 h-16 overflow-y-auto line-clamp-2">
                                                {typeof item?.basicDetails?.smallDesc === "string" ? (
                                                    <span dangerouslySetInnerHTML={{ __html: item?.basicDetails?.smallDesc }} />
                                                ) : (
                                                    <span>No description available</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 flex xl:flex-row flex-col xl:items-center justify-between gap-2 font-barlow">
                                            <div>
                                                <p className="text-sm">
                                                    Starting From:{" "}
                                                    <span className="font-bold text-blue-600">
                                                        ₹<span className="text-xl">{formatNumeric(item?.price)}*</span>
                                                    </span>
                                                </p>
                                                <p className="text-xs font-semibold">Onwards</p>
                                            </div>
                                            <Link href={`/package/${item._id}`}>
                                                <Button className="bg-blue-500 hover:bg-blue-600 uppercase rounded-sm">Learn more</Button>
                                            </Link>
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
        </div>
    );
};

export default ResponsiveCarousel;
